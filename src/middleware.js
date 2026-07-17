import { NextResponse } from "next/server";
import { getSelectedRoleCookieName, getSessionCookieName } from "@/lib/authSession";

/**
 * Middleware de Next.js para interceptar peticiones del lado del servidor.
 * Protege y delimita los accesos de roles:
 * - /dashboard/admin -> Únicamente administradores con sesión HttpOnly firmada
 * - /dashboard/coach -> Únicamente Entrenadores
 * - /dashboard/parent -> Únicamente Padres / Deportistas
 *
 * Firebase Admin SDK no es compatible con Edge Middleware. Por eso el
 * middleware delega la verificación criptográfica y la revalidación de rol a
 * /api/auth/session, que corre en runtime Node.js con Firebase Admin SDK.
 */
export async function middleware(request) {
  const url = request.nextUrl.clone();
  const cookieName = getSessionCookieName();
  const selectedRoleCookieName = getSelectedRoleCookieName();
  const sessionCookie = request.cookies.get(cookieName)?.value;
  const selectedRoleCookie = request.cookies.get(selectedRoleCookieName)?.value;

  if (!sessionCookie) {
    return NextResponse.redirect(new URL("/login?error=unauthorized", request.url));
  }

  const sessionResponse = await fetch(new URL("/api/auth/session", request.url), {
    headers: {
      cookie: [
        `${cookieName}=${sessionCookie}`,
        selectedRoleCookie ? `${selectedRoleCookieName}=${selectedRoleCookie}` : ""
      ].filter(Boolean).join("; ")
    },
    cache: "no-store"
  });

  if (!sessionResponse.ok) {
    return NextResponse.redirect(new URL("/login?error=unauthorized", request.url));
  }

  const session = await sessionResponse.json();

  // 1. Proteger Panel Administrativo
  if (url.pathname.startsWith("/dashboard/admin")) {
    if (session.role !== "admin") {
      return NextResponse.redirect(new URL("/login?error=unauthorized", request.url));
    }
  }

  // 2. Proteger Panel del Entrenador
  if (url.pathname.startsWith("/dashboard/coach")) {
    if (session.role !== "coach") {
      return NextResponse.redirect(new URL("/login?error=unauthorized", request.url));
    }
  }

  // 3. Proteger Portal del Acudiente
  if (url.pathname.startsWith("/dashboard/parent")) {
    if (session.role !== "parent") {
      return NextResponse.redirect(new URL("/login?error=unauthorized", request.url));
    }
  }

  return NextResponse.next();
}

// Intercepta todas las subrutas dentro de dashboard
export const config = {
  matcher: ["/dashboard/:path*"],
};
