import { NextResponse } from "next/server";

import { auth } from "@/auth";

const PUBLIC_ROUTES = ["/connexion", "/inscription"];

export default auth((req) => {
  const isPublicRoute = PUBLIC_ROUTES.some((route) =>
    req.nextUrl.pathname.startsWith(route),
  );

  if (!req.auth && !isPublicRoute) {
    const url = new URL("/connexion", req.nextUrl.origin);
    url.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
});

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
