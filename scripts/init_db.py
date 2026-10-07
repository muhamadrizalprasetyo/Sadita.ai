import asyncio
import asyncpg
import sys

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
    except Exception as e:
        print("Connection failed:", e)
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())
