import { NextResponse } from "next/server";
import { verify } from "./lib/auth";

export async function proxy(request) {
  const { pathname } = request.nextUrl;
  const session = request.cookies.get("session")?.value;

  // List of protected routes
  const protectedRoutes = ["/dashboard", "/inventory", "/pos", "/reports"];
  const isProtected = protectedRoutes.some((route) => pathname.startsWith(route));

  if (isProtected) {
    if (!session) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    try {
      await verify(session);
      return NextResponse.next();
    } catch (error) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  // If user is logged in, redirect away from login page
  if (pathname === "/" && session) {
    try {
      await verify(session);
      return NextResponse.redirect(new URL("/dashboard", request.url));
    } catch (error) {
      // invalid session, clear it and let them stay on login
      const response = NextResponse.next();
      response.cookies.set("session", "", { expires: new Date(0) });
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/dashboard/:path*",
    "/inventory/:path*",
    "/pos/:path*",
    "/reports/:path*",
  ],
};
