// src/demo/calendar.js

import { demoConfig } from "./demoConfig";

export async function getCalendarEvents() {
  await new Promise((resolve) => setTimeout(resolve, demoConfig.behavior.simulatedLatency));
  return [
    {
      id: "evt-1",
      title: "Entrenamiento Táctico",
      date: "2026-07-15",
      time: "16:00 - 17:30",
      location: "Cancha 3 - Principal",
      type: "practice",
      rsvps: { "Carlos Gomez": "confirmed", "Juan Perez": "confirmed" }
    },
    {
      id: "evt-2",
      title: "Partido vs Héroes FC",
      date: "2026-07-18",
      time: "09:00",
      location: "Sede Norte",
      type: "match",
      rsvps: { "Carlos Gomez": "confirmed" }
    }
  ];
}

export function subscribeCalendarEvents(categoryName, callback) {
  callback([
    {
      id: "evt-1",
      title: "Entrenamiento Táctico",
      date: "2026-07-15",
      time: "16:00 - 17:30",
      location: "Cancha 3 - Principal",
      type: "practice",
      rsvps: { "Carlos Gomez": "confirmed", "Juan Perez": "confirmed" }
    },
    {
      id: "evt-2",
      title: "Partido vs Héroes FC",
      date: "2026-07-18",
      time: "09:00",
      location: "Sede Norte",
      type: "match",
      rsvps: { "Carlos Gomez": "confirmed" }
    }
  ]);
  return () => {};
}

export async function updateRSVP(eventId, studentName, response) {
  await new Promise((resolve) => setTimeout(resolve, demoConfig.behavior.simulatedLatency));
  console.log(`[DEMO MODE] RSVP del estudiante ${studentName} para evento ${eventId}: ${response}`);
  return { success: true };
}
