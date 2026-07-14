import { useState, useEffect, useCallback } from "react";
import { AdminService } from "@/services/admin";
import { CalendarService } from "@/services/calendar";
import { adminStep } from "@/lib/adminDiagnostics";

/**
 * Custom Hook para gestionar los eventos desde el panel de administración.
 * Permite leer todos los eventos en tiempo real, así como crear y eliminarlos.
 * @returns {{ events: array, loading: boolean, error: any, createEvent: function, deleteEvent: function }}
 */
export function useAdminEvents() {
  adminStep("ADMIN_STEP_58_USE_ADMIN_EVENTS_RENDER");
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  adminStep("ADMIN_STEP_59_USE_ADMIN_EVENTS_BEFORE_EFFECT");
  useEffect(() => {
    adminStep("ADMIN_STEP_60_USE_ADMIN_EVENTS_EFFECT_ENTER");
    setLoading(true);
    setError(null);

    // Reutilizamos el listener de CalendarService que ya lee la colección "events" entera
    adminStep("ADMIN_STEP_61_USE_ADMIN_EVENTS_BEFORE_LISTENER");
    const unsubscribe = CalendarService.subscribeCalendarEvents("all", (list) => {
      adminStep("ADMIN_STEP_62_USE_ADMIN_EVENTS_DATA_RECEIVED", {
        eventsCount: Array.isArray(list) ? list.length : "not-array"
      });
      setEvents(list);
      setLoading(false);
    });

    return () => {
      adminStep("ADMIN_STEP_63_USE_ADMIN_EVENTS_CLEANUP");
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
