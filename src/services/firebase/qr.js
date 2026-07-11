// src/services/firebase/qr.js

import { db } from "@/lib/firebase";
import { doc, getDoc, onSnapshot, query, collection, where, updateDoc, serverTimestamp } from "firebase/firestore";

/**
 * Obtiene la credencial QR del alumno real.
 */
export async function getStudentQR(studentId) {
  if (!studentId) return null;
  const docRef = doc(db, "students", studentId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    const data = docSnap.data();
    return {
      studentId,
      qrValue: data.qrCode || `STUDENT_${studentId}`,
      status: data.status || "Activo"
    };
  }
  return null;
}

/**
 * Suscribe en tiempo real la información de la credencial QR y perfil del estudiante.
 */
export function subscribeStudentQR(studentId, studentName, callback) {
  if (studentId) {
    const docRef = doc(db, "students", studentId);
    return onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        callback({
          studentId,
          id: studentId,
          name: data.name || "",
          category: data.category || "",
          status: data.status || "",
          healthStatus: data.healthStatus || "",
          qrValue: data.qrCode || `STUDENT_${studentId}`,
          ...data
        });
      } else {
        callback(null);
      }
    });
  } else if (studentName) {
    const q = query(collection(db, "students"), where("name", "==", studentName));
    return onSnapshot(q, (snapshot) => {
      if (snapshot.docs.length > 0) {
        const docSnap = snapshot.docs[0];
        const data = docSnap.data();
        callback({
          studentId: docSnap.id,
          id: docSnap.id,
          name: data.name || "",
          category: data.category || "",
          status: data.status || "",
          healthStatus: data.healthStatus || "",
          qrValue: data.qrCode || `STUDENT_${docSnap.id}`,
          ...data
        });
      } else {
        callback(null);
      }
    });
  }
  callback(null);
  return () => {};
}

/**
 * Actualiza el estatus del estudiante real.
 */
export async function updateStudentStatus(studentId, status) {
  if (!studentId) return { success: false };
  const docRef = doc(db, "students", studentId);
  await updateDoc(docRef, {
    status,
    billingStatus: status,
    dueDays: 0,
    updatedAt: serverTimestamp()
  });
  return { success: true };
}
