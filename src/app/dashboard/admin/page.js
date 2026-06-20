"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ShieldCheck, LogOut, Users, DollarSign, AlertTriangle, MessageSquare, PlusCircle, CheckCircle, RefreshCw, Calendar, Sparkles } from "lucide-react";
import { db, auth } from "@/lib/firebase";
import { collection, doc, onSnapshot, updateDoc, setDoc, getDoc, query, where, getDocs } from "firebase/firestore";
import { initializeApp, deleteApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signOut } from "firebase/auth";

export default function AdminDashboard() {
  const formatCurrency = (val) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      maximumFractionDigits: 0
    }).format(val);
  };

  // Datos de Firestore en estado
  const [students, setStudents] = useState([]);
  const [activeTab, setActiveTab] = useState("students"); // 'students' | 'billing' | 'schedules' | 'notifications'
  
  // Estados para override
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [newCategory, setNewCategory] = useState("");
  const [overrideReason, setOverrideReason] = useState("");

  // Estado para envío de notificación
  const [notificationText, setNotificationText] = useState("");
  const [notificationStatus, setNotificationStatus] = useState(false);

  // Estados para el formulario de inscripción manual
  const [showAddForm, setShowAddForm] = useState(false);
  const [manualStudentName, setManualStudentName] = useState("");
  const [manualStudentAge, setManualStudentAge] = useState("");
  const [manualParentName, setManualParentName] = useState("");
  const [manualParentPhone, setManualParentPhone] = useState("");
  const [manualParentEmail, setManualParentEmail] = useState("");
  const [manualParentPassword, setManualParentPassword] = useState("");
  const [manualPaidCash, setManualPaidCash] = useState(false);
  const [manualPaymentConcept, setManualPaymentConcept] = useState("monthly"); // "monthly" | "class"

  // Cargar estudiantes y lista de validaciones de pago de Firestore
  const [pendingPayments, setPendingPayments] = useState([]);

  useEffect(() => {
    // Escuchar estudiantes en tiempo real
    const unsubscribeStudents = onSnapshot(collection(db, "students"), (snapshot) => {
      const studs = [];
      snapshot.forEach((doc) => {
        studs.push({ id: doc.id, ...doc.data() });
      });
      setStudents(studs);
    });

    // Escuchar pagos pendientes en tiempo real
    const qPayments = query(collection(db, "payments"), where("status", "==", "pending"));
    const unsubscribePayments = onSnapshot(qPayments, (snapshot) => {
      const pays = [];
      snapshot.forEach((doc) => {
        pays.push({ id: doc.id, ...doc.data() });
      });
      setPendingPayments(pays);
    });

    return () => {
      unsubscribeStudents();
      unsubscribePayments();
    };
  }, []);

  // Simular la reconciliación o envío de alertas de mora
  const [sendingAlerts, setSendingAlerts] = useState(false);
  const [alertSuccess, setAlertSuccess] = useState(false);

  const triggerMoraAlerts = async () => {
    setSendingAlerts(true);
    try {
      // En una base de datos real, podemos simular que marcamos al primer alumno suspendido 
      // o consultar a la API. Para que sea real en Firestore, buscamos alumnos activos con retraso 
      // y actualizamos su estado a suspendido.
      const q = query(collection(db, "students"), where("status", "==", "active"), where("dueDays", ">", 5));
      const querySnapshot = await getDocs(q);
      for (const d of querySnapshot.docs) {
        await updateDoc(doc(db, "students", d.id), { status: "suspended" });
        // También actualizar en user
        const studentData = d.data();
        if (studentData.parentEmail) {
          await updateDoc(doc(db, "users", studentData.parentEmail.toLowerCase()), { status: "suspended" });
        }
      }
      
      // Sincronizar el estado simulado de Ricardo García si es moroso
      const ricardoRef = doc(db, "users", "ricardo.garcia@gmail.com");
      const ricardoSnap = await getDoc(ricardoRef);
      if (ricardoSnap.exists()) {
        const ricardoData = ricardoSnap.data();
        if (ricardoData.status === "suspended") {
          localStorage.setItem("simulatedStatus", "suspended");
        }
      }
      
      setAlertSuccess(true);
      setTimeout(() => setAlertSuccess(false), 3000);
    } catch (err) {
      console.error("Error auditing mora:", err);
    } finally {
      setSendingAlerts(false);
    }
  };

  // Confirmar pago manual para levantar suspensión (Directo desde lista)
  const confirmManualPayment = async (studentIdOrName) => {
    try {
      // Buscamos al estudiante por su ID de documento (el nombre en Firestore)
      let studentDocRef = doc(db, "students", studentIdOrName);
      let studentSnap = await getDoc(studentDocRef);
      
      // Si no existe por nombre, puede ser un ID numérico (de los iniciales), buscamos por query
      if (!studentSnap.exists()) {
        const q = query(collection(db, "students"), where("name", "==", studentIdOrName));
        const qSnap = await getDocs(q);
        if (!qSnap.empty) {
          studentDocRef = doc(db, "students", qSnap.docs[0].id);
          studentSnap = qSnap.docs[0];
        } else {
          console.error("No se encontró el alumno a confirmar pago manual:", studentIdOrName);
          return;
        }
      }

      const studentData = studentSnap.data();
      
      // Actualizar en Firestore a 'active'
      await updateDoc(studentDocRef, {
        status: "active",
        dueDays: 0
      });

      // Actualizar el perfil del padre
      if (studentData.parentEmail) {
        const parentRef = doc(db, "users", studentData.parentEmail.toLowerCase());
        await updateDoc(parentRef, {
          status: "active"
        });
      }

      // Sincronizar localStorage para pruebas
      if (studentData.name === "Juan Andrés García") {
        localStorage.setItem("simulatedStatus", "active");
      }
    } catch (err) {
      console.error("Error en confirmManualPayment:", err);
    }
  };

  // Confirmar y aprobar una solicitud de pago reportada
  const approvePendingPayment = async (paymentId, studentNameFromPayment) => {
    try {
      // 1. Marcar el pago como aprobado en Firestore
      const paymentRef = doc(db, "payments", paymentId);
      await updateDoc(paymentRef, { status: "approved" });

      // 2. Reactivar al alumno en la colección 'students' de Firestore
      const studentRef = doc(db, "students", studentNameFromPayment);
      const studentSnap = await getDoc(studentRef);
      
      if (studentSnap.exists()) {
        const studentData = studentSnap.data();
        await updateDoc(studentRef, {
          status: "active",
          dueDays: 0
        });

        // 3. Actualizar la base de datos de usuarios
        if (studentData.parentEmail) {
          const parentRef = doc(db, "users", studentData.parentEmail.toLowerCase());
          await updateDoc(parentRef, { status: "active" });
        }
      }

      // Sincronizar localStorage
      if (studentNameFromPayment === "Juan Andrés García") {
        localStorage.setItem("simulatedStatus", "active");
      }
    } catch (err) {
      console.error("Error al aprobar pago:", err);
    }
  };

  // Poner una solicitud de pago en espera
  const holdPendingPayment = async (paymentId, studentNameFromPayment) => {
    try {
      // 1. Marcar el pago como en espera en Firestore
      const paymentRef = doc(db, "payments", paymentId);
      await updateDoc(paymentRef, { status: "on_hold" });

      // 2. Cambiar estado del alumno a en espera
      const studentRef = doc(db, "students", studentNameFromPayment);
      const studentSnap = await getDoc(studentRef);

      if (studentSnap.exists()) {
        const studentData = studentSnap.data();
        await updateDoc(studentRef, { status: "on_hold" });

        // 3. Actualizar la base de datos de usuarios
        if (studentData.parentEmail) {
          const parentRef = doc(db, "users", studentData.parentEmail.toLowerCase());
          await updateDoc(parentRef, { status: "on_hold" });
        }
      }

      // Sincronizar localStorage
      if (studentNameFromPayment === "Juan Andrés García") {
        localStorage.setItem("simulatedStatus", "on_hold");
      }
    } catch (err) {
      console.error("Error al poner pago en espera:", err);
    }
  };

    // Registrar un alumno de forma manual
  const handleManualRegister = async (e) => {
    e.preventDefault();
    if (!manualStudentName || !manualStudentAge) return;

    const ageNum = Number(manualStudentAge);
    let category = "Sub-8 Iniciación";
    if (ageNum > 8 && ageNum <= 10) {
      category = "Sub-10 Competitivo";
    } else if (ageNum > 10 && ageNum <= 12) {
      category = "Sub-12 Elite";
    } else if (ageNum > 12) {
      category = "Sub-15 Avanzado";
    }

    try {
      // 1. Guardar deportista en la colección 'students' en Firestore
      await setDoc(doc(db, "students", manualStudentName), {
        name: manualStudentName,
        age: ageNum,
        category: category,
        assignment: "automatic",
        status: manualPaidCash ? "active" : "suspended",
        dueDays: manualPaidCash ? 0 : 7,
        parentEmail: manualParentEmail ? manualParentEmail.toLowerCase() : "",
        parentName: manualParentName
      });

      // Guardar en localStorage para compatibilidad
      localStorage.setItem("simulatedStudentName", manualStudentName);
      localStorage.setItem("simulatedCategory", category);
      localStorage.setItem("simulatedStatus", manualPaidCash ? "active" : "suspended");
      localStorage.setItem("simulatedParentName", manualParentName);

      // 2. Registrar en Firebase Auth usando una aplicación secundaria para no desloguear al admin
      if (manualParentEmail && manualParentPassword) {
        try {
          const config = auth.app.options;
          const tempApp = initializeApp(config, "TempAdminRegisterApp");
          const tempAuth = getAuth(tempApp);
          
          const userCredential = await createUserWithEmailAndPassword(tempAuth, manualParentEmail.toLowerCase(), manualParentPassword);
          const user = userCredential.user;
          
          // Registrar en 'users'
          await setDoc(doc(db, "users", manualParentEmail.toLowerCase()), {
            uid: user.uid,
            email: manualParentEmail.toLowerCase(),
            role: "parent",
            name: manualParentName || (manualStudentName + " Acudiente"),
            phone: manualParentPhone || "",
            studentName: manualStudentName,
            categoryName: category,
            status: manualPaidCash ? "active" : "suspended"
          });

          await signOut(tempAuth);
          await deleteApp(tempApp);
        } catch (err) {
          console.error("Error creando cuenta en Auth secundario:", err);
          // Si ya existe el usuario, de todas formas agregamos/actualizamos el doc de su perfil
          if (err.code === "auth/email-already-in-use") {
            await setDoc(doc(db, "users", manualParentEmail.toLowerCase()), {
              email: manualParentEmail.toLowerCase(),
              role: "parent",
              name: manualParentName || (manualStudentName + " Acudiente"),
              phone: manualParentPhone || "",
              studentName: manualStudentName,
              categoryName: category,
              status: manualPaidCash ? "active" : "suspended"
            }, { merge: true });
          }
        }
      }

      // 3. Si pagó en efectivo/transferencia directa, registrar en Firestore pagos
      if (manualPaidCash) {
        await addDoc(collection(db, "payments"), {
          studentName: manualStudentName,
          categoryName: category,
          amount: manualPaymentConcept === "monthly" ? 300 : 50,
          paymentType: manualPaymentConcept === "monthly" ? "Mensualidad Completa" : "Clase Individual",
          date: new Date().toLocaleDateString("es-MX") + " " + new Date().toLocaleTimeString("es-MX", { hour: '2-digit', minute: '2-digit' }),
          status: "approved",
          parentEmail: manualParentEmail ? manualParentEmail.toLowerCase() : ""
        });
      }
    } catch (err) {
      console.error("Error en registro manual de Firestore:", err);
    }

    // Resetear form
    setManualStudentName("");
    setManualStudentAge("");
    setManualParentName("");
    setManualParentPhone("");
    setManualParentEmail("");
    setManualParentPassword("");
    setManualPaidCash(false);
    setManualPaymentConcept("monthly");
    setShowAddForm(false);
  };

  // Aplicar override manual de categoría
  const handleApplyOverride = async (e) => {
    e.preventDefault();
    if (!selectedStudent) return;

    try {
      // Modificar en Firestore
      const studentRef = doc(db, "students", selectedStudent.name);
      await updateDoc(studentRef, {
        category: newCategory,
        assignment: "manual",
        overrideReason: overrideReason || "Ajuste manual del cuerpo técnico"
      });
    } catch (err) {
      console.error("Error al aplicar override en Firestore:", err);
    }

    setSelectedStudent(null);
    setNewCategory("");
    setOverrideReason("");
  };

  // Enviar mensaje masivo
  const handleSendNotification = async (e) => {
    e.preventDefault();
    try {
      await setDoc(doc(db, "settings", "announcements"), {
        notice: notificationText,
        date: new Date().toISOString()
      });
      localStorage.setItem("adminNotice", notificationText);
      setNotificationStatus(true);
      setTimeout(() => {
        setNotificationStatus(false);
        setNotificationText("");
      }, 3000);
    } catch (err) {
      console.error("Error en envío de comunicado a Firestore:", err);
    }
  };

  return (
    <div className="min-h-screen bg-[#07090e] flex flex-col">
      {/* Header */}
      <header className="glass-panel border-b border-slate-900 px-6 py-4 flex items-center justify-between sticky top-0 z-40">
        <Link href="/" className="flex items-center gap-2.5 hover:opacity-90 transition-all">
          <span className="font-display font-black text-sm uppercase tracking-wider text-slate-200">
            Admin Consola <span className="text-[#10b981]">Club Colombia</span>
          </span>
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
      <div className="max-w-6xl w-full mx-auto px-4 pt-6 text-center flex flex-col items-center">
        <img 
          src="/logo.png" 
          alt="Escudo Club Colombia" 
          className="w-20 h-20 object-contain mb-3 filter drop-shadow-[0_0_15px_rgba(16,185,129,0.15)] animate-pulse-subtle" 
        />
        <h2 className="font-display font-black text-xl text-slate-100 uppercase tracking-wider">
          Consola de Administración
        </h2>
        <p className="text-[9px] font-mono text-[#10b981] font-bold uppercase tracking-widest mt-1">
          Escuela de Fútbol Club Colombia
        </p>
      </div>

      {/* Main Body */}
      <div className="flex-1 max-w-6xl w-full mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left Column: KPI Stats */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-[#0e121e] border border-slate-900 rounded-2xl p-5 space-y-4">
            <h3 className="text-[10px] font-mono text-slate-500 uppercase tracking-widest font-black">Métricas Clave</h3>
            
            <div className="space-y-3">
              {/* Stat 1 */}
              <div className="bg-[#07090e]/60 border border-slate-800/80 p-3 rounded-xl">
                <span className="text-[9px] text-slate-400 font-bold uppercase block">Alumnos Activos</span>
                <span className="text-xl font-display font-black text-slate-200 flex items-center gap-1.5 mt-0.5">
                  <Users className="w-4 h-4 text-[#10b981]" />
                  {students.filter(s => s.status === "active").length} / {students.length}
                </span>
              </div>

              {/* Stat 2 */}
              <div className="bg-[#07090e]/60 border border-slate-800/80 p-3 rounded-xl">
                <span className="text-[9px] text-slate-400 font-bold uppercase block">MRR Estimado (Mensual)</span>
                <span className="text-xl font-display font-black text-slate-200 flex items-center gap-1.5 mt-0.5">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                  {formatCurrency(students.filter(s => s.status === "active").length * 300)}
                </span>
              </div>

              {/* Stat 3 */}
              <div className="bg-[#07090e]/60 border border-slate-800/80 p-3 rounded-xl">
                <span className="text-[9px] text-slate-400 font-bold uppercase block">Tasa de Morosidad</span>
                <span className="text-xl font-display font-black text-amber-500 flex items-center gap-1.5 mt-0.5 animate-pulse">
                  <AlertTriangle className="w-4 h-4" />
                  {((students.filter(s => s.status === "suspended").length / students.length) * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          </div>

          {/* Menú de Navegación de Tablas */}
          <div className="bg-[#0e121e] border border-slate-900 rounded-2xl p-2.5 flex flex-col gap-1">
            <button
              onClick={() => setActiveTab("students")}
              className={`text-left px-4 py-2.5 rounded-xl text-xs font-bold font-display transition-all cursor-pointer ${
                activeTab === "students" ? "bg-slate-800 text-slate-200 border-l-2 border-[#10b981]" : "text-slate-400 hover:bg-slate-900"
              }`}
            >
              Control de Alumnos & Overrides
            </button>
            <button
              onClick={() => setActiveTab("billing")}
              className={`text-left px-4 py-2.5 rounded-xl text-xs font-bold font-display transition-all cursor-pointer ${
                activeTab === "billing" ? "bg-slate-800 text-slate-200 border-l-2 border-[#10b981]" : "text-slate-400 hover:bg-slate-900"
              }`}
            >
              Mora y Validaciones
            </button>
            <button
              onClick={() => setActiveTab("schedules")}
              className={`text-left px-4 py-2.5 rounded-xl text-xs font-bold font-display transition-all cursor-pointer ${
                activeTab === "schedules" ? "bg-slate-800 text-slate-200 border-l-2 border-[#10b981]" : "text-slate-400 hover:bg-slate-900"
              }`}
            >
              Cronograma & Canchas
            </button>
            <button
              onClick={() => setActiveTab("notifications")}
              className={`text-left px-4 py-2.5 rounded-xl text-xs font-bold font-display transition-all cursor-pointer ${
                activeTab === "notifications" ? "bg-slate-800 text-slate-200 border-l-2 border-[#10b981]" : "text-slate-400 hover:bg-slate-900"
              }`}
            >
              Notificaciones Omnicanal
            </button>
          </div>
        </div>

        {/* Right Column: Tab View Content */}
        <div className="lg:col-span-3">
          
          {/* TAB 1: CONTROL DE ALUMNOS & OVERRIDES */}
          {activeTab === "students" && (
            <div className="bg-[#0e121e] border border-slate-900 rounded-3xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-3">
                <div>
                  <h2 className="font-display font-black text-sm uppercase tracking-wider text-slate-200">Expediente General de Alumnos</h2>
                  <p className="text-[10px] text-slate-500 mt-0.5">Gestión de deportistas activos y anulación manual de reglas de edad (Manual Override).</p>
                </div>
                <button
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="bg-[#10b981] hover:bg-[#059669] text-slate-950 font-display font-black text-[10px] px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 uppercase tracking-wider font-sans shrink-0"
                >
                  {showAddForm ? "Cerrar Registro" : "+ Inscribir Alumno Manual"}
                </button>
              </div>

              {/* Formulario de Registro Manual */}
              {showAddForm && (
                <form onSubmit={handleManualRegister} className="bg-[#07090e] border border-slate-800 p-5 rounded-2xl animate-fade-in space-y-4 font-sans text-left">
                  <div className="flex items-center gap-1.5 text-[#10b981] font-display font-bold text-xs uppercase tracking-wider">
                    <Users className="w-4 h-4" />
                    Inscripción Manual de Alumno (Pago en Efectivo / Cuenta)
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Alumno */}
                    <div>
                      <label className="text-[9px] text-slate-400 font-bold block mb-1">NOMBRE COMPLETO DEL ALUMNO</label>
                      <input
                        type="text"
                        required
                        placeholder="Ej. Carlos López Jr."
                        value={manualStudentName}
                        onChange={(e) => setManualStudentName(e.target.value)}
                        className="w-full bg-[#0e121e] border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-brand-green font-semibold"
                      />
                    </div>

                    <div>
                      <label className="text-[9px] text-slate-400 font-bold block mb-1">EDAD DEL ALUMNO (AÑOS)</label>
                      <input
                        type="number"
                        required
                        min="5"
                        max="17"
                        placeholder="Ej. 9"
                        value={manualStudentAge}
                        onChange={(e) => setManualStudentAge(e.target.value)}
                        className="w-full bg-[#0e121e] border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-brand-green"
                      />
                    </div>

                    {/* Acudiente */}
                    <div>
                      <label className="text-[9px] text-slate-400 font-bold block mb-1">NOMBRE DEL REPRESENTANTE (PADRE)</label>
                      <input
                        type="text"
                        required
                        placeholder="Ej. Carlos López Padre"
                        value={manualParentName}
                        onChange={(e) => setManualParentName(e.target.value)}
                        className="w-full bg-[#0e121e] border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-brand-green"
                      />
                    </div>

                    <div>
                      <label className="text-[9px] text-slate-400 font-bold block mb-1">TELÉFONO DE CONTACTO</label>
                      <input
                        type="tel"
                        required
                        placeholder="Ej. 418 123 4567"
                        value={manualParentPhone}
                        onChange={(e) => setManualParentPhone(e.target.value)}
                        className="w-full bg-[#0e121e] border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-brand-green"
                      />
                    </div>

                    <div>
                      <label className="text-[9px] text-slate-400 font-bold block mb-1">CORREO ELECTRÓNICO (LOGIN DEL PADRE)</label>
                      <input
                        type="email"
                        required
                        placeholder="Ej. acudiente@correo.com"
                        value={manualParentEmail}
                        onChange={(e) => setManualParentEmail(e.target.value)}
                        className="w-full bg-[#0e121e] border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-brand-green"
                      />
                    </div>

                    <div>
                      <label className="text-[9px] text-slate-400 font-bold block mb-1">CONTRASEÑA DE ACCESO</label>
                      <input
                        type="password"
                        required
                        placeholder="Ej. acudiente123"
                        value={manualParentPassword}
                        onChange={(e) => setManualParentPassword(e.target.value)}
                        className="w-full bg-[#0e121e] border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-brand-green"
                      />
                    </div>
                  </div>

                  {/* Toggle Pago en Efectivo */}
                  <div className="flex flex-col gap-3 bg-[#0e121e]/80 p-3.5 rounded-xl border border-slate-800/80">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="manualPaidCash"
                        checked={manualPaidCash}
                        onChange={(e) => setManualPaidCash(e.target.checked)}
                        className="w-4.5 h-4.5 accent-[#10b981] rounded cursor-pointer animate-pulse"
                      />
                      <label htmlFor="manualPaidCash" className="text-xs text-slate-300 font-semibold cursor-pointer">
                        💵 Registrar pago inicial recibido (Efectivo / Transferencia Directa)
                      </label>
                    </div>

                    {manualPaidCash && (
                      <div className="pl-7.5 animate-fade-in space-y-2">
                        <label className="text-[8px] text-slate-400 font-bold block uppercase">Concepto de Pago Inicial Recibido</label>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setManualPaymentConcept("monthly")}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                              manualPaymentConcept === "monthly"
                                ? "bg-slate-800 text-[#10b981] border border-slate-700/50"
                                : "bg-[#07090e] text-slate-400 border border-slate-800"
                            }`}
                          >
                            Mensualidad ($300 MXN)
                          </button>
                          <button
                            type="button"
                            onClick={() => setManualPaymentConcept("class")}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                              manualPaymentConcept === "class"
                                ? "bg-slate-800 text-sky-400 border border-slate-700/50"
                                : "bg-[#07090e] text-slate-400 border border-slate-800"
                            }`}
                          >
                            Por Clase ($50 MXN)
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-2.5 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 font-display font-bold text-[10px] px-5 py-2.5 rounded-xl transition-all cursor-pointer uppercase tracking-wider"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="bg-[#10b981] hover:bg-[#059669] text-slate-950 font-display font-black text-[10px] px-6 py-2.5 rounded-xl transition-all cursor-pointer uppercase tracking-wider"
                    >
                      Dar de Alta Estudiante
                    </button>
                  </div>
                </form>
              )}

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="pb-3">Nombre</th>
                      <th className="pb-3">Edad</th>
                      <th className="pb-3">Categoría</th>
                      <th className="pb-3">Asignación</th>
                      <th className="pb-3 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {students.map((student) => (
                      <tr key={student.id} className="text-xs">
                        <td className="py-3.5 font-bold text-slate-300">{student.name}</td>
                        <td className="py-3.5 text-slate-400">{student.age} años</td>
                        <td className="py-3.5 text-slate-400">
                          <span className="bg-[#07090e] px-2.5 py-1 rounded-md border border-slate-800 text-[10px]">
                            {student.category}
                          </span>
                        </td>
                        <td className="py-3.5">
                          <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                            student.assignment === "automatic"
                              ? "bg-emerald-500/10 text-emerald-400"
                              : "bg-amber-500/10 text-amber-500"
                          }`}>
                            {student.assignment === "automatic" ? "Automática" : "Override Manual"}
                          </span>
                        </td>
                        <td className="py-3.5 text-right">
                          <button
                            onClick={() => setSelectedStudent(student)}
                            className="bg-slate-900 border border-slate-800 text-slate-400 hover:text-white text-[9px] font-bold px-2.5 py-1.5 rounded-lg transition-all cursor-pointer"
                          >
                            Override
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* MODAL / FORM DE OVERRIDE MANUAL */}
              {selectedStudent && (
                <div className="bg-[#07090e] border border-slate-800 p-5 rounded-2xl animate-fade-in mt-6 space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1.5 text-amber-500">
                      <Sparkles className="w-4 h-4" />
                      <h3 className="font-display font-bold text-xs uppercase tracking-wider">Forzar Categoría (Override): {selectedStudent.name}</h3>
                    </div>
                    <button
                      onClick={() => setSelectedStudent(null)}
                      className="text-slate-500 hover:text-slate-300 text-[10px] font-bold uppercase"
                    >
                      Cancelar
                    </button>
                  </div>

                  <form onSubmit={handleApplyOverride} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[8px] text-slate-400 font-bold block mb-1">SELECCIONAR NUEVA CATEGORÍA</label>
                      <select
                        required
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        className="w-full bg-[#0e121e] border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-brand-green"
                      >
                        <option value="">-- Seleccionar --</option>
                        <option value="Sub-8 Iniciación">Sub-8 Iniciación</option>
                        <option value="Sub-10 Competitivo">Sub-10 Competitivo</option>
                        <option value="Sub-12 Elite">Sub-12 Elite</option>
                        <option value="Sub-15 Avanzado">Sub-15 Avanzado</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[8px] text-slate-400 font-bold block mb-1">JUSTIFICACIÓN TÉCNICA DEL CAMBIO</label>
                      <input
                        type="text"
                        required
                        placeholder="Ej. Nivel superior, fuerza física o solicitud de familia"
                        value={overrideReason}
                        onChange={(e) => setOverrideReason(e.target.value)}
                        className="w-full bg-[#0e121e] border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-brand-green"
                      />
                    </div>

                    <div className="md:col-span-2 flex justify-end">
                      <button
                        type="submit"
                        className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-display font-black text-[10px] px-6 py-2.5 rounded-xl transition-all cursor-pointer"
                      >
                        Guardar Excepción
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: MORA Y RECONCILIACIÓN MP */}
          {activeTab === "billing" && (
            <div className="bg-[#0e121e] border border-slate-900 rounded-3xl p-5 space-y-4 font-sans">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="font-display font-black text-sm uppercase tracking-wider text-slate-200">Control de Mora y Recaudos</h2>
                  <p className="text-[10px] text-slate-500 mt-0.5">Control de suspensiones automáticas de QR al expirar el período de gracia (5 días hábiles).</p>
                </div>
                
                <button
                  onClick={triggerMoraAlerts}
                  disabled={sendingAlerts}
                  className="bg-[#10b981] hover:bg-[#059669] disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-display font-black text-[10px] px-5 py-2.5 rounded-full transition-all flex items-center gap-1.5 shadow-lg shadow-emerald-500/10 cursor-pointer font-sans"
                >
                  {sendingAlerts ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Auditar Mora & Enviar Avisos
                    </>
                  )}
                </button>
              </div>

              {alertSuccess && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3.5 rounded-xl text-xs flex items-center gap-2 animate-fade-in">
                  <CheckCircle className="w-4 h-4" />
                  <span>Auditoría completada. Las credenciales de alumnos morosos han sido suspendidas y las alertas de cobro por WhatsApp fueron enviadas.</span>
                </div>
              )}

              {/* Solicitudes de Validación de Pago Recibidas */}
              {pendingPayments.length > 0 && (
                <div className="bg-amber-500/5 border border-amber-500/15 p-4 rounded-2xl space-y-3 animate-pulse-subtle">
                  <div className="flex items-center gap-2 text-amber-500 font-bold text-xs uppercase tracking-wider font-display">
                    <Sparkles className="w-4 h-4 animate-spin-slow" />
                    Solicitudes de Validación de Pago por Confirmar ({pendingPayments.length})
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Los siguientes padres han realizado transferencias directas y reportado su pago. Verifica la cuenta bancaria del club y confirma para activar su QR:
                  </p>

                  <div className="space-y-3 pt-1">
                    {pendingPayments.map((payment) => (
                      <div key={payment.id} className="bg-[#07090e]/80 border border-slate-800/80 p-3.5 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                        <div className="space-y-0.5">
                          <div className="text-xs font-bold text-slate-200">{payment.studentName}</div>
                          <div className="text-[10px] text-slate-500 flex gap-3">
                            <span>Categoría: {payment.categoryName}</span>
                            <span className="text-red-400 font-bold">Monto: ${payment.amount.toLocaleString("es-MX")} MXN ({payment.paymentType || "Mensualidad"})</span>
                          </div>
                          <div className="text-[9px] text-slate-600 font-mono">Reportado: {payment.date}</div>
                        </div>
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          <button
                            onClick={() => approvePendingPayment(payment.id, payment.studentName)}
                            className="w-full sm:w-auto bg-[#10b981] hover:bg-[#059669] text-slate-950 font-display font-black text-[10px] px-4 py-2 rounded-xl transition-all cursor-pointer font-sans"
                          >
                            OK (Aprobar)
                          </button>
                          <button
                            onClick={() => holdPendingPayment(payment.id, payment.studentName)}
                            className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600 text-slate-950 font-display font-black text-[10px] px-4 py-2 rounded-xl transition-all cursor-pointer font-sans"
                          >
                            En Espera
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {students.map((student) => (
                  <div key={student.id} className="bg-[#07090e]/60 border border-slate-800/80 p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-200 text-xs">{student.name}</span>
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                          student.status === "active"
                            ? "bg-emerald-500/10 text-emerald-400"
                            : student.status === "pending_validation"
                              ? "bg-red-500/10 text-red-500 animate-pulse"
                              : student.status === "on_hold"
                                ? "bg-amber-500/10 text-amber-500"
                                : "bg-red-500/10 text-red-400 animate-pulse"
                        }`}>
                          {student.status === "active" 
                            ? "Activo (Al día)" 
                            : student.status === "pending_validation"
                              ? "DEPOSITADO" 
                              : student.status === "on_hold"
                                ? "EN ESPERA"
                                : "QR Suspendido"
                          }
                        </span>
                      </div>
                      
                      <div className="text-[10px] text-slate-500 mt-1 space-x-3">
                        <span>Categoría: {student.category}</span>
                        {student.dueDays > 0 && (
                          <span className="text-amber-500 font-semibold">{student.dueDays} días de retraso</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 w-full sm:w-auto">
                      {student.status === "suspended" ? (
                        <button
                          onClick={() => confirmManualPayment(student.id)}
                          className="w-full sm:w-auto bg-slate-900 border border-slate-800 text-[#10b981] hover:bg-emerald-500 hover:text-slate-950 font-display font-black text-[9px] px-3.5 py-2 rounded-xl transition-all cursor-pointer font-sans"
                        >
                          Registrar Recaudo Manual
                        </button>
                      ) : student.status === "pending_validation" ? (
                        <>
                          <button
                            onClick={() => {
                              const firstPending = pendingPayments.find(p => p.studentName === student.name) || pendingPayments[0];
                              if (firstPending) {
                                approvePendingPayment(firstPending.id, student.name);
                              } else {
                                confirmManualPayment(student.id);
                              }
                            }}
                            className="bg-emerald-500 text-slate-950 hover:bg-emerald-600 font-display font-black text-[9px] px-3.5 py-2 rounded-xl transition-all cursor-pointer font-sans"
                          >
                            OK (Aprobar)
                          </button>
                          <button
                            onClick={() => {
                              const firstPending = pendingPayments.find(p => p.studentName === student.name) || pendingPayments[0];
                              if (firstPending) {
                                holdPendingPayment(firstPending.id, student.name);
                              } else {
                                localStorage.setItem("simulatedStatus", "on_hold");
                                setStudents(prev => prev.map(s => s.id === student.id ? { ...s, status: "on_hold" } : s));
                              }
                            }}
                            className="bg-amber-500 text-slate-950 hover:bg-amber-600 font-display font-black text-[9px] px-3.5 py-2 rounded-xl transition-all cursor-pointer font-sans"
                          >
                            En Espera
                          </button>
                        </>
                      ) : student.status === "on_hold" ? (
                        <button
                          onClick={() => confirmManualPayment(student.id)}
                          className="w-full sm:w-auto bg-[#10b981] hover:bg-[#059669] text-slate-950 font-display font-black text-[9px] px-3.5 py-2 rounded-xl transition-all cursor-pointer font-sans"
                        >
                          Aprobar Pago (OK)
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-500 font-mono">Pago Al Día</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: CRONOGRAMA & CANCHAS */}
          {activeTab === "schedules" && (
            <div className="bg-[#0e121e] border border-slate-900 rounded-3xl p-5 space-y-4">
              <div>
                <h2 className="font-display font-black text-sm uppercase tracking-wider text-slate-200">Cronograma Deportivo Semanal</h2>
                <p className="text-[10px] text-slate-500 mt-0.5">Asignación de canchas, categorías y entrenadores por día.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#07090e]/60 border border-slate-800/80 p-4 rounded-2xl">
                  <h3 className="font-display font-bold text-xs uppercase tracking-wider text-[#10b981] mb-3 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Lunes & Miércoles
                  </h3>
                  <div className="space-y-3 text-xs text-slate-400">
                    <div className="border-b border-slate-900 pb-2">
                      <span className="font-bold text-slate-200 block">Sub-8 Iniciación</span>
                      <span className="text-[10px] block mt-0.5">Horario: 3:30 PM - 5:00 PM | Cancha 1</span>
                      <span className="text-[9px] text-slate-500 block">Profesor: Mario Silva</span>
                    </div>
                    <div>
                      <span className="font-bold text-slate-200 block">Sub-12 Elite</span>
                      <span className="text-[10px] block mt-0.5">Horario: 4:00 PM - 6:00 PM | Cancha 2</span>
                      <span className="text-[9px] text-slate-500 block">Profesor: Carlos Valderrama</span>
                    </div>
                  </div>
                </div>

                <div className="bg-[#07090e]/60 border border-slate-800/80 p-4 rounded-2xl">
                  <h3 className="font-display font-bold text-xs uppercase tracking-wider text-[#10b981] mb-3 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Martes & Jueves
                  </h3>
                  <div className="space-y-3 text-xs text-slate-400">
                    <div className="border-b border-slate-900 pb-2">
                      <span className="font-bold text-slate-200 block">Sub-10 Competitivo</span>
                      <span className="text-[10px] block mt-0.5">Horario: 4:00 PM - 6:00 PM | Cancha 1</span>
                      <span className="text-[9px] text-slate-500 block">Profesor: Mario Silva</span>
                    </div>
                    <div>
                      <span className="font-bold text-slate-200 block">Sub-15 Avanzado</span>
                      <span className="text-[10px] block mt-0.5">Horario: 5:00 PM - 7:00 PM | Cancha Principal</span>
                      <span className="text-[9px] text-slate-500 block">Profesor: Carlos Valderrama</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: NOTIFICACIONES OMNICANAL */}
          {activeTab === "notifications" && (
            <div className="bg-[#0e121e] border border-slate-900 rounded-3xl p-5 space-y-4">
              <div>
                <h2 className="font-display font-black text-sm uppercase tracking-wider text-slate-200">Canal de Comunicados de Urgencia</h2>
                <p className="text-[10px] text-slate-500 mt-0.5">Envía notificaciones simultáneas por WhatsApp (Twilio), Correo Electrónico (Resend) y Web Push.</p>
              </div>

              {notificationStatus && (
                <div className="bg-[#10b981]/10 border border-[#10b981]/20 text-[#10b981] p-3.5 rounded-xl text-xs flex items-center gap-2 animate-fade-in">
                  <CheckCircle className="w-4 h-4" />
                  <span>Comunicado enviado exitosamente a todos los padres de familia del club.</span>
                </div>
              )}

              <form onSubmit={handleSendNotification} className="space-y-4">
                <div>
                  <label className="text-[8px] text-slate-400 font-bold block mb-1">MENSAJE A TRANSMITIR</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Ej. Atención padres de familia: Debido a fuertes lluvias torrenciales en el complejo deportivo, los entrenamientos de la tarde quedan cancelados por seguridad de los atletas."
                    value={notificationText}
                    onChange={(e) => setNotificationText(e.target.value)}
                    className="w-full bg-[#07090e] border border-slate-800 rounded-xl px-3.5 py-3 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-brand-green resize-none"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="bg-[#10b981] hover:bg-[#059669] text-slate-950 font-display font-black text-[10px] px-6 py-2.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    Enviar Comunicado Masivo
                  </button>
                </div>
              </form>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
