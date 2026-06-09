import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_ROUTES = ["/", "/register", "/forgot-password", "/reset-password"];

export default function proxy(request: NextRequest) {
  const token = request.cookies.get("accessToken")?.value;

  const path = request.nextUrl.pathname;

  const isPublic = PUBLIC_ROUTES.some(
    (route) => path === route || path.startsWith(route),
  );

  if (!token && !isPublic) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/student/:path*",
    "/intern/:path*",
    "/profile/:path*",
    "/teacher/:path*",
    "/admin/:path*",
    "/tests/:path*",
    "/results/:path*",
    "/leaderboard/:path*",
  ],
};
