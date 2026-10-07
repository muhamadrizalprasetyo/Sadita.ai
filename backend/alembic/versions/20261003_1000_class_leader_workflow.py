"""class leader assignment and attendance approval workflow

Revision ID: b7f4c2d9a100
Revises: 395ec527e804
"""
from alembic import op
import sqlalchemy as sa

revision = "b7f4c2d9a100"
down_revision = "395ec527e804"
branch_labels = None
depends_on = None

def upgrade() -> None:
    inspector = sa.inspect(op.get_bind())
    if not inspector.has_table("class_leader_assignments"):
        op.create_table("class_leader_assignments", sa.Column("id",sa.Integer,primary_key=True), sa.Column("class_id",sa.Integer,sa.ForeignKey("course_classes.id",ondelete="CASCADE"),nullable=False), sa.Column("student_id",sa.Integer,sa.ForeignKey("student_profiles.id",ondelete="CASCADE"),nullable=False), sa.Column("assigned_at",sa.DateTime(timezone=True),nullable=False), sa.Column("assigned_by",sa.Integer,sa.ForeignKey("users.id"),nullable=False), sa.Column("is_active",sa.Boolean,nullable=False,server_default=sa.true()))
    if "uq_active_class_leader" not in {item["name"] for item in inspector.get_indexes("class_leader_assignments")}:
        op.create_index("uq_active_class_leader","class_leader_assignments",["class_id"],unique=True,postgresql_where=sa.text("is_active"))
    if not inspector.has_table("attendance_requests"):
        op.create_table("attendance_requests", sa.Column("id",sa.Integer,primary_key=True), sa.Column("session_id",sa.Integer,sa.ForeignKey("attendance_sessions.id",ondelete="CASCADE"),nullable=False), sa.Column("student_id",sa.Integer,sa.ForeignKey("student_profiles.id",ondelete="CASCADE"),nullable=False), sa.Column("status",sa.Enum("PENDING","VERIFIED","APPROVED","REJECTED",name="attendance_request_status_enum"),nullable=False), sa.Column("submitted_at",sa.DateTime(timezone=True),nullable=False), sa.Column("verified_by",sa.Integer,sa.ForeignKey("users.id")), sa.Column("verified_at",sa.DateTime(timezone=True)),sa.Column("approved_by",sa.Integer,sa.ForeignKey("users.id")),sa.Column("approved_at",sa.DateTime(timezone=True)),sa.Column("rejection_reason",sa.Text))
    if not inspector.has_table("audit_logs"):
        op.create_table("audit_logs",sa.Column("id",sa.Integer,primary_key=True),sa.Column("actor_id",sa.Integer,sa.ForeignKey("users.id")),sa.Column("action",sa.String(80),nullable=False),sa.Column("entity",sa.String(80),nullable=False),sa.Column("entity_id",sa.Integer),sa.Column("before",sa.JSON),sa.Column("after",sa.JSON),sa.Column("created_at",sa.DateTime(timezone=True),nullable=False))
def downgrade() -> None:
    op.drop_table("audit_logs");op.drop_table("attendance_requests");op.drop_index("uq_active_class_leader",table_name="class_leader_assignments");op.drop_table("class_leader_assignments")
