import { useState, useEffect, useCallback } from "react";
import { AdminService } from "@/services/admin";
import { AttendanceService } from "@/services/attendance";

/**
 * Custom Hook para gestionar la biblioteca de Drills (Videos de Entrenamiento)
 * desde el panel de administración.
 * Permite leer todos los drills en tiempo real, crearlos/editarlos y eliminarlos.
 * @returns {{ drills: array, loading: boolean, error: any, saveDrill: function, deleteDrill: function }}
 */
export function useAdminDrills() {
  const [drills, setDrills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    // Reutilizamos el listener de AttendanceService que ya lee la colección "drills" entera
    const unsubscribe = AttendanceService.subscribeDrills((list) => {
      setDrills(list);
      setLoading(false);
    });

    return () => {
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
