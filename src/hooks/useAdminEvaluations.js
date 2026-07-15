import { useState } from "react";
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

  return {
    data,
    loading,
    error
  };
}
export default useAdminEvaluations;
