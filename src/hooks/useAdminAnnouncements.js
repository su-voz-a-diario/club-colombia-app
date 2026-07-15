import { useState, useCallback, useEffect } from "react";
import { AdminService } from "@/services/admin";
import { NotificationsService } from "@/services/notifications";

/**
 * Custom Hook para gestionar los comunicados desde el panel de administración.
 * Permite leer, crear, editar y eliminar comunicados globales.
 * @returns {{ announcements: array, loading: boolean, actionLoading: boolean, error: any, successMessage: string, sendAnnouncement: function, deleteAnnouncement: function, clearMessages: function }}
 */
export function useAdminAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    setLoading(true);
    setError(null);

    const unsubscribe = NotificationsService.subscribeToAnnouncements((list) => {
      setAnnouncements(Array.isArray(list) ? list : []);
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const clearMessages = useCallback(() => {
    setError(null);
    setSuccessMessage("");
  }, []);

  const sendAnnouncement = useCallback(async (text) => {
    setActionLoading(true);
    setError(null);
    setSuccessMessage("");
    try {
      const data = await AdminService.sendAnnouncement(text);
      setSuccessMessage("Comunicado guardado correctamente.");
      return data;
    } catch (err) {
      setError(err.message || "Error al guardar el comunicado.");
      throw err;
    } finally {
      setActionLoading(false);
    }
  }, []);

  const deleteAnnouncement = useCallback(async () => {
    setActionLoading(true);
    setError(null);
    setSuccessMessage("");
    try {
      const data = await AdminService.deleteAnnouncement();
      setSuccessMessage("Comunicado eliminado correctamente.");
      return data;
    } catch (err) {
      setError(err.message || "Error al eliminar el comunicado.");
      throw err;
    } finally {
      setActionLoading(false);
    }
  }, []);

  return {
    announcements,
    sendAnnouncement,
    deleteAnnouncement,
    loading,
    actionLoading,
    error,
    successMessage,
    clearMessages
  };
}
export default useAdminAnnouncements;
