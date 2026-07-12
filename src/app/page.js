"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Calendar,
  Check,
  CheckCircle,
  ChartBar,
  Clock,
  Megaphone,
  ShieldCheck,
  Trophy,
  Users,
  X
} from "lucide-react";
import { useNotifications } from "@/hooks";
import FeatureTourModal from "@/components/FeatureTourModal";

export default function Home() {
  const { data: announcementsData } = useNotifications();
  const announcement = announcementsData?.[0] || {
    date: new Date().toLocaleDateString("es-CO", {
      day: "numeric",
      month: "long",
      year: "numeric"
    }),
    text: "Bienvenidos a la plataforma oficial de la Escuela de Fútbol Club Colombia."
  };

  const [activeChapter, setActiveChapter] = useState(null); // null | 1 | 2 | 3
  const [toastMessage, setToastMessage] = useState("");
  const [missingScreenshots, setMissingScreenshots] = useState({});

  // CAPÍTULO 1: CONTROL DE ACCESO (PREPARADO PARA IMÁGENES REALES)
  const accessSteps = [
    {
      title: "Pase de Lista Inmediato",
      description: "El entrenador registra la asistencia y marca inasistencias en segundos desde la cancha. La plataforma sincroniza el estado en tiempo real.",
      benefit: "Asistencia Ágil",
      type: "image",
      imageSrc: "/screenshots/coach_asistencia.png"
    },
    {
      title: "Evaluación Técnica y Médica",
      description: "El cuerpo técnico califica el rendimiento continuo y registra el estado de salud, generando alertas inmediatas ante lesiones o fatiga.",
      benefit: "Control Integral",
      type: "image",
      imageSrc: "/screenshots/coach_evaluacion_salud.png"
    },
    {
      title: "Transparencia Total para el Padre",
      description: "El representante visualiza el desarrollo deportivo, historial de asistencia y alertas médicas de su hijo desde su propio dispositivo móvil.",
      benefit: "Monitoreo Constante",
      type: "image",
      imageSrc: "/screenshots/padre_desarrollo.png",
      btnText: "Continuar"
    }
  ];



  return (
    <div className="flex min-h-screen flex-col bg-[#07090e] selection:bg-brand-green selection:text-white">
      <header className="sticky top-0 z-50 flex items-center justify-center border-b border-slate-900/60 px-6 py-3 glass-panel">
        <Link href="/" className="flex flex-col items-center text-center transition-all hover:opacity-90">
          <span className="font-display text-base font-black uppercase tracking-wide text-slate-100 sm:text-lg">
            Club <span className="text-[#10b981]">Colombia</span>
          </span>
          <span className="mt-0.5 font-mono text-[8px] font-bold uppercase tracking-[0.2em] text-[#10b981] sm:text-[9px]">
            Escuela de Fútbol
          </span>
        </Link>
      </header>

      <main className="flex-1">
        <section className="relative mx-auto flex max-w-5xl flex-col items-center overflow-hidden px-6 pb-12 pt-14 text-center sm:pt-16">
          <div className="pointer-events-none absolute left-1/2 top-28 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-emerald-500/5 blur-[120px]" />

          <div className="z-10 mb-6 flex justify-center">
            <img
              src="/logo.png"
              alt="Escudo Club Colombia"
              className="h-44 w-44 object-contain drop-shadow-[0_0_30px_rgba(16,185,129,0.3)] sm:h-56 sm:w-56"
            />
          </div>

          <h1 className="z-10 max-w-4xl font-display text-4xl font-black leading-[1.1] tracking-tight text-slate-100 sm:text-6xl">
            Escuela de Fútbol <br />
            <span className="bg-gradient-to-r from-[#10b981] via-[#34d399] to-[#d97706] bg-clip-text text-transparent">
              Club Colombia
            </span>
          </h1>

          <p className="z-10 mt-4 font-display text-xs font-bold uppercase tracking-widest text-[#10b981]">
            Juntos somos más fuertes, juntos somos Colombia
          </p>
          <p className="z-10 mt-1.5 font-mono text-[9px] uppercase tracking-widest text-slate-500">
            1 Corintios 1:10
          </p>

          <div className="z-10 mt-6 inline-flex items-center gap-2 rounded-full border border-slate-800/80 bg-slate-900/60 px-4 py-1.5">
            <Trophy className="h-4 w-4 text-amber-500" />
            <span className="font-display text-[10px] font-bold uppercase tracking-wider text-slate-300">
              Formación Deportiva de Alto Rendimiento
            </span>
          </div>

          <div className="z-10 mt-8 flex w-full flex-col justify-center gap-4 sm:flex-row">
            <Link
              href="/login?tab=register"
              className="cursor-pointer rounded-full bg-[#10b981] px-8 py-3.5 text-center font-display text-sm font-black text-slate-950 shadow-xl shadow-emerald-500/10 transition-all hover:bg-[#059669]"
            >
              Inscripción en Línea
            </Link>
            <Link
              href="/login"
              className="flex cursor-pointer items-center justify-center gap-2 rounded-full border border-slate-800 bg-slate-900/60 px-8 py-3.5 text-center font-display text-sm font-bold text-slate-200 transition-all hover:bg-slate-900/90"
            >
              Ingresar al Portal
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        <section className="mx-auto w-full max-w-4xl px-6 pb-12">
          <div className="flex gap-4 rounded-2xl border border-amber-500/15 bg-amber-500/5 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/10 text-amber-500">
              <Megaphone className="h-5 w-5" />
            </div>
            <div className="space-y-1 text-left">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-amber-500">
                  Comunicado Oficial del Club
                </span>
                <span className="flex items-center gap-1 font-mono text-[9px] text-slate-500">
                  <Calendar className="h-3 w-3" />
                  {announcement.date}
                </span>
              </div>
              <p className="font-sans text-xs leading-relaxed text-slate-300">
                {announcement.text}
              </p>
            </div>
          </div>
        </section>

        {/* BENTO GRID PREMIUM */}
        <section className="border-t border-slate-900/80 bg-[#07090e] px-6 py-16 sm:py-24 overflow-hidden">
          <div className="mx-auto max-w-5xl">
            <div className="mb-12 text-center">
              <span className="inline-flex items-center rounded-full border border-[#10b981]/20 bg-[#10b981]/5 px-3 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.24em] text-[#10b981] mb-4">
                Plataforma Integral
              </span>
              <h2 className="font-display text-3xl font-black uppercase tracking-tight text-slate-100 sm:text-4xl">
                Tecnología al <span className="text-[#10b981]">Servicio del Deporte</span>
              </h2>
              <p className="mt-4 text-sm text-slate-400 max-w-2xl mx-auto leading-relaxed">
                Una solución completa diseñada para maximizar el rendimiento deportivo, garantizar la transparencia financiera y optimizar la organización de Club Colombia.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[300px]">
              
              {/* Tarjeta 1: Control de Acceso (Ocupa 2 columnas en md) */}
              <div className="md:col-span-2 relative group overflow-hidden rounded-[2rem] border border-slate-800/80 bg-gradient-to-br from-[#0e121e]/80 to-[#07090e] p-8 transition-all duration-500 hover:border-[#10b981]/40 hover:shadow-[0_0_40px_rgba(16,185,129,0.1)]">
                <div className="absolute inset-0 bg-[#10b981]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute -right-20 -top-20 w-64 h-64 bg-[#10b981]/20 blur-[100px] rounded-full group-hover:bg-[#10b981]/30 transition-all duration-700" />
                
                <div className="relative z-10 flex flex-col h-full justify-between">
                  <div>
                    <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-[#10b981]/10 text-[#10b981] mb-5 border border-[#10b981]/20 group-hover:scale-110 transition-transform duration-500">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <h3 className="font-display text-2xl font-black text-slate-100 uppercase tracking-wide">Control de Acceso Real</h3>
                    <p className="mt-2 text-sm text-slate-400 max-w-sm leading-relaxed">Pase de lista inmediato desde la cancha mediante QRs únicos. Alertas médicas automatizadas y notificaciones instantáneas a la aplicación del padre.</p>
                  </div>
                  
                  {/* UI Simulada - Player Card */}
                  <div className="mt-6 flex items-center gap-4 bg-slate-950/90 p-4 rounded-2xl border border-slate-800/80 backdrop-blur-md w-max shadow-[0_20px_40px_rgba(0,0,0,0.5)] transform translate-y-6 group-hover:translate-y-0 opacity-80 group-hover:opacity-100 transition-all duration-500 ease-out">
                    <div className="w-12 h-12 rounded-full bg-slate-800 border-2 border-[#10b981] flex items-center justify-center overflow-hidden shrink-0 shadow-[0_0_15px_rgba(16,185,129,0.4)]">
                      <div className="w-7 h-7 rounded-full bg-slate-600 animate-pulse" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-200">Ingreso Autorizado</div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">17:45 PM • Categoría 2010</div>
                    </div>
                    <div className="ml-6 w-8 h-8 rounded-full bg-[#10b981]/20 flex items-center justify-center text-[#10b981]">
                      <Check className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Tarjeta 2: Seguimiento Deportivo */}
              <div className="relative group overflow-hidden rounded-[2rem] border border-slate-800/80 bg-gradient-to-bl from-[#0e121e]/80 to-[#07090e] p-8 transition-all duration-500 hover:border-amber-500/40 hover:shadow-[0_0_40px_rgba(245,158,11,0.1)]">
                <div className="absolute inset-0 bg-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-amber-500/10 blur-[100px] rounded-full group-hover:bg-amber-500/20 transition-all duration-700" />
                
                <div className="relative z-10 flex flex-col h-full justify-between">
                  <div>
                    <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-amber-500/10 text-amber-500 mb-5 border border-amber-500/20 group-hover:scale-110 transition-transform duration-500">
                      <Trophy className="w-6 h-6" />
                    </div>
                    <h3 className="font-display text-xl font-black text-slate-100 uppercase tracking-wide">Desarrollo Deportivo</h3>
                    <p className="mt-2 text-xs text-slate-400 leading-relaxed">Rendimiento evaluado constantemente. Transparencia total en el progreso técnico.</p>
                  </div>
                  
                  {/* UI Simulada - Radar Abstracto */}
                  <div className="mt-4 flex justify-center opacity-60 group-hover:opacity-100 transform scale-95 group-hover:scale-105 transition-all duration-700">
                    <svg width="110" height="110" viewBox="0 0 100 100" className="animate-[spin_20s_linear_infinite]">
                      <polygon points="50,5 95,30 95,75 50,95 5,75 5,30" fill="none" stroke="#fbbf24" strokeWidth="0.5" strokeDasharray="2 4" className="opacity-30" />
                      <polygon points="50,15 85,35 85,65 50,85 15,65 15,35" fill="none" stroke="#fbbf24" strokeWidth="1" className="opacity-40" />
                      <polygon points="50,25 75,45 65,70 50,80 30,60 35,35" fill="rgba(251,191,36,0.15)" stroke="#fbbf24" strokeWidth="1.5" className="filter drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" />
                      <circle cx="50" cy="50" r="2" fill="#fbbf24" />
                      <circle cx="50" cy="25" r="3" fill="#fbbf24" className="animate-pulse" />
                      <circle cx="75" cy="45" r="2.5" fill="#fbbf24" />
                      <circle cx="65" cy="70" r="3" fill="#fbbf24" />
                      <circle cx="50" cy="80" r="2" fill="#fbbf24" />
                      <circle cx="30" cy="60" r="2.5" fill="#fbbf24" />
                      <circle cx="35" cy="35" r="2" fill="#fbbf24" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Tarjeta 3: Gestión Administrativa (Ocupa 3 columnas) */}
              <div className="md:col-span-3 relative group overflow-hidden rounded-[2rem] border border-slate-800/80 bg-gradient-to-tr from-[#0e121e]/80 to-[#07090e] p-8 sm:p-10 transition-all duration-500 hover:border-sky-500/40 hover:shadow-[0_0_40px_rgba(14,165,233,0.1)]">
                <div className="absolute inset-0 bg-sky-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute right-1/4 -bottom-32 w-96 h-96 bg-sky-500/10 blur-[120px] rounded-full group-hover:bg-sky-500/20 transition-all duration-700" />
                
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-10 h-full">
                  <div className="flex-1 text-center md:text-left">
                    <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-sky-500/10 text-sky-400 mb-5 border border-sky-500/20 group-hover:scale-110 transition-transform duration-500">
                      <Users className="w-6 h-6" />
                    </div>
                    <h3 className="font-display text-2xl font-black text-slate-100 uppercase tracking-wide">Gestión Centralizada</h3>
                    <p className="mt-3 text-sm text-slate-400 max-w-lg mx-auto md:mx-0 leading-relaxed">
                      Conecta a la directiva, el cuerpo técnico y las familias en un ecosistema unificado. Controla la tesorería, emite comunicados oficiales y organiza las categorías deportivas con procesos automatizados.
                    </p>
                  </div>
                  
                  {/* UI Simulada - Iconos Conectados */}
                  <div className="flex-1 flex justify-center items-center w-full py-6">
                    <div className="relative flex items-center justify-center gap-4 sm:gap-8 w-full max-w-sm">
                      <div className="w-14 h-14 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-500 shadow-[0_10px_30px_rgba(0,0,0,0.5)] z-10 group-hover:-translate-y-2 group-hover:text-slate-300 group-hover:border-slate-700 transition-all duration-500">
                        <Users className="w-6 h-6" />
                      </div>
                      
                      {/* Línea animada conectora */}
                      <div className="absolute left-1/2 top-1/2 w-[70%] h-[1px] bg-gradient-to-r from-transparent via-sky-500/20 to-transparent -translate-x-1/2 -translate-y-1/2 overflow-hidden">
                        <div className="w-1/2 h-full bg-gradient-to-r from-transparent via-sky-400 to-transparent animate-[translateX_2s_ease-in-out_infinite]" />
                      </div>
                      
                      <div className="w-20 h-20 rounded-[1.75rem] bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 shadow-[0_0_30px_rgba(14,165,233,0.15)] z-20 group-hover:scale-110 group-hover:bg-sky-500/20 transition-all duration-500">
                        <ShieldCheck className="w-10 h-10 drop-shadow-[0_0_10px_rgba(14,165,233,0.5)]" />
                      </div>
                      
                      <div className="w-14 h-14 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-500 shadow-[0_10px_30px_rgba(0,0,0,0.5)] z-10 group-hover:-translate-y-2 group-hover:text-slate-300 group-hover:border-slate-700 transition-all duration-500 delay-100">
                        <ChartBar className="w-6 h-6" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
            </div>
          </div>
        </section>


        <section className="px-6 py-12">
          <div className="mx-auto flex max-w-4xl flex-col items-start justify-between gap-5 rounded-2xl border border-slate-800/80 bg-[#0e121e]/60 p-6 sm:flex-row sm:items-center">
            <div className="text-left">
              <div className="mb-2 flex items-center gap-2 text-[#10b981]">
                <Clock className="h-4 w-4" />
                <span className="font-mono text-[9px] font-bold uppercase tracking-widest">
                  Portal Oficial
                </span>
              </div>
              <h2 className="font-display text-lg font-black uppercase tracking-wide text-slate-100">
                Accede a la gestión del club
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-slate-400">
                Padres, entrenadores y administradores pueden ingresar con sus credenciales asignadas.
              </p>
            </div>
            <Link
              href="/login"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#10b981] px-5 py-3 font-display text-xs font-black uppercase tracking-wider text-slate-950 transition-all hover:bg-[#059669] sm:w-auto"
            >
              Entrar
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="mt-auto border-t border-slate-900/80 px-6 py-6 text-center font-mono text-[10px] text-slate-600">
        © 2026 Escuela de Fútbol Club Colombia. Todos los derechos reservados.
      </footer>

      {/* RENDERIZADO DEL MODAL PARA EL CAPÍTULO 1 */}
      <FeatureTourModal
        isOpen={activeChapter === 1}
        onClose={() => setActiveChapter(null)}
        title="Control de Acceso y Asistencia"
        accentColor="emerald"
        steps={accessSteps}
        onComplete={() => {
          setToastMessage("¡Capítulo 1 completado con éxito! El Capítulo 2 (Seguimiento Deportivo) estará disponible próximamente.");
          setTimeout(() => setToastMessage(""), 5000);
        }}
      />

      {/* TOAST PREMIUM NOTIFICADOR */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 max-w-sm w-full px-4 animate-fade-in font-sans">
          <div className="bg-[#0e121e]/90 border border-slate-800/80 backdrop-blur-md text-slate-200 px-4 py-3.5 rounded-2xl shadow-2xl flex items-start justify-between gap-3 text-xs">
            <span className="leading-relaxed text-left font-medium">{toastMessage}</span>
            <button
              onClick={() => setToastMessage("")}
              className="text-slate-500 hover:text-slate-350 shrink-0 p-1 -m-1 focus:outline-none cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
