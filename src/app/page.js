"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ShieldCheck, Trophy, QrCode, ChartBar, Users, ArrowRight, X, Calendar, Megaphone, Check } from "lucide-react";
import RadarPerformance from "@/components/RadarPerformance";
import { db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";

export default function Home() {
  const [activeModal, setActiveModal] = useState(null); // 'qr' | 'radar' | 'billing'
  
  const [announcement, setAnnouncement] = useState({
    date: "17 de Junio, 2026",
    text: "Atención padres de familia: Los entrenamientos de la tarde para todas las categorías se realizarán con normalidad. Recordar traer el uniforme alternativo verde."
  });

  // Cargar anuncio guardado por el administrador si existe en Firestore
  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, "settings", "announcements"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.notice) {
          const dateLabel = data.date 
            ? new Date(data.date).toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" })
            : new Date().toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" });
          setAnnouncement({
            date: dateLabel,
            text: data.notice
          });
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Simulación de valores de radar interactivos en el modal
  const [radarData, setRadarData] = useState({
    speed: 8, passing: 7, dribbling: 9, shooting: 8, physical: 8, discipline: 9
  });

  return (
    <div className="flex flex-col min-h-screen bg-[#07090e] selection:bg-brand-green selection:text-white">
      {/* Header / Navegación */}
      <header className="sticky top-0 z-50 glass-panel border-b border-slate-900 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 hover:opacity-90 transition-all">
          <span className="font-display font-black text-lg tracking-wide uppercase text-slate-100">
            Club <span className="text-[#10b981]">Colombia</span>
          </span>
        </Link>
        
        <div className="flex items-center gap-4">
          <Link 
            href="/login"
            className="text-xs font-bold font-display text-slate-400 hover:text-slate-200 transition-all"
          >
            Ingresar
          </Link>
          <Link 
            href="/login?tab=register"
            className="bg-[#10b981] hover:bg-[#059669] text-slate-950 font-display font-extrabold text-xs px-5 py-2.5 rounded-full transition-all flex items-center gap-1.5 shadow-lg shadow-emerald-500/10 cursor-pointer"
          >
            Inscripción en Línea
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex-1 flex flex-col justify-center items-center px-6 py-12 text-center max-w-4xl mx-auto relative overflow-hidden">
        {/* Glows de fondo */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-emerald-500/5 filter blur-[120px] pointer-events-none" />

        {/* Logo Grande Centrado */}
        <div className="mb-6 z-10 flex justify-center animate-fade-in">
          <img 
            src="/logo.png" 
            alt="Escudo Club Colombia" 
            className="w-44 h-44 sm:w-56 sm:h-56 object-contain filter drop-shadow-[0_0_30px_rgba(16,185,129,0.3)] animate-pulse-subtle" 
          />
        </div>

        <h1 className="font-display font-black text-4xl sm:text-6xl text-slate-100 leading-[1.1] tracking-tight z-10 max-w-4xl">
          Escuela de Fútbol <br/>
          <span className="bg-gradient-to-r from-[#10b981] via-[#34d399] to-[#d97706] bg-clip-text text-transparent">
            Club Colombia
          </span>
        </h1>
        <p className="text-[#10b981] font-display font-bold text-xs uppercase tracking-widest mt-4 z-10">
          El futuro del fútbol se gestiona aquí.
        </p>

        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/60 border border-slate-800/80 mt-6 z-10">
          <Trophy className="w-4 h-4 text-amber-500" />
          <span className="text-[10px] font-display font-bold uppercase tracking-wider text-slate-300">
            Formación Deportiva de Alto Rendimiento
          </span>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mt-8 z-10 w-full justify-center">
          <Link
            href="/login?tab=register"
            className="bg-[#10b981] hover:bg-[#059669] text-slate-950 font-display font-black text-sm px-8 py-3.5 rounded-full transition-all shadow-xl shadow-emerald-500/10 cursor-pointer text-center"
          >
            Inscripción en Línea
          </Link>
          <Link
            href="/login"
            className="bg-slate-900/60 hover:bg-slate-900/90 border border-slate-800 text-slate-200 font-display font-bold text-sm px-8 py-3.5 rounded-full transition-all cursor-pointer text-center"
          >
            Ingresar al Portal
          </Link>
        </div>
      </section>

      {/* Tablón de Anuncios / Comunicados del Día - Reubicado */}
      <div className="max-w-4xl w-full mx-auto px-6 pb-12">
        <div className="bg-amber-500/5 border border-amber-500/15 rounded-2xl p-4 flex gap-4 items-start animate-pulse-subtle">
          <div className="w-10 h-10 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center text-amber-500 shrink-0">
            <Megaphone className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-mono text-amber-500 font-bold uppercase tracking-widest">Comunicado Oficial del Club</span>
              <span className="text-[9px] text-slate-500 font-mono flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {announcement.date}
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              {announcement.text}
            </p>
          </div>
        </div>
      </div>

      {/* Características Destacadas (Interactivas) */}
      <section className="px-6 py-16 border-t border-slate-900/80 bg-[#090d16]/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="font-display font-black text-xl sm:text-2xl text-slate-200 uppercase tracking-wider">
              Módulos Diseñados para la Excelencia
            </h2>
            <p className="text-[10px] text-[#10b981] font-bold uppercase tracking-widest mt-1">Haz clic en cada tarjeta para ver una demostración interactiva</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Tarjeta 1: QR */}
            <button
              onClick={() => setActiveModal("qr")}
              className="p-6 bg-[#0e121e]/60 border border-slate-800/80 hover:border-[#10b981]/50 rounded-2xl flex flex-col gap-4 text-left transition-all hover:bg-[#151b2d]/50 cursor-pointer group"
            >
              <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-all">
                <QrCode className="w-5 h-5" />
              </div>
              <h3 className="font-display font-bold text-sm text-slate-200 uppercase tracking-wide flex justify-between items-center w-full">
                Credencial Digital QR
                <span className="text-[9px] text-[#10b981] lowercase font-normal group-hover:underline">Probar demo</span>
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Control de acceso sin fricciones. Código QR encriptado único para cada atleta con validación de estado en campo.
              </p>
            </button>

            {/* Tarjeta 2: Radar */}
            <button
              onClick={() => setActiveModal("radar")}
              className="p-6 bg-[#0e121e]/60 border border-slate-800/80 hover:border-amber-500/50 rounded-2xl flex flex-col gap-4 text-left transition-all hover:bg-[#151b2d]/50 cursor-pointer group"
            >
              <div className="w-10 h-10 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center text-amber-500 group-hover:scale-110 transition-all">
                <ChartBar className="w-5 h-5" />
              </div>
              <h3 className="font-display font-bold text-sm text-slate-200 uppercase tracking-wide flex justify-between items-center w-full">
                Evaluación Táctica e Historial
                <span className="text-[9px] text-amber-500 lowercase font-normal group-hover:underline">Probar demo</span>
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Seguimiento técnico a través de gráficos de radar interactivos. Los entrenadores califican habilidades directo en cancha.
              </p>
            </button>

            {/* Tarjeta 3: Billing */}
            <button
              onClick={() => setActiveModal("billing")}
              className="p-6 bg-[#0e121e]/60 border border-slate-800/80 hover:border-sky-500/50 rounded-2xl flex flex-col gap-4 text-left transition-all hover:bg-[#151b2d]/50 cursor-pointer group"
            >
              <div className="w-10 h-10 bg-sky-500/10 border border-sky-500/20 rounded-xl flex items-center justify-center text-sky-400 group-hover:scale-110 transition-all">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="font-display font-bold text-sm text-slate-200 uppercase tracking-wide flex justify-between items-center w-full">
                Gestión Recurrente Inteligente
                <span className="text-[9px] text-sky-400 lowercase font-normal group-hover:underline">Probar demo</span>
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Débito automático y pagos integrados con Mercado Pago. Automatización de suspensiones tras el período de gracia de 5 días.
              </p>
            </button>
          </div>
        </div>
      </section>

      {/* Sección de Transición a Producción y Requerimientos de Base de Datos */}


      {/* MODALES INTERACTIVOS */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-[#0e121e] border border-slate-800 w-full max-w-md rounded-3xl p-6 relative overflow-hidden shadow-2xl">
            {/* Botón de cerrar */}
            <button 
              onClick={() => setActiveModal(null)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-300 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* MODAL QR DEMO */}
            {activeModal === "qr" && (
              <div className="space-y-4 text-center">
                <div className="flex items-center gap-2 text-emerald-400 justify-center">
                  <QrCode className="w-5 h-5" />
                  <h3 className="font-display font-bold text-sm uppercase tracking-wider">Demostración: Control de Accesos</h3>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Escanea el QR del deportista en el lector móvil de la entrada. El sistema valida el pago y registra la asistencia de inmediato en la base de datos.
                </p>

                {/* Simulador de Escáner QR */}
                <div className="border border-slate-800 p-4 rounded-2xl bg-[#07090e] space-y-4">
                  <div className="relative w-36 h-36 mx-auto bg-white p-2 rounded-xl">
                    <svg width="100%" height="100%" viewBox="0 0 29 29" className="text-slate-950 fill-current">
                      <path d="M0 0h7v7H0zm1 1v5h5V1zm1 1h3v3H2zm20-2h7v7H22zm1 1v5h5V1zm1 1h3v3H24zM0 22h7v7H0zm1 1v5h5v-5zm1 1h3v3H2zM22 22h5v5H22zm1 1v3h3V23zm1 1h1v1h-1z" />
                      <path d="M8 6h14v1H8zm-2 2v14h1V8zm3 1h2v1H9zm4 0h1v2h-1zm3 0h2v1h-2zm-10 2h1v1h-1zm3 0h2v1h-2zm3 0h1v2h-1zm-9 2h2v1H9zm3 0h1v1h-1zm2 0h2v1h-2zm-7 2h1v2H9zm3 0h2v1h-2zm3 0h1v1h-1zm-6 2h1v1h-1zm3 0h2v1H12zm-6 2h2v1H10zm3 0h1v1h-1zm-9 2h1v1H9zm2 0h3v1h-3z" />
                    </svg>
                    {/* Barra de escáner animada */}
                    <div className="absolute left-0 right-0 h-0.5 bg-[#10b981] shadow-[0_0_8px_#10b981] animate-[bounce_2s_infinite] top-2" />
                  </div>
                  <div className="bg-[#10b981]/15 border border-[#10b981]/25 text-[#10b981] py-1.5 px-3 rounded-lg text-[10px] font-bold inline-flex items-center gap-1.5 animate-pulse">
                    <Check className="w-3.5 h-3.5" />
                    INGRESANDO: JUAN ANDRÉS GARCÍA (Activo)
                  </div>
                </div>
              </div>
            )}

            {/* MODAL RADAR DEMO */}
            {activeModal === "radar" && (
              <div className="space-y-4 text-center">
                <div className="flex items-center gap-2 text-amber-500 justify-center">
                  <ChartBar className="w-5 h-5" />
                  <h3 className="font-display font-bold text-sm uppercase tracking-wider">Demostración: Rendimiento Táctico</h3>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Modifica los valores de habilidad de prueba para observar cómo el gráfico de radar SVG recalcula los puntos dinámicamente:
                </p>

                {/* Renderizar Gráfico de Radar Interactivo */}
                <div className="flex flex-col items-center gap-4 bg-[#07090e] p-3 rounded-2xl border border-slate-800">
                  <RadarPerformance metrics={radarData} />
                  
                  {/* Controles interactivos */}
                  <div className="grid grid-cols-2 gap-2 w-full">
                    <button
                      onClick={() => setRadarData(prev => ({ ...prev, speed: prev.speed >= 10 ? 4 : prev.speed + 1 }))}
                      className="bg-slate-900 hover:bg-slate-800 text-slate-300 py-1.5 px-2.5 rounded-lg text-[10px] font-semibold border border-slate-800 cursor-pointer text-center"
                    >
                      Aumentar Velocidad (+1)
                    </button>
                    <button
                      onClick={() => setRadarData(prev => ({ ...prev, dribbling: prev.dribbling <= 4 ? 10 : prev.dribbling - 1 }))}
                      className="bg-slate-900 hover:bg-slate-800 text-slate-300 py-1.5 px-2.5 rounded-lg text-[10px] font-semibold border border-slate-800 cursor-pointer text-center"
                    >
                      Disminuir Regate (-1)
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* MODAL BILLING DEMO */}
            {activeModal === "billing" && (
              <div className="space-y-4 text-center">
                <div className="flex items-center gap-2 text-sky-400 justify-center">
                  <Users className="w-5 h-5" />
                  <h3 className="font-display font-bold text-sm uppercase tracking-wider">Demostración: Período de Gracia</h3>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  El sistema monitorea las facturas de Mercado Pago de forma automática. Observa el estado del cobro:
                </p>

                {/* Línea de tiempo visual */}
                <div className="border border-slate-800 p-4 rounded-2xl bg-[#07090e] text-left space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                      <span>DÍA 1 (Vencimiento de Factura)</span>
                      <span className="text-amber-500">Estado: Pendiente</span>
                    </div>
                    <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                      <div className="bg-amber-500 w-1/5 h-full" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                      <span>DÍA 5 HÁBILES (Fin del Período de Gracia)</span>
                      <span className="text-amber-500">Estado: Notificación de advertencia</span>
                    </div>
                    <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                      <div className="bg-amber-500 w-5/6 h-full" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-[10px] font-bold text-red-400">
                      <span>DÍA 6 (Mora Confirmada)</span>
                      <span className="text-red-500 font-black">Acceso QR: Suspendido</span>
                    </div>
                    <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                      <div className="bg-red-500 w-full h-full" />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-900/80 px-6 py-6 text-center text-[10px] text-slate-600 font-mono mt-auto">
        © 2026 Escuela de Fútbol Club Colombia. Todos los derechos reservados. <br/>
        Diseñado bajo estándares de alto rendimiento y arquitectura SaaS deportiva.
      </footer>
    </div>
  );
}
