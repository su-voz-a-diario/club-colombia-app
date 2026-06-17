import { NextResponse } from "next/server";
import { billingService } from "@/lib/services/billingService";

/**
 * Endpoint de Cron Job diario para auditar mensualidades.
 * Busca pagos vencidos por más de 5 días hábiles, suspende el QR del estudiante
 * y dispara avisos de cobro por correo y WhatsApp.
 */
export async function GET(request) {
  try {
    // Protección simple mediante token secreto en cabecera o query param
    const { searchParams } = new URL(request.url);
    const cronToken = searchParams.get("token");
    
    if (process.env.CRON_SECRET && cronToken !== process.env.CRON_SECRET) {
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
