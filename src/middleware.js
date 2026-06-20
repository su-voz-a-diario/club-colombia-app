import { NextResponse } from "next/server";

/**
 * Middleware de Next.js para interceptar peticiones del lado del servidor.
 * Protege y delimita los accesos de roles:
 * - /dashboard/admin -> Únicamente Profe Luis López
 * - /dashboard/coach -> Únicamente Entrenadores
 * - /dashboard/parent -> Únicamente Padres / Deportistas
 */
export async function middleware(request) {
  const url = request.nextUrl.clone();
  const userRole = request.cookies.get("user-role")?.value;
  const userEmail = request.cookies.get("user-email")?.value;

  const ALLOWED_ADMIN_EMAIL = "luis.lopez@clubcolombia.com";

  // 1. Proteger Panel Administrativo
  if (url.pathname.startsWith("/dashboard/admin")) {
    if (userRole !== "admin" || userEmail !== ALLOWED_ADMIN_EMAIL) {
      console.warn(`[Seguridad] Intento de acceso denegado a admin: Correo: ${userEmail}, Rol: ${userRole}`);
      return NextResponse.redirect(new URL("/login?error=unauthorized", request.url));
    }
  }

  // 2. Proteger Panel del Entrenador
  if (url.pathname.startsWith("/dashboard/coach")) {
    if (userRole !== "coach") {
      console.warn(`[Seguridad] Intento de acceso denegado a coach: Correo: ${userEmail}, Rol: ${userRole}`);
      return NextResponse.redirect(new URL("/login?error=unauthorized", request.url));
    }
  }

  // 3. Proteger Portal del Acudiente
  if (url.pathname.startsWith("/dashboard/parent")) {
    if (userRole !== "parent") {
      console.warn(`[Seguridad] Intento de acceso denegado a parent: Correo: ${userEmail}, Rol: ${userRole}`);
      return NextResponse.redirect(new URL("/login?error=unauthorized", request.url));
    }
  }

  return NextResponse.next();
}

// Intercepta todas las subrutas dentro de dashboard
export const config = {
  matcher: ["/dashboard/:path*"],
};
