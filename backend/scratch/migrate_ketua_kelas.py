from app.db.session import engine
from sqlalchemy import text

with engine.begin() as conn:
    res = conn.execute(text("UPDATE users SET role = 'MAHASISWA' WHERE role = 'KETUA_KELAS'"))
    print(f"Updated {res.rowcount} users from KETUA_KELAS to MAHASISWA")
