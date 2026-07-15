import { useState, useEffect, useCallback } from "react";
import { AdminService } from "@/services/admin";
import { AttendanceService } from "@/services/attendance";
import { adminStep } from "@/lib/adminDiagnostics";

/**
 * Custom Hook para gestionar la biblioteca de Drills (Videos de Entrenamiento)
 * desde el panel de administración.
 * Permite leer todos los drills en tiempo real.
 * @returns {{ drills: array, loading: boolean, error: any }}
 */
export function useAdminDrills() {
  adminStep("ADMIN_STEP_64_USE_ADMIN_DRILLS_RENDER");
  const [drills, setDrills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  adminStep("ADMIN_STEP_65_USE_ADMIN_DRILLS_BEFORE_EFFECT");
  useEffect(() => {
    adminStep("ADMIN_STEP_66_USE_ADMIN_DRILLS_EFFECT_ENTER");
    setLoading(true);
    setError(null);

    try {
      // Reutilizamos el listener de AttendanceService que ya lee la colección "drills" entera.
      adminStep("ADMIN_STEP_67_USE_ADMIN_DRILLS_BEFORE_LISTENER");
      const unsubscribe = AttendanceService.subscribeDrills((list) => {
        adminStep("ADMIN_STEP_68_USE_ADMIN_DRILLS_DATA_RECEIVED", {
          drillsCount: Array.isArray(list) ? list.length : "not-array"
        });
        setDrills(Array.isArray(list) ? list : []);
        setLoading(false);
      });

      return () => {
        adminStep("ADMIN_STEP_69_USE_ADMIN_DRILLS_CLEANUP");
        unsubscribe();
      };
    } catch (err) {
      setError(err?.message || "No se pudieron cargar los ejercicios.");
      setLoading(false);
      return () => {};
    }
  }, []);

  const clearMessages = useCallback(() => {
    setError(null);
    setSuccessMessage("");
  }, []);

  const saveDrill = useCallback(async (drillData, drillId = null) => {
    setActionLoading(true);
    clearMessages();

    try {
      const result = await AdminService.saveDrill(drillData, drillId);
      setSuccessMessage(drillId ? "Ejercicio actualizado correctamente." : "Ejercicio creado correctamente.");
      return result;
    } catch (err) {
      const message = err?.message || "No fue posible guardar el ejercicio.";
      setError(message);
      throw err;
    } finally {
      setActionLoading(false);
    }
  }, [clearMessages]);

  const deleteDrill = useCallback(async (drillId) => {
    setActionLoading(true);
    clearMessages();

    try {
      const result = await AdminService.deleteDrill(drillId);
      setSuccessMessage("Ejercicio eliminado correctamente.");
      return result;
    } catch (err) {
      const message = err?.message || "No fue posible eliminar el ejercicio.";
      setError(message);
      throw err;
    } finally {
      setActionLoading(false);
    }
  }, [clearMessages]);

  return {
    drills,
    loading,
    error,
    actionLoading,
    successMessage,
    saveDrill,
    deleteDrill,
    clearMessages
  };
}
export default useAdminDrills;
