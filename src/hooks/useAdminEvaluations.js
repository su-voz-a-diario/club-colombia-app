import { useState, useEffect } from "react";
import { AdminService } from "@/services/admin";
import { adminStep } from "@/lib/adminDiagnostics";

/**
 * Custom Hook para escuchar todas las evaluaciones técnicas registradas.
 * @returns {{ data: array, loading: boolean, error: any }}
 */
export function useAdminEvaluations() {
  adminStep("ADMIN_STEP_46_USE_ADMIN_EVALUATIONS_RENDER");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  adminStep("ADMIN_STEP_47_USE_ADMIN_EVALUATIONS_BEFORE_EFFECT");
  useEffect(() => {
    adminStep("ADMIN_STEP_48_USE_ADMIN_EVALUATIONS_EFFECT_ENTER");
    setLoading(true);
    setError(null);

    adminStep("ADMIN_STEP_49_USE_ADMIN_EVALUATIONS_BEFORE_LISTENER");
    const unsubscribe = AdminService.subscribeAllEvaluations((list) => {
      adminStep("ADMIN_STEP_50_USE_ADMIN_EVALUATIONS_DATA_RECEIVED", {
        evaluationsCount: Array.isArray(list) ? list.length : "not-array"
      });
      setData(list);
      setLoading(false);
    });

    return () => {
      adminStep("ADMIN_STEP_51_USE_ADMIN_EVALUATIONS_CLEANUP");
      unsubscribe();
    };
  }, []);

  return {
    data,
    loading,
    error
  };
}
export default useAdminEvaluations;
