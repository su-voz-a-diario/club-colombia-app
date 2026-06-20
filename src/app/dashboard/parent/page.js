"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ShieldCheck, LogOut, ChartBar, CreditCard, Image as ImageIcon, Sparkles, Trophy, Calendar, CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import QRGenerator from "@/components/QRGenerator";
import RadarPerformance from "@/components/RadarPerformance";
import PaymentSimulator from "@/components/PaymentSimulator";
import { db } from "@/lib/firebase";
import { doc, onSnapshot, updateDoc, collection, addDoc, query, where } from "firebase/firestore";

export default function ParentDashboard() {
  const [studentName, setStudentName] = useState("Juan Andrés García");
  const [categoryName, setCategoryName] = useState("Sub-10 Competitivo");
  const [studentStatus, setStudentStatus] = useState("suspended"); // 'active' | 'suspended' | 'pending_validation' | 'on_hold'
  const [activeTab, setActiveTab] = useState("performance"); // 'performance' | 'billing' | 'gallery'
  const [myPayments, setMyPayments] = useState([]);
  const [representativeName, setRepresentativeName] = useState("Ricardo García");
  const [userEmail, setUserEmail] = useState("");

  // Métricas del deportista (leídas en tiempo real de Firestore)
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

  // Helper para leer cookies en el cliente
  const getCookie = (name) => {
    if (typeof document === "undefined") return "";
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return "";
  };

  useEffect(() => {
    const email = getCookie("user-email") || "ricardo.garcia@gmail.com";
    setUserEmail(email);

    // 1. Escuchar perfil del usuario en Firestore
    const unsubscribeUser = onSnapshot(doc(db, "users", email.toLowerCase()), (docSnap) => {
      if (docSnap.exists()) {
        const userData = docSnap.data();
        if (userData.name) setRepresentativeName(userData.name);
        if (userData.studentName) setStudentName(userData.studentName);
        if (userData.categoryName) setCategoryName(userData.categoryName);
        if (userData.status) {
          setStudentStatus(userData.status);
          document.cookie = `user-status=${userData.status}; path=/; max-age=86400`;
        }
      }
    });

    return () => {
      unsubscribeUser();
    };
  }, []);

  // Escuchar estudiante, evaluaciones y pagos correspondientes una vez que sabemos el nombre del estudiante y el correo
  useEffect(() => {
    if (!studentName || !userEmail) return;

    // 2. Escuchar datos dinámicos del estudiante (como cambios en categoría por overrides)
    const unsubscribeStudent = onSnapshot(doc(db, "students", studentName), (docSnap) => {
      if (docSnap.exists()) {
        const studentData = docSnap.data();
        if (studentData.category) setCategoryName(studentData.category);
        if (studentData.status) setStudentStatus(studentData.status);
      }
    });

    // 3. Escuchar calificaciones técnicas en Firestore (de la colección 'evaluations')
    const unsubscribeEval = onSnapshot(doc(db, "evaluations", studentName), (docSnap) => {
      if (docSnap.exists()) {
        const evalData = docSnap.data();
        if (evalData.metrics) setMetrics(evalData.metrics);
        if (evalData.tacticalNotes) setCoachNotes(evalData.tacticalNotes);
      }
    });

    // 4. Escuchar historial de pagos del usuario en Firestore
    const qPays = query(collection(db, "payments"), where("parentEmail", "==", userEmail.toLowerCase()));
    const unsubscribePayments = onSnapshot(qPays, (snapshot) => {
      const pays = [];
      snapshot.forEach((doc) => {
        pays.push({ id: doc.id, ...doc.data() });
      });
      setMyPayments(pays);
    });

    return () => {
      unsubscribeStudent();
      unsubscribeEval();
      unsubscribePayments();
    };
  }, [studentName, userEmail]);

  const handlePaymentSuccess = async (amount, paymentLabel) => {
    if (!userEmail || !studentName) return;

    try {
      // 1. Guardar solicitud en la colección 'payments' en Firestore
      await addDoc(collection(db, "payments"), {
        studentName: studentName,
        categoryName: categoryName,
        amount: amount,
        paymentType: paymentLabel,
        date: new Date().toLocaleDateString("es-MX") + " " + new Date().toLocaleTimeString("es-MX", { hour: '2-digit', minute: '2-digit' }),
        status: "pending",
        parentEmail: userEmail.toLowerCase()
      });

      // 2. Cambiar estatus a 'pending_validation' en el perfil del usuario, del estudiante y cookies
      await updateDoc(doc(db, "users", userEmail.toLowerCase()), {
        status: "pending_validation"
      });

      await updateDoc(doc(db, "students", studentName), {
        status: "pending_validation",
        dueDays: 0
      });

      localStorage.setItem("simulatedStatus", "pending_validation");
      document.cookie = `user-status=pending_validation; path=/; max-age=86400`;

      setStudentStatus("pending_validation");
    } catch (err) {
      console.error("Error al reportar pago en Firestore:", err);
    }
  };

  return (
    <div className="min-h-screen bg-[#07090e] flex flex-col">
      {/* Header */}
      <header className="glass-panel border-b border-slate-900 px-6 py-4 flex items-center justify-between sticky top-0 z-40">
        <Link href="/" className="flex items-center gap-2.5 hover:opacity-90 transition-all">
          <div>
            <span className="font-display font-black text-xs uppercase tracking-wider text-slate-200 block">
              Portal Deportista <span className="text-[#10b981]">Club Colombia</span>
            </span>
            <span className="text-[9px] text-slate-500 font-bold block mt-0.5">Representante: {representativeName}</span>
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

      {/* Portal Welcome Section */}
      <div className="max-w-5xl w-full mx-auto px-4 pt-6 text-center flex flex-col items-center">
        <img 
          src="/logo.png" 
          alt="Escudo Club Colombia" 
          className="w-20 h-20 object-contain mb-3 filter drop-shadow-[0_0_15px_rgba(16,185,129,0.15)] animate-pulse-subtle" 
        />
        <h2 className="font-display font-black text-xl text-slate-100 uppercase tracking-wider">
          Portal del Deportista
        </h2>
        <p className="text-[9px] font-mono text-[#10b981] font-bold uppercase tracking-widest mt-1">
          Escuela de Fútbol Club Colombia
        </p>
      </div>

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

          {/* Tarjetas de Alerta de Estado del Alumno */}
          {studentStatus === "suspended" && (
            <div className="bg-red-500/5 border border-red-500/15 p-4 rounded-2xl w-full text-center font-sans">
              <span className="text-[9px] font-bold text-red-500 uppercase tracking-wider block">Mora Registrada</span>
              <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                Has superado el periodo de gracia de 5 días hábiles. Realiza tu pago para habilitar el acceso.
              </p>
            </div>
          )}

          {studentStatus === "pending_validation" && (
            <div className="bg-amber-500/5 border border-amber-500/15 p-4 rounded-2xl w-full text-center font-sans animate-pulse-subtle">
              <span className="text-[9px] font-bold text-amber-500 uppercase tracking-wider block">Verificación Pendiente</span>
              <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                Reporte de transferencia recibido. En proceso de validación bancaria.
              </p>
            </div>
          )}

          {studentStatus === "on_hold" && (
            <div className="bg-amber-500/5 border border-amber-500/15 p-4 rounded-2xl w-full text-center font-sans">
              <span className="text-[9px] font-bold text-amber-500 uppercase tracking-wider block">Pago bajo Aclaración</span>
              <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                Tu pago fue catalogado En Espera. Revisa los datos reportados o contacta al club.
              </p>
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

        {/* Right Column: Dynamic Content Tab or Lock Overlay */}
        <div className="md:col-span-2 relative">
          {studentStatus === "active" ? (
            <>
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
                <div className="bg-[#0e121e] border border-slate-900 rounded-3xl p-5 space-y-4 font-sans">
                  <div>
                    <h2 className="font-display font-black text-sm uppercase tracking-wider text-slate-200">Estado de Facturación</h2>
                    <p className="text-[10px] text-slate-500 mt-0.5">Control de matrículas y mensualidades del deportista.</p>
                  </div>

                  <div className="space-y-3">
                    {/* Pagos Reportados Dinámicos (localStorage) */}
                    {myPayments.map((payment) => (
                      <div key={payment.id} className="bg-[#07090e]/60 border border-slate-800/80 p-4 rounded-2xl flex justify-between items-center animate-pulse-subtle">
                        <div>
                          <span className="font-bold text-xs text-slate-200 block">{payment.paymentType} (${payment.amount} MXN)</span>
                          <span className="text-[9px] text-slate-500 block mt-0.5">Reportado el: {payment.date} | Transferencia Directa</span>
                        </div>
                        {payment.status === "approved" ? (
                           <div className="flex items-center gap-1.5 text-[#10b981] bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full text-[10px] font-bold uppercase">
                             <CheckCircle2 className="w-3.5 h-3.5" />
                             Validado
                           </div>
                        ) : payment.status === "on_hold" ? (
                           <div className="flex items-center gap-1.5 text-amber-500 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full text-[10px] font-bold uppercase">
                             <Clock className="w-3.5 h-3.5 animate-spin-slow" />
                             En Espera
                           </div>
                        ) : (
                           <div className="flex items-center gap-1.5 text-red-500 bg-red-500/10 border border-red-500/20 px-3 py-1 rounded-full text-[10px] font-bold uppercase animate-pulse">
                             <Clock className="w-3.5 h-3.5" />
                             Por Validar
                           </div>
                        )}
                      </div>
                    ))}

                    {/* Pago 1 */}
                    <div className="bg-[#07090e]/60 border border-slate-800/80 p-4 rounded-2xl flex justify-between items-center">
                      <div>
                        <span className="font-bold text-xs text-slate-200 block">Mensualidad Junio 2026 ($300 MXN)</span>
                        <span className="text-[9px] text-slate-500 block mt-0.5">Vence: 05-Jun-2026 | Plan Mensual</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[#10b981] bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full text-[10px] font-bold uppercase">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Pagado
                      </div>
                    </div>

                    {/* Clase Individual */}
                    <div className="bg-[#07090e]/60 border border-slate-800/80 p-4 rounded-2xl flex justify-between items-center">
                      <div>
                        <span className="font-bold text-xs text-slate-200 block">Clase de Entrenamiento ($50 MXN)</span>
                        <span className="text-[9px] text-slate-500 block mt-0.5">Entrenamiento: 20-May-2026 | Pago Único por Clase</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[#10b981] bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full text-[10px] font-bold uppercase">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Pagado
                      </div>
                    </div>

                    {/* Pago 2 */}
                    <div className="bg-[#07090e]/60 border border-slate-800/80 p-4 rounded-2xl flex justify-between items-center">
                      <div>
                        <span className="font-bold text-xs text-slate-200 block">Inscripción General Anual ($300 MXN)</span>
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
            </>
          ) : (
            /* Pantalla de bloqueo premium (Paywall) con Simulator */
            <div className="bg-[#0e121e]/80 border border-red-500/10 rounded-3xl p-6 sm:p-8 flex flex-col items-center justify-center text-center space-y-6 relative overflow-hidden backdrop-blur-md font-sans">
              {/* Faint lock icon in background */}
              <div className="absolute -right-10 -bottom-10 opacity-[0.02] pointer-events-none">
                <ShieldCheck className="w-64 h-64 text-red-500" />
              </div>

              <div className="w-12 h-12 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center text-red-500 animate-pulse">
                <AlertTriangle className="w-6 h-6" />
              </div>

              <div className="max-w-md space-y-2">
                <span className="text-[9px] font-mono text-red-500 font-black uppercase tracking-widest block">
                  {studentStatus === "suspended" ? "Acceso Suspendido por Falta de Pago" : studentStatus === "on_hold" ? "Pago Marcado En Espera" : "Validación de Depósito Requerida"}
                </span>
                <h2 className="font-display font-black text-lg sm:text-xl text-slate-100 uppercase tracking-wide">
                  {studentStatus === "suspended" ? "Reactiva tu Credencial QR" : studentStatus === "on_hold" ? "Depósito bajo Aclaración" : "Verificando Depósito Bancario"}
                </h2>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {studentStatus === "suspended" && (
                    "Para ver las evaluaciones tácticas del Profe Mario Silva, consultar el cronograma de entrenamientos y ver la galería de fotos, es necesario realizar tu pago mensual de $300 MXN o pago por clase de $50 MXN a Banorte y reportar la transferencia abajo."
                  )}
                  {studentStatus === "pending_validation" && (
                    "Tu transferencia directa Banorte ha sido reportada. El Profe Luis López está validando el dinero en la cuenta. El portal y tu credencial QR se desbloquearán de forma automática en cuanto confirme."
                  )}
                  {studentStatus === "on_hold" && (
                    "El Profe Luis López no ha podido identificar tu transferencia en la cuenta Banorte o requiere aclaraciones. A continuación puedes volver a subir los detalles o reportar otro depósito."
                  )}
                </p>
              </div>

              {/* Simulador integrado dentro del bloqueo si no está validado */}
              {studentStatus !== "pending_validation" ? (
                <div className="w-full max-w-sm pt-2">
                  <PaymentSimulator 
                    amount={300} 
                    onPaymentSuccess={handlePaymentSuccess} 
                  />
                </div>
              ) : (
                <div className="w-full max-w-sm bg-[#07090e] border border-slate-800 p-5 rounded-2xl space-y-3 text-left">
                  <div className="flex items-center gap-2 text-red-500 font-bold text-xs uppercase tracking-wider">
                    <Clock className="w-4 h-4 animate-spin-slow" />
                    Estado: Depositado (Por Validar)
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed font-normal">
                    Tu reporte se envió exitosamente. El Profe Luis López verificará tu depósito en la tarjeta de Banorte. Puedes mantener abierta esta ventana; el portal se desbloqueará de forma automática.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
