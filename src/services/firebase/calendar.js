// src/services/firebase/calendar.js

import { db } from "@/lib/firebase";
import { collection, getDocs, onSnapshot, query, where, doc, updateDoc } from "firebase/firestore";
import { adminListenerStarted, adminListenerStopped, adminStep } from "@/lib/adminDiagnostics";

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

  adminListenerStarted("ADMIN_STEP_82_FIRESTORE_LISTENER_EVENTS_CREATED", { collection: "events", categoryName });
  const unsubscribe = onSnapshot(ref, (snapshot) => {
    const list = [];
    snapshot.forEach((doc) => {
      list.push({ id: doc.id, ...doc.data() });
    });
    // Ordenar cronológicamente
    list.sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
    adminStep("ADMIN_STEP_83_FIRESTORE_LISTENER_EVENTS_SNAPSHOT", {
      docsCount: snapshot.size,
      mappedCount: list.length
    });
    callback(list);
  });
  return () => {
    adminListenerStopped("ADMIN_STEP_84_FIRESTORE_LISTENER_EVENTS_UNSUBSCRIBE", { collection: "events", categoryName });
    unsubscribe();
  };
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
