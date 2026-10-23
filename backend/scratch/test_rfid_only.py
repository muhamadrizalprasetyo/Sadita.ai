import paho.mqtt.client as mqtt
import json
import time

c = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
c.connect("127.0.0.1", 1883)
c.loop_start()

def on_msg(c, u, msg):
    print("BACKEND RESPONSE RECEIVED:")
    print("Topic:", msg.topic)
    print("Payload:", msg.payload.decode())

c.on_message = on_msg
c.subscribe("sadita/device/SADITA-ESP32-LAB-01/command")
time.sleep(0.5)

print("Publishing test RFID scan (mode: rfid_only)...")
c.publish("sadita/device/SADITA-ESP32-LAB-01/rfid", json.dumps({
    "uid": "A1B2C3D4",
    "device_id": "SADITA-ESP32-LAB-01",
    "mode": "rfid_only"
}))

time.sleep(2)
c.loop_stop()
c.disconnect()
print("Done.")
