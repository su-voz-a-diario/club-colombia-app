import { useState, useEffect, useCallback } from "react";
import { NotificationsService } from "@/services/notifications";

/**
 * Custom Hook para gestionar comunicados y anuncios del club.
 * @returns {{ data: array, loading: boolean, error: any, refresh: function }}
 */
export function useNotifications() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAnnouncements = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await NotificationsService.getClubAnnouncements();
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
    const unsubscribe = NotificationsService.subscribeToAnnouncements((list) => {
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
    error,
    refresh: fetchAnnouncements
  };
}
export default useNotifications;
