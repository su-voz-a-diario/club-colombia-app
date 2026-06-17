import { supabase } from "../supabase";

export const billingService = {
  /**
   * Genera una preferencia de pago en la base de datos simulando el inicio del checkout en Mercado Pago.
   */
  async initiateSubscription(studentId, amount) {
    const today = new Date();
    const billingDate = today.toISOString().split("T")[0];
    
    // El vencimiento es en 5 días naturales para propósitos del checkout
    const dueDateObj = new Date(today);
    dueDateObj.setDate(today.getDate() + 5);
    const dueDate = dueDateObj.toISOString().split("T")[0];

    // Simular creación de preferencia en Mercado Pago (MP preference ID)
    const mpPreferenceId = `pref_colombia_${Math.random().toString(36).substring(2, 9)}`;

    const { data, error } = await supabase
      .from("payments")
      .insert({
        student_id: studentId,
        amount: amount,
        status: "pending",
        type: "subscription",
        billing_date: billingDate,
        due_date: dueDate,
        mp_preference_id: mpPreferenceId
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Procesa el Webhook de Mercado Pago recibido en tiempo real.
   * Modifica el estado del pago a 'paid' y reactiva al estudiante en la misma transacción lógica.
   */
  async processPaymentWebhook(payload) {
    const { paymentId, preferenceId, status } = payload;

    if (status !== "approved") {
      return { success: false, message: "El pago no está aprobado" };
    }

    // 1. Buscar el pago pendiente asociado
    const { data: payment, error: fetchError } = await supabase
      .from("payments")
      .select("id, student_id")
      .eq("mp_preference_id", preferenceId)
      .eq("status", "pending")
      .single();

    if (fetchError || !payment) {
      throw new Error("Pago no encontrado o ya procesado");
    }

    // 2. Actualizar el pago a pagado
    const { error: updatePaymentError } = await supabase
      .from("payments")
      .update({
        status: "paid",
        mp_payment_id: paymentId,
        paid_at: new Date().toISOString()
      })
      .eq("id", payment.id);

    if (updatePaymentError) throw updatePaymentError;

    // 3. Reactivar la credencial QR del alumno
    const { error: updateStudentError } = await supabase
      .from("students")
      .update({ status: "active" })
      .eq("id", payment.student_id);

    if (updateStudentError) throw updateStudentError;

    // 4. Mapear simulación de notificaciones de confirmación
    console.log(`[Twilio / WhatsApp] Notificación enviada: El pago del estudiante fue procesado. Credencial QR activada.`);

    return { success: true, studentId: payment.student_id };
  },

  /**
   * Calcula días hábiles entre dos fechas (excluyendo fines de semana).
   */
  calculateBusinessDays(startDate, endDate) {
    let start = new Date(startDate);
    let end = new Date(endDate);
    let count = 0;

    while (start < end) {
      start.setDate(start.getDate() + 1);
      const day = start.getDay();
      if (day !== 0 && day !== 6) { // 0: Domingo, 6: Sábado
        count++;
      }
    }
    return count;
  },

  /**
   * Motor de Reglas: Audita la mora de mensualidades.
   * Si excede los 5 días hábiles de gracia, suspende el QR del alumno y dispara alertas simuladas.
   */
  async checkAndSuspendDelinquentStudents() {
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];

    // 1. Obtener todos los pagos pendientes
    const { data: pendingPayments, error: fetchError } = await supabase
      .from("payments")
      .select("*, student:students(*)")
      .eq("status", "pending");

    if (fetchError) throw fetchError;

    const suspendedStudentIds = [];

    // 2. Recorrer y aplicar regla de 5 días hábiles
    for (const payment of pendingPayments) {
      const businessDaysPastDue = this.calculateBusinessDays(payment.due_date, todayStr);
      
      // Si excede el periodo de gracia y está activo
      if (businessDaysPastDue > 5 && payment.student.status === "active") {
        
        // Suspender credencial del estudiante
        const { error: suspendError } = await supabase
          .from("students")
          .update({ status: "suspended" })
          .eq("id", payment.student_id);

        if (!suspendError) {
          suspendedStudentIds.push(payment.student_id);
          
          // MOCK: Disparar webhooks de mensajería
          console.log(`[Twilio SMS/WhatsApp SMS - Alerta de Mora] Enviado a padre del estudiante ${payment.student.first_name} por mora de ${businessDaysPastDue} días.`);
          console.log(`[Resend Email - Suspensión de Credencial] Enviado reporte a administración.`);
        }
      }
    }

    return {
      auditedCount: pendingPayments.length,
      suspendedCount: suspendedStudentIds.length,
      suspendedIds: suspendedStudentIds
    };
  }
};
