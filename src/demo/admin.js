// src/demo/admin.js

import { getActiveDemoData } from "./demoData";
import { demoConfig } from "./demoConfig";

/**
 * Obtiene todos los estudiantes de demostración.
 * @returns {Promise<array>}
 */
export async function getStudents() {
  await new Promise((resolve) => setTimeout(resolve, demoConfig.behavior.simulatedLatency));
  const data = getActiveDemoData();
  return data.students;
}

/**
 * Suscribe en tiempo real a la lista de estudiantes.
 */
export function subscribeStudentsList(callback) {
  const data = getActiveDemoData();
  callback(data.students);
  return () => {};
}

/**
 * Suscribe en tiempo real a todas las evaluaciones técnicas.
 */
export function subscribeAllEvaluations(callback) {
  const data = getActiveDemoData();
  // Generar evaluaciones mock asociadas a los estudiantes de demostración
  const evals = data.students.map((student, index) => ({
    id: `demo-eval-${index}`,
    studentName: student.name,
    metrics: student.status === "active" ? data.performance : { ...data.performance, speed: 5 },
    tacticalNotes: data.performance.coachNotes,
    date: "10/07/2026",
    timestamp: "2026-07-10T16:00:00Z"
  }));
  callback(evals);
  return () => {};
}

/**
 * Suscribe en tiempo real a todas las hojas de asistencia consolidadas.
 */
export function subscribeAllAttendance(callback) {
  const data = getActiveDemoData();
  // Generar asistencias mock asociadas a los estudiantes de demostración
  callback([
    {
      id: "demo-attendance-sheet-1",
      date: "11/07/2026",
      records: data.students.map(student => ({
        name: student.name,
        status: student.status === "active" ? "P" : "F"
      })),
      timestamp: "2026-07-11T16:00:00Z"
    }
  ]);
  return () => {};
}

/**
 * Actualiza la categoría del estudiante de demostración.
 * @param {string} studentId
 * @param {string} category
 * @returns {Promise<{ success: boolean }>}
 */
export async function updateStudentCategory(studentId, category) {
  await new Promise((resolve) => setTimeout(resolve, demoConfig.behavior.simulatedLatency));
  console.log(`[DEMO MODE] Categoría del estudiante ${studentId} actualizada a: ${category}`);
  return { success: true };
}

export async function updateStudentLifecycleStatus(studentId, status, context = {}) {
  await new Promise((resolve) => setTimeout(resolve, demoConfig.behavior.simulatedLatency));
  console.log(`[DEMO MODE] Estado del estudiante ${studentId} actualizado a: ${status}`, context);
  return { success: true };
}

export async function getStudentLifecycleHistory(student) {
  await new Promise((resolve) => setTimeout(resolve, demoConfig.behavior.simulatedLatency));
  const hasHistory = student?.status === "active";
  return {
    payments: hasHistory ? 2 : 0,
    attendance: hasHistory ? 1 : 0,
    evaluations: hasHistory ? 1 : 0,
    total: hasHistory ? 4 : 0
  };
}

export async function deleteEmptyStudent(student) {
  await new Promise((resolve) => setTimeout(resolve, demoConfig.behavior.simulatedLatency));
  const history = await getStudentLifecycleHistory(student);
  return {
    success: false,
    blocked: true,
    noPhysicalDelete: true,
    history
  };
}

export async function createEvent(eventData) {
  await new Promise((resolve) => setTimeout(resolve, demoConfig.behavior.simulatedLatency));
  console.log(`[DEMO MODE] Evento creado:`, eventData);
  const eventId = eventData.title ? eventData.title.toLowerCase().replace(/[^a-z0-9]/g, "-") : "demo-event";
  return { success: true, eventId };
}

export async function deleteEvent(eventId) {
  await new Promise((resolve) => setTimeout(resolve, demoConfig.behavior.simulatedLatency));
  console.log(`[DEMO MODE] Evento eliminado: ${eventId}`);
  return { success: true };
}

export async function sendAnnouncement(text) {
  await new Promise((resolve) => setTimeout(resolve, demoConfig.behavior.simulatedLatency));
  console.log(`[DEMO MODE] Comunicado enviado: ${text}`);
  if (typeof window !== "undefined") {
    localStorage.setItem("adminNotice", text);
    // Para que los listeners locales se actualicen (simulación simple)
    window.dispatchEvent(new Event("storage"));
  }
  return { success: true };
}

export async function deleteAnnouncement() {
  await new Promise((resolve) => setTimeout(resolve, demoConfig.behavior.simulatedLatency));
  console.log("[DEMO MODE] Comunicado eliminado");
  if (typeof window !== "undefined") {
    localStorage.removeItem("adminNotice");
    window.dispatchEvent(new Event("storage"));
  }
  return { success: true };
}

export async function saveDrill(drillData, drillId = null) {
  await new Promise((resolve) => setTimeout(resolve, demoConfig.behavior.simulatedLatency));
  console.log(`[DEMO MODE] Drill guardado:`, drillData);
  const finalId = drillId || (drillData.title ? drillData.title.toLowerCase().replace(/[^a-z0-9]/g, "-") : "demo-drill");
  return { success: true, drillId: finalId };
}

export async function deleteDrill(drillId) {
  await new Promise((resolve) => setTimeout(resolve, demoConfig.behavior.simulatedLatency));
  console.log(`[DEMO MODE] Drill eliminado: ${drillId}`);
  return { success: true };
}

export async function updateParentPhone(parentUid, oldPhone, newPhone) {
  await new Promise((resolve) => setTimeout(resolve, demoConfig.behavior.simulatedLatency));
  console.log(`[DEMO MODE] Teléfono de acudiente actualizado de ${oldPhone} a ${newPhone}`);
  
  if (!newPhone) {
    throw new Error("El nuevo número de teléfono es obligatorio.");
  }
  
  // Normalización simulada sencilla (para demo, agregar +52 si no lo tiene)
  const normalizedPhone = newPhone.startsWith("+") ? newPhone : `+52${newPhone.replace(/\D/g, "")}`;
  
  return { success: true, phone: normalizedPhone, registered: !!parentUid };
}

export async function manualRegisterStudent(studentData, manualPaidCash, manualPaymentConcept) {
  await new Promise((resolve) => setTimeout(resolve, demoConfig.behavior.simulatedLatency));
  console.log(`[DEMO MODE] Estudiante registrado manualmente:`, studentData);
  return { success: true, studentId: `demo_student_${Date.now()}` };
}

export async function applyCategoryOverride(studentId, newCategoryData) {
  await new Promise((resolve) => setTimeout(resolve, demoConfig.behavior.simulatedLatency));
  console.log(`[DEMO MODE] Override aplicado a ${studentId}:`, newCategoryData);
  return { success: true };
}

export async function confirmManualPayment(studentIdOrName) {
  await new Promise((resolve) => setTimeout(resolve, demoConfig.behavior.simulatedLatency));
  console.log(`[DEMO MODE] Pago confirmado manualmente para: ${studentIdOrName}`);
  return { success: true };
}

export function subscribePendingPayments(callback) {
  console.log(`[DEMO MODE] Suscribiendo a pagos pendientes...`);
  const initialPays = [
    {
      id: "demo_payment_1",
      studentId: "123",
      studentName: "Juan Pérez (Demo)",
      categoryName: "Sub-10 Competitivo",
      amount: 300,
      paymentType: "Transferencia",
      date: new Date().toLocaleDateString("es-CO"),
      status: "pending"
    }
  ];
  callback(initialPays);
  return () => {
    console.log(`[DEMO MODE] Desuscrito de pagos pendientes.`);
  };
}

export async function approvePayment(paymentId) {
  await new Promise((resolve) => setTimeout(resolve, demoConfig.behavior.simulatedLatency));
  console.log(`[DEMO MODE] Pago ${paymentId} aprobado.`);
  return { success: true };
}

export async function holdPayment(paymentId, studentIdOrName) {
  await new Promise((resolve) => setTimeout(resolve, demoConfig.behavior.simulatedLatency));
  console.log(`[DEMO MODE] Pago ${paymentId} puesto en espera para ${studentIdOrName}.`);
  return { success: true };
}

export async function processSuspensions() {
  await new Promise((resolve) => setTimeout(resolve, demoConfig.behavior.simulatedLatency));
  console.log(`[DEMO MODE] Mora auditada. Avisos enviados a estudiantes suspendidos.`);
  return { success: true, count: 2 };
}
