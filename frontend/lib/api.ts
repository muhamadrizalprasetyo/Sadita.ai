/**
 * SADITA Frontend — API Client
 * Centralized fetch wrapper for backend communication.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export function getFileUrl(pathOrUrl?: string | null): string {
  if (!pathOrUrl) return "#";
  if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) {
    return pathOrUrl;
  }
  const cleanPath = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;
  return `${API_BASE}${cleanPath}`;
}

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
  full_name?: string;
  department: string;
  batch_year: number;
  academic_cohort?: number;
  class_type?: "REGULER_PAGI" | "REGULER_MALAM" | "REGULER_SHIFT";
  phone?: string;
  rfid_uid?: string;
  fingerprint_template_id?: number;
  ktm_status?: string;
}

export interface ScannedCardResult {
  found: boolean;
  rfid_uid?: string;
  device_id?: string;
  scanned_at?: string;
  is_registered?: boolean;
  registered_to_nim?: string;
  registered_to_name?: string;
  message?: string;
}

export interface LecturerProfile {
  id: number;
  user_id: number;
  nidn: string;
  full_name?: string;
  department: string;
  phone?: string;
}

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: "ADMIN" | "KAPRODI" | "DOSEN" | "KETUA_KELAS" | "MAHASISWA";
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

export interface ClassRoom {
  id: number;
  name: string;
  capacity: number;
  code?: string;
  building?: string;
  floor?: number;
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
  class_type?: "REGULER_PAGI" | "REGULER_MALAM" | "SHIFT";
  course?: Course;
  term?: AcademicTerm;
  lecturer?: LecturerProfile;
  room?: ClassRoom;
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
  enrollment_type?: "REGULER" | "TAMBAH_SKS" | "MENGULANG";
  enrolled_at: string;
  student?: StudentProfile;
  course_class?: CourseClass;
}

export interface KrsRequest {
  id: number;
  student_id: number;
  class_id: number;
  request_type: "TAMBAH_SKS" | "MENGULANG";
  status: "PENDING_APPROVAL" | "APPROVED" | "REJECTED" | "CANCELLED";
  alasan?: string;
  submitted_at: string;
  reviewed_at?: string;
  reviewed_by?: number;
  reviewer_notes?: string;
  enrollment_id?: number;
  student?: StudentProfile;
  course_class?: CourseClass;
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
  changePassword: (data: { current_password: string; new_password: string; confirm_password: string }) =>
    apiFetch<{ message: string }>("/api/v1/auth/change-password", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

export const studentApi = {
  list: (paramsOrSkip?: number | { skip?: number; limit?: number; cohort?: number; class_type?: string; class_id?: number }, limit = 100) => {
    let s = 0;
    const l = limit;
    let qs = "";
    if (typeof paramsOrSkip === "object" && paramsOrSkip !== null) {
      const q = new URLSearchParams();
      if (paramsOrSkip.skip !== undefined) q.set("skip", String(paramsOrSkip.skip));
      if (paramsOrSkip.limit !== undefined) q.set("limit", String(paramsOrSkip.limit));
      if (paramsOrSkip.cohort !== undefined) q.set("cohort", String(paramsOrSkip.cohort));
      if (paramsOrSkip.class_type) q.set("class_type", paramsOrSkip.class_type);
      if (paramsOrSkip.class_id !== undefined) q.set("class_id", String(paramsOrSkip.class_id));
      qs = q.toString() ? `?${q.toString()}` : "";
    } else {
      if (typeof paramsOrSkip === "number") s = paramsOrSkip;
      qs = `?skip=${s}&limit=${l}`;
    }
    return apiFetch<StudentProfile[]>(`/api/v1/students${qs}`);
  },
  getMyProfile: () => apiFetch<StudentProfile>("/api/v1/students/me"),
  getById: (id: number) => apiFetch<StudentProfile>(`/api/v1/students/${id}`),
  updateStudentProfile: (
    id: number,
    data: { academic_cohort?: number; class_type?: string; phone?: string; batch_year?: number }
  ) =>
    apiFetch<StudentProfile>(`/api/v1/students/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
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
  registerMyKtm: (rfid_uid: string) =>
    apiFetch<StudentProfile>("/api/v1/students/register-ktm", {
      method: "POST",
      body: JSON.stringify({ rfid_uid }),
    }),
  getLatestScannedCard: () =>
    apiFetch<ScannedCardResult>("/api/v1/students/latest-scanned-card"),
};

export const krsApi = {
  getAvailableClasses: (params?: { cohort?: number; search?: string }) => {
    const q = new URLSearchParams();
    if (params?.cohort !== undefined) q.set("cohort", String(params.cohort));
    if (params?.search) q.set("search", params.search);
    const qs = q.toString() ? `?${q.toString()}` : "";
    return apiFetch<CourseClass[]>(`/api/v1/academic/krs/available-classes${qs}`);
  },
  requestKrs: (data: { class_id: number; request_type: "TAMBAH_SKS" | "MENGULANG"; alasan?: string }) =>
    apiFetch<KrsRequest>("/api/v1/academic/krs/request", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  getMyRequests: () => apiFetch<KrsRequest[]>("/api/v1/academic/krs/my-requests"),
  cancelRequest: (requestId: number) =>
    apiFetch<KrsRequest>(`/api/v1/academic/krs/requests/${requestId}`, {
      method: "DELETE",
    }),
  getLecturerRequests: (status?: string) =>
    apiFetch<KrsRequest[]>(`/api/v1/academic/krs/lecturer-requests${status ? `?status=${status}` : ""}`),
  reviewRequest: (requestId: number, data: { action: "APPROVE" | "REJECT"; notes?: string }) =>
    apiFetch<KrsRequest>(`/api/v1/academic/krs/requests/${requestId}/review`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

export const lecturerApi = {
  list: (skipOrParams?: number | { skip?: number; limit?: number }, limit = 100) => {
    let s = 0;
    let l = limit;
    if (typeof skipOrParams === "object" && skipOrParams !== null) {
      s = skipOrParams.skip ?? 0;
      l = skipOrParams.limit ?? 100;
    } else if (typeof skipOrParams === "number") {
      s = skipOrParams;
    }
    return apiFetch<LecturerProfile[]>(`/api/v1/lecturers?skip=${s}&limit=${l}`);
  },
  getById: (id: number) => apiFetch<LecturerProfile>(`/api/v1/lecturers/${id}`),
};

export const usersApi = {
  list: (skip = 0, limit = 100) => apiFetch<User[]>(`/api/v1/users?skip=${skip}&limit=${limit}`),
  getById: (id: number) => apiFetch<User>(`/api/v1/users/${id}`),
};

export const academicApi = {
  getTerms: () => apiFetch<AcademicTerm[]>("/api/v1/academic/terms"),
  createTerm: (data: { name: string; start_date: string; end_date: string; is_active?: boolean }) =>
    apiFetch<AcademicTerm>("/api/v1/academic/terms", { method: "POST", body: JSON.stringify(data) }),
  getCourses: () => apiFetch<Course[]>("/api/v1/academic/courses"),
  createCourse: (data: { code: string; name: string; credits: number; semester_ke?: number; description?: string }) =>
    apiFetch<Course>("/api/v1/academic/courses", { method: "POST", body: JSON.stringify(data) }),
  getRooms: () => apiFetch<{ id: number; kode: string; name: string; capacity: number; gedung?: string; lantai?: number }[]>("/api/v1/academic/rooms"),
  createRoom: (data: { name: string; capacity: number; kode?: string; gedung?: string; lantai?: number }) =>
    apiFetch<{ id: number; kode: string; name: string }>("/api/v1/academic/rooms", { method: "POST", body: JSON.stringify(data) }),
  getClasses: () => apiFetch<CourseClass[]>("/api/v1/academic/classes"),
  getClassById: (id: number) => apiFetch<CourseClass>(`/api/v1/academic/classes/${id}`),
  createClass: (data: {
    name: string;
    course_id: number;
    term_id: number;
    lecturer_id: number;
    room_id?: number;
    day_of_week: number;
    start_time: string;
    end_time: string;
    class_type?: string;
  }) => apiFetch<CourseClass>("/api/v1/academic/classes", { method: "POST", body: JSON.stringify(data) }),
  getClassStudents: (id: number) => apiFetch<ClassEnrollment[]>(`/api/v1/academic/classes/${id}/students`),
  enrollStudent: (classId: number, studentId: number) =>
    apiFetch<ClassEnrollment>(`/api/v1/academic/classes/${classId}/enroll`, {
      method: "POST",
      body: JSON.stringify({ student_id: studentId }),
    }),
  updateClass: (id: number, data: Partial<{
    name: string;
    course_id: number;
    term_id: number;
    lecturer_id: number;
    room_id: number;
    day_of_week: number;
    start_time: string;
    end_time: string;
    is_active: boolean;
  }>) =>
    apiFetch<CourseClass>(`/api/v1/academic/classes/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
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

export interface UploadResponse {
  file_url: string;
  original_filename: string;
  file_size_bytes: number;
  content_type?: string;
}

export const uploadApi = {
  upload: async (file: File): Promise<{ status: number; data?: UploadResponse; error?: string }> => {
    const token = typeof window !== "undefined" ? localStorage.getItem("sadita_access_token") : null;
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch(`${API_BASE}/api/v1/uploads`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) return { status: res.status, error: data?.detail ?? `HTTP ${res.status}` };
      return { status: res.status, data: data as UploadResponse };
    } catch {
      return { status: 0, error: "Upload gagal — periksa koneksi jaringan" };
    }
  },
};

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
export type MaterialType = "DOCUMENT" | "LINK" | "TEXT" | "VIDEO" | "SCORM";
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

export interface QuizOption {
  id: number;
  question_id: number;
  option_text: string;
  is_correct?: boolean;
  option_number: number;
}

export interface QuizQuestion {
  id: number;
  quiz_id: number;
  question_text: string;
  question_type: "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "TEXT";
  points: number;
  question_number: number;
  explanation?: string;
  options: QuizOption[];
}

export interface Quiz {
  id: number;
  class_id: number;
  lesson_id?: number;
  session_id?: number;
  title: string;
  description?: string;
  passing_score: number;
  max_attempts: number;
  time_limit_minutes?: number;
  shuffle_questions: boolean;
  is_published: boolean;
  created_at: string;
  question_count?: number;
  questions?: QuizQuestion[];
}

export interface QuizSubmission {
  id: number;
  quiz_id: number;
  student_id: number;
  attempt_number: number;
  score: number;
  passed: boolean;
  started_at: string;
  submitted_at?: string;
}

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
  updateGradeComponent: (classId: number, studentId: number, component: string, score: number) =>
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
    is_published?: boolean;
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

  getQuizzes: (classId: number) => apiFetch<Quiz[]>(`/api/v1/lms/quizzes?class_id=${classId}`),
  getQuiz: (id: number) => apiFetch<Quiz>(`/api/v1/lms/quizzes/${id}`),
  createQuiz: (data: {
    class_id: number;
    title: string;
    description?: string;
    passing_score?: number;
    max_attempts?: number;
    time_limit_minutes?: number;
    shuffle_questions?: boolean;
    is_published?: boolean;
  }) => apiFetch<Quiz>("/api/v1/lms/quizzes", { method: "POST", body: JSON.stringify(data) }),
  deleteQuiz: (id: number) => apiFetch<void>(`/api/v1/lms/quizzes/${id}`, { method: "DELETE" }),
  addQuizQuestion: (quizId: number, data: {
    question_text: string;
    question_type?: "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "TEXT";
    points?: number;
    question_number: number;
    explanation?: string;
  }) => apiFetch<QuizQuestion>(`/api/v1/lms/quizzes/${quizId}/questions`, { method: "POST", body: JSON.stringify(data) }),
  addQuizOption: (questionId: number, data: {
    option_text: string;
    is_correct: boolean;
    option_number: number;
  }) => apiFetch<QuizOption>(`/api/v1/lms/questions/${questionId}/options`, { method: "POST", body: JSON.stringify(data) }),
  submitQuiz: (quizId: number, answers: { question_id: number; selected_option_id?: number; text_answer?: string }[]) =>
    apiFetch<QuizSubmission>(`/api/v1/lms/quizzes/${quizId}/submit`, {
      method: "POST",
      body: JSON.stringify({ quiz_id: quizId, answers }),
    }),
  getQuizSubmissions: (quizId: number) => apiFetch<QuizSubmission[]>(`/api/v1/lms/quizzes/${quizId}/submissions`),
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

export interface UserItem {
  id: number;
  email: string;
  full_name: string;
  role: "ADMIN" | "DOSEN" | "MAHASISWA" | "KETUA_KELAS";
  is_active: boolean;
  created_at: string;
  updated_at: string;
  student_profile?: StudentProfile;
  lecturer_profile?: LecturerProfile;
}

export const userApi = {
  list: (params?: { role?: string; skip?: number; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.role) q.set("role", params.role);
    if (params?.skip) q.set("skip", String(params.skip));
    if (params?.limit) q.set("limit", String(params.limit));
    const qs = q.toString();
    return apiFetch<UserItem[]>(`/api/v1/users${qs ? `?${qs}` : ""}`);
  },
  getById: (id: number) => apiFetch<UserItem>(`/api/v1/users/${id}`),
  create: (data: {
    email: string;
    full_name: string;
    role: string;
    password: string;
    is_active?: boolean;
    student_profile?: {
      nim: string;
      department?: string;
      batch_year?: number;
      phone?: string;
      rfid_uid?: string;
      academic_cohort?: number;
      class_type?: "REGULER_PAGI" | "REGULER_MALAM" | "REGULER_SHIFT";
    };
    lecturer_profile?: { nidn: string; department?: string; phone?: string };
  }) => apiFetch<UserItem>("/api/v1/users", { method: "POST", body: JSON.stringify(data) }),
  update: (id: number, data: {
    full_name?: string;
    email?: string;
    role?: string;
    is_active?: boolean;
    password?: string;
  }) => apiFetch<UserItem>(`/api/v1/users/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  delete: (id: number) => apiFetch<void>(`/api/v1/users/${id}`, { method: "DELETE" }),
};

export default apiFetch;
