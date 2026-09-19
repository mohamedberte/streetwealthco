import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ACCESS_COOKIE, ACCESS_VALUE } from "@/lib/access-cookie";

export function proxy(request: NextRequest) {
  const granted =
    request.cookies.get(ACCESS_COOKIE)?.value === ACCESS_VALUE;

  if (!granted) {
    const url = request.nextUrl.clone();
    url.pathname = "/acces";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/boutique", "/boutique/:path*"],
};
