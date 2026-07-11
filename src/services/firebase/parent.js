// src/services/firebase/parent.js

import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, onSnapshot } from "firebase/firestore";

/**
 * Obtiene el perfil del padre de familia real.
 */
export async function getParentProfile(uid) {
  if (!uid) return null;
  const docRef = doc(db, "users", uid);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { uid, ...docSnap.data() };
  }
  return null;
}

/**
 * Escucha en tiempo real el perfil del usuario.
 */
export function subscribeParentProfile(uid, callback) {
  if (!uid) {
    callback(null);
    return () => {};
  }
  const docRef = doc(db, "users", uid);
  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      callback({ uid, ...docSnap.data() });
    } else {
      callback(null);
    }
  });
}

/**
 * Actualiza el número de teléfono del padre de familia real.
 */
export async function updateParentPhone(uid, phone) {
  if (!uid) return { success: false };
  const docRef = doc(db, "users", uid);
  await updateDoc(docRef, { phone });
  return { success: true };
}

/**
 * Actualiza el estado administrativo del padre de familia.
 */
export async function updateParentStatus(uid, status) {
  if (!uid) return { success: false };
  const docRef = doc(db, "users", uid);
  await updateDoc(docRef, { status });
  return { success: true };
}
