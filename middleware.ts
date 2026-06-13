import { NextResponse, type NextRequest } from "next/server";
import { createTrialAccessToken, trialAccessCookie } from "@/lib/trial-access";

const protectedRoutePrefixes = [
  "/dashboard",
  "/guide",
  "/data",
  "/forecast",
  "/briefing",
  "/copilot",
  "/approvals",
  "/settings"
];

export async function middleware(request: NextRequest) {
  const password = process.env.TRIAL_ACCESS_PASSWORD?.trim();
  const isProduction = process.env.NODE_ENV === "production";
  const { pathname } = request.nextUrl;

  if (isPublicPath(pathname) || !isProtectedPath(pathname)) {
    return NextResponse.next();
  }

  if (!password && !isProduction) {
    return NextResponse.next();
  }

  if (!password) {
    return handleMissingPassword(request);
  }

  const expectedToken = await createTrialAccessToken(password);

  if (request.cookies.get(trialAccessCookie)?.value === expectedToken) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json(
      { error: "Trial access is required before using this endpoint." },
      { status: 401 }
    );
  }

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/trial-login";
  loginUrl.search = "";
  loginUrl.searchParams.set("next", `${pathname}${request.nextUrl.search}`);

  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};

function isPublicPath(pathname: string): boolean {
  return pathname === "/" || pathname.startsWith("/trial-login");
}

function isProtectedPath(pathname: string): boolean {
  return (
    protectedRoutePrefixes.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
    ) || pathname.startsWith("/api/")
  );
}

function handleMissingPassword(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/")) {
    return NextResponse.json(
      {
        error:
          "TRIAL_ACCESS_PASSWORD is required in production before using this endpoint."
      },
      { status: 503 }
    );
  }

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/trial-login";
  loginUrl.search = "";
  loginUrl.searchParams.set("error", "missing-config");
  loginUrl.searchParams.set("next", `${pathname}${request.nextUrl.search}`);

  return NextResponse.redirect(loginUrl);
}
