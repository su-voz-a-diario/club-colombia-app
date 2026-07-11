import { useState, useEffect, useCallback } from "react";
import { QRService } from "@/services/qr";

/**
 * Custom Hook para gestionar y escuchar la credencial QR e información del estudiante.
 * @param {string} studentId
 * @param {string} studentName
 * @returns {{ data: object|null, loading: boolean, error: any, refresh: function, updateStatus: function }}
 */
export function useQR(studentId, studentName) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchQR = useCallback(async () => {
    const id = studentId || (data ? data.studentId : "");
    if (!id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const qrData = await QRService.getStudentQR(id);
      setData(qrData);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [studentId, data]);

  useEffect(() => {
    if (!studentId && !studentName) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const unsubscribe = QRService.subscribeStudentQR(studentId, studentName, (qrData) => {
      setData(qrData);
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [studentId, studentName]);

  const updateStatus = useCallback(async (status) => {
    const id = studentId || (data ? data.id || data.studentId : "");
    if (!id) return { success: false };
    setError(null);
    try {
      return await QRService.updateStudentStatus(id, status);
    } catch (err) {
      setError(err);
      throw err;
    }
  }, [studentId, data]);

  return {
    data,
    loading,
    error,
    refresh: fetchQR,
    updateStatus
  };
}
export default useQR;
