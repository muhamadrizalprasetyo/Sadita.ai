"""
Migration script for Academic Cohort, Regular Class Type, and KRS Requests.
Safe, non-destructive, idempotent.
"""
from app.db.session import engine
from sqlalchemy import text

def run_migration():
    with engine.connect() as conn:
        print("Running safe migration for Academic & KRS models...")
        conn.execute(text("""
            ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS academic_cohort INTEGER DEFAULT 1 NOT NULL;
            ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS class_type class_type_enum DEFAULT 'REGULER_PAGI' NOT NULL;
            ALTER TABLE class_enrollments ADD COLUMN IF NOT EXISTS enrollment_type VARCHAR(30) DEFAULT 'REGULER' NOT NULL;
            CREATE TABLE IF NOT EXISTS krs_requests (
                id SERIAL PRIMARY KEY,
                student_id INTEGER NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
                class_id INTEGER NOT NULL REFERENCES course_classes(id) ON DELETE CASCADE,
                request_type VARCHAR(30) NOT NULL,
                status VARCHAR(30) DEFAULT 'PENDING_APPROVAL' NOT NULL,
                alasan TEXT,
                submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                reviewed_at TIMESTAMPTZ,
                reviewed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
                reviewer_notes TEXT,
                enrollment_id INTEGER REFERENCES class_enrollments(id) ON DELETE SET NULL
            );
            CREATE INDEX IF NOT EXISTS ix_krs_requests_student_id ON krs_requests(student_id);
            CREATE INDEX IF NOT EXISTS ix_krs_requests_class_id ON krs_requests(class_id);
            CREATE INDEX IF NOT EXISTS ix_krs_requests_status ON krs_requests(status);
        """))
        conn.commit()
        print("✅ Migration completed successfully!")

if __name__ == "__main__":
    run_migration()
