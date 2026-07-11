// src/services/firebase/admin.js

import { db } from "@/lib/firebase";
import { collection, getDocs, doc, updateDoc, onSnapshot, query, where, serverTimestamp } from "firebase/firestore";

/**
 * Obtiene todos los estudiantes de la base de datos real.
 * @returns {Promise<array>}
 */
export async function getStudents() {
  const querySnapshot = await getDocs(collection(db, "students"));
  const students = [];
  querySnapshot.forEach((doc) => {
    students.push({ id: doc.id, ...doc.data() });
  });
  return students;
}

/**
 * Suscribe en tiempo real a la lista de estudiantes.
 */
export function subscribeStudentsList(callback) {
  return onSnapshot(collection(db, "students"), (snapshot) => {
    const list = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      list.push({ id: doc.id, studentId: data.studentId || doc.id, ...data });
    });
    callback(list);
  });
}

/**
 * Suscribe en tiempo real a todas las evaluaciones técnicas.
 */
export function subscribeAllEvaluations(callback) {
  return onSnapshot(collection(db, "evaluations"), (snapshot) => {
    const list = [];
    snapshot.forEach((doc) => {
      list.push({ id: doc.id, ...doc.data() });
    });
    callback(list);
  });
}

/**
 * Suscribe en tiempo real a todas las hojas de asistencia consolidadas.
 */
export function subscribeAllAttendance(callback) {
  return onSnapshot(collection(db, "attendance"), (snapshot) => {
    const list = [];
    snapshot.forEach((doc) => {
      list.push({ id: doc.id, ...doc.data() });
    });
    callback(list);
  });
}

/**
 * Actualiza la categoría del estudiante real.
 * @param {string} studentId
 * @param {string} category
 * @returns {Promise<{ success: boolean }>}
 */
export async function updateStudentCategory(studentId, category) {
  const docRef = doc(db, "students", studentId);
  await updateDoc(docRef, { category });
  return { success: true };
}

/**
 * Actualiza únicamente el estado administrativo del alumno.
 */
export async function updateStudentLifecycleStatus(studentId, status, context = {}) {
  const docRef = doc(db, "students", studentId);
  const patch = {
    status,
    updatedAt: serverTimestamp()
  };

  if (context.reason || context.reasonDetail) {
    patch.lifecycleReason = context.reason || "";
    patch.lifecycleReasonDetail = context.reasonDetail || "";
    patch.lifecycleUpdatedAt = serverTimestamp();
  }

  await updateDoc(docRef, patch);
  return { success: true };
}

async function countQuery(collectionName, field, value) {
  const q = query(collection(db, collectionName), where(field, "==", value));
  const snap = await getDocs(q);
  return snap.size;
}

/**
 * Revisa si un alumno tiene historial que impide su eliminación definitiva.
 */
export async function getStudentLifecycleHistory(student) {
  const studentId = student?.studentId || student?.id || "";
  const studentName = student?.name || "";
  if (!studentId) return { payments: 0, attendance: 0, evaluations: 0, total: 0 };

  const payments = await countQuery("payments", "studentId", studentId);
  const attendance = await countQuery("attendance", "studentId", studentId);
  const evaluationsById = await countQuery("evaluations", "studentId", studentId);
  const evaluationsByName = studentName ? await countQuery("evaluations", "studentName", studentName) : 0;
  const evaluations = Math.max(evaluationsById, evaluationsByName);

  return {
    payments,
    attendance,
    evaluations,
    total: payments + attendance + evaluations
  };
}

/**
 * Bloquea la eliminación física. La baja segura debe conservar el historial.
 */
export async function deleteEmptyStudent(student) {
  const studentId = student?.studentId || student?.id || "";
  if (!studentId) return { success: false, error: "studentId requerido" };

  const history = await getStudentLifecycleHistory(student);
  return {
    success: false,
    blocked: true,
    noPhysicalDelete: true,
    history
  };
}
