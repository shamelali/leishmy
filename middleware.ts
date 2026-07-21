import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED = ["/profile","/favorites","/rewards","/subscription","/payments","/beauty-profile","/onboarding"];
const PUBLIC = ["/login","/verify-email","/forgot-password","/api/auth","/api/webhook","/api/health","/_next","/favicon.ico"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (PUBLIC.some(p => pathname.startsWith(p))) return NextResponse.next();
  // Allow guest access to booking detail pages (/bookings/:id) but protect /bookings list
  if (pathname.startsWith("/bookings") && !pathname.match(/^\/bookings\/[^/]+$/)) {
    const hasSession = !!request.cookies.get("neauth_session")?.value;
    if (!hasSession) {
      const url = new URL("/login", request.url);
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }
  }
  const res = NextResponse.next();
  res.headers.set("X-Frame-Options","DENY");
  res.headers.set("X-Content-Type-Options","nosniff");
  return res;
}

export const config = { matcher: ["/((?!_next/static|_next/image|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"] };
