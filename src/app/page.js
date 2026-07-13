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

  // PASOS DEL TOUR (PREPARADO PARA LAS NUEVAS IMÁGENES FOTOREALISTAS)
  const accessSteps = [
    {
      title: "Control de Acceso Real",
      description: "Pase de lista inmediato desde la cancha mediante QRs únicos. Alertas médicas automatizadas y notificaciones instantáneas a la aplicación del padre.",
      benefit: "Asistencia Ágil",
      type: "image",
      imageSrc: "/screenshots/coach_asistencia.jpg"
    },
    {
      title: "Desarrollo Deportivo",
      description: "Rendimiento evaluado constantemente. Transparencia total en el progreso técnico mediante gráficos avanzados.",
      benefit: "Control Integral",
      type: "image",
      imageSrc: "/screenshots/coach_evaluacion_salud.jpg"
    },
    {
      title: "Gestión Centralizada",
      description: "Conecta a la directiva, cuerpo técnico y familias en un ecosistema unificado. Controla la tesorería y procesos deportivos en tiempo real.",
      benefit: "Administración Total",
      type: "image",
      imageSrc: "/screenshots/admin_dashboard_premium.jpg",
      btnText: "Finalizar Tour"
    }
  ];



  return (
    <div className="flex min-h-screen flex-col bg-[#07090e] selection:bg-emerald-500 selection:text-slate-900 relative overflow-hidden">
      <header className="sticky top-0 z-50 flex items-center justify-center border-b border-slate-800/60 px-6 py-4 glass-card-premium shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
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
        <section className="relative mx-auto flex max-w-5xl flex-col items-center overflow-hidden px-6 pb-12 pt-14 text-center sm:pt-20">
          {/* Decorative Premium Glows */}
          <div className="pointer-events-none absolute left-1/2 top-28 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-[150px]" />
          <div className="pointer-events-none absolute left-1/4 top-10 h-[300px] w-[300px] -translate-x-1/2 rounded-full bg-sky-500/5 blur-[120px]" />

          <div className="z-10 mb-8 flex justify-center relative">
            <div className="absolute inset-0 bg-emerald-500/20 blur-3xl rounded-full" />
            <img
              src="/logo.png"
              alt="Escudo Club Colombia"
              className="h-44 w-44 object-contain drop-shadow-[0_0_40px_rgba(16,185,129,0.4)] sm:h-56 sm:w-56 animate-float relative z-10"
            />
          </div>

          <h1 className="z-10 max-w-4xl font-display text-4xl font-black leading-[1.1] tracking-tight text-slate-100 sm:text-6xl drop-shadow-xl">
            Escuela de Fútbol <br />
            <span className="bg-gradient-to-r from-[#10b981] via-[#34d399] to-[#d97706] bg-clip-text text-transparent text-glow-emerald">
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

          <div className="z-10 mt-10 flex w-full flex-col justify-center gap-5 sm:flex-row">
            <Link
              href="/login?tab=register"
              className="cursor-pointer rounded-full glass-card-premium px-10 py-4 text-center font-display text-sm font-black text-emerald-400 border border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.2)] hover:shadow-[0_0_40px_rgba(16,185,129,0.5)] transition-all hover:bg-emerald-500/20 box-glow-emerald scale-100 hover:scale-105"
            >
              INSCRIPCIÓN EN LÍNEA
            </Link>
            <Link
              href="/login"
              className="flex cursor-pointer items-center justify-center gap-2 rounded-full glass-card-premium border border-slate-700/50 px-10 py-4 text-center font-display text-sm font-bold text-slate-200 transition-all hover:bg-slate-800/60 shadow-[0_0_20px_rgba(255,255,255,0.05)] hover:shadow-[0_0_25px_rgba(255,255,255,0.1)]"
            >
              INGRESAR AL PORTAL
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        <section className="mx-auto w-full max-w-3xl px-6 pb-16 relative z-10">
          <div className="flex gap-5 rounded-3xl border border-amber-500/20 glass-card-premium p-5 items-start sm:items-center flex-col sm:flex-row hover:border-amber-500/40 transition-colors">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-500 box-glow-amber">
              <Megaphone className="h-6 w-6 animate-pulse" />
            </div>
            <div className="space-y-1.5 text-left flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-mono text-[10px] font-black uppercase tracking-widest text-amber-500 text-glow-amber">
                  Comunicado Oficial
                </span>
                <span className="flex items-center gap-1 font-mono text-[10px] text-slate-400 bg-slate-800/50 px-2 py-0.5 rounded-md">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                  {announcement.date}
                </span>
              </div>
              <p className="font-sans text-sm leading-relaxed text-slate-200 font-medium">
                {announcement.text}
              </p>
            </div>
          </div>
        </section>

        {/* BENTO GRID PREMIUM CON MOCKUPS FOTOREALISTAS */}
        <section className="border-t border-slate-900/80 bg-[#07090e] px-6 py-16 sm:py-24 overflow-hidden">
          <div className="mx-auto max-w-6xl">
            <div className="mb-12 text-center">
              <span className="inline-flex items-center rounded-full border border-[#10b981]/20 bg-[#10b981]/5 px-3 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.24em] text-[#10b981] mb-4">
                Plataforma Integral
              </span>
              <h2 className="font-display text-3xl font-black uppercase tracking-tight text-slate-100 sm:text-4xl">
                Tecnología al <span className="text-[#10b981]">Servicio del Deporte</span>
              </h2>
              <p className="mt-4 text-sm text-slate-400 max-w-2xl mx-auto leading-relaxed">
                Explora las interfaces diseñadas para maximizar el rendimiento deportivo, garantizar la transparencia financiera y optimizar la organización.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 auto-rows-[400px]">
              
              {/* Tarjeta 1: Control de Acceso */}
              <button 
                onClick={() => setActiveChapter(1)}
                className="md:col-span-1 relative group overflow-hidden rounded-[2rem] border border-slate-800/80 bg-slate-900 text-left transition-all duration-500 hover:border-[#10b981]/50 hover:shadow-[0_0_40px_rgba(16,185,129,0.15)] focus:outline-none"
              >
                <div className="absolute inset-0 w-full h-full">
                  <Image 
                    src="/screenshots/coach_asistencia.jpg" 
                    alt="Control de Acceso" 
                    fill
                    className="object-cover object-top opacity-60 group-hover:opacity-80 group-hover:scale-105 transition-all duration-700" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#07090e] via-[#07090e]/80 to-transparent" />
                </div>
                
                <div className="absolute inset-x-0 bottom-0 p-8 z-10 flex flex-col justify-end h-full">
                  <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-[#10b981]/10 text-[#10b981] mb-4 border border-[#10b981]/20 w-max group-hover:-translate-y-1 transition-transform duration-300">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <h3 className="font-display text-xl font-black text-slate-100 uppercase tracking-wide">Control de Acceso</h3>
                  <p className="mt-2 text-sm text-slate-400 line-clamp-2">Pase de lista inmediato con códigos QR y notificaciones a padres.</p>
                  
                  <div className="mt-4 inline-flex items-center text-[#10b981] text-xs font-bold uppercase tracking-wider opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                    Explorar Función <ArrowRight className="ml-2 w-4 h-4" />
                  </div>
                </div>
              </button>

              {/* Tarjeta 2: Seguimiento Deportivo */}
              <button 
                onClick={() => setActiveChapter(2)}
                className="md:col-span-1 relative group overflow-hidden rounded-[2rem] border border-slate-800/80 bg-slate-900 text-left transition-all duration-500 hover:border-amber-500/50 hover:shadow-[0_0_40px_rgba(245,158,11,0.15)] focus:outline-none"
              >
                <div className="absolute inset-0 w-full h-full">
                  <Image 
                    src="/screenshots/coach_evaluacion_salud.jpg" 
                    alt="Seguimiento Deportivo" 
                    fill
                    className="object-cover object-top opacity-60 group-hover:opacity-80 group-hover:scale-105 transition-all duration-700" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#07090e] via-[#07090e]/80 to-transparent" />
                </div>
                
                <div className="absolute inset-x-0 bottom-0 p-8 z-10 flex flex-col justify-end h-full">
                  <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-amber-500/10 text-amber-500 mb-4 border border-amber-500/20 w-max group-hover:-translate-y-1 transition-transform duration-300">
                    <Trophy className="w-6 h-6" />
                  </div>
                  <h3 className="font-display text-xl font-black text-slate-100 uppercase tracking-wide">Desarrollo Deportivo</h3>
                  <p className="mt-2 text-sm text-slate-400 line-clamp-2">Evaluaciones técnicas y gráficos de rendimiento de cada atleta.</p>
                  
                  <div className="mt-4 inline-flex items-center text-amber-500 text-xs font-bold uppercase tracking-wider opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                    Explorar Función <ArrowRight className="ml-2 w-4 h-4" />
                  </div>
                </div>
              </button>

              {/* Tarjeta 3: Gestión Administrativa */}
              <button 
                onClick={() => setActiveChapter(3)}
                className="md:col-span-2 relative group overflow-hidden rounded-[2rem] border border-slate-800/80 bg-slate-900 text-left transition-all duration-500 hover:border-sky-500/50 hover:shadow-[0_0_40px_rgba(14,165,233,0.15)] focus:outline-none"
              >
                <div className="absolute inset-0 w-full h-full">
                  <Image 
                    src="/screenshots/admin_dashboard_premium.jpg" 
                    alt="Gestión Administrativa" 
                    fill
                    className="object-cover object-left opacity-60 group-hover:opacity-80 group-hover:scale-105 transition-all duration-700" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#07090e] via-[#07090e]/60 to-transparent md:bg-gradient-to-r md:from-[#07090e] md:via-[#07090e]/80 md:to-transparent" />
                </div>
                
                <div className="absolute inset-0 p-8 z-10 flex flex-col justify-end md:justify-center md:w-1/2">
                  <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-sky-500/10 text-sky-400 mb-4 border border-sky-500/20 w-max group-hover:-translate-y-1 transition-transform duration-300">
                    <Users className="w-6 h-6" />
                  </div>
                  <h3 className="font-display text-2xl font-black text-slate-100 uppercase tracking-wide">Gestión Centralizada</h3>
                  <p className="mt-2 text-sm text-slate-300">
                    Conecta a la directiva, cuerpo técnico y familias en un ecosistema unificado. Controla la tesorería y estadísticas de crecimiento en tiempo real.
                  </p>
                  
                  <div className="mt-6 inline-flex items-center text-sky-400 text-xs font-bold uppercase tracking-wider opacity-0 translate-x-[-10px] group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                    Explorar Función <ArrowRight className="ml-2 w-4 h-4" />
                  </div>
                </div>
              </button>

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
        isOpen={activeChapter !== null}
        onClose={() => setActiveChapter(null)}
        initialStep={activeChapter ? activeChapter - 1 : 0}
        title="Detalle de Funcionalidad"
        accentColor="emerald"
        steps={accessSteps}
        onComplete={() => {
          setToastMessage("¡Gracias por explorar nuestras funciones premium!");
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
