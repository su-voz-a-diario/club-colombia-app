"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Temas de color para cada tipo de panel (Control de Acceso, Deportes, Administración).
 */
const THEME_MAP = {
  emerald: {
    text: "text-emerald-400",
    bg: "bg-emerald-500",
    bgHover: "hover:bg-emerald-600",
    border: "border-emerald-500/30",
    badgeBg: "bg-emerald-500/10",
    badgeText: "text-emerald-400",
    shadow: "shadow-emerald-500/20",
    glow: "bg-emerald-500/5",
  },
  amber: {
    text: "text-amber-500",
    bg: "bg-amber-500",
    bgHover: "hover:bg-amber-600",
    border: "border-amber-500/30",
    badgeBg: "bg-amber-500/10",
    badgeText: "text-amber-500",
    shadow: "shadow-amber-500/20",
    glow: "bg-amber-500/5",
  },
  sky: {
    text: "text-sky-400",
    bg: "bg-sky-500",
    bgHover: "hover:bg-sky-600",
    border: "border-sky-500/30",
    badgeBg: "bg-sky-500/10",
    badgeText: "text-sky-400",
    shadow: "shadow-sky-500/20",
    glow: "bg-sky-500/5",
  },
};
export default function FeatureTourModal({
  isOpen,
  onClose,
  title = "Detalle del Módulo",
  accentColor = "emerald",
  steps = [],
  onComplete,
  initialStep = 0,
}) {
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [direction, setDirection] = useState(0); // -1: atrás, 1: adelante

  // Efecto para reiniciar el step cuando se abre con uno diferente
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(initialStep);
      setDirection(0);
    }
  }, [isOpen, initialStep]);

  const theme = THEME_MAP[accentColor] || THEME_MAP.emerald;
  const modalRef = useRef(null);
  const previousActiveElement = useRef(null);

  // 1. Precarga de Imágenes para la Siguiente Diapositiva
  useEffect(() => {
    if (!isOpen || steps.length === 0) return;

    const nextIndex = currentStep + 1;
    if (nextIndex < steps.length) {
      const nextStep = steps[nextIndex];
      if (nextStep?.type === "image" && nextStep?.imageSrc) {
        const img = new Image();
        img.src = nextStep.imageSrc;
      }
    }
  }, [currentStep, steps, isOpen]);

  // 2. Focus Trap (Trampa de Enfoque) y Teclado
  useEffect(() => {
    if (!isOpen) return;

    // Guardar el elemento activo anterior
    previousActiveElement.current = document.activeElement;

    // Forzar el foco inicial en el modal
    if (modalRef.current) {
      modalRef.current.focus();
    }

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }

      if (e.key === "ArrowRight") {
        handleNext();
        return;
      }

      if (e.key === "ArrowLeft") {
        handlePrev();
        return;
      }

      if (e.key === "Tab") {
        if (!modalRef.current) return;

        const focusableSelectors = 'button, [href], input, select, textarea, [tabindex="0"]';
        const focusableElements = Array.from(
          modalRef.current.querySelectorAll(focusableSelectors)
        );

        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          // Shift + Tab (hacia atrás)
          if (document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
          }
        } else {
          // Tab (hacia adelante)
          if (document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      // Restaurar el foco original
      if (previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    };
  }, [isOpen, currentStep, steps.length]);

  // Resetear el paso al abrir
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
      setDirection(0);
    }
  }, [isOpen]);

  if (!isOpen || steps.length === 0) return null;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setDirection(1);
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setDirection(-1);
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleDotClick = (index) => {
    setDirection(index > currentStep ? 1 : -1);
    setCurrentStep(index);
  };

  // Variantes de Animación Premium (Tween, 250ms sin rebotes exagerados)
  const slideVariants = {
    enter: (dir) => ({
      x: dir > 0 ? 60 : dir < 0 ? -60 : 0,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
      transition: {
        x: { type: "spring", stiffness: 300, damping: 30 },
        opacity: { duration: 0.2 },
      },
    },
    exit: (dir) => ({
      x: dir > 0 ? -60 : dir < 0 ? 60 : 0,
      opacity: 0,
      transition: {
        x: { type: "spring", stiffness: 300, damping: 30 },
        opacity: { duration: 0.2 },
      },
    }),
  };

  const currentStepData = steps[currentStep];

  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          aria-describedby="modal-desc"
        >
          {/* Backdrop / Overlay Oscuro con Blur Ligero */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/85 backdrop-blur-sm cursor-pointer"
          />

          {/* Modal Box */}
          <motion.div
            ref={modalRef}
            tabIndex="-1"
            initial={{ opacity: 0, scale: 0.97, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 10 }}
            transition={{ type: "tween", ease: "easeOut", duration: 0.3 }}
            className="relative w-full max-w-4xl max-h-[90vh] md:max-h-[580px] bg-[#0c0f17] border border-slate-900/80 rounded-[28px] overflow-hidden shadow-2xl z-10 flex flex-col md:grid md:grid-cols-5 font-sans focus:outline-none"
          >
            {/* Botón de cerrar superior */}
            <button
              onClick={onClose}
              className="absolute top-5 right-5 text-slate-500 hover:text-slate-350 bg-slate-900/40 hover:bg-slate-900/80 p-2 rounded-full border border-slate-800/40 transition-all cursor-pointer z-30 focus:outline-none focus:ring-1 focus:ring-slate-700"
              aria-label="Cerrar modal"
            >
              <X className="w-4 h-4" />
            </button>

            {/* PANEL IZQUIERDO: Demostración Visual (Swipeable) */}
            <div className="relative md:col-span-3 min-h-[200px] md:min-h-full bg-[#07090e]/75 border-b md:border-b-0 md:border-r border-slate-900/60 flex items-center justify-center p-6 md:p-8 overflow-hidden select-none">
              {/* Resplandor ambiental de acento en el fondo */}
              <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] h-[280px] rounded-full ${theme.glow} blur-[90px] pointer-events-none`} />

              {/* Contenedor Arrastrable para Swipe en Móviles */}
              <motion.div
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.25}
                onDragEnd={(e, { offset }) => {
                  const swipeThreshold = 55;
                  if (offset.x < -swipeThreshold) {
                    handleNext();
                  } else if (offset.x > swipeThreshold) {
                    handlePrev();
                  }
                }}
                className="w-full h-full max-w-md aspect-square md:aspect-auto md:h-[350px] flex items-center justify-center relative z-10 cursor-grab active:cursor-grabbing"
              >
                <AnimatePresence mode="wait" custom={direction}>
                  <motion.div
                    key={currentStep}
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    className="w-full h-full flex items-center justify-center"
                  >
                    {/* Renderización con Arquitectura para Imagen/Video/Mock SVG */}
                    {currentStepData.type === "video" ? (
                      <video
                        src={currentStepData.videoSrc}
                        muted
                        playsInline
                        autoPlay
                        loop
                        className="w-full h-full object-cover rounded-2xl border border-slate-800/40"
                      />
                    ) : currentStepData.type === "image" && currentStepData.imageSrc ? (
                      <img
                        src={currentStepData.imageSrc}
                        alt={currentStepData.title}
                        className="w-full h-full object-contain rounded-2xl"
                        onError={(e) => {
                          e.target.style.display = "none";
                          const parent = e.target.parentElement;
                          if (parent && !parent.querySelector(".image-error-placeholder")) {
                            const errDiv = document.createElement("div");
                            errDiv.className = "image-error-placeholder w-full h-full bg-[#090d16] border border-slate-850 rounded-3xl p-6 flex flex-col items-center justify-center space-y-4";
                            errDiv.innerHTML = `
                              <div class="w-14 h-14 bg-emerald-500/10 border border-emerald-500/25 rounded-full flex items-center justify-center text-[#10b981]">
                                <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                              </div>
                              <span class="text-[10px] font-bold text-slate-400 block uppercase tracking-wider text-center">Captura Temporal (${currentStepData.benefit || "Módulo"})</span>
                            `;
                            parent.appendChild(errDiv);
                          }
                        }}
                      />
                    ) : (
                      currentStepData.visualContent
                    )}
                  </motion.div>
                </AnimatePresence>
              </motion.div>
            </div>

            {/* PANEL DERECHO: Información y Navegación Fija (Glassmorphism sutil) */}
            <div className="md:col-span-2 flex flex-col justify-between h-[300px] md:h-full p-6 md:p-8 bg-gradient-to-b from-[#0e121e]/90 to-[#07090e]/95 backdrop-blur-md border-l border-slate-800/10">
              
              {/* Cabecera de Módulo */}
              <div className="space-y-1 pr-8">
                <span className={`text-[9px] font-mono font-black uppercase tracking-widest block ${theme.text}`}>
                  {title}
                </span>
                <span className="text-[10px] text-slate-500 font-mono font-bold block">
                  {currentStep + 1} de {steps.length}
                </span>
              </div>

              {/* Contenido Central Desplazable (overflow-y-auto en móvil para evitar recortes) */}
              <div className="flex-1 overflow-y-auto my-3 pr-1 py-1 text-left min-h-0">
                <AnimatePresence mode="wait" custom={direction}>
                  <motion.div
                    key={currentStep}
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    className="space-y-3"
                  >
                    {/* Badge de Beneficio Clave */}
                    {currentStepData.benefit && (
                      <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider ${theme.badgeBg} ${theme.badgeText}`}>
                        {currentStepData.benefit}
                      </div>
                    )}

                    {/* Título de la diapositiva */}
                    <h3 
                      id="modal-title"
                      className="font-display font-black text-base sm:text-lg text-slate-100 uppercase tracking-wide leading-snug"
                    >
                      {currentStepData.title}
                    </h3>

                    {/* Descripción descriptiva */}
                    <p 
                      id="modal-desc"
                      className="text-[11px] text-slate-400 leading-relaxed font-normal"
                    >
                      {currentStepData.description}
                    </p>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Pie Fijo: Barra de Progreso + Dots + Controles */}
              <div className="space-y-4 pt-3 border-t border-slate-900/60 shrink-0">
                
                {/* Contenedor de Progreso */}
                <div className="space-y-2.5">
                  {/* Barra de Progreso Lineal Sincronizada */}
                  <div className="w-full bg-slate-950/80 h-[2px] rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full ${theme.bg}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                    />
                  </div>

                  {/* Dots / Puntos de progreso expandibles con área táctil accesible */}
                  <div className="flex items-center gap-2">
                    {steps.map((_, idx) => {
                      const isSelected = idx === currentStep;
                      return (
                        <button
                          key={idx}
                          onClick={() => handleDotClick(idx)}
                          className="relative p-1 -m-1 focus:outline-none group cursor-pointer"
                          aria-label={`Ir al paso ${idx + 1}`}
                        >
                          {/* Dot visual */}
                          <div className={`h-1.5 rounded-full transition-all duration-200 ${
                            isSelected ? `w-6 ${theme.bg}` : "w-1.5 bg-slate-800 group-hover:bg-slate-700"
                          }`} />
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Botones de Acción */}
                <div className="flex items-center justify-between gap-3 pt-1">
                  <button
                    onClick={handlePrev}
                    disabled={currentStep === 0}
                    className="flex items-center gap-1 text-[9px] font-black uppercase tracking-wider transition-all disabled:opacity-20 disabled:pointer-events-none cursor-pointer text-slate-450 hover:text-slate-200 focus:outline-none focus:text-slate-200"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    Atrás
                  </button>

                  {currentStep === steps.length - 1 ? (
                    <button
                      onClick={() => {
                        if (onComplete) onComplete();
                        onClose();
                      }}
                      className={`px-4.5 py-2.5 rounded-xl font-display text-[9px] font-black uppercase tracking-wider text-slate-950 transition-all cursor-pointer shadow-lg ${theme.bg} ${theme.bgHover} ${theme.shadow} focus:outline-none focus:ring-1 focus:ring-slate-300`}
                    >
                      {currentStepData.btnText || "Entendido"}
                    </button>
                  ) : (
                    <button
                      onClick={handleNext}
                      className={`px-4.5 py-2.5 rounded-xl font-display text-[9px] font-black uppercase tracking-wider text-slate-950 transition-all cursor-pointer shadow-lg ${theme.bg} ${theme.bgHover} ${theme.shadow} focus:outline-none focus:ring-1 focus:ring-slate-300`}
                    >
                      {currentStepData.btnText || "Siguiente"}
                    </button>
                  )}
                </div>

              </div>

            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
