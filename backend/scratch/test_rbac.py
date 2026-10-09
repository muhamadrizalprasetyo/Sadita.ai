"""
Audit RBAC Forensic Script for SADITA.ai
Tests Positive and Negative Access across roles:
- ADMIN
- KAPRODI
- DOSEN
- KETUA_KELAS
- MAHASISWA
"""
import sys, os
sys.path.insert(0, os.path.abspath("."))
import json, urllib.request, urllib.error

BASE_URL = "http://127.0.0.1:8000/api/v1"

def login(email, password):
    req = urllib.request.Request(
        f"{BASE_URL}/auth/login",
        data=json.dumps({"email": email, "password": password}).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode("utf-8"))["access_token"]

tokens = {
    "ADMIN": login("admin@unipi.ac.id", "admin123"),
    "KAPRODI": login("kaprodi@unipi.ac.id", "kaprodi123"),
    "DOSEN": login("dosen@unipi.ac.id", "dosen123"),
    "KETUA_KELAS": login("ketua@mhs.unipi.ac.id", "ketua123"),
    "MAHASISWA": login("rizal@mhs.unipi.ac.id", "mhs123"),
}

def api_call(role, path, method="GET", body=None):
    headers = {"Authorization": f"Bearer {tokens[role]}"}
    data = None
    if body is not None:
        headers["Content-Type"] = "application/json"
        data = json.dumps(body).encode("utf-8")
    req = urllib.request.Request(f"{BASE_URL}{path}", data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            content = resp.read().decode("utf-8")
            return resp.status, json.loads(content) if content else {}
    except urllib.error.HTTPError as e:
        content = e.read().decode("utf-8")
        try:
            parsed = json.loads(content)
        except Exception:
            parsed = content
        return e.code, parsed

tests = [
    # 1. Admin Endpoint Negative Tests (GET /users is Admin only)
    ("MAHASISWA -> GET /users (Admin only)", "MAHASISWA", "/users", "GET", None, 403),
    ("DOSEN -> GET /users (Admin only)", "DOSEN", "/users", "GET", None, 403),
    ("KETUA_KELAS -> GET /users (Admin only)", "KETUA_KELAS", "/users", "GET", None, 403),
    ("KAPRODI -> GET /users (Admin only)", "KAPRODI", "/users", "GET", None, 403),
    ("ADMIN -> GET /users (Admin only)", "ADMIN", "/users", "GET", None, 200),
    
    # 2. IoT Devices (Admin only)
    ("MAHASISWA -> GET /devices (Admin only)", "MAHASISWA", "/devices", "GET", None, 403),
    ("DOSEN -> GET /devices (Admin only)", "DOSEN", "/devices", "GET", None, 403),
    ("KETUA_KELAS -> GET /devices (Admin only)", "KETUA_KELAS", "/devices", "GET", None, 403),
    ("ADMIN -> GET /devices (Admin only)", "ADMIN", "/devices", "GET", None, 200),

    # 3. Grade Modification Negative Tests
    ("MAHASISWA -> PUT /lms/classes/1/students/2/grade", "MAHASISWA", "/lms/classes/1/students/2/grade", "PUT", {"component": "uts", "score": 90}, 403),
    ("KETUA_KELAS -> PUT /lms/classes/1/students/2/grade", "KETUA_KELAS", "/lms/classes/1/students/2/grade", "PUT", {"component": "uts", "score": 90}, 403),
    ("DOSEN -> PUT /lms/classes/1/students/2/grade", "DOSEN", "/lms/classes/1/students/2/grade", "PUT", {"component": "uts", "score": 90}, 200),
    
    # 4. Attendance Session Open/Close (Lecturer/Admin only)
    ("MAHASISWA -> POST /attendance/sessions/1/close", "MAHASISWA", "/attendance/sessions/1/close", "POST", None, 403),
    ("KETUA_KELAS -> POST /attendance/sessions/1/close", "KETUA_KELAS", "/attendance/sessions/1/close", "POST", None, 403),
    ("DOSEN -> POST /attendance/sessions/1/close", "DOSEN", "/attendance/sessions/1/close", "POST", None, 200),
    
    # 5. Quiz Management (Create Quiz)
    ("MAHASISWA -> POST /lms/quizzes", "MAHASISWA", "/lms/quizzes", "POST", {"class_id": 1, "title": "Hacked Quiz", "passing_score": 70}, 403),
    ("KETUA_KELAS -> POST /lms/quizzes", "KETUA_KELAS", "/lms/quizzes", "POST", {"class_id": 1, "title": "Hacked Quiz", "passing_score": 70}, 403),
    ("DOSEN -> POST /lms/quizzes", "DOSEN", "/lms/quizzes", "POST", {"class_id": 1, "title": "Audit Test Quiz 2", "passing_score": 70}, 201),

    # 6. Student History (Can student A access student B private history?)
    ("MAHASISWA (id=4) -> GET /attendance/students/2/history (Student B)", "MAHASISWA", "/attendance/students/2/history", "GET", None, 403),
    ("MAHASISWA (id=4) -> GET /attendance/students/1/history (Own profile id=1)", "MAHASISWA", "/attendance/students/1/history", "GET", None, 200),

    # 7. Kaprodi Monitoring endpoints
    ("KAPRODI -> GET /academic/classes", "KAPRODI", "/academic/classes", "GET", None, 200),
    ("KAPRODI -> GET /academic/courses", "KAPRODI", "/academic/courses", "GET", None, 200),
]

print("================ STARTING RBAC FORENSIC TESTS ================")
results = []
for desc, role, path, method, body, expected_code in tests:
    status, resp_data = api_call(role, path, method, body)
    passed = (status == expected_code)
    results.append((desc, role, expected_code, status, passed, resp_data))
    status_icon = "✅ PASS" if passed else "❌ FAIL"
    print(f"{status_icon} | {desc} -> Expected {expected_code}, Got {status}")

failed_count = sum(1 for r in results if not r[4])
print(f"\nRBAC Audit: {len(results) - failed_count}/{len(results)} tests passed.")
