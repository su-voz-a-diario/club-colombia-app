// src/services/admin.js

import { isDemoActive } from "./resolver";
import * as DemoAdmin from "@/demo/admin";
import * as FirebaseAdmin from "./firebase/admin";

export const AdminService = {
  getStudents: () => {
    return isDemoActive() 
      ? DemoAdmin.getStudents() 
      : FirebaseAdmin.getStudents();
  },

  subscribeStudentsList: (callback) => {
    return isDemoActive()
      ? DemoAdmin.subscribeStudentsList(callback)
      : FirebaseAdmin.subscribeStudentsList(callback);
  },

  subscribeAllEvaluations: (callback) => {
    return isDemoActive()
      ? DemoAdmin.subscribeAllEvaluations(callback)
      : FirebaseAdmin.subscribeAllEvaluations(callback);
  },

  subscribeAllAttendance: (callback) => {
    return isDemoActive()
      ? DemoAdmin.subscribeAllAttendance(callback)
      : FirebaseAdmin.subscribeAllAttendance(callback);
  },

  updateStudentCategory: (studentId, category) => {
    return isDemoActive() 
      ? DemoAdmin.updateStudentCategory(studentId, category) 
      : FirebaseAdmin.updateStudentCategory(studentId, category);
  },

  updateStudentLifecycleStatus: (studentId, status, context) => {
    return isDemoActive()
      ? DemoAdmin.updateStudentLifecycleStatus(studentId, status, context)
      : FirebaseAdmin.updateStudentLifecycleStatus(studentId, status, context);
  },

  getStudentLifecycleHistory: (student) => {
    return isDemoActive()
      ? DemoAdmin.getStudentLifecycleHistory(student)
      : FirebaseAdmin.getStudentLifecycleHistory(student);
  },

  deleteEmptyStudent: (student) => {
    return isDemoActive()
      ? DemoAdmin.deleteEmptyStudent(student)
      : FirebaseAdmin.deleteEmptyStudent(student);
  }
};
export default AdminService;
