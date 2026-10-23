"""
SADITA Backend — MQTT Client
Manages persistent connection to Mosquitto broker.
The backend subscribes to device events and publishes commands.

Topic schema:
  sadita/device/{device_id}/status       Device → backend: heartbeat/status
  sadita/device/{device_id}/rfid         Device → backend: RFID scan event
  sadita/device/{device_id}/fingerprint  Device → backend: fingerprint event
  sadita/device/{device_id}/attendance   Device → backend: attendance event
  sadita/device/{device_id}/command      Backend → device: commands
  sadita/device/{device_id}/ack          Device → backend: command acknowledgement
"""
from __future__ import annotations

import json
import logging
import threading
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from typing import Any, Callable, Dict, Optional

import paho.mqtt.client as mqtt

from app.core.config import settings

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Topic constants
# ---------------------------------------------------------------------------
TOPIC_STATUS = "sadita/device/{device_id}/status"
TOPIC_RFID = "sadita/device/{device_id}/rfid"
TOPIC_FINGERPRINT = "sadita/device/{device_id}/fingerprint"
TOPIC_ATTENDANCE = "sadita/device/{device_id}/attendance"
TOPIC_COMMAND = "sadita/device/{device_id}/command"
TOPIC_ACK = "sadita/device/{device_id}/ack"

SUBSCRIBE_WILDCARD = "sadita/device/+/#"


# ---------------------------------------------------------------------------
# Handler registry type
# ---------------------------------------------------------------------------
EventHandler = Callable[[str, dict], None]


class SADITAMQTTClient:
    """
    Singleton-like MQTT client for SADITA backend.
    Handles connection lifecycle, subscriptions, and event dispatch.
    """

    def __init__(self) -> None:
        self._client: Optional[mqtt.Client] = None
        self._connected: bool = False
        self._handlers: Dict[str, list[EventHandler]] = {}
        self._lock = threading.Lock()
        self._executor = ThreadPoolExecutor(max_workers=8, thread_name_prefix="mqtt_worker")

    # ------------------------------------------------------------------
    # Lifecycle
    # ------------------------------------------------------------------
    def setup(self) -> None:
        """Initialize client and connect to broker (non-blocking)."""
        client_id = f"{settings.MQTT_CLIENT_ID}-{datetime.now(timezone.utc).timestamp():.0f}"
        self._client = mqtt.Client(
            mqtt.CallbackAPIVersion.VERSION2,
            client_id=client_id,
            protocol=mqtt.MQTTv5,
        )

        if settings.MQTT_USERNAME:
            self._client.username_pw_set(
                settings.MQTT_USERNAME, settings.MQTT_PASSWORD or None
            )

        self._client.on_connect = self._on_connect
        self._client.on_disconnect = self._on_disconnect
        self._client.on_message = self._on_message

        try:
            self._client.connect(
                settings.MQTT_BROKER_HOST,
                settings.MQTT_BROKER_PORT,
                keepalive=settings.MQTT_KEEPALIVE,
            )
            self._client.loop_start()
            logger.info(
                "MQTT client connecting to %s:%d",
                settings.MQTT_BROKER_HOST,
                settings.MQTT_BROKER_PORT,
            )
        except Exception as exc:
            logger.warning("MQTT connection failed: %s — running without MQTT", exc)

    def teardown(self) -> None:
        """Gracefully disconnect."""
        if self._client:
            self._client.loop_stop()
            self._client.disconnect()
            logger.info("MQTT client disconnected")
        self._executor.shutdown(wait=False)

    # ------------------------------------------------------------------
    # Callbacks
    # ------------------------------------------------------------------
    def _on_connect(
        self, client: mqtt.Client, userdata: Any, flags: Any, reason_code: Any, properties: Any
    ) -> None:
        if reason_code == 0:
            self._connected = True
            client.subscribe(SUBSCRIBE_WILDCARD, qos=1)
            logger.info("MQTT connected and subscribed to %s", SUBSCRIBE_WILDCARD)
        else:
            logger.error("MQTT connect failed, reason_code=%s", reason_code)

    def _on_disconnect(
        self, client: mqtt.Client, userdata: Any, flags: Any, reason_code: Any, properties: Any
    ) -> None:
        self._connected = False
        if reason_code != 0:
            logger.warning("MQTT unexpected disconnect, reason_code=%s", reason_code)

    def _safe_dispatch(self, handler: EventHandler, device_id: str, payload: dict, event_type: str) -> None:
        try:
            handler(device_id, payload)
        except Exception as exc:
            logger.exception("Handler error for %s on device %s: %s", event_type, device_id, exc)

    def _on_message(
        self, client: mqtt.Client, userdata: Any, message: mqtt.MQTTMessage
    ) -> None:
        topic = message.topic
        try:
            payload = json.loads(message.payload.decode("utf-8"))
        except (json.JSONDecodeError, UnicodeDecodeError) as exc:
            logger.warning("MQTT invalid payload on %s: %s", topic, exc)
            return

        logger.debug("MQTT message: topic=%s payload=%s", topic, payload)

        # Dispatch to registered handlers for this topic pattern
        parts = topic.split("/")
        # parts: ['sadita', 'device', '{device_id}', '{event_type}']
        if len(parts) >= 4:
            event_type = parts[3]
            device_id = parts[2]
            payload["_device_id"] = device_id
            payload["_topic"] = topic

            with self._lock:
                handlers = list(self._handlers.get(event_type, []))

            for handler in handlers:
                self._executor.submit(self._safe_dispatch, handler, device_id, payload, event_type)

    # ------------------------------------------------------------------
    # Handler registration
    # ------------------------------------------------------------------
    def register_handler(self, event_type: str, handler: EventHandler) -> None:
        """Register a callback for a specific event type (e.g. 'attendance')."""
        with self._lock:
            self._handlers.setdefault(event_type, []).append(handler)
        logger.debug("Registered handler for event type '%s'", event_type)

    # ------------------------------------------------------------------
    # Publishing
    # ------------------------------------------------------------------
    def publish_command(self, device_id: str, command: dict) -> bool:
        """Send a command to a specific SADITA device."""
        if not self._connected or not self._client:
            logger.warning("MQTT not connected — command not sent to %s", device_id)
            return False
        topic = TOPIC_COMMAND.format(device_id=device_id)
        self._client.publish(topic, json.dumps(command), qos=1)
        return True

    def publish(self, topic: str, payload: dict, qos: int = 1) -> bool:
        """Publish to an arbitrary topic."""
        if not self._connected or not self._client:
            return False
        self._client.publish(topic, json.dumps(payload), qos=qos)
        return True

    # ------------------------------------------------------------------
    # Status
    # ------------------------------------------------------------------
    @property
    def is_connected(self) -> bool:
        return self._connected

    def health(self) -> dict:
        return {
            "status": "ok" if self._connected else "disconnected",
            "broker_host": settings.MQTT_BROKER_HOST,
            "broker_port": settings.MQTT_BROKER_PORT,
            "client_id": settings.MQTT_CLIENT_ID,
        }


# ---------------------------------------------------------------------------
# Module-level singleton — imported by app startup
# ---------------------------------------------------------------------------
mqtt_client = SADITAMQTTClient()
