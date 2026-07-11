// src/demo/parent.js

import { getActiveDemoData } from "./demoData";
import { demoConfig } from "./demoConfig";

export async function getParentProfile(uid) {
  await new Promise((resolve) => setTimeout(resolve, demoConfig.behavior.simulatedLatency));
  const data = getActiveDemoData();
  return {
    uid: uid || data.parent.id,
    name: data.parent.name,
    displayName: data.parent.name,
    phone: data.parent.phone,
    email: data.parent.email,
    studentId: data.student.id,
    studentIds: [data.student.id],
    studentName: data.student.name,
    categoryName: data.student.category,
    status: data.student.status
  };
}

export function subscribeParentProfile(uid, callback) {
  const data = getActiveDemoData();
  // Retornar datos de demostración inmediatamente
  callback({
    uid: uid || data.parent.id,
    name: data.parent.name,
    displayName: data.parent.name,
    phone: data.parent.phone,
    email: data.parent.email,
    studentId: data.student.id,
    studentIds: [data.student.id],
    studentName: data.student.name,
    categoryName: data.student.category,
    status: data.student.status
  });
  return () => {};
}

export async function updateParentPhone(uid, phone) {
  await new Promise((resolve) => setTimeout(resolve, demoConfig.behavior.simulatedLatency));
  console.log(`[DEMO MODE] Teléfono del padre actualizado simuladamente a: ${phone}`);
  return { success: true };
}

export async function updateParentStatus(uid, status) {
  await new Promise((resolve) => setTimeout(resolve, demoConfig.behavior.simulatedLatency));
  console.log(`[DEMO MODE] Estatus del padre actualizado a: ${status}`);
  return { success: true };
}
