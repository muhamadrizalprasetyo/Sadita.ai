import { prisma } from "./db";
import bcrypt from "bcryptjs";
import {
  createSessionToken,
  setSessionCookie,
  clearSessionCookie,
  getSessionFromCookies,
  SessionUser,
  UserRole,
} from "./session";

export interface AuthResult {
  success: boolean;
  message?: string;
  user?: SessionUser;
}

/**
 * Autentikasi pengguna secara nyata terhadap tabel users di PostgreSQL
 */
export async function authenticateUser(
  email: string,
  plainPassword: string
): Promise<AuthResult> {
  const user = await prisma.users.findUnique({
    where: { email: email.trim().toLowerCase() },
    include: {
      lecturer_profiles: {
        include: { program_studi: true },
      },
      student_profiles: {
        include: { program_studi: true },
      },
    },
  });

  if (!user) {
    return { success: false, message: "Email atau password salah." };
  }

  if (!user.is_active) {
    return { success: false, message: "Akun Anda dinonaktifkan oleh administrator." };
  }

  // Verifikasi bcrypt password hash
  const isValid = await bcrypt.compare(plainPassword, user.password_hash);
  if (!isValid) {
    return { success: false, message: "Email atau password salah." };
  }

  // Tentukan role efektif (misal Dosen yang menjabat Kaprodi)
  let effectiveRole: UserRole = user.role as UserRole;
  let isKaprodi = false;
  let prodiId: number | undefined;
  let prodiKode: string | undefined;
  let nidn: string | undefined;
  let nim: string | undefined;

  if (user.role === "DOSEN" && user.lecturer_profiles) {
    nidn = user.lecturer_profiles.nidn;
    prodiId = user.lecturer_profiles.prodi_id;
    prodiKode = user.lecturer_profiles.program_studi.kode;
    if (user.lecturer_profiles.nidn === "0412058501") {
      // Dosen Dr. Ahmad Fauzi juga dapat bertindak sebagai Kaprodi TI
      isKaprodi = true;
    }
  } else if (user.role === "MAHASISWA" && user.student_profiles) {
    nim = user.student_profiles.nim;
    prodiId = user.student_profiles.prodi_id;
    prodiKode = user.student_profiles.program_studi.kode;
  }

  const sessionUser: SessionUser = {
    id: user.id,
    email: user.email,
    fullName: user.full_name,
    role: effectiveRole,
    prodiId,
    prodiKode,
    nidn,
    nim,
    isKaprodi,
  };

  const token = await createSessionToken(sessionUser);
  await setSessionCookie(token);

  return { success: true, user: sessionUser };
}

/**
 * Logout pengguna dan hapus cookie sesi
 */
export async function logoutUser(): Promise<void> {
  await clearSessionCookie();
}

/**
 * Adapter kompatibilitas untuk getServerSession & Better Auth call convention
 */
export const auth = {
  api: {
    async getSession(): Promise<{ user: SessionUser } | null> {
      const data = await getSessionFromCookies();
      if (!data) return null;
      return { user: data.user };
    },
  },
};
