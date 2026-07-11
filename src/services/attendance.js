// src/services/attendance.js

import { isDemoActive } from "./resolver";
import * as DemoAttendance from "@/demo/attendance";
import * as FirebaseAttendance from "./firebase/attendance";

export const AttendanceService = {
  getAttendanceHistory: (studentId) => {
    return isDemoActive() 
      ? DemoAttendance.getAttendanceHistory(studentId) 
      : FirebaseAttendance.getAttendanceHistory(studentId);
  },

  subscribeAttendanceHistory: (studentId, callback) => {
    return isDemoActive()
      ? DemoAttendance.subscribeAttendanceHistory(studentId, callback)
      : FirebaseAttendance.subscribeAttendanceHistory(studentId, callback);
  },

  subscribeEvaluations: (studentName, callback) => {
    return isDemoActive()
      ? DemoAttendance.subscribeEvaluations(studentName, callback)
      : FirebaseAttendance.subscribeEvaluations(studentName, callback);
  },

  subscribeDrills: (callback) => {
    return isDemoActive()
      ? DemoAttendance.subscribeDrills(callback)
      : FirebaseAttendance.subscribeDrills(callback);
  }
};
export default AttendanceService;
