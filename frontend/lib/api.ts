/**
 * SADITA Frontend — API Client
 * Centralized fetch wrapper for backend communication.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
}

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("sadita_access_token");
}

export function setStoredToken(token: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem("sadita_access_token", token);
  }
}

export function clearStoredToken(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem("sadita_access_token");
    localStorage.removeItem("sadita_user");
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_BASE}${path}`;
  const token = getStoredToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string>),
  };

  try {
    const res = await fetch(url, {
      ...options,
      headers,
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      return {
        status: res.status,
        error: data?.detail ?? `HTTP ${res.status}`,
      };
    }

    return { status: res.status, data: data as T };
  } catch (err) {
    const rawMessage = err instanceof Error ? err.message : "Network error";
    const networkHint =
      rawMessage.includes("Failed to fetch") ||
      rawMessage.includes("NetworkError") ||
      rawMessage.includes("fetch")
        ? `Backend SADITA tidak aktif atau tidak dapat dijangkau di ${API_BASE}. Jalankan server FastAPI terlebih dahulu, lalu coba login kembali.`
        : rawMessage;

    return {
      status: 0,
      error: networkHint,
    };
  }
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface StudentProfile {
  id: number;
  user_id: number;
  nim: string;
  department: string;
  batch_year: number;
  phone?: string;
  rfid_uid?: string;
  fingerprint_template_id?: number;
}

export interface LecturerProfile {
  id: number;
  user_id: number;
  nidn: string;
  department: string;
  phone?: string;
}

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: "ADMIN" | "DOSEN" | "MAHASISWA";
  is_active: boolean;
  student_profile?: StudentProfile;
  lecturer_profile?: LecturerProfile;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: User;
}

export interface AcademicTerm {
  id: number;
  name: string;
  is_active: boolean;
  start_date: string;
  end_date: string;
}

export interface Course {
  id: number;
  code: string;
  name: string;
  credits: number;
  description?: string;
}

export interface CourseClass {
  id: number;
  name: string;
  course_id: number;
  term_id: number;
  lecturer_id: number;
  room_id?: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
  course?: Course;
  term?: AcademicTerm;
  lecturer?: LecturerProfile;
}

export interface AdminDashboard {
  total_students: number;
  total_lecturers: number;
  total_classes: number;
  total_courses: number;
  open_sessions: number;
  devices_offline: number;
  pending_approvals: number;
  today_attendance: number;
  generated_at: string;
}

export interface SaditaDevice {
  id: number;
  device_id: string;
  nama: string;
  room_id?: number;
  status: "ACTIVE" | "INACTIVE" | "MAINTENANCE" | "OFFLINE";
  firmware_version?: string;
  ip_address?: string;
  last_seen_at?: string;
  keterangan?: string;
}

export interface DeviceEvent {
  id: number;
  device_id: string;
  session_id?: number;
  student_id?: number;
  event_type: string;
  berhasil: boolean;
  pesan?: string;
  received_at: string;
}

export interface ClassEnrollment {
  id: number;
  class_id: number;
  student_id: number;
  status: string;
  enrolled_at: string;
  student?: StudentProfile;
}

// ---------------------------------------------------------------------------
// API Modules
// ---------------------------------------------------------------------------
export const authApi = {
  login: (email: string, password: string) =>
    apiFetch<TokenResponse>("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  getMe: () => apiFetch<User>("/api/v1/auth/me"),
  refresh: (refresh_token: string) =>
    apiFetch<TokenResponse>("/api/v1/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refresh_token }),
    }),
};

export const studentApi = {
  list: (skip = 0, limit = 100) =>
    apiFetch<StudentProfile[]>(`/api/v1/students?skip=${skip}&limit=${limit}`),
  getById: (id: number) => apiFetch<StudentProfile>(`/api/v1/students/${id}`),
  getByRfid: (rfidUid: string) =>
    apiFetch<StudentProfile>(`/api/v1/students/by-rfid/${rfidUid}`),
  assignHardware: (
    id: number,
    hardware: { rfid_uid?: string; fingerprint_template_id?: number }
  ) =>
    apiFetch<StudentProfile>(`/api/v1/students/${id}/hardware`, {
      method: "PUT",
      body: JSON.stringify(hardware),
    }),
};

export const lecturerApi = {
  list: (skip = 0, limit = 100) =>
    apiFetch<LecturerProfile[]>(`/api/v1/lecturers?skip=${skip}&limit=${limit}`),
  getById: (id: number) => apiFetch<LecturerProfile>(`/api/v1/lecturers/${id}`),
};

export const academicApi = {
  getTerms: () => apiFetch<AcademicTerm[]>("/api/v1/academic/terms"),
  getCourses: () => apiFetch<Course[]>("/api/v1/academic/courses"),
  getClasses: () => apiFetch<CourseClass[]>("/api/v1/academic/classes"),
  getClassById: (id: number) =>
    apiFetch<CourseClass>(`/api/v1/academic/classes/${id}`),
  getClassStudents: (id: number) =>
    apiFetch<ClassEnrollment[]>(`/api/v1/academic/classes/${id}/students`),
  getDashboard: () => apiFetch<AdminDashboard>("/api/v1/academic/dashboard"),
};

// ---------------------------------------------------------------------------
// Attendance Types & API
// ---------------------------------------------------------------------------
export type SessionStatus = "SCHEDULED" | "OPEN" | "CLOSED";
export type AttendanceStatus = "HADIR" | "TERLAMBAT" | "IZIN" | "SAKIT" | "ALFA";

export interface AttendanceSession {
  id: number;
  class_id: number;
  session_number: number;
  date: string;
  topic?: string;
  status: SessionStatus;
  opened_at?: string;
  closed_at?: string;
}

export interface AttendanceRecord {
  id: number;
  session_id: number;
  student_id: number;
  status: AttendanceStatus;
  method?: string;
  check_in_time?: string;
  notes?: string;
  student?: StudentProfile;
}

export const attendanceApi = {
  getSessions: (classId: number) =>
    apiFetch<AttendanceSession[]>(`/api/v1/attendance/sessions?class_id=${classId}`),
  getSession: (sessionId: number) =>
    apiFetch<AttendanceSession>(`/api/v1/attendance/sessions/${sessionId}`),
  createSession: (data: { class_id: number; session_number: number; date: string; topic?: string }) =>
    apiFetch<AttendanceSession>("/api/v1/attendance/sessions", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  openSession: (sessionId: number, topic?: string) =>
    apiFetch<AttendanceSession>(`/api/v1/attendance/sessions/${sessionId}/open`, {
      method: "POST",
      body: JSON.stringify({ topic }),
    }),
  closeSession: (sessionId: number) =>
    apiFetch<AttendanceSession>(`/api/v1/attendance/sessions/${sessionId}/close`, {
      method: "POST",
    }),
  getSessionRecords: (sessionId: number) =>
    apiFetch<AttendanceRecord[]>(`/api/v1/attendance/sessions/${sessionId}/records`),
  getSessionSummary: (sessionId: number) =>
    apiFetch<Record<string, number>>(`/api/v1/attendance/sessions/${sessionId}/summary`),
  manualUpdate: (sessionId: number, data: { student_id: number; status: AttendanceStatus; notes?: string }) =>
    apiFetch<AttendanceRecord>(`/api/v1/attendance/sessions/${sessionId}/manual`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  getStudentHistory: (studentId: number, classId?: number) =>
    apiFetch<AttendanceRecord[]>(
      `/api/v1/attendance/students/${studentId}/history${classId ? `?class_id=${classId}` : ""}`
    ),
};

// ---------------------------------------------------------------------------
// LMS Types & API
// ---------------------------------------------------------------------------
export type MaterialType = "DOCUMENT" | "LINK" | "TEXT";
export type SubmissionStatus = "SUBMITTED" | "LATE" | "GRADED";

export interface CourseMaterial {
  id: number;
  class_id: number;
  session_id?: number;
  title: string;
  material_type: MaterialType;
  description?: string;
  resource_url?: string;
  content?: string;
  created_at: string;
}

export interface Assignment {
  id: number;
  class_id: number;
  session_id?: number;
  title: string;
  description?: string;
  due_date: string;
  max_score: number;
  allow_late: boolean;
  created_at: string;
  submission_count?: number;
}

export interface AssignmentSubmission {
  id: number;
  assignment_id: number;
  student_id: number;
  file_url?: string;
  content?: string;
  submitted_at: string;
  status: SubmissionStatus;
  score?: number;
  feedback?: string;
  graded_by?: number;
  graded_at?: string;
  student?: StudentProfile;
}

export interface AssignmentSummary {
  assignment_id: number;
  title: string;
  total_enrolled: number;
  total_submitted: number;
  total_graded: number;
  submission_rate_percent: number;
  average_score?: number;
  highest_score?: number;
  lowest_score?: number;
}

export type AttendanceRequestStatus = "PENDING" | "VERIFIED" | "APPROVED" | "REJECTED";
export interface AttendanceRequest {
  id: number; session_id: number; student_id: number; status: AttendanceRequestStatus;
  submitted_at: string; verified_by?: number; verified_at?: string; approved_by?: number;
  approved_at?: string; rejection_reason?: string;
}
export interface ClassLeader { id: number; class_id: number; student_id: number; assigned_at: string; assigned_by: number; is_active: boolean; }

// ---------------------------------------------------------------------------
// Grading Types & API
// ---------------------------------------------------------------------------
export type GradeScale = "A" | "B" | "C" | "D" | "E";

export interface StudentGrade {
  id: number;
  class_id: number;
  student_id: number;
  uts_score?: number;
  uas_score?: number;
  aktif_score?: number;
  tugas_score?: number;
  absen_score?: number;
  final_score?: number;
  grade_scale?: GradeScale;
  calculated_at?: string;
  notes?: string;
}

export const gradingApi = {
  getClassGrades: (classId: number) =>
    apiFetch<StudentGrade[]>(`/api/v1/lms/classes/${classId}/grades`),
  getStudentGrade: (classId: number, studentId: number) =>
    apiFetch<StudentGrade>(`/api/v1/lms/classes/${classId}/students/${studentId}/grade`),
  updateGrade: (classId: number, studentId: number, component: string, score: number) =>
    apiFetch<StudentGrade>(`/api/v1/lms/classes/${classId}/students/${studentId}/grade`, {
      method: "PUT",
      body: JSON.stringify({ component, score }),
    }),
  calculateClassGrades: (classId: number, recalculateAttendance = false) =>
    apiFetch<StudentGrade[]>(`/api/v1/lms/classes/${classId}/grades/calculate`, {
      method: "POST",
      body: JSON.stringify({ recalculate_attendance: recalculateAttendance }),
    }),
};

export const lmsApi = {
  getMaterials: (classId: number, sessionId?: number) =>
    apiFetch<CourseMaterial[]>(
      `/api/v1/lms/materials?class_id=${classId}${sessionId ? `&session_id=${sessionId}` : ""}`
    ),
  createMaterial: (data: {
    class_id: number;
    title: string;
    material_type: MaterialType;
    session_id?: number;
    description?: string;
    resource_url?: string;
    content?: string;
  }) =>
    apiFetch<CourseMaterial>("/api/v1/lms/materials", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  deleteMaterial: (id: number) =>
    apiFetch<void>(`/api/v1/lms/materials/${id}`, { method: "DELETE" }),

  getAssignments: (classId: number, sessionId?: number) =>
    apiFetch<Assignment[]>(
      `/api/v1/lms/assignments?class_id=${classId}${sessionId ? `&session_id=${sessionId}` : ""}`
    ),
  getAssignment: (id: number) =>
    apiFetch<Assignment & { submissions: AssignmentSubmission[] }>(`/api/v1/lms/assignments/${id}`),
  createAssignment: (data: {
    class_id: number;
    title: string;
    due_date: string;
    session_id?: number;
    description?: string;
    max_score?: number;
    allow_late?: boolean;
  }) =>
    apiFetch<Assignment>("/api/v1/lms/assignments", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  getAssignmentSummary: (id: number) =>
    apiFetch<AssignmentSummary>(`/api/v1/lms/assignments/${id}/summary`),
  deleteAssignment: (id: number) =>
    apiFetch<void>(`/api/v1/lms/assignments/${id}`, { method: "DELETE" }),

  submitAssignment: (
    assignmentId: number,
    data: { file_url?: string; content?: string }
  ) =>
    apiFetch<AssignmentSubmission>(`/api/v1/lms/assignments/${assignmentId}/submissions`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  getMySubmission: (assignmentId: number) =>
    apiFetch<AssignmentSubmission | null>(`/api/v1/lms/assignments/${assignmentId}/my-submission`),
  listSubmissions: (assignmentId: number) =>
    apiFetch<AssignmentSubmission[]>(`/api/v1/lms/assignments/${assignmentId}/submissions`),
  gradeSubmission: (
    submissionId: number,
    data: { score: number; feedback?: string }
  ) =>
    apiFetch<AssignmentSubmission>(`/api/v1/lms/submissions/${submissionId}/grade`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  getStudentSubmissions: (studentId: number, classId?: number) =>
    apiFetch<AssignmentSubmission[]>(
      `/api/v1/lms/students/${studentId}/submissions${classId ? `?class_id=${classId}` : ""}`
    ),
};

export const healthApi = {
  check: () =>
    apiFetch<{
      status: string;
      timestamp?: string;
      components: {
        database?: { status: string; version?: string };
        mqtt?: { status: string; broker_host?: string; broker_port?: number };
      };
    }>("/api/v1/health"),
  db: () => apiFetch<{ status: string; version?: string }>("/api/v1/health/db"),
  mqtt: () =>
    apiFetch<{ status: string; broker_host: string }>("/api/v1/health/mqtt"),
};

export const deviceApi = {
  list: () => apiFetch<SaditaDevice[]>("/api/v1/devices"),
  getEvents: (deviceId: string) =>
    apiFetch<DeviceEvent[]>(`/api/v1/devices/${encodeURIComponent(deviceId)}/events`),
};

export const workflowApi = {
  getLeader: (classId: number) => apiFetch<ClassLeader | null>(`/api/v1/academic/classes/${classId}/leader`),
  assignLeader: (classId: number, studentId: number) => apiFetch<ClassLeader>(`/api/v1/academic/classes/${classId}/leader`, { method: "POST", body: JSON.stringify({ student_id: studentId }) }),
  removeLeader: (classId: number) => apiFetch<void>(`/api/v1/academic/classes/${classId}/leader`, { method: "DELETE" }),
  submitAttendance: (sessionId: number) => apiFetch<AttendanceRequest>(`/api/v1/attendance/sessions/${sessionId}/requests`, { method: "POST" }),
  pendingPresence: (classId: number) => apiFetch<AttendanceRequest[]>(`/api/v1/academic/classes/${classId}/leader/presence-pending`),
  verifyPresence: (classId: number, requestId: number) => apiFetch<AttendanceRequest>(`/api/v1/academic/classes/${classId}/presence/${requestId}/verify`, { method: "POST" }),
  approve: (requestId: number) => apiFetch<AttendanceRequest>(`/api/v1/attendance/requests/${requestId}/approve`, { method: "POST" }),
  reject: (requestId: number, reason: string) => apiFetch<AttendanceRequest>(`/api/v1/attendance/requests/${requestId}/reject`, { method: "POST", body: JSON.stringify({ reason }) }),
};

export default apiFetch;
