// src/services/qr.js

import { isDemoActive } from "./resolver";
import * as DemoQR from "@/demo/qr";
import * as FirebaseQR from "./firebase/qr";

export const QRService = {
  getStudentQR: (studentId) => {
    return isDemoActive() 
      ? DemoQR.getStudentQR(studentId) 
      : FirebaseQR.getStudentQR(studentId);
  },

  subscribeStudentQR: (studentId, studentName, callback) => {
    return isDemoActive()
      ? DemoQR.subscribeStudentQR(studentId, studentName, callback)
      : FirebaseQR.subscribeStudentQR(studentId, studentName, callback);
  },

  updateStudentStatus: (studentId, status) => {
    return isDemoActive()
      ? DemoQR.updateStudentStatus(studentId, status)
      : FirebaseQR.updateStudentStatus(studentId, status);
  }
};
export default QRService;
