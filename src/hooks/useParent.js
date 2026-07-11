import { useState, useEffect, useCallback } from "react";
import { ParentService } from "@/services/parent";

/**
 * Custom Hook para suscribirse en tiempo real al perfil del padre de familia.
 * @param {string} uid
 * @returns {{ data: object|null, loading: boolean, error: any, refresh: function, updatePhone: function, updateStatus: function }}
 */
export function useParent(uid) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProfile = useCallback(async () => {
    if (!uid) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const profile = await ParentService.getParentProfile(uid);
      setData(profile);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [uid]);

  useEffect(() => {
    if (!uid) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Suscribirse en tiempo real a los cambios del documento
    const unsubscribe = ParentService.subscribeParentProfile(uid, (profile) => {
      setData(profile);
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [uid]);

  const updatePhone = useCallback(async (phone) => {
    setError(null);
    try {
      const result = await ParentService.updateParentPhone(uid, phone);
      return result;
    } catch (err) {
      setError(err);
      throw err;
    }
  }, [uid]);

  const updateStatus = useCallback(async (status) => {
    setError(null);
    try {
      const result = await ParentService.updateParentStatus(uid, status);
      return result;
    } catch (err) {
      setError(err);
      throw err;
    }
  }, [uid]);

  return {
    data,
    loading,
    error,
    refresh: fetchProfile,
    updatePhone,
    updateStatus
  };
}
export default useParent;
