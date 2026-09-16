import { NextResponse, type NextRequest } from "next/server";
import { defaultLocale, isLocale, localeCookie, localeFromPathname, stripLocale } from "@/i18n/config";
import { updateSession } from "@/lib/supabase/middleware";

function preferredLocale(request: NextRequest) {
  const saved = request.cookies.get(localeCookie)?.value;
  if (isLocale(saved)) return saved;

  const accepted = request.headers.get("accept-language") ?? "";
  for (const part of accepted.split(",")) {
    const candidate = part.trim().split(";")[0].toLowerCase().split("-")[0];
    if (isLocale(candidate)) return candidate;
  }
  return defaultLocale;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (request.headers.get("x-petsquare-internal") === "1") {
    return NextResponse.next({ request });
  }
  const firstSegment = pathname.split("/")[1];
  const looksLikeFile = /\.[^/]+$/.test(pathname);

  if (pathname.startsWith("/api/") || pathname.startsWith("/_next/") || looksLikeFile) {
    return NextResponse.next();
  }

  const locale = localeFromPathname(pathname);
  if (!locale) {
    // Unknown two-letter locale prefixes are normalized instead of becoming
    // accidental application routes.
    const cleanPath = /^[a-z]{2}(?:\/|$)/i.test(firstSegment) ? pathname.slice(3) || "/" : pathname;
    const url = request.nextUrl.clone();
    url.pathname = `/${preferredLocale(request)}${cleanPath === "/" ? "" : cleanPath}`;
    return NextResponse.redirect(url);
  }

  const internalPath = stripLocale(pathname);
  const rewriteUrl = request.nextUrl.clone();
  rewriteUrl.pathname = internalPath;
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-petsquare-locale", locale);
  requestHeaders.set("x-petsquare-internal", "1");
  const response = NextResponse.rewrite(rewriteUrl, { request: { headers: requestHeaders } });
  response.cookies.set(localeCookie, locale, { path: "/", maxAge: 31_536_000, sameSite: "lax" });

  return updateSession(request, response, internalPath, `/${locale}`);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
