import { NextResponse } from "next/server";

/**
 * Middleware de Next.js para interceptar peticiones del lado del servidor.
 * Protege el panel de administración (/dashboard/admin) limitando el acceso
 * exclusivamente al Profe Luis López (por rol y correo electrónico).
 */
export async function middleware(request) {
  const url = request.nextUrl.clone();
  
  // Verificar si la ruta es del panel administrativo
  if (url.pathname.startsWith("/dashboard/admin")) {
    
    // 1. En producción, leemos el token JWT de Supabase Auth
    // const supabase = createServerClient(...)
    // const { data: { user } } = await supabase.auth.getUser()
    
    // 2. Simulación para el entorno demo (leído de Cookies de prueba)
    const userRole = request.cookies.get("user-role")?.value || "admin"; // Fallback para pruebas locales
    const userEmail = request.cookies.get("user-email")?.value || "luis.lopez@clubcolombia.com"; // Email de Luis López por defecto en demo

    const ALLOWED_ADMIN_EMAIL = "luis.lopez@clubcolombia.com";

    // Regla de Negocio: Debe tener rol 'admin' Y ser el correo del Profe Luis López
    if (userRole !== "admin" || userEmail !== ALLOWED_ADMIN_EMAIL) {
      console.warn(`[Seguridad] Intento de acceso bloqueado a: ${userEmail}. Rol: ${userRole}`);
      
      // Redirigir o retornar error 403
      return new NextResponse(
        JSON.stringify({ 
          error: "Acceso Prohibido", 
          message: "Este panel está restringido únicamente al Administrador General Profe Luis López." 
        }),
        { 
          status: 403, 
          headers: { "content-type": "application/json; charset=utf-8" } 
        }
      );
    }
  }

  return NextResponse.next();
}

// Intercepta todas las subrutas dentro de dashboard/admin
export const config = {
  matcher: ["/dashboard/admin/:path*"],
};
