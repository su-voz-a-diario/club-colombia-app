// src/services/firebase/admin.js

import { db } from "@/lib/firebase";
import { collection, getDocs, doc, updateDoc, onSnapshot } from "firebase/firestore";

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
