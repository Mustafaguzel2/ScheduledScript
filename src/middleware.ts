import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const session = request.cookies.get("session");
  const currentPath = request.nextUrl.pathname;

  console.log("Middleware triggered for path:", currentPath);
  console.log("Session cookie:", session ? "present" : "not present");

  // Eğer oturum yoksa ve kullanıcı giriş sayfasında değilse yönlendir
  if (!session && currentPath !== "/") {
    console.log("No session found. Redirecting to login page.");
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Eğer oturum varsa ve kullanıcı giriş sayfasındaysa yönlendir
  if (session && currentPath === "/") {
    console.log("Session exists. Redirecting to panel.");
    return NextResponse.redirect(new URL("/panel", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"], // Sadece belirli rotaları kontrol et
};
