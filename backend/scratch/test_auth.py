"""
Audit Authentication Script for SADITA.ai
Uses urllib.request (standard library)
Tests login, token generation, and protected endpoints for all 5 roles:
- ADMIN
- KAPRODI
- DOSEN
- KETUA_KELAS
- MAHASISWA
"""
import sys
import os
sys.path.insert(0, os.path.abspath("."))

import json
import urllib.request
import urllib.error
import sqlalchemy as sa
from app.core.security import hash_password
from app.db.session import engine

BASE_URL = "http://127.0.0.1:8000/api/v1"

# 1. Ensure test users exist with known credentials
with engine.connect().execution_options(isolation_level="AUTOCOMMIT") as conn:
    exists = conn.execute(sa.text("SELECT id FROM users WHERE email='ketua@mhs.unipi.ac.id'")).scalar()
    if not exists:
        conn.execute(
            sa.text(
                "INSERT INTO users (email, password_hash, full_name, role, is_active, created_at, updated_at) "
                "VALUES ('ketua@mhs.unipi.ac.id', :pwd, 'Ahmad Ketua Kelas', 'KETUA_KELAS', true, NOW(), NOW())"
            ),
            {"pwd": hash_password("ketua123")},
        )
        print("[SETUP] Created test user: ketua@mhs.unipi.ac.id (role=KETUA_KELAS)")

users_to_test = [
    ("ADMIN", "admin@unipi.ac.id", "admin123"),
    ("KAPRODI", "kaprodi@unipi.ac.id", "kaprodi123"),
    ("DOSEN", "dosen@unipi.ac.id", "dosen123"),
    ("KETUA_KELAS", "ketua@mhs.unipi.ac.id", "ketua123"),
    ("MAHASISWA", "rizal@mhs.unipi.ac.id", "mhs123"),
]

def make_req(url, method="GET", data=None, headers=None):
    if headers is None:
        headers = {}
    req_data = None
    if data is not None:
        req_data = json.dumps(data).encode("utf-8")
        headers["Content-Type"] = "application/json"
    req = urllib.request.Request(url, data=req_data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            body = resp.read().decode("utf-8")
            return resp.status, json.loads(body) if body else {}
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8")
        try:
            parsed = json.loads(body)
        except Exception:
            parsed = body
        return e.code, parsed

results = {}

for role, email, password in users_to_test:
    print(f"\n--- Testing Login for Role: {role} ({email}) ---")
    status, data = make_req(f"{BASE_URL}/auth/login", method="POST", data={"email": email, "password": password})
    if status != 200:
        print(f"FAILED LOGIN: {status} - {data}")
        results[role] = {"status": "FAIL_LOGIN", "code": status, "error": data}
        continue
    
    token = data.get("access_token")
    user_info = data.get("user", {})
    print(f"SUCCESS LOGIN: Token={token[:15]}... | Returned Role={user_info.get('role')} | Name={user_info.get('full_name')}")

    # Test /auth/me
    headers = {"Authorization": f"Bearer {token}"}
    me_status, me_body = make_req(f"{BASE_URL}/auth/me", headers=headers)
    print(f"PROTECTED /auth/me: Status={me_status} | Body={me_body}")

    results[role] = {
        "status": "PASS",
        "login_code": status,
        "returned_role": user_info.get("role"),
        "me_code": me_status,
        "token_type": data.get("token_type")
    }

print("\n================ AUTH AUDIT SUMMARY ================")
for r, res in results.items():
    print(f"{r}: {res}")
