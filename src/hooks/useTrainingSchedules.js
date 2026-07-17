import { useCallback, useEffect, useState } from "react";
import { TrainingScheduleService } from "@/services/trainingSchedules";

export function useTrainingSchedules({ includeCoaches = true } = {}) {
  const [schedules, setSchedules] = useState([]);
  const [coaches, setCoaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");

    const unsubscribeSchedules = TrainingScheduleService.subscribeTrainingSchedules((list) => {
      setSchedules(Array.isArray(list) ? list : []);
      setLoading(false);
    }, (err) => {
      setError(err?.message || "No se pudieron cargar los horarios.");
      setLoading(false);
    });

    const unsubscribeCoaches = includeCoaches
      ? TrainingScheduleService.subscribeCoachUsers((list) => {
        setCoaches(Array.isArray(list) ? list : []);
      }, () => {})
      : () => {};

    return () => {
      unsubscribeSchedules();
      unsubscribeCoaches();
    };
  }, [includeCoaches]);

  const clearMessages = useCallback(() => {
    setError("");
    setSuccessMessage("");
  }, []);

  const saveSchedule = useCallback(async (scheduleData, scheduleId = null) => {
    setActionLoading(true);
    clearMessages();
    try {
      const result = await TrainingScheduleService.saveTrainingSchedule(scheduleData, scheduleId);
      setSuccessMessage(scheduleId ? "Horario actualizado correctamente." : "Horario creado correctamente.");
      return result;
    } catch (err) {
      setError(err?.message || "No fue posible guardar el horario.");
      throw err;
    } finally {
      setActionLoading(false);
    }
  }, [clearMessages]);

  const toggleScheduleStatus = useCallback(async (scheduleId, active) => {
    setActionLoading(true);
    clearMessages();
    try {
      const result = await TrainingScheduleService.updateTrainingScheduleStatus(scheduleId, active);
      setSuccessMessage(active ? "Horario activado correctamente." : "Horario desactivado correctamente.");
      return result;
    } catch (err) {
      setError(err?.message || "No fue posible actualizar el horario.");
      throw err;
    } finally {
      setActionLoading(false);
    }
  }, [clearMessages]);

  const deleteSchedule = useCallback(async (scheduleId) => {
    setActionLoading(true);
    clearMessages();
    try {
      const result = await TrainingScheduleService.deleteTrainingSchedule(scheduleId);
      setSuccessMessage("Horario eliminado correctamente.");
      return result;
    } catch (err) {
      setError(err?.message || "No fue posible eliminar el horario.");
      throw err;
    } finally {
      setActionLoading(false);
    }
  }, [clearMessages]);

  return {
    schedules,
    coaches,
    loading,
    error,
    actionLoading,
    successMessage,
    saveSchedule,
    toggleScheduleStatus,
    deleteSchedule,
    clearMessages
  };
}

export default useTrainingSchedules;
