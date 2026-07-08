"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Calendar,
  CheckCircle,
  Clock,
  Megaphone,
  ShieldCheck,
  Trophy,
  Users
} from "lucide-react";
import { db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";

export default function Home() {
  const [announcement, setAnnouncement] = useState({
    date: new Date().toLocaleDateString("es-CO", {
      day: "numeric",
      month: "long",
      year: "numeric"
    }),
    text: "Bienvenidos a la plataforma oficial de la Escuela de Fútbol Club Colombia."
  });

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, "settings", "announcements"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.notice) {
          const dateLabel = data.date
            ? new Date(data.date).toLocaleDateString("es-CO", {
                day: "numeric",
                month: "long",
                year: "numeric"
              })
            : new Date().toLocaleDateString("es-CO", {
                day: "numeric",
                month: "long",
                year: "numeric"
              });

          setAnnouncement({
            date: dateLabel,
            text: data.notice
          });
        }
      }
    });

    return () => unsubscribe();
  }, []);

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

        <section className="border-t border-slate-900/80 bg-[#090d16]/30 px-6 py-14">
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-5 md:grid-cols-3">
            <article className="rounded-2xl border border-slate-800/80 bg-[#0e121e]/60 p-6">
              <ShieldCheck className="mb-4 h-7 w-7 text-[#10b981]" />
              <h2 className="font-display text-sm font-bold uppercase tracking-wide text-slate-200">
                Control de Acceso
              </h2>
              <p className="mt-2 text-xs leading-relaxed text-slate-400">
                Credenciales digitales para validar el estado de cada deportista y apoyar el registro de ingreso a entrenamientos.
              </p>
            </article>

            <article className="rounded-2xl border border-slate-800/80 bg-[#0e121e]/60 p-6">
              <CheckCircle className="mb-4 h-7 w-7 text-amber-500" />
              <h2 className="font-display text-sm font-bold uppercase tracking-wide text-slate-200">
                Seguimiento Deportivo
              </h2>
              <p className="mt-2 text-xs leading-relaxed text-slate-400">
                Evaluaciones técnicas, asistencia y comunicación entre entrenadores, acudientes y administración del club.
              </p>
            </article>

            <article className="rounded-2xl border border-slate-800/80 bg-[#0e121e]/60 p-6">
              <Users className="mb-4 h-7 w-7 text-sky-400" />
              <h2 className="font-display text-sm font-bold uppercase tracking-wide text-slate-200">
                Gestión Administrativa
              </h2>
              <p className="mt-2 text-xs leading-relaxed text-slate-400">
                Inscripciones, pagos reportados, comunicados oficiales y organización de categorías desde una sola plataforma.
              </p>
            </article>
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
    </div>
  );
}
