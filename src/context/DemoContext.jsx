"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { demoConfig } from "../demo/demoConfig";
import { getActiveDemoData } from "../demo/demoData";
import { validateDemoEnvironment } from "../demo/DemoValidator";

const DemoContext = createContext({
  isDemoActive: false,
  demoVersion: "",
  demoConfig: {},
  demoData: {}
});

export function DemoProvider({ children }) {
  const [isDemoActive, setIsDemoActive] = useState(false);
  const [demoData, setDemoData] = useState({});

  useEffect(() => {
    // 1. Resolver el estado activo según el orden de prioridad especificado
    let active = false;

    // A. Prioridad 1: Variable de Entorno
    if (process.env.NEXT_PUBLIC_DEMO_MODE === "true") {
      active = true;
    }

    // B. Prioridad 2: Solo en desarrollo, validar URL y LocalStorage
    if (process.env.NODE_ENV !== "production") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("demo") === "1" || params.get("demo") === "true") {
        active = true;
        localStorage.setItem("demo_active", "true");
      } else if (localStorage.getItem("demo_active") === "true") {
        active = true;
      }
    }

    // Si se forzó desactivación en desarrollo
    if (process.env.NODE_ENV !== "production") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("demo") === "0" || params.get("demo") === "false") {
        active = false;
        localStorage.removeItem("demo_active");
      }
    }

    // 2. Si está activo, validar el entorno estructural antes de inicializar
    if (active) {
      const validation = validateDemoEnvironment();
      if (!validation.isValid) {
        console.error("⚠️ DEMO MODE ABORTADO: La validación estructural falló. Iniciando en modo producción real.");
        active = false;
      } else {
        setDemoData(getActiveDemoData());
      }
    }

    setIsDemoActive(active);
  }, []);

  return (
    <DemoContext.Provider
      value={{
        isDemoActive,
        demoVersion: demoConfig.DEMO_VERSION,
        demoConfig,
        demoData
      }}
    >
      {children}
      
      {/* Banner / Indicador estético discreto y premium del Demo Mode */}
      {isDemoActive && (
        <div 
          className="fixed bottom-4 right-4 z-50 bg-[#0e121e]/90 border border-emerald-500/20 backdrop-blur-md px-3 py-1 rounded-full text-[8.5px] font-mono font-black uppercase text-emerald-450 tracking-widest shadow-2xl pointer-events-none select-none animate-pulse"
          style={{ contentVisibility: "auto" }}
        >
          DEMO v{demoConfig.DEMO_VERSION}
        </div>
      )}
    </DemoContext.Provider>
  );
}

export function useDemo() {
  return useContext(DemoContext);
}
