import asyncio
import asyncpg
import sys
import os

async def main():
    try:
        conn = await asyncpg.connect(user='postgres', host='localhost', port=5433, database='postgres')
        print("Connected to PostgreSQL port 5433.")
        exists = await conn.fetchval("SELECT 1 FROM pg_database WHERE datname = 'sadita_db'")
        if not exists:
            await conn.execute("CREATE DATABASE sadita_db")
            print("Database 'sadita_db' created successfully.")
        else:
            print("Database 'sadita_db' already exists.")
        await conn.close()

        # Initialize schema and seed data
        backend_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backend")
        sys.path.insert(0, backend_dir)
        import app.models  # noqa: F401
        from app.db.session import Base, engine
        from app.db.seed import seed_database
        print("Creating database tables...")
        Base.metadata.create_all(bind=engine)
        print("Seeding initial academic dataset...")
        seed_database()
        print("Database ready for real university usage!")
    except Exception as e:
        print("Connection/Initialization failed:", e)
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())
