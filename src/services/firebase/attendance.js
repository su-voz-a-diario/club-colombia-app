// src/services/firebase/attendance.js

import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, onSnapshot } from "firebase/firestore";

/**
 * Obtiene el historial de asistencia real del estudiante.
 */
export async function getAttendanceHistory(studentId) {
  if (!studentId) return [];
  const q = query(collection(db, "attendance"), where("studentId", "==", studentId));
  const querySnapshot = await getDocs(q);
  const attendance = [];
  querySnapshot.forEach((doc) => {
    attendance.push({ id: doc.id, ...doc.data() });
  });
  return attendance;
}

/**
 * Suscribe en tiempo real al historial de asistencia.
 */
export function subscribeAttendanceHistory(studentId, callback) {
  if (!studentId) {
    callback([]);
    return () => {};
  }
  const q = query(collection(db, "attendance"), where("studentId", "==", studentId));
  return onSnapshot(q, (snapshot) => {
    const list = [];
    snapshot.forEach((doc) => {
      list.push({ id: doc.id, ...doc.data() });
    });
    callback(list);
  });
}

/**
 * Suscribe en tiempo real a las evaluaciones de rendimiento.
 */
export function subscribeEvaluations(studentName, callback) {
  if (!studentName) {
    callback([]);
    return () => {};
  }
  const q = query(collection(db, "evaluations"), where("studentName", "==", studentName));
  return onSnapshot(q, (snapshot) => {
    const list = [];
    snapshot.forEach((doc) => {
      list.push({ id: doc.id, ...doc.data() });
    });
    // Ordenar cronológicamente
    list.sort((a, b) => {
      const tA = a.timestamp || "";
      const tB = b.timestamp || "";
      return tA.localeCompare(tB);
    });
    callback(list);
  });
}

/**
 * Suscribe en tiempo real a la biblioteca de ejercicios (Drills).
 */
export function subscribeDrills(callback) {
  const ref = collection(db, "drills");
  return onSnapshot(ref, (snapshot) => {
    const list = [];
    snapshot.forEach((doc) => {
      list.push({ id: doc.id, ...doc.data() });
    });
    callback(list);
  });
}
