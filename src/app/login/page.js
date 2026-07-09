"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, UserCheck, Users, Dumbbell, ArrowRight, UserPlus, LogIn, Calendar, QrCode, Sparkles } from "lucide-react";
import Link from "next/link";
import PaymentSimulator from "@/components/PaymentSimulator";
import QRGenerator from "@/components/QRGenerator";
import { auth, db } from "@/lib/firebase";
import { categoryNameToId, normalizeStudentName } from "@/lib/studentModel";
import { normalizeAndValidatePhone } from "@/lib/phone";
import { RecaptchaVerifier, signInWithEmailAndPassword, signInWithPhoneNumber, sendPasswordResetEmail } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";

export default function Login() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("login"); // 'login' | 'register'
  
  // Estados de Autenticación
  const [loginUserType, setLoginUserType] = useState("parent");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginPhone, setLoginPhone] = useState("");
  const [smsCode, setSmsCode] = useState("");
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [phoneCodeSent, setPhoneCodeSent] = useState(false);
  const [loginError, setLoginError] = useState("");
  
  // Estados para Recuperación de Contraseña
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSuccessMessage, setResetSuccessMessage] = useState("");
  const [resetError, setResetError] = useState("");
  const [isResetting, setIsResetting] = useState(false);

  // Estados para simulación de Inscripción
  const [registerStep, setRegisterStep] = useState(1); // 1: Datos, 2: Horarios/Pago, 3: Credencial QR
  const [parentName, setParentName] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [parentEmail] = useState("");
  const [studentName, setStudentName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [parentUid, setParentUid] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [studentCategory, setStudentCategory] = useState(null);
  const [registerError, setRegisterError] = useState("");

  // Limpiar cookies de sesión para asegurar que al estar en /login el usuario está deslogueado
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      fetch("/api/auth/session", { method: "DELETE" }).catch(() => {});
    }
  }, []);

  const createSessionFromAuthUser = async (authUser) => {
    const idToken = await authUser.getIdToken();
    const sessionResponse = await fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken })
    });

    if (!sessionResponse.ok) {
      throw new Error("No se pudo crear una sesión segura.");
    }

    return sessionResponse.json();
  };

  const getRecaptchaVerifier = () => {
    if (typeof window === "undefined") return null;
    if (!window.ccRecaptchaVerifier) {
      window.ccRecaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
        size: "invisible"
      });
    }
    return window.ccRecaptchaVerifier;
  };

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

  const handleNextStep = async (e) => {
    e.preventDefault();
    setRegisterError("");
    
    if (registerStep === 1 && studentCategory) {
      try {
        const normalizedParentPhone = normalizeAndValidatePhone(parentPhone);
        const studentDocRef = doc(collection(db, "students"));
        const newStudentId = studentDocRef.id;
        const normalizedName = normalizeStudentName(studentName);
        const categoryId = categoryNameToId(studentCategory.name);

        // Registrar deportista en la colección 'students'
        const birthYear = new Date(birthDate).getFullYear();
        const ageNum = 2026 - birthYear;
        await setDoc(studentDocRef, {
          studentId: newStudentId,
          name: studentName,
          normalizedName,
          age: ageNum || 9,
          parentName,
          parentPhone: normalizedParentPhone,
          parentEmail: "",
          parentUid: "",
          categoryId,
          category: studentCategory.name,
          assignedCoachUid: "",
          assignment: "automatic",
          status: "suspended",
          billingStatus: "pending_payment",
          healthStatus: "optimal",
          dueDays: 7,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        setStudentId(newStudentId);
        setParentUid("");
        
        localStorage.setItem("simulatedStatus", "suspended");
        
        setRegisterStep(2);
      } catch (err) {
        console.error("Error en registro:", err);
        setRegisterError("Ocurrió un error al registrar al alumno: " + err.message);
      }
    }
  };

  const handlePaymentCompleted = async (amount, paymentLabel) => {
    try {
      // 1. Guardar solicitud en pendingPayments en Firestore
      await addDoc(collection(db, "payments"), {
        studentName: studentName,
        studentId: studentId || "",
        parentUid: parentUid || "",
        categoryId: categoryNameToId(studentCategory.name),
        categoryName: studentCategory.name,
        amount: amount,
        paymentType: paymentLabel,
        date: new Date().toLocaleDateString("es-MX") + " " + new Date().toLocaleTimeString("es-MX", { hour: '2-digit', minute: '2-digit' }),
        status: "pending",
        parentEmail: parentEmail.toLowerCase(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // 2. Cambiar su estado a 'pending_validation' tanto en Firestore como en localStorage.
      const studentRef = doc(db, "students", studentId || studentName);
      await updateDoc(studentRef, {
        status: "pending_validation",
        billingStatus: "pending_validation",
        dueDays: 0,
        updatedAt: serverTimestamp()
      });

      localStorage.setItem("simulatedStatus", "pending_validation");

      setRegisterStep(3);
    } catch (err) {
      console.error("Error al reportar pago:", err);
      setRegisterError("Error al reportar el pago en la base de datos: " + err.message);
    }
  };

  const handlePasswordResetSubmit = async (e) => {
    e.preventDefault();
    setResetError("");
    setResetSuccessMessage("");

    const email = resetEmail.trim().toLowerCase();
    if (!email) {
      setResetError("Por favor ingresa tu correo electrónico.");
      return;
    }

    setIsResetting(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setResetSuccessMessage("Se ha enviado un correo electrónico de recuperación. Revisa tu bandeja de entrada.");
      setResetEmail("");
    } catch (err) {
      console.error("Error al enviar correo de recuperación:", err);
      if (err.code === "auth/user-not-found") {
        setResetError("No existe ninguna cuenta registrada con este correo electrónico.");
      } else if (err.code === "auth/invalid-email") {
        setResetError("El formato del correo electrónico es inválido.");
      } else {
        setResetError("Ocurrió un error al intentar enviar el correo. Por favor intenta de nuevo.");
      }
    } finally {
      setIsResetting(false);
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError("");

    try {
      if (loginUserType === "parent") {
        const normalizedPhone = normalizeAndValidatePhone(loginPhone);
        if (!phoneCodeSent) {
          const verifier = getRecaptchaVerifier();
          const result = await signInWithPhoneNumber(auth, normalizedPhone, verifier);
          setConfirmationResult(result);
          setPhoneCodeSent(true);
          return;
        }

        if (!confirmationResult) {
          setLoginError("Primero solicita el código SMS.");
          return;
        }

        const userCredential = await confirmationResult.confirm(smsCode);
        await createSessionFromAuthUser(userCredential.user);
        router.push("/dashboard/parent");
        return;
      }

      // 1. Iniciar sesión en Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, loginEmail.toLowerCase(), loginPassword);
      const authUser = userCredential.user;

      // 2. Leer perfil del usuario de Firestore
      let userDocSnap = await getDoc(doc(db, "users", authUser.uid));
      if (!userDocSnap.exists()) {
        // Legacy compatibility
        // TODO remove after migration
        userDocSnap = await getDoc(doc(db, "users", loginEmail.toLowerCase()));
      }

      if (!userDocSnap.exists()) {
        setLoginError("No se encontró el perfil de usuario en la base de datos.");
        return;
      }

      const user = userDocSnap.data();
      if (user.role !== loginUserType || !["admin", "coach"].includes(user.role)) {
        setLoginError("El tipo de usuario seleccionado no corresponde a esta cuenta.");
        return;
      }

      await createSessionFromAuthUser(authUser);

      // Redirigir
      if (user.role === "admin") {
        router.push("/dashboard/admin");
      } else if (user.role === "coach") {
        router.push("/dashboard/coach");
      } else if (user.role === "parent") {
        router.push("/dashboard/parent");
      }
    } catch (err) {
      console.error("Error en login:", err);
      if (err.code === "auth/invalid-phone-number") {
        setLoginError("El teléfono no es válido. Usa formato internacional, por ejemplo +573001234567.");
      } else if (err.code === "auth/invalid-verification-code") {
        setLoginError("El código SMS no es válido.");
      } else if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
        setLoginError("Correo electrónico o contraseña incorrectos.");
      } else {
        setLoginError("Error de conexión con el servidor: " + err.message);
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center bg-[#07090e] px-4 py-8 relative overflow-hidden select-none">
      {/* Background glow lines */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-emerald-500/5 filter blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md mx-auto z-10">
        {/* Logo */}
        <div className="flex flex-col items-center justify-center mb-8">
          <Link href="/" className="flex flex-col items-center gap-3.5 mb-2 hover:opacity-80 transition-all text-center">
            <img 
              src="/logo.png" 
              alt="Logo Club Colombia" 
              className="w-24 h-24 object-contain filter drop-shadow-[0_0_15px_rgba(16,185,129,0.2)]" 
            />
            <span className="font-display font-black text-2xl tracking-wider uppercase">
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
        {activeTab === "login" && !showForgotPassword && (
          <form onSubmit={handleLoginSubmit} className="bg-[#0e121e]/80 border border-slate-900 p-6 rounded-3xl shadow-xl space-y-5 font-sans">
            <div className="text-center">
              <h2 className="font-display font-bold text-sm text-slate-200 uppercase tracking-wider">Ingreso de Usuarios</h2>
              <p className="text-[11px] text-slate-500 mt-1">Selecciona tu tipo de usuario para acceder al portal.</p>
            </div>

            {loginError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-[11px] text-center">
                {loginError}
              </div>
            )}

            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-1.5 bg-[#07090e] border border-slate-800 rounded-xl p-1">
                {[
                  ["parent", "Padre"],
                  ["coach", "Entrenador"],
                  ["admin", "Administrador"]
                ].map(([type, label]) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => {
                      setLoginUserType(type);
                      setLoginError("");
                    }}
                    className={`py-2 rounded-lg text-[9px] font-bold uppercase transition-all ${
                      loginUserType === type ? "bg-[#10b981] text-slate-950" : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {loginUserType === "parent" ? (
                <>
                  <div>
                    <label className="text-[9px] text-slate-400 font-bold block mb-1">TELÉFONO CELULAR</label>
                    <input
                      type="tel"
                      required
                      placeholder="+57 300 123 4567"
                      value={loginPhone}
                      onChange={(e) => {
                        setLoginPhone(e.target.value);
                        setPhoneCodeSent(false);
                        setConfirmationResult(null);
                      }}
                      className="w-full bg-[#07090e] border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 placeholder-slate-700 focus:outline-none focus:border-brand-green"
                    />
                  </div>

                  {phoneCodeSent && (
                    <div>
                      <label className="text-[9px] text-slate-400 font-bold block mb-1">CÓDIGO SMS</label>
                      <input
                        type="text"
                        required
                        inputMode="numeric"
                        placeholder="Código recibido"
                        value={smsCode}
                        onChange={(e) => setSmsCode(e.target.value)}
                        className="w-full bg-[#07090e] border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 placeholder-slate-700 focus:outline-none focus:border-brand-green"
                      />
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div>
                    <label className="text-[9px] text-slate-400 font-bold block mb-1">CORREO ELECTRÓNICO</label>
                    <input
                      type="email"
                      required
                      placeholder="ejemplo@correo.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="w-full bg-[#07090e] border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 placeholder-slate-700 focus:outline-none focus:border-brand-green"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] text-slate-400 font-bold block mb-1">CONTRASEÑA</label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full bg-[#07090e] border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 placeholder-slate-700 focus:outline-none focus:border-brand-green"
                    />
                    <div className="flex justify-end mt-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setShowForgotPassword(true);
                          setResetEmail(loginEmail);
                          setResetError("");
                          setResetSuccessMessage("");
                        }}
                        className="text-[10px] text-slate-500 hover:text-[#10b981] transition-all font-semibold cursor-pointer"
                      >
                        ¿Olvidaste tu contraseña?
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div id="recaptcha-container" />

            <button
              type="submit"
              className="w-full bg-[#10b981] hover:bg-[#059669] text-slate-950 font-display font-black text-xs py-3 rounded-xl transition-all flex items-center justify-center gap-1.5 mt-2 cursor-pointer uppercase tracking-wider"
            >
              {loginUserType === "parent" && !phoneCodeSent ? "Enviar Código" : "Iniciar Sesión"}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        )}

        {/* Formulario de Recuperación de Contraseña */}
        {activeTab === "login" && showForgotPassword && (
          <form onSubmit={handlePasswordResetSubmit} className="bg-[#0e121e]/80 border border-slate-900 p-6 rounded-3xl shadow-xl space-y-5 font-sans">
            <div className="text-center">
              <h2 className="font-display font-bold text-sm text-slate-200 uppercase tracking-wider">Recuperar Contraseña</h2>
              <p className="text-[11px] text-slate-500 mt-1">Ingresa tu correo electrónico y te enviaremos un enlace de restablecimiento.</p>
            </div>

            {resetError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-[11px] text-center">
                {resetError}
              </div>
            )}

            {resetSuccessMessage && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-xl text-[11px] text-center">
                {resetSuccessMessage}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="text-[9px] text-slate-400 font-bold block mb-1">CORREO ELECTRÓNICO</label>
                <input
                  type="email"
                  required
                  placeholder="ejemplo@correo.com"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="w-full bg-[#07090e] border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 placeholder-slate-700 focus:outline-none focus:border-brand-green"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <button
                type="submit"
                disabled={isResetting}
                className="w-full bg-[#10b981] hover:bg-[#059669] text-slate-950 font-display font-black text-xs py-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer uppercase tracking-wider disabled:opacity-50"
              >
                {isResetting ? "Enviando..." : "Enviar Correo"}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowForgotPassword(false);
                  setLoginError("");
                }}
                className="w-full bg-[#0e121e] border border-slate-800 text-slate-400 hover:text-slate-200 font-display font-bold text-xs py-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer uppercase tracking-wider"
              >
                Volver al ingreso
              </button>
            </div>
          </form>
        )}

        {/* Tab Content: REGISTER / USER JOURNEY SIMULATOR */}
        {activeTab === "register" && (
          <div className="space-y-4">
            {registerStep === 1 && (
              <form onSubmit={handleNextStep} className="bg-[#0e121e]/80 border border-slate-900 p-6 rounded-3xl shadow-xl space-y-4 font-sans">
                <div className="text-center mb-2">
                  <h2 className="font-display font-bold text-sm text-slate-200 uppercase tracking-wider">Paso 1: Ficha del Atleta</h2>
                  <p className="text-[11px] text-slate-500 mt-1">Completa los datos del alumno y acudiente para calcular la categoría deportiva.</p>
                </div>

                {registerError && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-[11px] text-center">
                    {registerError}
                  </div>
                )}

                <div className="space-y-3">
                  <div>
                    <label className="text-[9px] text-slate-400 font-bold block mb-1">NOMBRE COMPLETO DEL PADRE / ACUDIENTE</label>
                    <input
                      type="text"
                      required
                      placeholder="Nombre completo"
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
                      placeholder="+57 300 123 4567"
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
                      placeholder="Nombre completo del atleta"
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

            {/* Paso 2: Checkout de Suscripción */}
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

            {/* Paso 3: Credencial QR y Activación Exitosa (Pendiente de aprobación) */}
            {registerStep === 3 && (
              <div className="flex flex-col items-center justify-center space-y-5 animate-fade-in font-sans">
                <div className="text-center max-w-xs">
                  <div className="bg-red-500/10 text-red-500 border border-red-500/20 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider inline-flex items-center gap-1 mb-2">
                    <QrCode className="w-3.5 h-3.5" />
                    Pago por Confirmar
                  </div>
                  <h2 className="font-display font-black text-base text-slate-100 uppercase tracking-wide">Inscripción Recibida</h2>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    Tus datos y reporte de pago han sido guardados. Una vez que el Profe Luis López valide tu depósito en la cuenta de Banorte, tu portal y credencial QR se activarán automáticamente.
                  </p>
                </div>

                <QRGenerator 
                  studentName={studentName} 
                  status="pending_validation" 
                  token={`CC-2026-${Math.floor(1000 + Math.random() * 9000)}`} 
                />

                <button
                  onClick={() => router.push("/dashboard/parent")}
                  className="w-full bg-[#10b981] hover:bg-[#059669] text-slate-950 font-display font-black text-xs py-3 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-xl shadow-emerald-500/10 cursor-pointer"
                >
                  Ir a Mi Portal (Acceso Restringido)
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
