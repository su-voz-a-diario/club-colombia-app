"use client";

import React from "react";

export default function RadarPerformance({ metrics = { speed: 8, passing: 7, dribbling: 9, shooting: 8, physical: 8, discipline: 9 } }) {
  const categories = [
    { key: "speed", label: "Velocidad" },
    { key: "passing", label: "Pase" },
    { key: "dribbling", label: "Regate" },
    { key: "shooting", label: "Tiro" },
    { key: "physical", label: "Físico" },
    { key: "discipline", label: "Disciplina" }
  ];

  const size = 300;
  const center = size / 2;
  const radius = size * 0.35; // Radio máximo correspondiente a calificación 10

  // Puntos para el polígono de datos
  const getPoints = (data) => {
    return categories.map((cat, i) => {
      const val = (data[cat.key] || 0);
      const angle = (i * 2 * Math.PI) / 6 - Math.PI / 2; // Desfase -90 grados para empezar arriba
      const x = center + radius * (val / 10) * Math.cos(angle);
      const y = center + radius * (val / 10) * Math.sin(angle);
      return `${x},${y}`;
    }).join(" ");
  };

  // Puntos para las rejillas concéntricas de fondo (niveles 2, 4, 6, 8, 10)
  const gridLevels = [2, 4, 6, 8, 10];
  const gridPoints = gridLevels.map(level => {
    return categories.map((_, i) => {
      const angle = (i * 2 * Math.PI) / 6 - Math.PI / 2;
      const x = center + radius * (level / 10) * Math.cos(angle);
      const y = center + radius * (level / 10) * Math.sin(angle);
      return `${x},${y}`;
    }).join(" ");
  });

  // Coordenadas para las etiquetas de cada eje
  const getLabelCoords = (i) => {
    const angle = (i * 2 * Math.PI) / 6 - Math.PI / 2;
    const labelRadius = radius + 22; // Margen exterior
    const x = center + labelRadius * Math.cos(angle);
    const y = center + labelRadius * Math.sin(angle);
    
    let textAnchor = "middle";
    if (Math.cos(angle) > 0.1) textAnchor = "start";
    else if (Math.cos(angle) < -0.1) textAnchor = "end";
    
    return { x, y, textAnchor };
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 glass-card-premium rounded-3xl relative overflow-hidden group">
      {/* Decorative Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      
      <svg width={size} height={size} className="w-full max-w-[280px] drop-shadow-[0_0_15px_rgba(245,158,11,0.2)] animate-spin-slow">
        {/* Rejillas de fondo */}
        {gridPoints.map((points, idx) => (
          <polygon
            key={idx}
            points={points}
            fill="none"
            stroke="rgba(245, 158, 11, 0.15)"
            strokeWidth="1"
            strokeDasharray="2, 2"
          />
        ))}

        {/* Ejes */}
        {categories.map((_, i) => {
          const angle = (i * 2 * Math.PI) / 6 - Math.PI / 2;
          const x = center + radius * Math.cos(angle);
          const y = center + radius * Math.sin(angle);
          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={x}
              y2={y}
              stroke="rgba(245, 158, 11, 0.2)"
              strokeWidth="1"
            />
          );
        })}

        {/* Polígono de Rendimiento */}
        <polygon
          points={getPoints(metrics)}
          fill="url(#goldGradient)"
          stroke="#f59e0b"
          strokeWidth="3"
          className="transition-all duration-1000 ease-out"
        />

        {/* Definición de Gradiente para el Polígono */}
        <defs>
          <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(245, 158, 11, 0.4)" />
            <stop offset="100%" stopColor="rgba(217, 119, 6, 0.1)" />
          </linearGradient>
        </defs>

        {/* Puntos / Marcadores */}
        {categories.map((cat, i) => {
          const val = metrics[cat.key] || 0;
          const angle = (i * 2 * Math.PI) / 6 - Math.PI / 2;
          const cx = center + radius * (val / 10) * Math.cos(angle);
          const cy = center + radius * (val / 10) * Math.sin(angle);
          return (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r="4.5"
              fill="#fbbf24"
              stroke="#0f172a"
              strokeWidth="1.5"
              className="transition-all duration-1000 ease-out"
              style={{ filter: "drop-shadow(0 0 4px rgba(251,191,36,0.8))" }}
            />
          );
        })}

        {/* Etiquetas - Corregimos la rotación para que el texto sea legible pese al grid que rota */}
        {categories.map((cat, i) => {
          const { x, y, textAnchor } = getLabelCoords(i);
          return (
            <text
              key={i}
              x={x}
              y={y}
              textAnchor={textAnchor}
              alignmentBaseline="middle"
              className="text-[9px] font-black uppercase tracking-widest"
              fill="#94a3b8"
              // Invertimos la rotación lenta localmente
              style={{ animation: "spin-slow 20s linear infinite reverse", transformOrigin: `${x}px ${y}px` }}
            >
              {cat.label}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
