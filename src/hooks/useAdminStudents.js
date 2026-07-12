import { useState, useEffect, useCallback } from "react";
import { AdminService } from "@/services/admin";

/**
 * Custom Hook para gestionar y escuchar la nómina de estudiantes.
 * @returns {{ data: array, loading: boolean, error: any, refresh: function, updateStudentCategory: function }}
 */
export function useAdminStudents() {
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
    setLoading(true);
    setError(null);

    const unsubscribe = AdminService.subscribeStudentsList((list) => {
      setData(list);
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const updateStudentCategory = useCallback(async (studentId, category) => {
    setError(null);
    try {
      return await AdminService.updateStudentCategory(studentId, category);
    } catch (err) {
      setError(err);
      throw err;
    }
  }, []);

  const manualRegisterStudent = useCallback(async (studentData, manualPaidCash, manualPaymentConcept) => {
    setError(null);
    try {
      return await AdminService.manualRegisterStudent(studentData, manualPaidCash, manualPaymentConcept);
    } catch (err) {
      setError(err);
      throw err;
    }
  }, []);

  const applyCategoryOverride = useCallback(async (studentId, newCategoryData) => {
    setError(null);
    try {
      return await AdminService.applyCategoryOverride(studentId, newCategoryData);
    } catch (err) {
      setError(err);
      throw err;
    }
  }, []);

  const confirmManualPayment = useCallback(async (studentIdOrName) => {
    setError(null);
    try {
      return await AdminService.confirmManualPayment(studentIdOrName);
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
    updateStudentCategory,
    manualRegisterStudent,
    applyCategoryOverride,
    confirmManualPayment
  };
}
export default useAdminStudents;
