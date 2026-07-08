import { NextResponse } from "next/server";
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
      return NextResponse.json({ 
        success: false,
        paymentId,
        message: "Pago recibido pero no aprobado: falta validación real con Mercado Pago"
      }, { status: 202 });
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
