import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const SESSION_SECRET = new TextEncoder().encode(
  process.env.BETTER_AUTH_SECRET ||
    process.env.JWT_SECRET_KEY ||
    "sadita-super-secret-auth-key-2026-development-token"
);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Cek apakah route termasuk protected route
  const isProtected =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/dosen") ||
    pathname.startsWith("/kaprodi") ||
    pathname.startsWith("/mahasiswa") ||
    pathname.startsWith("/portal") ||
    pathname.startsWith("/dashboard");

  if (!isProtected) {
    return NextResponse.next();
  }

  const token = request.cookies.get("sadita_session")?.value;

  if (!token) {
    const signInUrl = new URL("/sign-in", request.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  try {
    const { payload } = await jwtVerify(token, SESSION_SECRET, {
      algorithms: ["HS256"],
    });

    const user = (payload as any).user;

    // RBAC Route Level Enforcement
    if (pathname.startsWith("/admin") && user.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/sign-in", request.url));
    }

    if (
      pathname.startsWith("/kaprodi") &&
      user.role !== "ADMIN" &&
      user.role !== "KAPRODI" &&
      !user.isKaprodi
    ) {
      return NextResponse.redirect(new URL("/sign-in", request.url));
    }

    if (
      pathname.startsWith("/dosen") &&
      user.role !== "ADMIN" &&
      user.role !== "DOSEN"
    ) {
      return NextResponse.redirect(new URL("/sign-in", request.url));
    }

    if (
      pathname.startsWith("/mahasiswa") &&
      user.role !== "ADMIN" &&
      user.role !== "MAHASISWA"
    ) {
      return NextResponse.redirect(new URL("/sign-in", request.url));
    }

    // Redirect generic /dashboard to specific role home
    if (pathname === "/dashboard") {
      if (user.role === "ADMIN") return NextResponse.redirect(new URL("/admin", request.url));
      if (user.isKaprodi || user.role === "KAPRODI") return NextResponse.redirect(new URL("/kaprodi", request.url));
      if (user.role === "DOSEN") return NextResponse.redirect(new URL("/dosen", request.url));
      return NextResponse.redirect(new URL("/mahasiswa", request.url));
    }

    return NextResponse.next();
  } catch (err) {
    // Token invalid atau expired
    const response = NextResponse.redirect(new URL("/sign-in", request.url));
    response.cookies.delete("sadita_session");
    return response;
  }
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/dosen/:path*",
    "/kaprodi/:path*",
    "/mahasiswa/:path*",
    "/portal/:path*",
    "/dashboard/:path*",
  ],
};
