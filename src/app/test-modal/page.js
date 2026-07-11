"use client";

import React, { useState } from "react";
import FeatureTourModal from "@/components/FeatureTourModal";
import { Shield, Trophy, Users, CreditCard, Activity } from "lucide-react";

// Mock Visual Component 1: QR Access Simulator
function QRAccessMock() {
  return (
    <div className="w-full h-full bg-[#090d16] border border-slate-850 rounded-3xl p-6 flex flex-col items-center justify-center space-y-4 relative overflow-hidden">
      <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[8px] font-black uppercase tracking-wider">
        Demo Live
      </div>
      <div className="w-24 h-24 bg-white p-2 rounded-xl flex items-center justify-center relative">
        <svg width="100%" height="100%" viewBox="0 0 29 29" className="text-slate-950 fill-current">
          <path d="M0 0h7v7H0zm1 1v5h5V1zm1 1h3v3H2zm20-2h7v7H22zm1 1v5h5V1zm1 1h3v3H24zM0 22h7v7H0zm1 1v5h5v-5zm1 1h3v3H2zM22 22h5v5H22zm1 1v3h3V23zm1 1h1v1h-1z" />
          <path d="M8 6h14v1H8zm-2 2v14h1V8zm3 1h2v1H9zm4 0h1v2h-1zm3 0h2v1h-2zm-10 2h1v1h-1zm3 0h2v1h-2zm3 0h1v2h-1zm-9 2h2v1H9zm3 0h1v1h-1zm2 0h2v1h-2zm-7 2h1v2H9zm3 0h2v1h-2zm3 0h1v1h-1zm-6 2h1v1h-1zm3 0h2v1H12zm-6 2h2v1H10zm3 0h1v1h-1zm-9 2h1v1H9zm2 0h3v1h-3z" />
        </svg>
        <div className="absolute left-0 right-0 h-0.5 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-[bounce_2.5s_infinite] top-2" />
      </div>
      <div className="text-center space-y-1">
        <span className="text-[10px] font-bold text-slate-200 block">Mateo González Centeno</span>
        <span className="text-[8px] font-mono text-emerald-400 font-bold uppercase tracking-widest bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.5 rounded-full inline-block">
          QR Activo
        </span>
      </div>
    </div>
  );
}

// Mock Visual Component 2: Radar Performance Graph
function RadarMock() {
  return (
    <div className="w-full h-full bg-[#090d16] border border-slate-850 rounded-3xl p-6 flex flex-col items-center justify-center space-y-4">
      <div className="relative w-32 h-32 flex items-center justify-center">
        <svg viewBox="0 0 100 100" className="w-full h-full text-slate-850 stroke-current fill-none">
          <polygon points="50,5 95,35 77,88 23,88 5,35" strokeWidth="0.5" />
          <polygon points="50,20 80,42 68,75 32,75 20,42" strokeWidth="0.5" />
          <polygon points="50,35 65,49 59,62 41,62 35,49" strokeWidth="0.5" />
          <line x1="50" y1="50" x2="50" y2="5" strokeWidth="0.5" />
          <line x1="50" y1="50" x2="95" y2="35" strokeWidth="0.5" />
          <line x1="50" y1="50" x2="77" y2="88" strokeWidth="0.5" />
          <line x1="50" y1="50" x2="23" y2="88" strokeWidth="0.5" />
          <line x1="50" y1="50" x2="5" y2="35" strokeWidth="0.5" />
          <polygon points="50,25 82,42 70,68 40,75 12,42" className="stroke-amber-500 fill-amber-500/20" strokeWidth="1.5" />
        </svg>
      </div>
      <div className="text-center">
        <span className="text-[10px] font-bold text-slate-200 block">Desempeño Promedio: 8.2/10</span>
        <span className="text-[7px] font-mono text-slate-500 uppercase tracking-widest block mt-0.5">Habilidades Técnicas</span>
      </div>
    </div>
  );
}

// Mock Visual Component 3: Billing Audit Dashboard
function BillingMock() {
  return (
    <div className="w-full h-full bg-[#090d16] border border-slate-850 rounded-3xl p-5 flex flex-col justify-between space-y-4">
      <div className="space-y-2 text-left">
        <span className="text-[8px] font-mono text-sky-400 font-bold uppercase tracking-widest block">Consola Financiera</span>
        <div className="flex justify-between items-center bg-[#0c0f17] border border-slate-800/80 p-2.5 rounded-xl">
          <div className="space-y-0.5">
            <span className="text-[9px] font-bold text-slate-200 block">Matrícula - Dante López</span>
            <span className="text-[7px] text-slate-500 block">Reportado: 11 de julio</span>
          </div>
          <span className="text-[8px] bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded font-black uppercase tracking-wider">
            Por Validar
          </span>
        </div>
        <div className="flex justify-between items-center bg-[#0c0f17] border border-slate-800/80 p-2.5 rounded-xl">
          <div className="space-y-0.5">
            <span className="text-[9px] font-bold text-slate-200 block">Mensualidad - Mateo Centeno</span>
            <span className="text-[7px] text-slate-500 block">Reportado: 10 de julio</span>
          </div>
          <span className="text-[8px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-black uppercase tracking-wider">
            Validado
          </span>
        </div>
      </div>
      <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden">
        <div className="h-full bg-sky-500 w-3/4 shadow-[0_0_8px_rgba(14,165,233,0.5)]" />
      </div>
    </div>
  );
}

export default function TestModalPage() {
  const [activeModal, setActiveModal] = useState(null); // 'access' | 'sports' | 'admin'

  const accessSteps = [
    {
      title: "Pase Escanable Inteligente",
      description: "Los alumnos ingresan a las canchas escaneando su código QR digital personalizado. Los entrenadores controlan la entrada directamente desde la aplicación de campo.",
      benefit: "Ingreso Fluido",
      type: "custom",
      visualContent: <QRAccessMock />,
    },
    {
      title: "Protección Contra Retrasos",
      description: "Si un alumno excede los 5 días hábiles de gracia en su pago mensual, la credencial QR se torna de color rojo, restringiendo temporalmente el acceso hasta su regularización.",
      benefit: "Cobranza Automatizada",
      type: "custom",
      visualContent: (
        <div className="w-full h-full bg-[#090d16] border border-slate-850 rounded-3xl p-6 flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center text-red-500 animate-pulse">
            <Shield className="w-7 h-7" />
          </div>
          <span className="text-[10px] font-bold text-slate-200 block text-center">Acceso Denegado - Pago Requerido</span>
        </div>
      ),
    },
    {
      title: "Logotipo Oficial Club Colombia",
      description: "Soporte de precarga de imágenes de alta resolución. Las imágenes secundarias se cargan en caché de forma transparente antes de cambiar la diapositiva.",
      benefit: "Diseño e Identidad",
      type: "image",
      imageSrc: "/logo.png"
    },
    {
      title: "Conciliación Directa STP",
      description: "El padre de familia reporta su comprobante de transferencia bancaria directamente en el portal. Al validarse en el panel administrativo, el QR es rehabilitado a color verde.",
      benefit: "Autogestión de Cuenta",
      type: "custom",
      visualContent: (
        <div className="w-full h-full bg-[#090d16] border border-slate-850 rounded-3xl p-6 flex flex-col items-center justify-center space-y-3">
          <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400">
            <CreditCard className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-bold text-slate-200 block text-center">Reporte de Pago Registrado</span>
        </div>
      ),
    },
  ];

  const sportsSteps = [
    {
      title: "Asistencia en Campo",
      description: "El entrenador registra la asistencia de los niños en su celular con un solo toque. Los padres reciben una alerta en tiempo real del estatus del deportista.",
      benefit: "100% Digital",
      type: "custom",
      visualContent: <RadarMock />,
    },
    {
      title: "Ficha de Habilidades",
      description: "Evaluación periódica de 6 métricas clave: velocidad, pase, regate, tiro, físico y disciplina. Acompañado de notas tácticas específicas escritas por el coach.",
      benefit: "Monitoreo Técnico",
      type: "custom",
      visualContent: (
        <div className="w-full h-full bg-[#090d16] border border-slate-850 rounded-3xl p-6 flex flex-col items-center justify-center space-y-3">
          <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 rounded-full flex items-center justify-center text-amber-500">
            <Activity className="w-5 h-5 animate-pulse" />
          </div>
          <span className="text-[10px] font-bold text-slate-200 block text-center">Rendimiento Físico Monitoreado</span>
        </div>
      ),
    },
  ];

  const adminSteps = [
    {
      title: "Consola Directiva Integral",
      description: "Centro de control financiero y deportivo. Permite gestionar alumnos, validar inscripciones en línea y dar altas manuales en segundos.",
      benefit: "SaaS Administrativo",
      type: "custom",
      visualContent: <BillingMock />,
    },
  ];

  return (
    <div className="min-h-screen bg-[#07090e] text-[#ededed] flex flex-col items-center justify-center p-6 space-y-12">
      <div className="text-center space-y-3 max-w-lg">
        <span className="text-xs font-mono text-emerald-400 font-bold uppercase tracking-widest">
          Consola de Pruebas
        </span>
        <h1 className="font-display font-black text-3xl uppercase tracking-wide">
          Prototipo de Componente Modal Perfeccionado
        </h1>
        <p className="text-xs text-slate-400 leading-relaxed">
          Usa los siguientes botones para desplegar y verificar el comportamiento del modal premium reutilizable en sus tres temas estéticos de acento.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        {/* Button 1: Access Control */}
        <button
          onClick={() => setActiveModal("access")}
          className="flex items-center gap-2 bg-[#0e121e] border border-slate-800 hover:border-emerald-500/30 px-6 py-3.5 rounded-2xl text-xs font-bold font-display uppercase tracking-wider transition-all cursor-pointer hover:bg-[#0e121e]/80"
        >
          <Shield className="w-4 h-4 text-emerald-400" />
          Control de Acceso (Emerald)
        </button>

        {/* Button 2: Sports Tracking */}
        <button
          onClick={() => setActiveModal("sports")}
          className="flex items-center gap-2 bg-[#0e121e] border border-slate-800 hover:border-amber-500/30 px-6 py-3.5 rounded-2xl text-xs font-bold font-display uppercase tracking-wider transition-all cursor-pointer hover:bg-[#0e121e]/80"
        >
          <Trophy className="w-4 h-4 text-amber-500" />
          Seguimiento Deportivo (Amber)
        </button>

        {/* Button 3: Admin Console */}
        <button
          onClick={() => setActiveModal("admin")}
          className="flex items-center gap-2 bg-[#0e121e] border border-slate-800 hover:border-sky-500/30 px-6 py-3.5 rounded-2xl text-xs font-bold font-display uppercase tracking-wider transition-all cursor-pointer hover:bg-[#0e121e]/80"
        >
          <Users className="w-4 h-4 text-sky-400" />
          Gestión Administrativa (Sky)
        </button>
      </div>

      {/* Access Control Modal */}
      <FeatureTourModal
        isOpen={activeModal === "access"}
        onClose={() => setActiveModal(null)}
        title="Control de Acceso y Credenciales"
        accentColor="emerald"
        steps={accessSteps}
      />

      {/* Sports Tracking Modal */}
      <FeatureTourModal
        isOpen={activeModal === "sports"}
        onClose={() => setActiveModal(null)}
        title="Seguimiento y Rendimiento Técnico"
        accentColor="amber"
        steps={sportsSteps}
      />

      {/* Admin Console Modal */}
      <FeatureTourModal
        isOpen={activeModal === "admin"}
        onClose={() => setActiveModal(null)}
        title="Gestión y Control de Operaciones"
        accentColor="sky"
        steps={adminSteps}
      />
    </div>
  );
}
