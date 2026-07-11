// src/demo/demoData.js

import { demoConfig } from "./demoConfig";

// Datasets completos para cada escenario
export const demoDatasets = {
  // ESCENARIO 1: LANDING PAGE (Dedicado a la fluidez del onboarding y capturas básicas)
  landing: {
    student: {
      id: "demo-mateo",
      name: demoConfig.characters.protagonist.name,
      category: demoConfig.characters.protagonist.category,
      status: demoConfig.characters.protagonist.status,
      avatar: "",
      qrCode: "ACTIVE_MATEO_LOPEZ_SUB12_AUTHORIZED"
    },
    parent: {
      id: "demo-roberto",
      name: demoConfig.characters.family.fatherName,
      phone: demoConfig.characters.family.phone,
      email: "roberto.lopez@demo.com"
    },
    coach: {
      id: "demo-carlos",
      name: demoConfig.characters.coach.name,
      phone: "+57 311 111 2222"
    },
    attendance: [
      { date: "2026-07-11", time: "16:02", status: "Presente", coach: demoConfig.characters.coach.name },
      { date: "2026-07-09", time: "15:58", status: "Presente", coach: demoConfig.characters.coach.name },
      { date: "2026-07-07", time: "16:01", status: "Presente", coach: demoConfig.characters.coach.name }
    ],
    health: {
      status: "Óptimo",
      notes: "Jugador en condiciones óptimas. Listo al 100% para la acción y la planificación táctica de la semana.",
      metrics: {
        stamina: 9,
        fatigue: "Ninguna",
        lastChecked: "11 de julio, 15:45"
      }
    },
    payments: [
      { id: "pay-july", month: "Julio 2026", amount: 1200, status: "Validado", date: "2026-07-05" },
      { id: "pay-june", month: "Junio 2026", amount: 1200, status: "Validado", date: "2026-06-03" }
    ],
    performance: {
      speed: 9,
      passing: 8,
      dribbling: 8,
      physical: 9,
      shooting: 7,
      discipline: 10,
      coachNotes: "Excelente actitud en los entrenamientos. Mateo ha mejorado mucho su perfil de pase interior."
    }
  },

  // ESCENARIO 2: PRESENTACIÓN COMERCIAL (Listo para demostrar flujos de morosidad y cobro)
  sales: {
    student: {
      id: "demo-mateo-sales",
      name: demoConfig.characters.protagonist.name,
      category: demoConfig.characters.protagonist.category,
      status: "Mora",
      avatar: "",
      qrCode: "BLOCKED_MATEO_LOPEZ_SUB12_MORA"
    },
    parent: {
      id: "demo-roberto-sales",
      name: demoConfig.characters.family.fatherName,
      phone: demoConfig.characters.family.phone,
      email: "roberto.lopez@demo.com"
    },
    coach: {
      id: "demo-carlos-sales",
      name: demoConfig.characters.coach.name,
      phone: "+57 311 111 2222"
    },
    attendance: [
      { date: "2026-07-11", time: "16:02", status: "Restringido", coach: demoConfig.characters.coach.name },
      { date: "2026-07-09", time: "15:58", status: "Presente", coach: demoConfig.characters.coach.name }
    ],
    health: {
      status: "Fatiga",
      notes: "Presenta fatiga muscular leve en abductor derecho. Reposo activo recomendado.",
      metrics: {
        stamina: 7,
        fatigue: "Moderada",
        lastChecked: "11 de julio, 15:45"
      }
    },
    payments: [
      { id: "pay-july-sales", month: "Julio 2026", amount: 1200, status: "Por Validar", date: "2026-07-10" },
      { id: "pay-june-sales", month: "Junio 2026", amount: 1200, status: "Validado", date: "2026-06-03" }
    ],
    performance: {
      speed: 8,
      passing: 8,
      dribbling: 7,
      physical: 7,
      shooting: 7,
      discipline: 9,
      coachNotes: "Se recomienda reducir carga de juego para prevenir contracturas."
    }
  }
};

// Selector dinámico del dataset según el escenario de configuración
export function getActiveDemoData() {
  const scenario = demoConfig.activeScenario || "landing";
  return demoDatasets[scenario] || demoDatasets.landing;
}
