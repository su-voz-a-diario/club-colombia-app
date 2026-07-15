import { useEffect, useState } from "react";
import { AdminService } from "@/services/admin";
import { adminStep } from "@/lib/adminDiagnostics";

/**
 * Custom Hook para escuchar todas las evaluaciones técnicas registradas.
 * @returns {{ data: array, loading: boolean, error: any }}
 */
export function useAdminEvaluations() {
  adminStep("ADMIN_STEP_46_USE_ADMIN_EVALUATIONS_RENDER");
  const [data] = useState([]);
  const [loading] = useState(false);
  const [error] = useState(null);

  useEffect(() => {
    const unsubscribe = AdminService.subscribeAllEvaluations(() => {});

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
export default useAdminEvaluations;
