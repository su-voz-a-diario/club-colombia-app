// src/services/payments.js

import { isDemoActive } from "./resolver";
import * as DemoPayments from "@/demo/payments";
import * as FirebasePayments from "./firebase/payments";

export const PaymentsService = {
  getPaymentsHistory: (studentId) => {
    return isDemoActive() 
      ? DemoPayments.getPaymentsHistory(studentId) 
      : FirebasePayments.getPaymentsHistory(studentId);
  },

  subscribePayments: (studentId, parentUid, parentEmail, callback) => {
    return isDemoActive()
      ? DemoPayments.subscribePayments(studentId, parentUid, parentEmail, callback)
      : FirebasePayments.subscribePayments(studentId, parentUid, parentEmail, callback);
  },

  reportPayment: (studentId, paymentData) => {
    return isDemoActive() 
      ? DemoPayments.reportPayment(studentId, paymentData) 
      : FirebasePayments.reportPayment(studentId, paymentData);
  }
};
export default PaymentsService;
