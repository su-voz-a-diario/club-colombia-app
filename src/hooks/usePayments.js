import { useState, useEffect, useCallback } from "react";
import { PaymentsService } from "@/services/payments";

/**
 * Custom Hook para gestionar pagos y estados financieros en tiempo real.
 * @param {string} studentId
 * @param {string} parentUid
 * @param {string} parentEmail
 * @returns {{ data: array, loading: boolean, error: any, refresh: function, reportPayment: function }}
 */
export function usePayments(studentId, parentUid, parentEmail) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPayments = useCallback(async () => {
    if (!studentId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const history = await PaymentsService.getPaymentsHistory(studentId);
      setData(history);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    if (!parentUid && !parentEmail) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const unsubscribe = PaymentsService.subscribePayments(parentUid, parentEmail, (list) => {
      setData(list);
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [parentUid, parentEmail]);

  const reportPayment = useCallback(async (paymentData) => {
    setError(null);
    try {
      const result = await PaymentsService.reportPayment(studentId, paymentData);
      return result;
    } catch (err) {
      setError(err);
      throw err;
    }
  }, [studentId]);

  return {
    data,
    loading,
    error,
    refresh: fetchPayments,
    reportPayment
  };
}
export default usePayments;
