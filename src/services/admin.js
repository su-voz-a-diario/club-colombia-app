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
  },

  createEvent: (eventData) => {
    return isDemoActive()
      ? DemoAdmin.createEvent(eventData)
      : FirebaseAdmin.createEvent(eventData);
  },

  deleteEvent: (eventId) => {
    return isDemoActive()
      ? DemoAdmin.deleteEvent(eventId)
      : FirebaseAdmin.deleteEvent(eventId);
  },

  sendAnnouncement: (text) => {
    return isDemoActive()
      ? DemoAdmin.sendAnnouncement(text)
      : FirebaseAdmin.sendAnnouncement(text);
  },

  deleteAnnouncement: () => {
    return isDemoActive()
      ? DemoAdmin.deleteAnnouncement()
      : FirebaseAdmin.deleteAnnouncement();
  },

  saveDrill: (drillData, drillId) => {
    return isDemoActive()
      ? DemoAdmin.saveDrill(drillData, drillId)
      : FirebaseAdmin.saveDrill(drillData, drillId);
  },

  deleteDrill: (drillId) => {
    return isDemoActive()
      ? DemoAdmin.deleteDrill(drillId)
      : FirebaseAdmin.deleteDrill(drillId);
  },

  updateParentPhone: (parentUid, oldPhone, newPhone) => {
    return isDemoActive()
      ? DemoAdmin.updateParentPhone(parentUid, oldPhone, newPhone)
      : FirebaseAdmin.updateParentPhone(parentUid, oldPhone, newPhone);
  },

  manualRegisterStudent: (studentData, manualPaidCash, manualPaymentConcept) => {
    return isDemoActive()
      ? DemoAdmin.manualRegisterStudent(studentData, manualPaidCash, manualPaymentConcept)
      : FirebaseAdmin.manualRegisterStudent(studentData, manualPaidCash, manualPaymentConcept);
  },

  applyCategoryOverride: (studentId, newCategoryData) => {
    return isDemoActive()
      ? DemoAdmin.applyCategoryOverride(studentId, newCategoryData)
      : FirebaseAdmin.applyCategoryOverride(studentId, newCategoryData);
  },

  confirmManualPayment: (studentIdOrName) => {
    return isDemoActive()
      ? DemoAdmin.confirmManualPayment(studentIdOrName)
      : FirebaseAdmin.confirmManualPayment(studentIdOrName);
  },

  subscribePendingPayments: (callback) => {
    return isDemoActive()
      ? DemoAdmin.subscribePendingPayments(callback)
      : FirebaseAdmin.subscribePendingPayments(callback);
  },

  approvePayment: (paymentId) => {
    return isDemoActive()
      ? DemoAdmin.approvePayment(paymentId)
      : FirebaseAdmin.approvePayment(paymentId);
  },

  holdPayment: (paymentId, studentIdOrName) => {
    return isDemoActive()
      ? DemoAdmin.holdPayment(paymentId, studentIdOrName)
      : FirebaseAdmin.holdPayment(paymentId, studentIdOrName);
  },

  processSuspensions: () => {
    return isDemoActive()
      ? DemoAdmin.processSuspensions()
      : FirebaseAdmin.processSuspensions();
  }
};
export default AdminService;
