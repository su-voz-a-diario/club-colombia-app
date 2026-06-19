"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, UserCheck, Users, Dumbbell, ArrowRight, UserPlus, LogIn, Calendar, QrCode, Sparkles } from "lucide-react";
import Link from "next/link";
import PaymentSimulator from "@/components/PaymentSimulator";
import QRGenerator from "@/components/QRGenerator";

export default function Login() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("login"); // 'login' | 'register'
  
  // Estados para simulación de Inscripción
  const [registerStep, setRegisterStep] = useState(1); // 1: Datos, 2: Horarios/Pago, 3: Credencial QR
  const [parentName, setParentName] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [studentName, setStudentName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [studentCategory, setStudentCategory] = useState(null);

  // Leer query params al cargar
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get("tab");
      if (tab === "register") {
        setActiveTab("register");
      }
    }
  }, []);

  // Calcular categoría recomendada
  const handleBirthDateChange = (e) => {
    const dateStr = e.target.value;
    setBirthDate(dateStr);
    if (!dateStr) return;

    const birthYear = new Date(dateStr).getFullYear();
    const currentYear = 2026; // Local Time/Context Year
    const age = currentYear - birthYear;

    let cat = { name: "Sub-8 Iniciación", schedules: "Lunes y Miércoles 3:30 PM - 5:00 PM", cost: 300 };
    if (age > 8 && age <= 10) {
      cat = { name: "Sub-10 Competitivo", schedules: "Martes y Jueves 4:00 PM - 6:00 PM", cost: 300 };
    } else if (age > 10 && age <= 12) {
      cat = { name: "Sub-12 Elite", schedules: "Lunes, Miércoles y Viernes 4:00 PM - 6:00 PM", cost: 300 };
    } else if (age > 12) {
      cat = { name: "Sub-15 Avanzado", schedules: "Martes, Jueves y Sábado 5:00 PM - 7:00 PM", cost: 300 };
    }
    setStudentCategory(cat);
  };

  const handleNextStep = (e) => {
    e.preventDefault();
    if (registerStep === 1 && studentCategory) {
      setRegisterStep(2);
    }
  };

  const handlePaymentCompleted = () => {
    // Simular guardado de estado en localStorage para reflejarlo en el dashboard del padre
    localStorage.setItem("simulatedStudentName", studentName);
    localStorage.setItem("simulatedCategory", studentCategory.name);
    localStorage.setItem("simulatedStatus", "active");
    setRegisterStep(3);
  };

  return (
    <div className="min-h-screen flex flex-col justify-center bg-[#07090e] px-4 py-8 relative overflow-hidden select-none">
      {/* Background glow lines */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-emerald-500/5 filter blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md mx-auto z-10">
        {/* Logo */}
        <div className="flex flex-col items-center justify-center mb-8">
          <Link href="/" className="flex items-center gap-2 mb-2 hover:opacity-80 transition-all">
            <ShieldCheck className="w-8 h-8 text-[#10b981]" />
            <span className="font-display font-black text-xl tracking-wider uppercase">
              Club <span className="text-[#10b981]">Colombia</span>
            </span>
          </Link>
          <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Plataforma de Gestión Integrada</p>
          <Link href="/" className="text-[10px] text-slate-400 hover:text-[#10b981] mt-2 underline transition-all font-semibold">
            ← Volver a Inicio
          </Link>
        </div>

        {/* Tabs */}
        {registerStep < 3 && (
          <div className="grid grid-cols-2 bg-[#0e121e] border border-slate-900 rounded-xl p-1 mb-6">
            <button
              onClick={() => {
                setActiveTab("login");
                setRegisterStep(1);
              }}
              className={`py-2 text-xs font-bold font-display rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === "login"
                  ? "bg-slate-800 text-slate-100 border border-slate-700/60"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              Ingresar
            </button>
            <button
              onClick={() => setActiveTab("register")}
              className={`py-2 text-xs font-bold font-display rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === "register"
                  ? "bg-slate-800 text-slate-100 border border-slate-700/60"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              Inscripción
            </button>
          </div>
        )}

        {/* Tab Content: LOGIN */}
        {activeTab === "login" && (
          <div className="bg-[#0e121e]/80 border border-slate-900 p-6 rounded-3xl shadow-xl space-y-6">
            <div className="text-center">
              <h2 className="font-display font-bold text-sm text-slate-200 uppercase tracking-wider">Acceso Rápido de Simulación</h2>
              <p className="text-[11px] text-slate-500 mt-1">Selecciona un perfil de prueba para ingresar directamente al panel correspondiente.</p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => {
                  document.cookie = "user-role=admin; path=/";
                  document.cookie = "user-email=luis.lopez@clubcolombia.com; path=/";
                  router.push("/dashboard/admin");
                }}
                className="w-full bg-[#151b2d] hover:bg-[#1a233b] border border-slate-800 p-4 rounded-2xl flex items-center justify-between text-left transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Profe Luis López</h4>
                    <p className="text-[10px] text-slate-500 mt-0.5">Administrador General (Acceso Exclusivo)</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-[#10b981] group-hover:translate-x-1 transition-all" />
              </button>

              <button
                onClick={() => {
                  document.cookie = "user-role=coach; path=/";
                  document.cookie = "user-email=mario.silva@clubcolombia.com; path=/";
                  router.push("/dashboard/coach");
                }}
                className="w-full bg-[#151b2d] hover:bg-[#1a233b] border border-slate-800 p-4 rounded-2xl flex items-center justify-between text-left transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center text-amber-500">
                    <Dumbbell className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Entrenador</h4>
                    <p className="text-[10px] text-slate-500 mt-0.5">Control de campo y evaluaciones de habilidad</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-amber-500 group-hover:translate-x-1 transition-all" />
              </button>

              <button
                onClick={() => {
                  document.cookie = "user-role=parent; path=/";
                  document.cookie = "user-email=ricardo.garcia@gmail.com; path=/";
                  router.push("/dashboard/parent");
                }}
                className="w-full bg-[#151b2d] hover:bg-[#1a233b] border border-slate-800 p-4 rounded-2xl flex items-center justify-between text-left transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-sky-500/10 border border-sky-500/20 rounded-xl flex items-center justify-center text-sky-400">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Padres / Alumnos</h4>
                    <p className="text-[10px] text-slate-500 mt-0.5">Credencial QR, rendimiento y portal de pagos</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-sky-400 group-hover:translate-x-1 transition-all" />
              </button>
            </div>
          </div>
        )}

        {/* Tab Content: REGISTER / USER JOURNEY SIMULATOR */}
        {activeTab === "register" && (
          <div className="space-y-4">
            {registerStep === 1 && (
              <form onSubmit={handleNextStep} className="bg-[#0e121e]/80 border border-slate-900 p-6 rounded-3xl shadow-xl space-y-4">
                <div className="text-center mb-2">
                  <h2 className="font-display font-bold text-sm text-slate-200 uppercase tracking-wider">Paso 1: Ficha del Atleta</h2>
                  <p className="text-[11px] text-slate-500 mt-1">Completa los datos del menor para calcular su categoría deportiva de forma automática.</p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-[9px] text-slate-400 font-bold block mb-1">NOMBRE COMPLETO DEL PADRE / ACUDIENTE</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Ricardo García"
                      value={parentName}
                      onChange={(e) => setParentName(e.target.value)}
                      className="w-full bg-[#07090e] border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-700 focus:outline-none focus:border-brand-green"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] text-slate-400 font-bold block mb-1">TELÉFONO DE CONTACTO</label>
                    <input
                      type="tel"
                      required
                      placeholder="Ej. 300 123 4567"
                      value={parentPhone}
                      onChange={(e) => setParentPhone(e.target.value)}
                      className="w-full bg-[#07090e] border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-700 focus:outline-none focus:border-brand-green"
                    />
                  </div>

                  <hr className="border-slate-800/80 my-2" />

                  <div>
                    <label className="text-[9px] text-slate-400 font-bold block mb-1">NOMBRE COMPLETO DEL ALUMNO (ATLETA)</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Juan Andrés García"
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      className="w-full bg-[#07090e] border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-700 focus:outline-none focus:border-brand-green font-semibold"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] text-slate-400 font-bold block mb-1">FECHA DE NACIMIENTO DEL ATLETA</label>
                    <input
                      type="date"
                      required
                      value={birthDate}
                      onChange={handleBirthDateChange}
                      className="w-full bg-[#07090e] border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-brand-green"
                    />
                  </div>
                </div>

                {/* Categoría Recomendada Result */}
                {studentCategory && (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 flex flex-col gap-1.5 animate-fade-in mt-4">
                    <div className="flex items-center gap-1.5 text-emerald-400">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Categoría Asignada Automáticamente</span>
                    </div>
                    <div className="flex justify-between items-center text-xs mt-0.5">
                      <span className="font-display font-black text-slate-200">{studentCategory.name}</span>
                      <span className="text-slate-400 font-mono text-[10px] flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-[#10b981]" />
                        {studentCategory.schedules}
                      </span>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!studentCategory}
                  className="w-full bg-[#10b981] hover:bg-[#059669] disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-display font-black text-xs py-3 rounded-xl transition-all flex items-center justify-center gap-1.5 mt-4 cursor-pointer"
                >
                  Continuar al Pago
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>
            )}

            {/* Paso 2: Pasarela de Pago Recurrente Mercado Pago */}
            {registerStep === 2 && studentCategory && (
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="text-center w-full max-w-sm">
                  <span className="text-[9px] font-mono text-[#10b981] uppercase tracking-widest font-bold">Paso 2 de 3</span>
                  <h2 className="font-display font-black text-sm text-slate-200 uppercase tracking-wider mt-1">Checkout de Suscripción</h2>
                </div>
                <PaymentSimulator 
                  amount={studentCategory.cost} 
                  onPaymentSuccess={handlePaymentCompleted} 
                />
              </div>
            )}

            {/* Paso 3: Credencial QR y Activación Exitosa */}
            {registerStep === 3 && (
              <div className="flex flex-col items-center justify-center space-y-5 animate-fade-in">
                <div className="text-center max-w-xs">
                  <div className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider inline-flex items-center gap-1 mb-2">
                    <QrCode className="w-3.5 h-3.5" />
                    Inscripción Completada
                  </div>
                  <h2 className="font-display font-black text-base text-slate-100 uppercase tracking-wide">¡Bienvenido al Club!</h2>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    Tu inscripción fue validada. Se ha generado tu credencial digital. Preséntala al ingresar a las canchas.
                  </p>
                </div>

                <QRGenerator 
                  studentName={studentName} 
                  status="active" 
                  token={`CC-2026-${Math.floor(1000 + Math.random() * 9000)}`} 
                />

                <button
                  onClick={() => router.push("/dashboard/parent")}
                  className="w-full bg-[#10b981] hover:bg-[#059669] text-slate-950 font-display font-black text-xs py-3 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-xl shadow-emerald-500/10 cursor-pointer"
                >
                  Ir a Mi Portal del Deportista
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
