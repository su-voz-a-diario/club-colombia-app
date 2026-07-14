import { useState, useEffect, useCallback } from "react";
import { AdminService } from "@/services/admin";
import { AttendanceService } from "@/services/attendance";
import { adminStep } from "@/lib/adminDiagnostics";

/**
 * Custom Hook para gestionar la biblioteca de Drills (Videos de Entrenamiento)
 * desde el panel de administración.
 * Permite leer todos los drills en tiempo real, crearlos/editarlos y eliminarlos.
 * @returns {{ drills: array, loading: boolean, error: any, saveDrill: function, deleteDrill: function }}
 */
export function useAdminDrills() {
  adminStep("ADMIN_STEP_64_USE_ADMIN_DRILLS_RENDER");
  const [drills, setDrills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  adminStep("ADMIN_STEP_65_USE_ADMIN_DRILLS_BEFORE_EFFECT");
  useEffect(() => {
    adminStep("ADMIN_STEP_66_USE_ADMIN_DRILLS_EFFECT_ENTER");
    setLoading(true);
    setError(null);

    // Reutilizamos el listener de AttendanceService que ya lee la colección "drills" entera
    adminStep("ADMIN_STEP_67_USE_ADMIN_DRILLS_BEFORE_LISTENER");
    const unsubscribe = AttendanceService.subscribeDrills((list) => {
      adminStep("ADMIN_STEP_68_USE_ADMIN_DRILLS_DATA_RECEIVED", {
        drillsCount: Array.isArray(list) ? list.length : "not-array"
      });
      setDrills(list);
      setLoading(false);
    });

    return () => {
      adminStep("ADMIN_STEP_69_USE_ADMIN_DRILLS_CLEANUP");
      unsubscribe();
    };
  }, []);

  const saveDrill = useCallback(async (drillData, drillId = null) => {
    setError(null);
    try {
      return await AdminService.saveDrill(drillData, drillId);
    } catch (err) {
      setError(err);
      throw err;
    }
  }, []);

  const deleteDrill = useCallback(async (drillId) => {
    setError(null);
    try {
      return await AdminService.deleteDrill(drillId);
    } catch (err) {
      setError(err);
      throw err;
    }
  }, []);

  return {
    drills,
    loading,
    error,
    saveDrill,
    deleteDrill
  };
}
export default useAdminDrills;
