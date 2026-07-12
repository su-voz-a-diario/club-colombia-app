// src/services/firebase/notifications.js

import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

/**
 * Obtiene la lista de anuncios oficiales reales.
 * @returns {Promise<array>}
 */
export async function getClubAnnouncements() {
  const docRef = doc(db, "settings", "announcements");
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    const data = docSnap.data();
    return [
      {
        id: "ann-notice",
        date: data.date ? new Date(data.date).toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" }) : "",
        text: data.notice || ""
      }
    ];
  }
  return [];
}

/**
 * Suscribe a los anuncios en tiempo real.
 */
export function subscribeToAnnouncements(callback) {
  const docRef = doc(db, "settings", "announcements");
  
  import("firebase/firestore").then(({ onSnapshot }) => {
    onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        callback([
          {
            id: "ann-notice",
            date: data.date ? new Date(data.date).toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" }) : "",
            text: data.notice || ""
          }
        ]);
      } else {
        callback([]);
      }
    });
  });

  return () => {}; // Simplicidad para evitar promise sync lock
}
