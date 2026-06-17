"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ShieldCheck, LogOut, ChartBar, CreditCard, Image as ImageIcon, Sparkles, Trophy, Calendar, CheckCircle2 } from "lucide-react";
import QRGenerator from "@/components/QRGenerator";
import RadarPerformance from "@/components/RadarPerformance";
import PaymentSimulator from "@/components/PaymentSimulator";

export default function ParentDashboard() {
  const [studentName, setStudentName] = useState("Juan Andrés García");
  const [categoryName, setCategoryName] = useState("Sub-10 Competitivo");
  const [studentStatus, setStudentStatus] = useState("suspended"); // Inicialmente suspendido para mostrar el flujo de reactivación por mora
  const [activeTab, setActiveTab] = useState("performance"); // 'performance' | 'billing' | 'gallery'

  // Métricas del deportista (leídas de localStorage si el entrenador las actualizó)
  const [metrics, setMetrics] = useState({
    speed: 8,
    passing: 7,
    dribbling: 9,
    shooting: 8,
    physical: 8,
    discipline: 9
  });
  const [coachNotes, setCoachNotes] = useState(
    "Juan Andrés ha mostrado un crecimiento excepcional en velocidad y juego colectivo. Debe continuar trabajando en su perfil izquierdo durante los tiros libres."
  );

  // Leer posibles estados simulados al cargar
  useEffect(() => {
    // Si fue registrado en el paso anterior
    const simName = localStorage.getItem("simulatedStudentName");
    const simCat = localStorage.getItem("simulatedCategory");
    const simStatus = localStorage.getItem("simulatedStatus");
    if (simName) setStudentName(simName);
    if (simCat) setCategoryName(simCat);
    if (simStatus) setStudentStatus(simStatus);

    // Si el entrenador guardó calificaciones
    const simMetrics = localStorage.getItem("simulatedMetrics");
    const simNotes = localStorage.getItem("simulatedNotes");
    if (simMetrics) setMetrics(JSON.parse(simMetrics));
    if (simNotes) setCoachNotes(simNotes);
  }, []);

  const handlePaymentSuccess = () => {
    setStudentStatus("active");
    localStorage.setItem("simulatedStatus", "active");
  };

  return (
    <div className="min-h-screen bg-[#07090e] flex flex-col">
      {/* Header */}
      <header className="glass-panel border-b border-slate-900 px-6 py-4 flex items-center justify-between sticky top-0 z-40">
        <Link href="/" className="flex items-center gap-2.5 hover:opacity-90 transition-all">
          <ShieldCheck className="w-6 h-6 text-[#10b981]" />
          <div>
            <span className="font-display font-black text-xs uppercase tracking-wider text-slate-200 block">
              Portal Deportista <span className="text-[#10b981]">Club Colombia</span>
            </span>
            <span className="text-[9px] text-slate-500 font-bold block mt-0.5">Representante: Ricardo García</span>
          </div>
        </Link>
        <div className="flex items-center gap-4">
          <Link 
            href="/"
            className="text-slate-400 hover:text-slate-200 font-display font-semibold text-xs transition-all"
          >
            Inicio
          </Link>
          <Link 
            href="/login"
            className="text-slate-400 hover:text-[#10b981] font-display font-semibold text-xs flex items-center gap-1.5 transition-all"
          >
            <LogOut className="w-4 h-4" />
            Salir
          </Link>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Column: QR Card & Payment Simulator if Suspended */}
        <div className="md:col-span-1 flex flex-col items-center gap-6">
          <div className="text-center w-full">
            <h3 className="text-[10px] font-mono text-slate-500 uppercase tracking-widest font-black mb-3">Ficha de Cancha</h3>
            <QRGenerator 
              studentName={studentName} 
              status={studentStatus} 
              token="CC-2026-8849" 
            />
          </div>

          {/* Si está suspendido, incrustar la simulación de pago directamente debajo de la credencial */}
          {studentStatus === "suspended" && (
            <div className="w-full flex flex-col items-center gap-3 animate-pulse-subtle">
              <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl w-full text-center">
                <span className="text-[9px] font-bold text-amber-500 uppercase tracking-wider block">Atención: Mensualidad Vencida</span>
                <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                  Has superado el periodo de gracia de 5 días hábiles. Realiza tu pago mediante Mercado Pago para rehabilitar tu QR de inmediato.
                </p>
              </div>
              <PaymentSimulator 
                amount={120000} 
                onPaymentSuccess={handlePaymentSuccess} 
              />
            </div>
          )}

          {/* Menú de pestañas para móviles */}
          <div className="bg-[#0e121e] border border-slate-900 rounded-2xl p-2 w-full grid grid-cols-3 gap-1">
            <button
              onClick={() => setActiveTab("performance")}
              className={`py-2 rounded-xl text-[10px] font-bold font-display transition-all flex flex-col items-center gap-1 cursor-pointer ${
                activeTab === "performance" ? "bg-slate-800 text-[#10b981] border border-slate-700/50" : "text-slate-400"
              }`}
            >
              <ChartBar className="w-3.5 h-3.5" />
              Rendimiento
            </button>
            <button
              onClick={() => setActiveTab("billing")}
              className={`py-2 rounded-xl text-[10px] font-bold font-display transition-all flex flex-col items-center gap-1 cursor-pointer ${
                activeTab === "billing" ? "bg-slate-800 text-sky-400 border border-slate-700/50" : "text-slate-400"
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              Pagos
            </button>
            <button
              onClick={() => setActiveTab("gallery")}
              className={`py-2 rounded-xl text-[10px] font-bold font-display transition-all flex flex-col items-center gap-1 cursor-pointer ${
                activeTab === "gallery" ? "bg-slate-800 text-amber-500 border border-slate-700/50" : "text-slate-400"
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              Galería
            </button>
          </div>
        </div>

        {/* Right Column: Dynamic Content Tab */}
        <div className="md:col-span-2">
          
          {/* TAB 1: RENDIMIENTO (RADAR CHART) */}
          {activeTab === "performance" && (
            <div className="bg-[#0e121e] border border-slate-900 rounded-3xl p-5 space-y-5">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="font-display font-black text-sm uppercase tracking-wider text-slate-200">Seguimiento de Desempeño</h2>
                  <p className="text-[10px] text-slate-500 mt-0.5">Informe consolidado de habilidades y comentarios del profesor.</p>
                </div>
                <div className="flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full text-[9px] font-bold text-[#10b981]">
                  <Trophy className="w-3 h-3" />
                  {categoryName}
                </div>
              </div>

              {/* Fila superior: Radar + Detalle textual */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                <RadarPerformance metrics={metrics} />
                
                <div className="bg-[#07090e]/60 border border-slate-800/80 p-4 rounded-2xl space-y-3">
                  <div className="flex items-center gap-1 text-[#10b981]">
                    <Sparkles className="w-4 h-4" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Reporte Técnico Trimestral</span>
                  </div>
                  <h4 className="text-[10px] font-mono text-slate-500 uppercase">PROFESOR: Mario Silva</h4>
                  <p className="text-xs text-slate-300 leading-relaxed italic">
                    "{coachNotes}"
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ESTADO DE CUENTA & PAGOS */}
          {activeTab === "billing" && (
            <div className="bg-[#0e121e] border border-slate-900 rounded-3xl p-5 space-y-4">
              <div>
                <h2 className="font-display font-black text-sm uppercase tracking-wider text-slate-200">Estado de Facturación</h2>
                <p className="text-[10px] text-slate-500 mt-0.5">Control de matrículas y mensualidades del deportista.</p>
              </div>

              <div className="space-y-3">
                {/* Pago 1 */}
                <div className="bg-[#07090e]/60 border border-slate-800/80 p-4 rounded-2xl flex justify-between items-center">
                  <div>
                    <span className="font-bold text-xs text-slate-200 block">Mensualidad Junio 2026</span>
                    <span className="text-[9px] text-slate-500 block mt-0.5">Vence: 05-Jun-2026 | Suscripción Recurrente</span>
                  </div>
                  {studentStatus === "active" ? (
                    <div className="flex items-center gap-1.5 text-[#10b981] bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full text-[10px] font-bold uppercase">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Pagado
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-1 rounded-full text-[10px] font-bold uppercase">
                      Vencido
                    </div>
                  )}
                </div>

                {/* Pago 2 */}
                <div className="bg-[#07090e]/60 border border-slate-800/80 p-4 rounded-2xl flex justify-between items-center">
                  <div>
                    <span className="font-bold text-xs text-slate-200 block">Matrícula & Seguro Médico Anual</span>
                    <span className="text-[9px] text-slate-500 block mt-0.5">Cobrado el: 10-Ene-2026 | Pago Único</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[#10b981] bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full text-[10px] font-bold uppercase">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Pagado
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: GALERÍA DE FOTOS */}
          {activeTab === "gallery" && (
            <div className="bg-[#0e121e] border border-slate-900 rounded-3xl p-5 space-y-4">
              <div>
                <h2 className="font-display font-black text-sm uppercase tracking-wider text-slate-200">Galería de {categoryName}</h2>
                <p className="text-[10px] text-slate-500 mt-0.5">Imágenes recientes de los entrenamientos y partidos de la categoría.</p>
              </div>

              {/* Grid de Fotos Simuladas */}
              <div className="grid grid-cols-2 gap-3">
                <div className="group relative aspect-video bg-[#07090e] border border-slate-800 rounded-2xl overflow-hidden flex flex-col justify-end p-3.5 hover:border-brand-green transition-all">
                  <div className="absolute top-2 left-2 bg-[#0e121e]/80 border border-slate-800 px-2 py-0.5 rounded text-[8px] font-mono text-slate-400">12-Jun-2026</div>
                  <span className="font-display font-bold text-[10px] text-slate-100 truncate z-10 group-hover:text-[#10b981] transition-all">Entrenamiento de Regate</span>
                  <span className="text-[8px] text-slate-500 block z-10">Cancha 2 - Profesor Mario</span>
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-70" />
                </div>

                <div className="group relative aspect-video bg-[#07090e] border border-slate-800 rounded-2xl overflow-hidden flex flex-col justify-end p-3.5 hover:border-brand-green transition-all">
                  <div className="absolute top-2 left-2 bg-[#0e121e]/80 border border-slate-800 px-2 py-0.5 rounded text-[8px] font-mono text-slate-400">08-Jun-2026</div>
                  <span className="font-display font-bold text-[10px] text-slate-100 truncate z-10 group-hover:text-[#10b981] transition-all">Charla Técnica Táctica</span>
                  <span className="text-[8px] text-slate-500 block z-10">Camerino Central</span>
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-70" />
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
