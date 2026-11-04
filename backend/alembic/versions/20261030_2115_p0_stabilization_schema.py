"""P0 Stabilization Schema: Quota, KRS Requests, Delay tracking, Attendance reason, and Audit columns

Revision ID: 5e8c1b2a9d41
Revises: 4fbf64d0e827
Create Date: 2026-10-30 21:15:00.000000
"""
from __future__ import annotations

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '5e8c1b2a9d41'
down_revision: Union[str, None] = '4fbf64d0e827'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    # 1. CourseClass.kuota_maksimal
    if inspector.has_table("course_classes"):
        class_cols = {col["name"] for col in inspector.get_columns("course_classes")}
        if "kuota_maksimal" not in class_cols:
            op.add_column(
                "course_classes",
                sa.Column("kuota_maksimal", sa.Integer(), nullable=False, server_default="40"),
            )

    # 2. AttendanceRequest.reason
    if inspector.has_table("attendance_requests"):
        req_cols = {col["name"] for col in inspector.get_columns("attendance_requests")}
        if "reason" not in req_cols:
            op.add_column(
                "attendance_requests",
                sa.Column("reason", sa.Text(), nullable=True),
            )

    # 3. AttendanceSession delay & schedule tracking
    if inspector.has_table("attendance_sessions"):
        sess_cols = {col["name"] for col in inspector.get_columns("attendance_sessions")}
        if "scheduled_start_at" not in sess_cols:
            op.add_column(
                "attendance_sessions",
                sa.Column("scheduled_start_at", sa.DateTime(timezone=True), nullable=True),
            )
        if "delay_minutes" not in sess_cols:
            op.add_column(
                "attendance_sessions",
                sa.Column("delay_minutes", sa.Integer(), nullable=True, server_default="0"),
            )
        if "delay_reason" not in sess_cols:
            op.add_column(
                "attendance_sessions",
                sa.Column("delay_reason", sa.Text(), nullable=True),
            )

    # 4. KRS Requests Table
    if not inspector.has_table("krs_requests"):
        op.create_table(
            "krs_requests",
            sa.Column("id", sa.Integer(), primary_key=True, index=True),
            sa.Column(
                "student_id",
                sa.Integer(),
                sa.ForeignKey("student_profiles.id", ondelete="CASCADE"),
                nullable=False,
                index=True,
            ),
            sa.Column(
                "class_id",
                sa.Integer(),
                sa.ForeignKey("course_classes.id", ondelete="CASCADE"),
                nullable=False,
                index=True,
            ),
            sa.Column("request_type", sa.String(length=40), nullable=False),
            sa.Column(
                "status",
                sa.String(length=40),
                nullable=False,
                server_default="PENDING_APPROVAL",
                index=True,
            ),
            sa.Column("alasan", sa.Text(), nullable=True),
            sa.Column(
                "submitted_at",
                sa.DateTime(timezone=True),
                nullable=False,
                server_default=sa.func.now(),
            ),
            sa.Column("reviewed_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column(
                "reviewed_by",
                sa.Integer(),
                sa.ForeignKey("users.id", ondelete="SET NULL"),
                nullable=True,
            ),
            sa.Column("reviewer_notes", sa.Text(), nullable=True),
            sa.Column(
                "enrollment_id",
                sa.Integer(),
                sa.ForeignKey("class_enrollments.id", ondelete="SET NULL"),
                nullable=True,
            ),
        )

    # 5. AuditLog missing columns
    if inspector.has_table("audit_logs"):
        audit_cols = {col["name"] for col in inspector.get_columns("audit_logs")}
        if "reason" not in audit_cols:
            op.add_column("audit_logs", sa.Column("reason", sa.Text(), nullable=True))
        if "ip_address" not in audit_cols:
            op.add_column("audit_logs", sa.Column("ip_address", sa.String(length=45), nullable=True))
        if "user_agent" not in audit_cols:
            op.add_column("audit_logs", sa.Column("user_agent", sa.String(length=500), nullable=True))


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if inspector.has_table("krs_requests"):
        op.drop_table("krs_requests")

    if inspector.has_table("course_classes"):
        class_cols = {col["name"] for col in inspector.get_columns("course_classes")}
        if "kuota_maksimal" in class_cols:
            op.drop_column("course_classes", "kuota_maksimal")

    if inspector.has_table("attendance_requests"):
        req_cols = {col["name"] for col in inspector.get_columns("attendance_requests")}
        if "reason" in req_cols:
            op.drop_column("attendance_requests", "reason")

    if inspector.has_table("attendance_sessions"):
        sess_cols = {col["name"] for col in inspector.get_columns("attendance_sessions")}
        if "delay_reason" in sess_cols:
            op.drop_column("attendance_sessions", "delay_reason")
        if "delay_minutes" in sess_cols:
            op.drop_column("attendance_sessions", "delay_minutes")
        if "scheduled_start_at" in sess_cols:
            op.drop_column("attendance_sessions", "scheduled_start_at")
