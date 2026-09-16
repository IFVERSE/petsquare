import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const configured = !!SUPABASE_URL && !!SUPABASE_ANON_KEY && !SUPABASE_URL.includes("YOUR-PROJECT-REF");

export async function updateSession(
  request: NextRequest,
  initialResponse = NextResponse.next({ request }),
  pathname = request.nextUrl.pathname,
  localePrefix = "",
) {
  const withLocale = (path: string) => `${localePrefix}${path}` || "/";
  // Supabase not configured yet (Phase 1 standalone, or Phase 2 not set up) —
  // let everything through except the routes that need a real backend.
  if (!configured) {
    if (
      pathname.startsWith("/admin") && pathname !== "/admin/unauthorized"
    ) {
      const url = request.nextUrl.clone();
      url.pathname = withLocale("/admin/unauthorized");
      return NextResponse.redirect(url);
    }
    if (pathname.startsWith("/dashboard")) {
      const url = request.nextUrl.clone();
      url.pathname = withLocale("/auth/sign-in");
      url.searchParams.set("next", withLocale(pathname));
      return NextResponse.redirect(url);
    }
    return initialResponse;
  }

  const response = initialResponse;

  const supabase = createServerClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  // IMPORTANT: this call refreshes the auth token and must not be removed.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Gate every /admin route: must be signed in AND have an active admin_access row.
  if (pathname.startsWith("/admin")) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = withLocale("/auth/sign-in");
      url.searchParams.set("next", withLocale(pathname));
      return NextResponse.redirect(url);
    }

    const { data: access } = await supabase
      .from("admin_access")
      .select("status, role_id, admin_roles(name,label)")
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();

    if (!access && pathname !== "/admin/unauthorized") {
      const url = request.nextUrl.clone();
      url.pathname = withLocale("/admin/unauthorized");
      return NextResponse.redirect(url);
    }
  }

  // Gate every /dashboard route: must simply be signed in — any account type
  // (pet owner or vendor) gets the Pet Owner dashboard in this phase.
  if (pathname.startsWith("/dashboard")) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = withLocale("/auth/sign-in");
      url.searchParams.set("next", withLocale(pathname));
      return NextResponse.redirect(url);
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("status")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.status === "suspended" && pathname !== "/account-suspended") {
      const url = request.nextUrl.clone();
      url.pathname = withLocale("/account-suspended");
      return NextResponse.redirect(url);
    }
  }

  return response;
}
