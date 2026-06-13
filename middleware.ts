import { NextResponse, type NextRequest } from "next/server";
import { createTrialAccessToken, trialAccessCookie } from "@/lib/trial-access";

export async function middleware(request: NextRequest) {
  const password = process.env.TRIAL_ACCESS_PASSWORD?.trim();

  if (!password) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
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
  loginUrl.searchParams.set("next", pathname);

  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};

function isPublicPath(pathname: string): boolean {
  return pathname === "/" || pathname.startsWith("/trial-login");
}
