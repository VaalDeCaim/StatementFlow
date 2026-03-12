import {createServerClient} from "@supabase/ssr";
import {NextResponse, type NextRequest} from "next/server";
import {isAuthDisabled} from "@/lib/auth-config";
import {checkRateLimit, getClientIp} from "@/lib/rate-limit";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith("/api/")) {
    const ip = getClientIp(request);
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        {error: {code: "RATE_LIMITED", message: "Too many requests"}},
        {status: 429},
      );
    }
    return NextResponse.next();
  }

  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return NextResponse.next();
  }
  if (isAuthDisabled()) {
    return NextResponse.next();
  }

  try {
    let response = NextResponse.next({request});

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({name, value, options}) =>
              response.cookies.set(name, value, options),
            );
          },
        },
      },
    );

    await supabase.auth.getSession();

    const protectedPaths =
      pathname === "/dashboard" ||
      pathname.startsWith("/dashboard/") ||
      pathname === "/onboarding" ||
      pathname.startsWith("/onboarding/") ||
      pathname === "/reset-password";
    if (protectedPaths) {
      const {
        data: {session},
      } = await supabase.auth.getSession();
      if (!session) {
        const loginUrl = new URL("/login", request.url);
        return NextResponse.redirect(loginUrl);
      }
    }

    return response;
  } catch {
    return NextResponse.next({request});
  }
}

export const config = {
  matcher: [
    "/api/:path*",
    "/dashboard",
    "/dashboard/:path*",
    "/onboarding",
    "/onboarding/:path*",
    "/reset-password",
  ],
};
