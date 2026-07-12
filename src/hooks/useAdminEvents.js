import { useState, useEffect, useCallback } from "react";
import { AdminService } from "@/services/admin";
import { CalendarService } from "@/services/calendar";

/**
 * Custom Hook para gestionar los eventos desde el panel de administración.
 * Permite leer todos los eventos en tiempo real, así como crear y eliminarlos.
 * @returns {{ events: array, loading: boolean, error: any, createEvent: function, deleteEvent: function }}
 */
export function useAdminEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    // Reutilizamos el listener de CalendarService que ya lee la colección "events" entera
    const unsubscribe = CalendarService.subscribeCalendarEvents("all", (list) => {
      setEvents(list);
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const createEvent = useCallback(async (eventData) => {
    setError(null);
    try {
      return await AdminService.createEvent(eventData);
    } catch (err) {
      setError(err);
      throw err;
    }
  }, []);

  const deleteEvent = useCallback(async (eventId) => {
    setError(null);
    try {
      return await AdminService.deleteEvent(eventId);
    } catch (err) {
      setError(err);
      throw err;
    }
  }, []);

  return {
    events,
    loading,
    error,
    createEvent,
    deleteEvent
  };
}
export default useAdminEvents;
