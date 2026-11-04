"""Add LMS enhancements (groups, server timer, availability) and ClassGradeConfig

Revision ID: 7b2a9f1c3d8e
Revises: 5e8c1b2a9d41
Create Date: 2026-10-30 22:15:00.000000
"""
from __future__ import annotations

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '7b2a9f1c3d8e'
down_revision: Union[str, None] = '5e8c1b2a9d41'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Extend quiz_question_type_enum with new question types
    op.execute("ALTER TYPE quiz_question_type_enum ADD VALUE IF NOT EXISTS 'TRUE_FALSE'")
    op.execute("ALTER TYPE quiz_question_type_enum ADD VALUE IF NOT EXISTS 'SHORT_ANSWER'")
    op.execute("ALTER TYPE quiz_question_type_enum ADD VALUE IF NOT EXISTS 'ESSAY'")

    # 2. Create class_grade_configs table
    op.create_table(
        'class_grade_configs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('class_id', sa.Integer(), nullable=False),
        sa.Column('uts_weight', sa.Float(), nullable=False, server_default='0.30'),
        sa.Column('uas_weight', sa.Float(), nullable=False, server_default='0.35'),
        sa.Column('aktif_weight', sa.Float(), nullable=False, server_default='0.10'),
        sa.Column('tugas_weight', sa.Float(), nullable=False, server_default='0.15'),
        sa.Column('absen_weight', sa.Float(), nullable=False, server_default='0.10'),
        sa.Column('default_aktif_score', sa.Float(), nullable=False, server_default='80.0'),
        sa.Column('is_published', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('published_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('published_by', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['class_id'], ['course_classes.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['published_by'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('class_id', name='uq_class_grade_config_class_id'),
    )
    op.create_index(op.f('ix_class_grade_configs_id'), 'class_grade_configs', ['id'], unique=False)

    # 3. Add columns to student_grades
    op.add_column('student_grades', sa.Column('is_default_aktif', sa.Boolean(), server_default=sa.text('true'), nullable=False))
    op.add_column('student_grades', sa.Column('is_published', sa.Boolean(), server_default=sa.text('false'), nullable=False))
    op.add_column('student_grades', sa.Column('revision_reason', sa.Text(), nullable=True))
    op.add_column('student_grades', sa.Column('revision_requested_at', sa.DateTime(timezone=True), nullable=True))

    # 4. Add columns to course_materials
    op.add_column('course_materials', sa.Column('available_from', sa.DateTime(timezone=True), nullable=True))

    # 5. Add columns to assignments
    op.add_column('assignments', sa.Column('is_group', sa.Boolean(), server_default=sa.text('false'), nullable=False))
    op.add_column('assignments', sa.Column('group_size', sa.Integer(), server_default=sa.text('1'), nullable=False))
    op.add_column('assignments', sa.Column('start_date', sa.DateTime(timezone=True), nullable=True))

    # 6. Create assignment_groups table
    op.create_table(
        'assignment_groups',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('assignment_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('leader_id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['assignment_id'], ['assignments.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['leader_id'], ['student_profiles.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_assignment_groups_id'), 'assignment_groups', ['id'], unique=False)

    # 7. Create assignment_group_members table
    op.create_table(
        'assignment_group_members',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('group_id', sa.Integer(), nullable=False),
        sa.Column('student_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['group_id'], ['assignment_groups.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['student_id'], ['student_profiles.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('group_id', 'student_id', name='uq_assignment_group_member'),
    )
    op.create_index(op.f('ix_assignment_group_members_id'), 'assignment_group_members', ['id'], unique=False)

    # 8. Add group_id to assignment_submissions
    op.add_column('assignment_submissions', sa.Column('group_id', sa.Integer(), nullable=True))
    op.create_foreign_key(
        'fk_assignment_submissions_group_id',
        'assignment_submissions',
        'assignment_groups',
        ['group_id'],
        ['id'],
        ondelete='SET NULL',
    )

    # 9. Add columns to quizzes
    op.add_column('quizzes', sa.Column('start_time', sa.DateTime(timezone=True), nullable=True))
    op.add_column('quizzes', sa.Column('end_time', sa.DateTime(timezone=True), nullable=True))
    op.add_column('quizzes', sa.Column('show_answer_after_deadline', sa.Boolean(), server_default=sa.text('false'), nullable=False))

    # 10. Add columns to quiz_submissions
    op.add_column('quiz_submissions', sa.Column('server_deadline', sa.DateTime(timezone=True), nullable=True))
    op.add_column('quiz_submissions', sa.Column('is_auto_submitted', sa.Boolean(), server_default=sa.text('false'), nullable=False))


def downgrade() -> None:
    op.drop_column('quiz_submissions', 'is_auto_submitted')
    op.drop_column('quiz_submissions', 'server_deadline')

    op.drop_column('quizzes', 'show_answer_after_deadline')
    op.drop_column('quizzes', 'end_time')
    op.drop_column('quizzes', 'start_time')

    op.drop_constraint('fk_assignment_submissions_group_id', 'assignment_submissions', type_='foreignkey')
    op.drop_column('assignment_submissions', 'group_id')

    op.drop_index(op.f('ix_assignment_group_members_id'), table_name='assignment_group_members')
    op.drop_table('assignment_group_members')

    op.drop_index(op.f('ix_assignment_groups_id'), table_name='assignment_groups')
    op.drop_table('assignment_groups')

    op.drop_column('assignments', 'start_date')
    op.drop_column('assignments', 'group_size')
    op.drop_column('assignments', 'is_group')

    op.drop_column('course_materials', 'available_from')

    op.drop_column('student_grades', 'revision_requested_at')
    op.drop_column('student_grades', 'revision_reason')
    op.drop_column('student_grades', 'is_published')
    op.drop_column('student_grades', 'is_default_aktif')

    op.drop_index(op.f('ix_class_grade_configs_id'), table_name='class_grade_configs')
    op.drop_table('class_grade_configs')
