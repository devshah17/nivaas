import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "./lib/auth";

// Add routes that require authentication here
const protectedRoutes = ["/dashboard", "/profile", "/org"];

// Add routes that are only for unauthenticated users (like login/register)
const unauthenticatedRoutes = ["/login", "/register", "/forgot-password"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtectedRoute = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
  
  const isUnauthenticatedRoute = unauthenticatedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  const token = request.cookies.get("token")?.value;
  let payload = null;

  if (token) {
    payload = await verifyToken(token);
  }

  // If trying to access protected route without valid token, redirect to login
  if (isProtectedRoute && !payload) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // If trying to access login/register while authenticated, redirect to dashboard
  if (isUnauthenticatedRoute && payload) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
