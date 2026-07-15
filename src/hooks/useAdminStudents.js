import { useState, useEffect, useCallback } from "react";
import { AdminService } from "@/services/admin";
import { adminStep } from "@/lib/adminDiagnostics";

/**
 * Custom Hook para gestionar y escuchar la nómina de estudiantes.
 * @returns {{ data: array, loading: boolean, error: any, refresh: function, updateStudentCategory: function }}
 */
export function useAdminStudents() {
  adminStep("ADMIN_STEP_34_USE_ADMIN_STUDENTS_RENDER");
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

  adminStep("ADMIN_STEP_35_USE_ADMIN_STUDENTS_BEFORE_EFFECT");
  useEffect(() => {
    adminStep("ADMIN_STEP_36_USE_ADMIN_STUDENTS_EFFECT_ENTER");
    setLoading(true);
    setError(null);

    adminStep("ADMIN_STEP_37_USE_ADMIN_STUDENTS_BEFORE_LISTENER");
    const unsubscribe = AdminService.subscribeStudentsList((list) => {
      adminStep("ADMIN_STEP_38_USE_ADMIN_STUDENTS_DATA_RECEIVED", {
        studentsCount: Array.isArray(list) ? list.length : "not-array"
      });
      setData(list);
      setLoading(false);
    });

    return () => {
      adminStep("ADMIN_STEP_39_USE_ADMIN_STUDENTS_CLEANUP");
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

  const updateStudentLifecycleStatus = useCallback(async (studentId, status, context = {}) => {
    setError(null);
    try {
      return await AdminService.updateStudentLifecycleStatus(studentId, status, context);
    } catch (err) {
      setError(err);
      throw err;
    }
  }, []);

  const getStudentLifecycleHistory = useCallback(async (student) => {
    setError(null);
    try {
      return await AdminService.getStudentLifecycleHistory(student);
    } catch (err) {
      setError(err);
      throw err;
    }
  }, []);

  const deleteEmptyStudent = useCallback(async (student) => {
    setError(null);
    try {
      return await AdminService.deleteEmptyStudent(student);
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
    confirmManualPayment,
    updateStudentLifecycleStatus,
    getStudentLifecycleHistory,
    deleteEmptyStudent
  };
}
export default useAdminStudents;
