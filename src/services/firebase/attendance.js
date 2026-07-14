// src/services/firebase/attendance.js

import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, onSnapshot } from "firebase/firestore";
import { adminListenerStarted, adminListenerStopped, adminStep } from "@/lib/adminDiagnostics";

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
  adminListenerStarted("ADMIN_STEP_85_FIRESTORE_LISTENER_DRILLS_CREATED", { collection: "drills" });
  const unsubscribe = onSnapshot(ref, (snapshot) => {
    const list = [];
    snapshot.forEach((doc) => {
      list.push({ id: doc.id, ...doc.data() });
    });
    adminStep("ADMIN_STEP_86_FIRESTORE_LISTENER_DRILLS_SNAPSHOT", {
      docsCount: snapshot.size,
      mappedCount: list.length
    });
    callback(list);
  });
  return () => {
    adminListenerStopped("ADMIN_STEP_87_FIRESTORE_LISTENER_DRILLS_UNSUBSCRIBE", { collection: "drills" });
    unsubscribe();
  };
}
