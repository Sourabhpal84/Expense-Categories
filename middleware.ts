import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const protectedPath = request.nextUrl.pathname.startsWith("/dashboard");
  if (!protectedPath) return NextResponse.next();
  const firebaseConfigured = Boolean(process.env.NEXT_PUBLIC_FIREBASE_API_KEY && process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
  if (!firebaseConfigured) return NextResponse.next();

  const hasClientSession = request.cookies.get("magneetoz-auth-hint")?.value === "true";
  if (!hasClientSession) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"]
};
