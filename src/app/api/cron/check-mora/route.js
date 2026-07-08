import { NextResponse } from "next/server";
import { billingService } from "@/lib/services/billingService";

/**
 * Endpoint de Cron Job diario para auditar mensualidades.
 * Busca pagos vencidos por más de 5 días hábiles, suspende el QR del estudiante
 * y dispara avisos de cobro por correo y WhatsApp.
 */
export async function GET(request) {
  try {
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) {
      return NextResponse.json({ error: "CRON_SECRET no está configurado" }, { status: 500 });
    }
    
    const authHeader = request.headers.get("authorization") || "";
    const expectedHeader = `Bearer ${cronSecret}`;

    if (authHeader !== expectedHeader) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Ejecutar el motor de reglas de cobro
    const auditResult = await billingService.checkAndSuspendDelinquentStudents();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      message: "Auditoría de mora ejecutada con éxito",
      result: auditResult
    });

  } catch (error) {
    console.error("Error en cron job de auditoría de cobros:", error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
