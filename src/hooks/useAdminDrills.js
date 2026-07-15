import { useState, useEffect } from "react";
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

  return {
    drills,
    loading,
    error
  };
}
export default useAdminDrills;
