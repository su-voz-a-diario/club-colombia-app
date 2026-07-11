import { useState, useEffect, useCallback } from "react";
import { AdminService } from "@/services/admin";

/**
 * Custom Hook para gestionar acciones administrativas.
 * @returns {{ data: array, loading: boolean, error: any, refresh: function, updateStudentCategory: function }}
 */
export function useAdmin() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await AdminService.getStudents();
      setData(list);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const updateStudentCategory = useCallback(async (studentId, category) => {
    setError(null);
    try {
      return await AdminService.updateStudentCategory(studentId, category);
    } catch (err) {
      setError(err);
      throw err;
    }
  }, []);

  return {
    data,
    loading,
    error,
    refresh: fetchStudents,
    updateStudentCategory
  };
}
export default useAdmin;
