// src/demo/notifications.js

import { demoConfig } from "./demoConfig";

/**
 * Obtiene la lista de anuncios oficiales simulados del club.
 * @returns {Promise<array>}
 */
export async function getClubAnnouncements() {
  await new Promise((resolve) => setTimeout(resolve, demoConfig.behavior.simulatedLatency));
  return [
    {
      id: "demo-ann-1",
      date: new Date().toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" }),
      text: `[DEMO MODE v${demoConfig.DEMO_VERSION}] Bienvenidos a la plataforma de demostración del ${demoConfig.branding.clubName}.`
    }
  ];
}
