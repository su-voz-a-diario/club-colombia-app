import { useEffect, useState } from "react";
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

  useEffect(() => {
    setLoading(true);
    setError(null);

    const unsubscribe = AdminService.subscribeAllEvaluations(
      (evaluations) => {
        setData(evaluations);
        setLoading(false);
      },
      (err) => {
        setError(err.message || "Error al cargar evaluaciones");
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
export default useAdminEvaluations;
