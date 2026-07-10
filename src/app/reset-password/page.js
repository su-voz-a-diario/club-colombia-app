"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ShieldCheck, ArrowRight, Lock, AlertTriangle, CheckCircle } from "lucide-react";
import Link from "next/link";
import { auth } from "@/lib/firebase";
import { verifyPasswordResetCode, confirmPasswordReset } from "firebase/auth";

// Función utilitaria para enmascarar correos de forma segura en la UI
function maskEmail(email) {
  if (!email || !email.includes("@")) return email;
  const [local, domain] = email.split("@");
  if (local.length <= 2) {
    return `${local[0]}***@${domain}`;
  }
  return `${local[0]}${"*".repeat(local.length - 2)}${local[local.length - 1]}@${domain}`;
}

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  
  // Parámetros de la URL
  const mode = searchParams.get("mode");
  const oobCode = searchParams.get("oobCode");
  
  // Estados de control
  const [verifying, setVerifying] = useState(true);
  const [isValidCode, setIsValidCode] = useState(false);
  const [associatedEmail, setAssociatedEmail] = useState("");
  const [verificationError, setVerificationError] = useState("");
  
  // Estados de la contraseña
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Bloqueo de doble submit para la confirmación de la contraseña
  const submitInFlightRef = useRef(false);

  // Validar el oobCode al montar la página
  useEffect(() => {
    if (mode !== "resetPassword" || !oobCode) {
      setVerificationError("El enlace de restablecimiento es inválido o el formato de los parámetros es incorrecto.");
      setVerifying(false);
      return;
    }

    async function checkCode() {
      try {
        const email = await verifyPasswordResetCode(auth, oobCode);
        setAssociatedEmail(email);
        setIsValidCode(true);
      } catch (err) {
        console.error("Error verifying reset code:", err.code);
        if (err.code === "auth/expired-action-code") {
          setVerificationError("El enlace de recuperación ha expirado. Por favor solicita uno nuevo.");
        } else if (err.code === "auth/invalid-action-code") {
          setVerificationError("El enlace es inválido o ya ha sido utilizado.");
        } else {
          setVerificationError("Error de validación del enlace: " + err.message);
        }
      } finally {
        setVerifying(false);
      }
    }

    checkCode();
  }, [mode, oobCode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitInFlightRef.current || !oobCode) return;

    setSubmitError("");

    // Validaciones básicas de contraseña
    if (newPassword.length < 6) {
      setSubmitError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setSubmitError("Las contraseñas no coinciden.");
      return;
    }

    submitInFlightRef.current = true;
    setSubmitting(true);

    try {
      await confirmPasswordReset(auth, oobCode, newPassword);
      setSubmitSuccess(true);
      // Limpiar inputs
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      console.error("Error setting new password:", err.code);
      if (err.code === "auth/weak-password") {
        setSubmitError("La contraseña es muy débil. Debe tener al menos 6 caracteres.");
      } else if (err.code === "auth/expired-action-code") {
        setSubmitError("El enlace ha expirado. Solicita un nuevo enlace desde la página de inicio de sesión.");
        setIsValidCode(false);
      } else if (err.code === "auth/invalid-action-code") {
        setSubmitError("El código de acción es inválido o ya se usó.");
        setIsValidCode(false);
      } else {
        setSubmitError("No se pudo restablecer la contraseña. Intenta de nuevo.");
      }
    } finally {
      setSubmitting(false);
      submitInFlightRef.current = false;
    }
  };

  // 1. Pantalla de carga / validación inicial
  if (verifying) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-400 font-mono uppercase tracking-wider">Validando enlace de seguridad...</p>
      </div>
    );
  }

  // 2. Pantalla de error en la validación del oobCode
  if (!isValidCode || verificationError) {
    return (
      <div className="bg-[#0e121e]/80 border border-slate-900 p-6 rounded-3xl shadow-xl space-y-6 text-center font-sans">
        <div className="flex justify-center">
          <div className="bg-red-500/10 p-3 rounded-full border border-red-500/20 text-red-500">
            <AlertTriangle className="w-8 h-8" />
          </div>
        </div>
        
        <div>
          <h2 className="font-display font-black text-sm text-slate-200 uppercase tracking-wider">Enlace Inválido</h2>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed">
            {verificationError || "Este enlace de restablecimiento ya no es válido o ya fue utilizado."}
          </p>
        </div>

        <div className="pt-2">
          <Link
            href="/login"
            className="w-full bg-[#10b981] hover:bg-[#059669] text-slate-950 font-display font-black text-xs py-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer uppercase tracking-wider"
          >
            Volver a Iniciar Sesión
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    );
  }

  // 3. Pantalla de Cambio de Contraseña Exitoso
  if (submitSuccess) {
    return (
      <div className="bg-[#0e121e]/80 border border-slate-900 p-6 rounded-3xl shadow-xl space-y-6 text-center font-sans">
        <div className="flex justify-center">
          <div className="bg-emerald-500/10 p-3 rounded-full border border-emerald-500/20 text-[#10b981]">
            <CheckCircle className="w-8 h-8" />
          </div>
        </div>
        
        <div>
          <h2 className="font-display font-black text-sm text-slate-200 uppercase tracking-wider">Contraseña Actualizada</h2>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed">
            Tu contraseña ha sido restablecida exitosamente. Ya puedes ingresar formalmente con tus nuevas credenciales.
          </p>
        </div>

        <div className="pt-2">
          <Link
            href="/login"
            className="w-full bg-[#10b981] hover:bg-[#059669] text-slate-950 font-display font-black text-xs py-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer uppercase tracking-wider"
          >
            Ir al Portal de Ingreso
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    );
  }

  // 4. Formulario de Cambio de Contraseña (Estado Normal)
  return (
    <form onSubmit={handleSubmit} className="bg-[#0e121e]/80 border border-slate-900 p-6 rounded-3xl shadow-xl space-y-5 font-sans">
      <div className="text-center">
        <div className="flex justify-center mb-3">
          <div className="bg-emerald-500/10 p-2.5 rounded-full border border-emerald-500/20 text-[#10b981]">
            <ShieldCheck className="w-6 h-6 animate-pulse" />
          </div>
        </div>
        <h2 className="font-display font-bold text-sm text-slate-200 uppercase tracking-wider">Nueva Contraseña</h2>
        <p className="text-[11px] text-slate-500 mt-1.5">
          Restableciendo acceso para: <span className="text-emerald-400 font-mono font-bold">{maskEmail(associatedEmail)}</span>
        </p>
      </div>

      {submitError && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-[11px] text-center font-medium">
          {submitError}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="text-[9px] text-slate-400 font-bold block mb-1">NUEVA CONTRASEÑA</label>
          <div className="relative">
            <Lock className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
            <input
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              placeholder="Mínimo 6 caracteres"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full bg-[#07090e] border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-200 placeholder-slate-700 focus:outline-none focus:border-brand-green"
              disabled={submitting}
            />
          </div>
        </div>

        <div>
          <label className="text-[9px] text-slate-400 font-bold block mb-1">CONFIRMAR CONTRASEÑA</label>
          <div className="relative">
            <Lock className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
            <input
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              placeholder="Repite la contraseña"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-[#07090e] border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-200 placeholder-slate-700 focus:outline-none focus:border-brand-green"
              disabled={submitting}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2 pt-2">
        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-[#10b981] hover:bg-[#059669] text-slate-950 font-display font-black text-xs py-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer uppercase tracking-wider disabled:opacity-50"
        >
          {submitting ? "Actualizando..." : "Guardar Contraseña"}
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
        
        <Link
          href="/login"
          className="text-center text-[10px] text-slate-500 hover:text-slate-300 mt-2 font-bold uppercase transition-all"
        >
          Cancelar y Volver
        </Link>
      </div>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex flex-col justify-center bg-[#07090e] px-4 py-8 relative overflow-hidden select-none">
      {/* Fondo luminoso difuso */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-emerald-500/5 filter blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md mx-auto z-10">
        {/* Encabezado Logo */}
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
          <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Portal de Seguridad</p>
        </div>

        {/* Formulario envuelto en Suspense para Next.js build estático */}
        <Suspense fallback={
          <div className="flex flex-col items-center justify-center p-8 space-y-4">
            <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-slate-400 font-mono uppercase tracking-wider">Cargando...</p>
          </div>
        }>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
