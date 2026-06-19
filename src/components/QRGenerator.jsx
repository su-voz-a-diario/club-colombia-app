"use client";

import React, { useState, useEffect } from "react";
import { CheckCircle, AlertTriangle, ShieldCheck, Clock } from "lucide-react";

export default function QRGenerator({ studentName = "Atleta de Prueba", status = "active", token = "CC-2026-9981" }) {
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    setAnimated(true);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-[#0e121e] border border-slate-800 rounded-3xl w-full max-w-[300px] relative overflow-hidden shadow-2xl font-sans">
      {/* Glow de fondo dinámico */}
      <div className={`absolute -top-24 -left-24 w-48 h-48 rounded-full filter blur-[80px] opacity-20 transition-all duration-1000 ${
        status === "active" ? "bg-emerald-500" : status === "pending_validation" ? "bg-amber-500" : "bg-red-500"
      }`} />
      
      {/* Cabecera de la Credencial */}
      <div className="flex items-center justify-between w-full mb-6 z-10">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-[#10b981]" />
          <span className="font-display font-bold text-[10px] uppercase tracking-widest text-slate-400">Club Colombia</span>
        </div>
        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider ${
          status === "active" 
            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
            : status === "pending_validation"
              ? "bg-amber-500/10 text-amber-500 border border-amber-500/20 animate-pulse"
              : "bg-red-500/10 text-red-400 border border-red-500/20"
        }`}>
          {status === "active" ? (
            <>
              <CheckCircle className="w-3.5 h-3.5" />
              Activo
            </>
          ) : status === "pending_validation" ? (
            <>
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              Verificando
            </>
          ) : (
            <>
              <AlertTriangle className="w-3.5 h-3.5" />
              Mora / QR Bloqueado
            </>
          )}
        </div>
      </div>

      {/* Contenedor del Código QR */}
      <div className="relative p-4 bg-white rounded-2xl z-10 shadow-lg">
        {/* Esquinas decorativas del escáner */}
        <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-slate-900 -m-1" />
        <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-slate-900 -m-1" />
        <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-slate-900 -m-1" />
        <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-slate-900 -m-1" />

        {/* QR Vectorial Diseñado a medida */}
        <svg width="150" height="150" viewBox="0 0 29 29" shapeRendering="crispEdges" className="text-slate-900 fill-current">
          {/* Marcador Superior Izquierda */}
          <path d="M0 0h7v7H0zm1 1v5h5V1zm1 1h3v3H2z" />
          {/* Marcador Superior Derecha */}
          <path d="M22 0h7v7H22zm1 1v5h5V1zm1 1h3v3H24z" />
          {/* Marcador Inferior Izquierda */}
          <path d="M0 22h7v7H0zm1 1v5h5v-5zm1 1h3v3H2z" />
          {/* Patrón de alineación */}
          <path d="M22 22h5v5H22zm1 1v3h3V23zm1 1h1v1h-1z" />
          {/* Líneas de sincronización */}
          <path d="M8 6h14v1H8zm-2 2v14h1V8z" />
          {/* Patrón pseudo-aleatorio */}
          <path d="M9 9h2v1H9zm4 0h1v2h-1zm3 0h2v1h-2zm4 0h1v1h-1zm-10 2h1v1h-1zm3 0h2v1h-2zm3 0h1v2h-1zm3 0h1v1h-1zm-9 2h2v1H9zm3 0h1v1h-1zm2 0h2v1h-2zm3 0h2v1H16zm-7 2h1v2H9zm3 0h2v1H-2zm3 0h1v1h-1zm2 0h1v2h-1zm-6 2h1v1h-1zm3 0h2v1H12zm4 0h3v1h-3zm-6 2h2v1H10zm3 0h1v1h-1zm2 0h2v1h-2zm3 0h1v1h-1zm-9 2h1v1H9zm2 0h3v1h-3zm4 0h1v1H16zm2 0h2v1h-2z" />
          <path d="M9 19h1v1H9zm2 0h2v1h-2zm4 0h1v1h-1zm2 0h2v1h-2zm-7 2h3v1h-3zm5 0h1v1h-1zm2 0h1v1H19z" />
          {/* Espacio en blanco y escudo en el centro */}
          <rect x="12" y="12" width="5" height="5" fill="white" />
          <path d="M13.5 13.5h2v2h-2z" fill={status === "active" ? "#10b981" : status === "pending_validation" ? "#f59e0b" : "#ef4444"} />
        </svg>

        {/* Láser de escaneo animado en verde activo */}
        {status === "active" && (
          <div className="absolute left-0 right-0 h-0.5 bg-emerald-500 shadow-[0_0_6px_#10b981] animate-[bounce_2s_infinite] top-4 pointer-events-none" />
        )}
        
        {/* Láser de verificación en amarillo/naranja */}
        {status === "pending_validation" && (
          <div className="absolute left-0 right-0 h-0.5 bg-amber-500 shadow-[0_0_6px_#f59e0b] animate-pulse top-1/2 -translate-y-1/2 pointer-events-none" />
        )}
      </div>

      {/* Datos del Atleta */}
      <div className="text-center mt-5 z-10 w-full">
        <h3 className="font-display font-bold text-sm text-slate-100 truncate">{studentName}</h3>
        <p className="text-[10px] text-slate-500 font-mono mt-0.5 tracking-wider">{token}</p>
        
        {status === "suspended" && (
          <p className="text-[10px] text-red-400 font-semibold mt-3 animate-pulse bg-red-500/10 py-1 px-2 rounded-lg border border-red-500/20">
            INGRESO NEGADO: PAGO MOROSO
          </p>
        )}

        {status === "pending_validation" && (
          <p className="text-[10px] text-amber-500 font-semibold mt-3 animate-pulse bg-amber-500/10 py-1.5 px-2.5 rounded-lg border border-amber-500/20 leading-tight">
            VALIDACIÓN DE PAGO PENDIENTE
          </p>
        )}
      </div>
    </div>
  );
}
