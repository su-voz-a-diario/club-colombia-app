import { useState, useCallback } from "react";
import { AdminService } from "@/services/admin";

/**
 * Custom Hook para gestionar los comunicados desde el panel de administración.
 * Permite enviar comunicados globales a toda la plataforma.
 * @returns {{ sendAnnouncement: function, loading: boolean, error: any }}
 */
export function useAdminAnnouncements() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const sendAnnouncement = useCallback(async (text) => {
    setLoading(true);
    setError(null);
    try {
      return await AdminService.sendAnnouncement(text);
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    sendAnnouncement,
    loading,
    error
  };
}
export default useAdminAnnouncements;
