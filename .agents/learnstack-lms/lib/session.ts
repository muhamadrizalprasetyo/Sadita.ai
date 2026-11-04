import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const SESSION_SECRET = new TextEncoder().encode(
  process.env.BETTER_AUTH_SECRET ||
    process.env.JWT_SECRET_KEY ||
    "sadita-super-secret-auth-key-2026-development-token"
);

const COOKIE_NAME = "sadita_session";

export type UserRole = "ADMIN" | "KAPRODI" | "DOSEN" | "MAHASISWA";

export interface SessionUser {
  id: number;
  email: string;
  fullName: string;
  role: UserRole;
  prodiId?: number;
  prodiKode?: string;
  nim?: string;
  nidn?: string;
  isKaprodi?: boolean;
}

export interface SessionData {
  user: SessionUser;
  expiresAt: number;
}

export async function createSessionToken(user: SessionUser): Promise<string> {
  const expiresAt = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60; // 7 days
  return new SignJWT({ user, expiresAt })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresAt)
    .sign(SESSION_SECRET);
}

export async function verifySessionToken(token: string): Promise<SessionData | null> {
  try {
    const { payload } = await jwtVerify(token, SESSION_SECRET, {
      algorithms: ["HS256"],
    });
    return payload as unknown as SessionData;
  } catch (err) {
    return null;
  }
}

export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getSessionFromCookies(): Promise<SessionData | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;
    return await verifySessionToken(token);
  } catch {
    return null;
  }
}
