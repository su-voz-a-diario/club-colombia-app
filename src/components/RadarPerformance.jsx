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
    <div className="flex flex-col items-center justify-center p-2 bg-[#0e121e]/50 border border-slate-800/60 rounded-2xl">
      <svg width={size} height={size} className="w-full max-w-[280px]">
        {/* Rejillas de fondo */}
        {gridPoints.map((points, idx) => (
          <polygon
            key={idx}
            points={points}
            fill="none"
            stroke="rgba(148, 163, 184, 0.12)"
            strokeWidth="1"
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
              stroke="rgba(148, 163, 184, 0.2)"
              strokeWidth="1"
            />
          );
        })}

        {/* Polígono de Rendimiento */}
        <polygon
          points={getPoints(metrics)}
          fill="rgba(16, 185, 129, 0.18)"
          stroke="#10b981"
          strokeWidth="2.5"
          className="transition-all duration-500 ease-out"
        />

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
              fill="#d97706"
              stroke="#07090e"
              strokeWidth="1.5"
            />
          );
        })}

        {/* Textos de Categoría */}
        {categories.map((cat, i) => {
          const { x, y, textAnchor } = getLabelCoords(i);
          const val = metrics[cat.key] || 0;
          return (
            <text
              key={i}
              x={x}
              y={y}
              textAnchor={textAnchor}
              className="text-[11px] font-sans font-semibold fill-slate-300"
              dominantBaseline="middle"
            >
              {cat.label} <tspan fill="#10b981">{val}</tspan>
            </text>
          );
        })}
      </svg>
    </div>
  );
}
