// src/services/firebase/payments.js

import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, addDoc, onSnapshot, serverTimestamp } from "firebase/firestore";

/**
 * Obtiene el historial de facturación real.
 */
export async function getPaymentsHistory(studentId) {
  if (!studentId) return [];
  const q = query(collection(db, "payments"), where("studentId", "==", studentId));
  const querySnapshot = await getDocs(q);
  const payments = [];
  querySnapshot.forEach((doc) => {
    payments.push({ id: doc.id, ...doc.data() });
  });
  return payments;
}

/**
 * Suscribe en tiempo real al historial de pagos.
 */
export function subscribePayments(parentUid, parentEmail, callback) {
  if (!parentUid && !parentEmail) {
    callback([]);
    return () => {};
  }
  const q = parentUid
    ? query(collection(db, "payments"), where("parentUid", "==", parentUid))
    : query(collection(db, "payments"), where("parentEmail", "==", parentEmail.toLowerCase()));

  return onSnapshot(q, (snapshot) => {
    const list = [];
    snapshot.forEach((doc) => {
      list.push({ id: doc.id, ...doc.data() });
    });
    callback(list);
  });
}

/**
 * Reporta un comprobante bancario real en Firestore.
 */
export async function reportPayment(studentId, paymentData) {
  await addDoc(collection(db, "payments"), {
    studentId: studentId || "",
    studentName: paymentData.studentName || "",
    categoryName: paymentData.categoryName || "",
    amount: paymentData.amount || 0,
    paymentType: paymentData.paymentType || "",
    date: new Date().toLocaleDateString("es-MX") + " " + new Date().toLocaleTimeString("es-MX", { hour: '2-digit', minute: '2-digit' }),
    status: "pending",
    parentEmail: paymentData.parentEmail || "",
    parentUid: paymentData.parentUid || "",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  return { success: true };
}
