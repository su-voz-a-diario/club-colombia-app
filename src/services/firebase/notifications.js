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
