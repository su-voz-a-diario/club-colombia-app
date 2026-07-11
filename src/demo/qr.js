// src/demo/qr.js

import { getActiveDemoData } from "./demoData";
import { demoConfig } from "./demoConfig";

export async function getStudentQR(studentId) {
  await new Promise((resolve) => setTimeout(resolve, demoConfig.behavior.simulatedLatency));
  const data = getActiveDemoData();
  return {
    studentId: studentId || data.student.id,
    id: studentId || data.student.id,
    name: data.student.name,
    category: data.student.category,
    status: data.student.status,
    healthStatus: data.health.status,
    qrValue: data.student.qrCode
  };
}

export function subscribeStudentQR(studentId, studentName, callback) {
  const data = getActiveDemoData();
  callback({
    studentId: studentId || data.student.id,
    id: studentId || data.student.id,
    name: data.student.name,
    category: data.student.category,
    status: data.student.status,
    healthStatus: data.health.status,
    qrValue: data.student.qrCode
  });
  return () => {};
}

export async function updateStudentStatus(studentId, status) {
  await new Promise((resolve) => setTimeout(resolve, demoConfig.behavior.simulatedLatency));
  console.log(`[DEMO MODE] Estado del estudiante ${studentId} actualizado a: ${status}`);
  return { success: true };
}
