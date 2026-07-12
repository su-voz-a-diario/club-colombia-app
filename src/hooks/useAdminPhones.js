import { useState, useCallback } from "react";
import { AdminService } from "@/services/admin";

/**
 * Custom Hook para la gestión administrativa de teléfonos de acudientes.
 * Abstrae la lógica de llamadas HTTP e interacción con Firebase Admin.
 * @returns {{ updatePhone: function, loading: boolean, error: any, successMessage: string, clearState: function }}
 */
export function useAdminPhones() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  const clearState = useCallback(() => {
    setError(null);
    setSuccessMessage("");
  }, []);

  const updatePhone = useCallback(async (parentUid, oldPhone, newPhone) => {
    setLoading(true);
    setError(null);
    setSuccessMessage("");
    try {
      const data = await AdminService.updateParentPhone(parentUid, oldPhone, newPhone);
      setSuccessMessage(`Teléfono actualizado exitosamente a ${data.phone}.`);
      return data;
    } catch (err) {
      setError(err.message || "Error al actualizar el teléfono.");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    updatePhone,
    loading,
    error,
    successMessage,
    clearState
  };
}
export default useAdminPhones;
