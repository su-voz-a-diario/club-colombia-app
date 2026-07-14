import { useState, useEffect } from "react";
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

  adminStep("ADMIN_STEP_53_USE_ADMIN_ATTENDANCE_BEFORE_EFFECT");
  useEffect(() => {
    adminStep("ADMIN_STEP_54_USE_ADMIN_ATTENDANCE_EFFECT_ENTER");
    setLoading(true);
    setError(null);

    adminStep("ADMIN_STEP_55_USE_ADMIN_ATTENDANCE_BEFORE_LISTENER");
    const unsubscribe = AdminService.subscribeAllAttendance((list) => {
      adminStep("ADMIN_STEP_56_USE_ADMIN_ATTENDANCE_DATA_RECEIVED", {
        attendanceCount: Array.isArray(list) ? list.length : "not-array"
      });
      setData(list);
      setLoading(false);
    });

    return () => {
      adminStep("ADMIN_STEP_57_USE_ADMIN_ATTENDANCE_CLEANUP");
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
