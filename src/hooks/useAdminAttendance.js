import { useState, useEffect } from "react";
import { AdminService } from "@/services/admin";

/**
 * Custom Hook para escuchar todas las hojas de asistencia.
 * @returns {{ data: array, loading: boolean, error: any }}
 */
export function useAdminAttendance() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    const unsubscribe = AdminService.subscribeAllAttendance((list) => {
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
export default useAdminAttendance;
