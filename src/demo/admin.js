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
