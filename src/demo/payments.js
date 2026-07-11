// src/demo/payments.js

import { getActiveDemoData } from "./demoData";
import { demoConfig } from "./demoConfig";

export async function getPaymentsHistory(studentId) {
  await new Promise((resolve) => setTimeout(resolve, demoConfig.behavior.simulatedLatency));
  const data = getActiveDemoData();
  return data.payments;
}

export function subscribePayments(studentId, parentUid, parentEmail, callback) {
  const data = getActiveDemoData();
  callback(data.payments);
  return () => {};
}

export async function reportPayment(studentId, paymentData) {
  await new Promise((resolve) => setTimeout(resolve, demoConfig.behavior.simulatedLatency));
  if (!studentId) {
    throw new Error("studentId es obligatorio para reportar un pago");
  }
  console.log(`[DEMO MODE] Reporte de pago recibido para estudiante ${studentId}:`, paymentData);
  return { success: true };
}
