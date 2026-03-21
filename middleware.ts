import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  // Simple pass-through middleware - no auth checks to avoid lock conflicts
  // Auth is handled client-side via AuthProvider
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
