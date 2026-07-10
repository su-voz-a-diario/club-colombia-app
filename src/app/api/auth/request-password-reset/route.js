import { NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/firebaseAdmin";
import { Resend } from "resend";

export async function POST(request) {
  try {
    // 1. Limitar el tamaño del body usando el encabezado Content-Length para prevenir DDoS
    const contentLength = request.headers.get("content-length");
    if (contentLength && parseInt(contentLength, 10) > 2048) {
      return NextResponse.json(
        { success: false, error: "Tamaño de solicitud excedido." },
        { status: 400 }
      );
    }

    // 2. Aceptar únicamente JSON
    const contentType = request.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      return NextResponse.json(
        { success: false, error: "Formato de solicitud no soportado. Debe ser JSON." },
        { status: 400 }
      );
    }

    // 3. Extraer y rechazar payloads inesperados
    const body = await request.json();
    const allowedKeys = ["email"];
    const payloadKeys = Object.keys(body);
    const hasUnexpectedKeys = payloadKeys.some(key => !allowedKeys.includes(key));
    if (hasUnexpectedKeys) {
      return NextResponse.json(
        { success: false, error: "Estructura de solicitud no válida." },
        { status: 400 }
      );
    }

    // 4. Validar y sanear el correo
    const email = body.email;
    if (typeof email !== "string") {
      return NextResponse.json(
        { success: false, error: "Correo electrónico no válido." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    
    // Limitar longitud del correo para evitar desbordamientos
    if (cleanEmail.length > 254) {
      return NextResponse.json(
        { success: false, error: "Correo electrónico demasiado largo." },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return NextResponse.json(
        { success: false, error: "Formato de correo electrónico no válido." },
        { status: 400 }
      );
    }

    // 5. Verificar variables de entorno requeridas de forma estricta
    const resendApiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.PASSWORD_RESET_FROM_EMAIL;
    const appUrl = process.env.APP_URL;

    if (!resendApiKey || !fromEmail || !appUrl) {
      console.error("Configuración de servidor incompleta: Faltan variables de entorno para recuperación de contraseña.");
      return NextResponse.json(
        { success: false, error: "Error de configuración interna en el servidor." },
        { status: 500 }
      );
    }

    const auth = getAdminAuth();

    // Generar enlace seguro mediante el Admin SDK
    const generatedLink = await auth.generatePasswordResetLink(cleanEmail);

    // 6. Construcción segura del enlace usando la interfaz URL
    const firebaseLink = new URL(generatedLink);
    const resetLink = new URL("/reset-password", appUrl);
    resetLink.search = firebaseLink.search;

    // Forzar HTTPS en producción
    if (process.env.NODE_ENV === "production" && resetLink.protocol !== "https:") {
      resetLink.protocol = "https:";
    }

    const customLink = resetLink.toString();

    // Enviar el correo usando la API de Resend
    const resend = new Resend(resendApiKey);
    const { data, error } = await resend.emails.send({
      from: `Club Colombia <${fromEmail}>`,
      to: [cleanEmail],
      subject: "Restablecer tu contraseña - Club Colombia",
      html: `
        <div style="font-family: sans-serif; background-color: #07090e; color: #ededed; padding: 40px; text-align: center; max-width: 600px; margin: 0 auto; border-radius: 16px; border: 1px solid #1e293b; box-sizing: border-box;">
          <div style="margin-bottom: 24px; text-align: center;">
            <img src="https://clubcolombiafc.mx/logo.png" alt="Logo Club Colombia" style="width: 80px; height: 80px; object-fit: contain; margin: 0 auto; display: block;" />
          </div>
          <h1 style="font-size: 20px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #ffffff; margin-bottom: 8px; text-align: center;">Restablecer Contraseña</h1>
          <p style="font-size: 11px; color: #10b981; font-family: monospace; text-transform: uppercase; margin-bottom: 24px; text-align: center; letter-spacing: 2px; font-weight: bold;">Escuela de Fútbol Club Colombia</p>
          <div style="background-color: #0e121e; border: 1px solid #334155; padding: 24px; border-radius: 12px; margin-bottom: 24px; text-align: left;">
            <p style="font-size: 14px; line-height: 1.6; color: #cbd5e1; margin-top: 0;">Hola,</p>
            <p style="font-size: 14px; line-height: 1.6; color: #cbd5e1;">Hemos recibido una solicitud para restablecer la contraseña de tu cuenta asociada a este correo electrónico.</p>
            <p style="font-size: 14px; line-height: 1.6; color: #cbd5e1; margin-bottom: 24px;">Para completar este proceso y configurar tu nueva contraseña, haz clic en el siguiente botón:</p>
            <div style="text-align: center; margin-bottom: 24px;">
              <a href="${customLink}" style="background-color: #10b981; color: #0f172a; text-decoration: none; padding: 12px 24px; font-size: 13px; font-weight: 850; border-radius: 8px; text-transform: uppercase; display: inline-block; letter-spacing: 0.5px;">
                Restablecer Contraseña
              </a>
            </div>
            <p style="font-size: 11px; line-height: 1.5; color: #64748b; margin-bottom: 0; font-style: italic; border-top: 1px solid #1e293b; padding-top: 16px;">
              Si el botón no funciona, puedes copiar y pegar el siguiente enlace en la barra de tu navegador:
              <br />
              <span style="word-break: break-all; color: #10b981; font-family: monospace; display: block; margin-top: 8px;">${customLink}</span>
            </p>
          </div>
          <div style="border-top: 1px solid #1e293b; padding-top: 16px; font-size: 11px; color: #64748b; text-align: center;">
            <p style="margin: 0 0 8px 0;">Si tú no solicitaste este cambio, puedes ignorar este mensaje de forma segura.</p>
            <p style="margin: 0;">&copy; ${new Date().getFullYear()} Escuela de Fútbol Club Colombia. Todos los derechos reservados.</p>
          </div>
        </div>
      `
    });

    if (error) {
      console.error("Fallo interno del servicio de mensajería (Resend). Código:", error.name || error.message);
    } else {
      console.log("Correo enviado con éxito.");
    }

    // Respuesta pública genérica idéntica para evitar la enumeración de cuentas (Caso Éxito)
    return NextResponse.json({
      success: true,
      message: "Si tu correo está registrado en el sistema, recibirás un correo electrónico con instrucciones para restablecer tu contraseña en breve."
    });

  } catch (globalErr) {
    // Registrar la excepción detallada requerida para auditoría temporal en Vercel
    console.error("Auditoría de Excepción:", {
      name: globalErr?.name,
      code: globalErr?.code,
      message: globalErr?.message,
      stack: globalErr?.stack
    });
    console.warn("Recuperación de contraseña abortada de forma segura.");

    // Respuesta pública genérica idéntica para evitar la enumeración de cuentas (Caso Fallo)
    return NextResponse.json({
      success: true,
      message: "Si tu correo está registrado en el sistema, recibirás un correo electrónico con instrucciones para restablecer tu contraseña en breve."
    });
  }
}
