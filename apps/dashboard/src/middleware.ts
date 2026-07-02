import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/admin")) {
    if (!req.auth?.user?.id) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    // Role is populated in session via JWT token in auth.ts
    if (req.auth.user.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/workspace", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*"],
};
