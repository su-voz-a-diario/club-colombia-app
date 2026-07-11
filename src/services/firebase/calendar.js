// src/services/firebase/calendar.js

import { db } from "@/lib/firebase";
import { collection, getDocs, onSnapshot, query, where, doc, updateDoc } from "firebase/firestore";

/**
 * Obtiene los eventos del calendario real.
 */
export async function getCalendarEvents() {
  const querySnapshot = await getDocs(collection(db, "events"));
  const events = [];
  querySnapshot.forEach((doc) => {
    events.push({ id: doc.id, ...doc.data() });
  });
  return events;
}

/**
 * Suscribe en tiempo real a los eventos del calendario, opcionalmente filtrados por categoría.
 */
export function subscribeCalendarEvents(categoryName, callback) {
  const ref = (categoryName && categoryName !== "all")
    ? query(collection(db, "events"), where("category", "==", categoryName))
    : collection(db, "events");

  return onSnapshot(ref, (snapshot) => {
    const list = [];
    snapshot.forEach((doc) => {
      list.push({ id: doc.id, ...doc.data() });
    });
    // Ordenar cronológicamente
    list.sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
    callback(list);
  });
}

/**
 * Actualiza la confirmación RSVP de un evento real.
 */
export async function updateRSVP(eventId, studentName, response) {
  if (!eventId || !studentName) return { success: false };
  const docRef = doc(db, "events", eventId);
  await updateDoc(docRef, {
    [`rsvps.${studentName}`]: response
  });
  return { success: true };
}
