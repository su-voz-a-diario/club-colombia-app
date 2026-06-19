"use client";

import React, { useState } from "react";
import { Check, ShieldCheck, Copy } from "lucide-react";

export default function PaymentSimulator({ amount: initialAmount = 300, onPaymentSuccess }) {
  const [copiedText, setCopiedText] = useState(false);
  const [notified, setNotified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [paymentType, setPaymentType] = useState(initialAmount === 50 ? "class" : "monthly");

  const bankDetails = {
    banco: "Banorte",
    beneficiario: "Luis Alberto García",
    cuenta: "4189 1433 3272 1003",
  };

  const amount = paymentType === "monthly" ? 300 : 50;
  const paymentLabel = paymentType === "monthly" ? "Mensualidad Completa" : "Clase Individual";

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const handleNotifyPayment = (e) => {
    e.preventDefault();
    setLoading(true);
    // Simular retraso de guardado en base de datos
    setTimeout(() => {
      setLoading(false);
      setNotified(true);
      if (onPaymentSuccess) {
        onPaymentSuccess(amount, paymentLabel);
      }
    }, 1200);
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="w-full max-w-sm p-5 bg-[#0e121e] border border-slate-800 rounded-3xl shadow-2xl relative overflow-hidden font-sans">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
        <span className="font-display font-black text-xs uppercase tracking-wider text-slate-300">
          Cuenta Oficial de la Escuela
        </span>
        <div className="flex items-center gap-1 text-[9px] text-slate-500 font-semibold uppercase tracking-wider">
          <ShieldCheck className="w-3.5 h-3.5 text-[#10b981]" />
          Depósito Directo
        </div>
      </div>

      {notified ? (
        <div className="flex flex-col items-center justify-center py-4 text-center animate-fade-in">
          <div className="w-10 h-10 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mb-3 text-red-500 animate-pulse">
            <Check className="w-5 h-5" />
          </div>
          <h3 className="font-display font-black text-xs text-red-500 uppercase tracking-widest">Estado: Depositado</h3>
          <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
            Reporte enviado. Tu estado ahora es <strong className="text-red-500">"DEPOSITADO"</strong>. El QR se desbloqueará (pasará a verde) una vez que el administrador valide la cuenta.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="text-center bg-[#07090e] border border-slate-800 p-3.5 rounded-2xl">
            <span className="text-[9px] text-slate-500 font-bold tracking-wider uppercase block mb-2">Selecciona Concepto de Pago</span>
            
            {/* Selector de Concepto */}
            <div className="flex bg-[#0e121e] border border-slate-800 rounded-xl p-1 mb-3">
              <button
                type="button"
                onClick={() => setPaymentType("monthly")}
                className={`flex-1 py-1.5 text-[9px] font-bold uppercase rounded-lg transition-all cursor-pointer ${
                  paymentType === "monthly" 
                    ? "bg-slate-800 text-[#10b981] border border-slate-700/50" 
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Mensualidad ($300)
              </button>
              <button
                type="button"
                onClick={() => setPaymentType("class")}
                className={`flex-1 py-1.5 text-[9px] font-bold uppercase rounded-lg transition-all cursor-pointer ${
                  paymentType === "class" 
                    ? "bg-slate-800 text-sky-400 border border-slate-700/50" 
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Por Clase ($50)
              </button>
            </div>

            <span className="text-[9px] text-slate-500 font-bold tracking-wider uppercase block">Total a Transferir</span>
            <span className="text-xl font-display font-black text-[#10b981] mt-0.5 block">{formatCurrency(amount)} MXN</span>
            <span className="text-[9px] text-slate-400 mt-1 block">Concepto: <strong className="text-slate-200">{paymentLabel}</strong></span>
          </div>

          <div className="bg-[#07090e] border border-slate-800/80 p-3.5 rounded-2xl space-y-2.5 text-left text-xs">
            <span className="text-[8px] text-slate-500 font-black tracking-wider uppercase block border-b border-slate-900 pb-1">DATOS PARA TRANSFERENCIA</span>
            
            <div className="space-y-2 pt-0.5">
              <div>
                <span className="text-[9px] text-slate-500 block">Banco:</span>
                <span className="text-slate-200 font-bold block">{bankDetails.banco}</span>
              </div>
              <div>
                <span className="text-[9px] text-slate-500 block">Beneficiario:</span>
                <span className="text-slate-200 font-bold block">{bankDetails.beneficiario}</span>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-[9px] text-slate-500 block">Tarjeta / Cuenta:</span>
                  <span className="text-slate-200 font-mono font-bold text-[11px] block">{bankDetails.cuenta}</span>
                </div>
                <button
                  onClick={() => copyToClipboard(bankDetails.cuenta)}
                  className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer"
                  title="Copiar Tarjeta"
                >
                  {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/60 p-3 rounded-xl text-[10px] text-slate-400 leading-relaxed text-center">
            También puedes realizar el pago en efectivo directamente en la cancha.
          </div>

          <button
            onClick={handleNotifyPayment}
            disabled={loading}
            className="w-full bg-[#10b981] hover:bg-[#059669] disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-display font-black text-xs py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
          >
            {loading ? (
              <span className="animate-spin rounded-full h-4 w-4 border-2 border-slate-950 border-t-transparent" />
            ) : (
              "Reportar como Depositado"
            )}
          </button>
        </div>
      )}
    </div>
  );
}
