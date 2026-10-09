"""
Audit LMS End-to-End Forensic Script for SADITA.ai
Performs full cycle with real PostgreSQL database:
1. DOSEN LOGIN
2. DOSEN selects class
3. DOSEN creates meeting / session
4. DOSEN creates material
5. DOSEN creates assignment
6. DOSEN creates quiz + questions + options
7. MAHASISWA LOGIN
8. MAHASISWA accesses class
9. MAHASISWA accesses meeting / session
10. MAHASISWA accesses material
11. MAHASISWA submits assignment
12. MAHASISWA takes quiz
13. DOSEN views assignment submission
14. DOSEN grades submission
15. MAHASISWA views grade
"""
import sys, os
sys.path.insert(0, os.path.abspath("."))
import json, urllib.request, urllib.error
from datetime import date, datetime, timedelta, timezone

BASE_URL = "http://127.0.0.1:8000/api/v1"

def req(url, method="GET", data=None, token=None):
    headers = {}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    body = None
    if data is not None:
        headers["Content-Type"] = "application/json"
        body = json.dumps(data).encode("utf-8")
    r = urllib.request.Request(f"{BASE_URL}{url}", data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(r) as resp:
            content = resp.read().decode("utf-8")
            return resp.status, json.loads(content) if content else {}
    except urllib.error.HTTPError as e:
        content = e.read().decode("utf-8")
        try:
            return e.code, json.loads(content)
        except Exception:
            return e.code, content

steps = []

def run_step(step_name, func):
    try:
        ok, detail = func()
        status = "PASS" if ok else "FAIL"
        steps.append((step_name, status, detail))
        print(f"[{status}] {step_name}: {detail}")
        return ok
    except Exception as e:
        import traceback
        tb = traceback.format_exc()
        steps.append((step_name, "FAIL", f"Exception: {e}"))
        print(f"[FAIL] {step_name}: Exception {e}")
        return False

# Shared context
ctx = {}

# 1. DOSEN LOGIN
def step_dosen_login():
    code, data = req("/auth/login", "POST", {"email": "dosen@unipi.ac.id", "password": "dosen123"})
    if code == 200 and "access_token" in data:
        ctx["dosen_token"] = data["access_token"]
        return True, f"Token received, User={data['user']['full_name']}"
    return False, f"Code {code}: {data}"

run_step("1. DOSEN Login", step_dosen_login)

# 2. DOSEN selects class
def step_dosen_class():
    code, data = req("/academic/classes", "GET", token=ctx["dosen_token"])
    if code == 200 and len(data) > 0:
        ctx["class_id"] = data[0]["id"]
        return True, f"Class ID={ctx['class_id']}, Name={data[0]['name']}"
    return False, f"Code {code}: {data}"

run_step("2. DOSEN selects class", step_dosen_class)

# 3. DOSEN creates meeting / session
def step_dosen_meeting():
    code, data = req("/attendance/sessions", "POST", {
        "class_id": ctx["class_id"],
        "session_number": 2,
        "date": str(date.today()),
        "topic": "E2E Audit Session Pertemuan 2"
    }, token=ctx["dosen_token"])
    if code in (200, 201):
        ctx["session_id"] = data["id"]
        return True, f"Session ID={ctx['session_id']}, Pertemuan={data.get('session_number')}"
    return False, f"Code {code}: {data}"

run_step("3. DOSEN creates meeting/session", step_dosen_meeting)

# 4. DOSEN creates material
def step_dosen_material():
    code, data = req("/lms/materials", "POST", {
        "class_id": ctx["class_id"],
        "session_id": ctx["session_id"],
        "title": "Materi Pertemuan 2 E2E",
        "material_type": "DOCUMENT",
        "description": "Bahan ajar materi pertemuan 2",
        "resource_url": "https://unipi.ac.id/modul2.pdf"
    }, token=ctx["dosen_token"])
    if code in (200, 201):
        ctx["material_id"] = data["id"]
        return True, f"Material ID={ctx['material_id']}, Title={data.get('title')}"
    return False, f"Code {code}: {data}"

run_step("4. DOSEN creates material", step_dosen_material)

# 5. DOSEN creates assignment
def step_dosen_assignment():
    due = (datetime.now(timezone.utc) + timedelta(days=7)).isoformat()
    code, data = req("/lms/assignments", "POST", {
        "class_id": ctx["class_id"],
        "session_id": ctx["session_id"],
        "title": "Tugas 2 E2E Audit",
        "description": "Deskripsi tugas pertemuan 2",
        "due_date": due,
        "max_score": 100,
        "allow_late": True
    }, token=ctx["dosen_token"])
    if code in (200, 201):
        ctx["assignment_id"] = data["id"]
        return True, f"Assignment ID={ctx['assignment_id']}, Title={data.get('title')}"
    return False, f"Code {code}: {data}"

run_step("5. DOSEN creates assignment", step_dosen_assignment)

# 6. DOSEN creates quiz + questions + options
def step_dosen_quiz():
    code, data = req("/lms/quizzes", "POST", {
        "class_id": ctx["class_id"],
        "session_id": ctx["session_id"],
        "title": "Kuis Pertemuan 2 E2E",
        "description": "Kuis formatif",
        "passing_score": 70,
        "max_attempts": 2,
        "time_limit_minutes": 15,
        "is_published": True
    }, token=ctx["dosen_token"])
    if code not in (200, 201):
        return False, f"Failed quiz create: {code} - {data}"
    ctx["quiz_id"] = data["id"]

    # Add question
    q_code, q_data = req(f"/lms/quizzes/{ctx['quiz_id']}/questions", "POST", {
        "question_text": "Apa protokol IoT utama SADITA?",
        "question_type": "SINGLE_CHOICE",
        "points": 100,
        "question_number": 1
    }, token=ctx["dosen_token"])
    if q_code not in (200, 201):
        return False, f"Failed question create: {q_code} - {q_data}"
    ctx["q_id"] = q_data["id"]

    # Add options
    opt1_code, opt1 = req(f"/lms/questions/{ctx['q_id']}/options", "POST", {
        "option_text": "MQTT",
        "is_correct": True,
        "option_number": 1
    }, token=ctx["dosen_token"])
    opt2_code, opt2 = req(f"/lms/questions/{ctx['q_id']}/options", "POST", {
        "option_text": "FTP",
        "is_correct": False,
        "option_number": 2
    }, token=ctx["dosen_token"])
    ctx["correct_opt_id"] = opt1["id"]

    return True, f"Quiz ID={ctx['quiz_id']}, Question ID={ctx['q_id']}, Option1 ID={opt1['id']}"

run_step("6. DOSEN creates quiz + questions + options", step_dosen_quiz)

# 7. MAHASISWA LOGIN
def step_mhs_login():
    code, data = req("/auth/login", "POST", {"email": "rizal@mhs.unipi.ac.id", "password": "mhs123"})
    if code == 200 and "access_token" in data:
        ctx["mhs_token"] = data["access_token"]
        return True, f"Token received, User={data['user']['full_name']}"
    return False, f"Code {code}: {data}"

run_step("7. MAHASISWA Login", step_mhs_login)

# 8. MAHASISWA accesses class
def step_mhs_class():
    code, data = req(f"/academic/classes/{ctx['class_id']}", "GET", token=ctx["mhs_token"])
    if code == 200:
        return True, f"Class accessed: {data.get('name')}"
    return False, f"Code {code}: {data}"

run_step("8. MAHASISWA accesses class", step_mhs_class)

# 9. MAHASISWA accesses meeting / session
def step_mhs_meeting():
    code, data = req(f"/attendance/sessions/{ctx['session_id']}", "GET", token=ctx["mhs_token"])
    if code == 200:
        return True, f"Meeting accessed: Pertemuan {data.get('session_number')}"
    return False, f"Code {code}: {data}"

run_step("9. MAHASISWA accesses meeting/session", step_mhs_meeting)

# 10. MAHASISWA accesses material
def step_mhs_material():
    code, data = req(f"/lms/materials?class_id={ctx['class_id']}&session_id={ctx['session_id']}", "GET", token=ctx["mhs_token"])
    if code == 200 and len(data) > 0:
        return True, f"Material accessed: {data[0]['title']}"
    return False, f"Code {code}: {data}"

run_step("10. MAHASISWA accesses material", step_mhs_material)

# 11. MAHASISWA submits assignment
def step_mhs_submit_assignment():
    code, data = req(f"/lms/assignments/{ctx['assignment_id']}/submissions", "POST", {
        "file_url": "https://unipi.ac.id/submission-rizal.pdf",
        "content": "Laporan pengujian IoT pertemuan 2"
    }, token=ctx["mhs_token"])
    if code in (200, 201):
        ctx["submission_id"] = data["id"]
        return True, f"Submission ID={ctx['submission_id']}, Status={data.get('status')}"
    return False, f"Code {code}: {data}"

run_step("11. MAHASISWA submits assignment", step_mhs_submit_assignment)

# 12. MAHASISWA takes quiz
def step_mhs_take_quiz():
    code, data = req(f"/lms/quizzes/{ctx['quiz_id']}/submit", "POST", {
        "quiz_id": ctx["quiz_id"],
        "answers": [
            {
                "question_id": ctx["q_id"],
                "selected_option_id": ctx["correct_opt_id"]
            }
        ]
    }, token=ctx["mhs_token"])
    if code in (200, 201):
        ctx["quiz_submission_id"] = data["id"]
        return True, f"Quiz submitted! Score={data.get('score')}, Passed={data.get('passed')}"
    return False, f"Code {code}: {data}"

run_step("12. MAHASISWA takes quiz", step_mhs_take_quiz)

# 13. DOSEN views submission
def step_dosen_view_submission():
    code, data = req(f"/lms/assignments/{ctx['assignment_id']}/submissions", "GET", token=ctx["dosen_token"])
    if code == 200 and len(data) > 0:
        return True, f"Total submissions found: {len(data)}, First student ID: {data[0]['student_id']}"
    return False, f"Code {code}: {data}"

run_step("13. DOSEN views assignment submissions", step_dosen_view_submission)

# 14. DOSEN grades submission
def step_dosen_grade_submission():
    code, data = req(f"/lms/submissions/{ctx['submission_id']}/grade", "PUT", {
        "score": 95.0,
        "feedback": "Bagus sekali, pemahaman MQTT dan sensor sangat memadai."
    }, token=ctx["dosen_token"])
    if code == 200:
        return True, f"Graded! Score={data.get('score')}, Feedback={data.get('feedback')}"
    return False, f"Code {code}: {data}"

run_step("14. DOSEN grades submission", step_dosen_grade_submission)

# 15. MAHASISWA views grade
def step_mhs_view_grade():
    code, data = req(f"/lms/assignments/{ctx['assignment_id']}/my-submission", "GET", token=ctx["mhs_token"])
    if code == 200 and data:
        return True, f"Score viewed: {data.get('score')}, Feedback: {data.get('feedback')}"
    return False, f"Code {code}: {data}"

run_step("15. MAHASISWA views grade", step_mhs_view_grade)

print("\n================ LMS E2E SUMMARY ================")
all_pass = all(s[1] == "PASS" for s in steps)
print(f"Overall Result: {'100% PASS' if all_pass else 'FAIL'}")
for s in steps:
    print(f"  [{s[1]}] {s[0]}: {s[2]}")
