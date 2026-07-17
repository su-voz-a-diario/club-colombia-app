import { isDemoActive } from "./resolver";
import * as FirebaseTrainingSchedules from "./firebase/trainingSchedules";

const demoSchedules = [];
const demoCoaches = [];

export const TrainingScheduleService = {
  subscribeTrainingSchedules: (callback, onError) => {
    if (isDemoActive()) {
      callback(demoSchedules);
      return () => {};
    }
    return FirebaseTrainingSchedules.subscribeTrainingSchedules(callback, onError);
  },

  subscribeCoachUsers: (callback, onError) => {
    if (isDemoActive()) {
      callback(demoCoaches);
      return () => {};
    }
    return FirebaseTrainingSchedules.subscribeCoachUsers(callback, onError);
  },

  saveTrainingSchedule: (scheduleData, scheduleId) => {
    if (isDemoActive()) return Promise.resolve({ success: true, scheduleId: scheduleId || "demo-schedule" });
    return FirebaseTrainingSchedules.saveTrainingSchedule(scheduleData, scheduleId);
  },

  updateTrainingScheduleStatus: (scheduleId, active) => {
    if (isDemoActive()) return Promise.resolve({ success: true });
    return FirebaseTrainingSchedules.updateTrainingScheduleStatus(scheduleId, active);
  },

  deleteTrainingSchedule: (scheduleId) => {
    if (isDemoActive()) return Promise.resolve({ success: true });
    return FirebaseTrainingSchedules.deleteTrainingSchedule(scheduleId);
  }
};

export default TrainingScheduleService;
