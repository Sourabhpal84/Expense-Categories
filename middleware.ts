import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const protectedPath = request.nextUrl.pathname.startsWith("/dashboard");
  if (!protectedPath) return NextResponse.next();
  // Firebase Auth session is restored in the browser. A server-side hint cookie can
  // become stale or missing during navigation, which causes false login redirects.
  // Dashboard access is guarded by app/dashboard/layout.tsx after Firebase finishes
  // restoring the real client session.
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"]
};
