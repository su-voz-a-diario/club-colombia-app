// src/demo/demoConfig.js

export const demoConfig = {
  // Versión del Entorno Demo para rastreo y auditoría
  DEMO_VERSION: "1.1.0",

  // Escenario Activo: "landing" | "sales" | "training" | "videos" | "manuals"
  activeScenario: "landing",
  
  // Datos Generales de Marca del Club
  branding: {
    clubName: "Club Colombia FC",
    primaryColor: "emerald", // "emerald" | "amber" | "sky"
    logoPath: "/logo.png" // Apunta a la imagen de producción en public/
  },
  
  // Personajes y Contexto del Viaje Continuo
  characters: {
    protagonist: {
      name: "Mateo López Silva",
      category: "Sub-12",
      status: "Activo"
    },
    family: {
      fatherName: "Roberto López",
      phone: "+57 300 000 0000"
    },
    coach: {
      name: "Carlos Hernández"
    }
  },
  
  // Parámetros de Operación y Simulación
  behavior: {
    animationDuration: 250, // en ms
    simulatedLatency: 600,   // latencia en ms para simular escrituras en memoria
    autoValidatePayments: true
  }
};
