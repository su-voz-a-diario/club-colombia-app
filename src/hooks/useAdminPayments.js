import { useState, useEffect, useCallback } from "react";
import { AdminService } from "@/services/admin";
import { adminStep } from "@/lib/adminDiagnostics";

/**
 * Custom Hook para la gestión administrativa de validación de pagos.
 * Abstrae la lectura en tiempo real y las mutaciones.
 * @returns {{ pendingPayments: array, loading: boolean, error: any, approvePayment: function, holdPayment: function, clearError: function, successMessage: string, clearSuccessMessage: function }}
 */
export function useAdminPayments() {
  adminStep("ADMIN_STEP_40_USE_ADMIN_PAYMENTS_RENDER");
  const [pendingPayments, setPendingPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  adminStep("ADMIN_PAYMENTS_STAGE_B1_BEFORE_EFFECT");
  useEffect(() => {
    adminStep("ADMIN_PAYMENTS_STAGE_B1_EFFECT_ENTER");
    const unsubscribe = AdminService.subscribePendingPayments((payments) => {
      console.log("payments recibidos:", payments.length);
    });

    return () => {
      adminStep("ADMIN_PAYMENTS_STAGE_B1_CLEANUP");
      unsubscribe();
    };
  }, []);

  const clearError = useCallback(() => setError(null), []);
  const clearSuccessMessage = useCallback(() => setSuccessMessage(""), []);

  const approvePayment = useCallback(async (paymentId) => {
    setActionLoading(true);
    setError(null);
    setSuccessMessage("");
    try {
      const data = await AdminService.approvePayment(paymentId);
      setSuccessMessage("Pago aprobado correctamente. Se actualizó la facturación del alumno asociado.");
      return data;
    } catch (err) {
      setError(err.message || "Error al aprobar pago");
      throw err;
    } finally {
      setActionLoading(false);
    }
  }, []);

  const holdPayment = useCallback(async (paymentId, studentIdOrName) => {
    setActionLoading(true);
    setError(null);
    setSuccessMessage("");
    try {
      const data = await AdminService.holdPayment(paymentId, studentIdOrName);
      setSuccessMessage("El pago ha sido puesto en espera y el estudiante ha sido notificado.");
      return data;
    } catch (err) {
      setError(err.message || "Error al retener pago");
      throw err;
    } finally {
      setActionLoading(false);
    }
  }, []);

  const processSuspensions = useCallback(async () => {
    setActionLoading(true);
    setError(null);
    setSuccessMessage("");
    try {
      const data = await AdminService.processSuspensions();
      setSuccessMessage(`Se han auditado los estudiantes con mora y se suspendieron ${data.count} cuentas exitosamente.`);
      return data;
    } catch (err) {
      setError(err.message || "Error al procesar suspensiones por mora");
      throw err;
    } finally {
      setActionLoading(false);
    }
  }, []);

  return {
    pendingPayments,
    loading,
    error,
    successMessage,
    actionLoading,
    approvePayment,
    holdPayment,
    processSuspensions,
    clearError,
    clearSuccessMessage
  };
}
export default useAdminPayments;
