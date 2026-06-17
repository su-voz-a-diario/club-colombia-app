import { NextResponse } from "next/server";
import { billingService } from "@/lib/services/billingService";

/**
 * Recibe notificaciones IPN / Webhooks de Mercado Pago en tiempo real.
 * Procesa la aprobación de suscripciones recurrentes de la Escuela de Fútbol.
 */
export async function POST(request) {
  try {
    const body = await request.json();
    
    // ID de pago y tipo de acción enviados por Mercado Pago
    const paymentId = body.data?.id || body.id;
    const action = body.action || body.type;

    // Verificar si es una notificación de pago
    if (action === "payment.created" || action === "payment" || !action) {
      
      // En producción, harías una llamada a la API de Mercado Pago para verificar:
      // fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, { headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` } })
      
      const payload = {
        paymentId: paymentId,
        // Usar preferencia provista o mockear una para compatibilidad
        preferenceId: body.preference_id || body.data?.preference_id || "pref_colombia_mock",
        status: "approved"
      };

      const result = await billingService.processPaymentWebhook(payload);
      
      return NextResponse.json({ 
        success: true, 
        message: "Webhook procesado exitosamente",
        data: result 
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: "Acción de notificación ignorada" 
    });

  } catch (error) {
    console.error("Error al procesar webhook de Mercado Pago:", error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
