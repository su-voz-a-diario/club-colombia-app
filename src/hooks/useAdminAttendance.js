import { useEffect, useState } from "react";
import { AdminService } from "@/services/admin";
import { adminStep } from "@/lib/adminDiagnostics";

/**
 * Custom Hook para escuchar todas las hojas de asistencia.
 * @returns {{ data: array, loading: boolean, error: any }}
 */
export function useAdminAttendance() {
  adminStep("ADMIN_STEP_52_USE_ADMIN_ATTENDANCE_RENDER");
  const [data] = useState([]);
  const [loading] = useState(false);
  const [error] = useState(null);

  useEffect(() => {
    const unsubscribe = AdminService.subscribeAllAttendance(() => {});

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
