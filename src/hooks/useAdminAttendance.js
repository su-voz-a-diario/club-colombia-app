import { useEffect, useState } from "react";
import { AdminService } from "@/services/admin";
import { adminStep } from "@/lib/adminDiagnostics";

/**
 * Custom Hook para escuchar todas las hojas de asistencia.
 * @returns {{ data: array, loading: boolean, error: any }}
 */
export function useAdminAttendance() {
  adminStep("ADMIN_STEP_52_USE_ADMIN_ATTENDANCE_RENDER");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    const unsubscribe = AdminService.subscribeAllAttendance(
      (attendance) => {
        setData(attendance);
        setLoading(false);
      },
      (err) => {
        setError(err.message || "Error al cargar asistencias");
        setLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, []);

  return {
    data,
    loading,
    error
  };
}
export default useAdminAttendance;
