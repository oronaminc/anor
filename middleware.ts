import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE, verifySession } from "@/lib/session";

/**
 * Gate the /admin area on a valid signed-cookie admin session. Runs in the
 * Edge runtime; verifySession uses the Web Crypto API (no Node APIs, no DB).
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isLogin = pathname.startsWith("/admin/login");

  const token = request.cookies.get(ADMIN_COOKIE)?.value;
  const session = await verifySession(token);
  const isAdmin = !!session && session.role === "admin";

  // Protected admin paths require a session.
  if (!isLogin && !isAdmin) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // Already signed in → skip the login page.
  if (isLogin && isAdmin) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
