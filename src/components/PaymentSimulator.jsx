"use client";

import React, { useState } from "react";
import { CreditCard, Check, ShieldCheck, RefreshCw, Smartphone } from "lucide-react";

export default function PaymentSimulator({ amount = 120000, onPaymentSuccess }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [paymentType, setPaymentType] = useState("subscription"); // 'subscription' | 'pse'
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");

  const handlePay = (e) => {
    e.preventDefault();
    setLoading(true);
    // Simular latencia de red de la API de Mercado Pago
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      if (onPaymentSuccess) {
        onPaymentSuccess();
      }
    }, 2000);
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="w-full max-w-sm p-5 bg-[#0e121e] border border-slate-800 rounded-3xl shadow-2xl relative overflow-hidden">
      {/* Header de Mercado Pago */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3.5 mb-4">
        <div className="flex items-center gap-1.5">
          <div className="bg-sky-500 text-white font-black px-2 py-0.5 rounded text-[10px] tracking-tight">
            mercado
            <span className="font-light"> pago</span>
          </div>
        </div>
        <div className="flex items-center gap-1 text-[9px] text-slate-500 font-semibold uppercase tracking-wider">
          <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
          Pago seguro SSL
        </div>
      </div>

      {success ? (
        <div className="flex flex-col items-center justify-center py-6 text-center animate-fade-in">
          <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center mb-3.5 text-emerald-400">
            <Check className="w-7 h-7 animate-bounce" />
          </div>
          <h3 className="font-display font-bold text-sm text-slate-100">¡Pago Procesado Exitosamente!</h3>
          <p className="text-[11px] text-slate-400 mt-2 max-w-[220px] leading-relaxed">
            La suscripción recurrente ha sido configurada. El código QR del alumno ha sido reactivado de inmediato.
          </p>
          <div className="mt-4 w-full bg-[#07090e]/80 border border-slate-800 p-3 rounded-xl text-left font-mono text-[9px] text-slate-400 space-y-1">
            <div className="flex justify-between">
              <span>Referencia:</span>
              <span className="text-slate-300">MP-TRANS-2026B</span>
            </div>
            <div className="flex justify-between">
              <span>Monto Acreditado:</span>
              <span className="text-[#10b981] font-bold">{formatCurrency(amount)}</span>
            </div>
            <div className="flex justify-between">
              <span>Método:</span>
              <span>{paymentType === "subscription" ? "Débito Automático" : "PSE Digital"}</span>
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handlePay} className="space-y-3.5">
          <div className="text-center bg-[#07090e] border border-slate-800/80 p-3.5 rounded-2xl">
            <span className="text-[9px] text-slate-500 font-bold tracking-wider uppercase block">Valor Mensualidad</span>
            <span className="text-xl font-display font-black text-slate-100 mt-0.5 block">{formatCurrency(amount)}</span>
            <span className="text-[9px] text-slate-400 mt-0.5 block">Matrícula & Cobertura Club Colombia</span>
          </div>

          {/* Opciones de pago */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setPaymentType("subscription")}
              className={`p-2.5 rounded-xl border text-[11px] font-bold flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                paymentType === "subscription"
                  ? "bg-sky-500/10 border-sky-500 text-sky-400"
                  : "bg-slate-900/40 border-slate-800/80 text-slate-400 hover:bg-slate-900/70"
              }`}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Suscripción Tarjeta
            </button>
            <button
              type="button"
              onClick={() => setPaymentType("pse")}
              className={`p-2.5 rounded-xl border text-[11px] font-bold flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                paymentType === "pse"
                  ? "bg-sky-500/10 border-sky-500 text-sky-400"
                  : "bg-slate-900/40 border-slate-800/80 text-slate-400 hover:bg-slate-900/70"
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              Pago por PSE
            </button>
          </div>

          {/* Formulario de Tarjeta (Suscripción) */}
          {paymentType === "subscription" ? (
            <div className="space-y-2.5">
              <div>
                <label className="text-[8px] text-slate-400 font-black tracking-wider block mb-1">NÚMERO DE TARJETA</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="4000 1234 5678 9010"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, "").slice(0, 16))}
                    className="w-full bg-[#07090e] border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-700 focus:outline-none focus:border-sky-500 font-mono"
                  />
                  <CreditCard className="w-4 h-4 text-slate-700 absolute right-3 top-2" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[8px] text-slate-400 font-black tracking-wider block mb-1">VENCIMIENTO</label>
                  <input
                    type="text"
                    required
                    placeholder="MM/AA"
                    className="w-full bg-[#07090e] border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-700 focus:outline-none focus:border-sky-500 font-mono text-center"
                  />
                </div>
                <div>
                  <label className="text-[8px] text-slate-400 font-black tracking-wider block mb-1">CVC</label>
                  <input
                    type="password"
                    required
                    placeholder="•••"
                    className="w-full bg-[#07090e] border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-700 focus:outline-none focus:border-sky-500 font-mono text-center"
                  />
                </div>
              </div>

              <div>
                <label className="text-[8px] text-slate-400 font-black tracking-wider block mb-1">NOMBRE DEL TITULAR</label>
                <input
                  type="text"
                  required
                  placeholder="NOMBRE DEL TARJETAHABIENTE"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value.toUpperCase())}
                  className="w-full bg-[#07090e] border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-700 focus:outline-none focus:border-sky-500 uppercase font-sans"
                />
              </div>
            </div>
          ) : (
            /* Formulario PSE */
            <div className="space-y-2.5">
              <div>
                <label className="text-[8px] text-slate-400 font-black tracking-wider block mb-1">BANCO EMISOR</label>
                <select
                  required
                  className="w-full bg-[#07090e] border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                >
                  <option value="">Selecciona tu entidad financiera</option>
                  <option value="bancolombia">Bancolombia</option>
                  <option value="davivienda">Davivienda</option>
                  <option value="nequi">Nequi</option>
                  <option value="bogota">Banco de Bogotá</option>
                  <option value="daviplata">Daviplata</option>
                  <option value="bbva">BBVA Colombia</option>
                </select>
              </div>
              <div>
                <label className="text-[8px] text-slate-400 font-black tracking-wider block mb-1">EMAIL REGISTRADO EN PSE</label>
                <input
                  type="email"
                  required
                  placeholder="ejemplo@correo.com"
                  className="w-full bg-[#07090e] border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-700 focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-sky-500 hover:bg-sky-600 disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold text-xs py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 mt-4 cursor-pointer"
          >
            {loading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Validando con Mercado Pago...
              </>
            ) : (
              `Pagar ${formatCurrency(amount)}`
            )}
          </button>
        </form>
      )}
    </div>
  );
}
