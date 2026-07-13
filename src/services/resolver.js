// src/services/resolver.js

/**
 * Determina de forma síncrona si el Demo Mode está activo.
 * @returns {boolean}
 */
export function isDemoActive() {
  // A. Prioridad 1: Variable de Entorno (Evaluada tanto en Servidor como en Cliente)
  if (process.env.NEXT_PUBLIC_DEMO_MODE === "true") {
    return true;
  }

  // B. Prioridad 2: Solo en Cliente (Navegador) y entorno que no sea producción
  if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
    const params = new URLSearchParams(window.location.search);
    if (params.get("demo") === "1" || params.get("demo") === "true") {
      return true;
    }
    if (localStorage.getItem("demo_active") === "true") {
      return true;
    }
  }

  // C. Prioridad 3: Master Key (Bypass de producción)
  if (typeof window !== "undefined" && localStorage.getItem("constructor_master_key") === "granted") {
    return true;
  }

  return false;
}
