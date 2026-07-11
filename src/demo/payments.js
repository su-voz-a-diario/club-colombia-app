// src/demo/payments.js

import { getActiveDemoData } from "./demoData";
import { demoConfig } from "./demoConfig";

export async function getPaymentsHistory(studentId) {
  await new Promise((resolve) => setTimeout(resolve, demoConfig.behavior.simulatedLatency));
  const data = getActiveDemoData();
  return data.payments;
}

export function subscribePayments(parentUid, parentEmail, callback) {
  const data = getActiveDemoData();
  callback(data.payments);
  return () => {};
}

export async function reportPayment(studentId, paymentData) {
  await new Promise((resolve) => setTimeout(resolve, demoConfig.behavior.simulatedLatency));
  console.log(`[DEMO MODE] Reporte de pago recibido para estudiante ${studentId}:`, paymentData);
  return { success: true };
}
