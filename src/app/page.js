import React from "react";
import Link from "next/link";
import { ShieldCheck, Trophy, QrCode, ChartBar, Users, ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-[#07090e] selection:bg-brand-green selection:text-white">
      {/* Header / Navegación */}
      <header className="sticky top-0 z-50 glass-panel border-b border-slate-900 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-7 h-7 text-[#10b981]" />
          <span className="font-display font-black text-lg tracking-wide uppercase">
            Club <span className="text-[#10b981]">Colombia</span>
          </span>
        </div>
        
        <Link 
          href="/login"
          className="bg-[#10b981] hover:bg-[#059669] text-slate-950 font-display font-extrabold text-xs px-5 py-2.5 rounded-full transition-all flex items-center gap-1.5 shadow-lg shadow-emerald-500/10 cursor-pointer"
        >
          Portal Club
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </header>

      {/* Hero Section */}
      <section className="flex-1 flex flex-col justify-center items-center px-6 py-16 text-center max-w-4xl mx-auto relative overflow-hidden">
        {/* Glows de fondo */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-emerald-500/5 filter blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 left-1/4 w-[250px] h-[250px] rounded-full bg-amber-500/5 filter blur-[100px] pointer-events-none" />

        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/60 border border-slate-800/80 mb-6 z-10 animate-pulse">
          <Trophy className="w-4 h-4 text-amber-500" />
          <span className="text-[10px] font-display font-bold uppercase tracking-wider text-slate-300">
            Formación Deportiva de Alto Rendimiento
          </span>
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

        <p className="text-slate-400 text-sm sm:text-base max-w-xl mt-6 leading-relaxed z-10">
          Un ecosistema digital premium para atletas, entrenadores y padres. Ficha técnica en tiempo real, credencial QR segura y cobro recurrente integrado.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mt-10 z-10 w-full justify-center">
          <Link
            href="/login?tab=register"
            className="bg-[#10b981] hover:bg-[#059669] text-slate-950 font-display font-black text-sm px-8 py-3.5 rounded-full transition-all shadow-xl shadow-emerald-500/10 cursor-pointer"
          >
            Inscripción en Línea
          </Link>
          <Link
            href="/login"
            className="bg-slate-900/60 hover:bg-slate-900/90 border border-slate-800 text-slate-200 font-display font-bold text-sm px-8 py-3.5 rounded-full transition-all cursor-pointer"
          >
            Ingresar al Portal
          </Link>
        </div>
      </section>

      {/* Características Destacadas */}
      <section className="px-6 py-16 border-t border-slate-900/80 bg-[#090d16]/30">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-display font-black text-xl sm:text-2xl text-center text-slate-200 uppercase tracking-wider mb-12">
            Módulos Diseñados para la Excelencia
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Tarjeta 1 */}
            <div className="p-6 bg-[#0e121e]/60 border border-slate-800/80 rounded-2xl flex flex-col gap-4">
              <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400">
                <QrCode className="w-5 h-5" />
              </div>
              <h3 className="font-display font-bold text-sm text-slate-200 uppercase tracking-wide">
                Credencial Digital QR
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Control de acceso sin fricciones. Código QR encriptado único para cada atleta con validación de estado en campo.
              </p>
            </div>

            {/* Tarjeta 2 */}
            <div className="p-6 bg-[#0e121e]/60 border border-slate-800/80 rounded-2xl flex flex-col gap-4">
              <div className="w-10 h-10 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center text-amber-500">
                <ChartBar className="w-5 h-5" />
              </div>
              <h3 className="font-display font-bold text-sm text-slate-200 uppercase tracking-wide">
                Evaluación Táctica e Historial
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Seguimiento técnico a través de gráficos de radar interactivos. Los entrenadores califican habilidades directo en cancha.
              </p>
            </div>

            {/* Tarjeta 3 */}
            <div className="p-6 bg-[#0e121e]/60 border border-slate-800/80 rounded-2xl flex flex-col gap-4">
              <div className="w-10 h-10 bg-sky-500/10 border border-sky-500/20 rounded-xl flex items-center justify-center text-sky-400">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="font-display font-bold text-sm text-slate-200 uppercase tracking-wide">
                Gestión Recurrente Inteligente
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Débito automático y pagos integrados con Mercado Pago. Automatización de suspensiones tras el período de gracia de 5 días.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-900/80 px-6 py-6 text-center text-[10px] text-slate-600 font-mono">
        © 2026 Escuela de Fútbol Club Colombia. Todos los derechos reservados. <br/>
        Diseñado bajo estándares de alto rendimiento y arquitectura SaaS deportiva.
      </footer>
    </div>
  );
}
