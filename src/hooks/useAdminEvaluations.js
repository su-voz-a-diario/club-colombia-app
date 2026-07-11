import { useState, useEffect } from "react";
import { AdminService } from "@/services/admin";

/**
 * Custom Hook para escuchar todas las evaluaciones técnicas registradas.
 * @returns {{ data: array, loading: boolean, error: any }}
 */
export function useAdminEvaluations() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    const unsubscribe = AdminService.subscribeAllEvaluations((list) => {
      setData(list);
      setLoading(false);
    });

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
