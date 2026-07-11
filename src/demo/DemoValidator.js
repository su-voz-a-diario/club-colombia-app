// src/demo/DemoValidator.js

import { demoConfig } from "./demoConfig";
import { demoDatasets } from "./demoData";

/**
 * Valida la integridad estructural de la configuración y datos del Demo Mode.
 * @returns {{ isValid: boolean, errors: string[] }}
 */
export function validateDemoEnvironment() {
  const errors = [];

  // 1. Validar Versión
  if (!demoConfig.DEMO_VERSION) {
    errors.push("Falta la constante central DEMO_VERSION en demoConfig.");
  }

  // 2. Validar Escenario Activo
  const activeScenario = demoConfig.activeScenario;
  if (!activeScenario) {
    errors.push("Falta especificar el activeScenario en demoConfig.");
  } else if (!demoDatasets[activeScenario]) {
    errors.push(`El escenario configurado "${activeScenario}" no existe en demoDatasets.`);
  } else {
    // 3. Validar Estructura del Escenario Activo
    const data = demoDatasets[activeScenario];
    const requiredKeys = ["student", "parent", "coach", "attendance", "health", "payments", "performance"];
    
    requiredKeys.forEach((key) => {
      if (!data[key]) {
        errors.push(`El dataset del escenario "${activeScenario}" no contiene la sección requerida "${key}".`);
      }
    });

    // 4. Validar Coherencia de Personajes
    if (data.student && data.student.name !== demoConfig.characters.protagonist.name) {
      errors.push(`Inconsistencia: El nombre del estudiante en demoData ("${data.student.name}") no coincide con demoConfig ("${demoConfig.characters.protagonist.name}").`);
    }
  }

  // 5. Validar Recursos de Marca
  if (!demoConfig.branding || !demoConfig.branding.clubName) {
    errors.push("Falta la especificación de clubName en branding.");
  }

  const isValid = errors.length === 0;

  if (!isValid) {
    console.error("❌ ERROR CRÍTICO EN DEMO MODE VALIDATOR:", errors);
  } else {
    console.log(`✅ DEMO MODE VALIDATOR: Entorno validado con éxito. Versión ${demoConfig.DEMO_VERSION}`);
  }

  return {
    isValid,
    errors
  };
}
