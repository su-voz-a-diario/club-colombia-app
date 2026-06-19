"use client";

import React, { useState } from "react";
import { Check, ShieldCheck, Copy } from "lucide-react";

export default function PaymentSimulator({ amount = 120000, onPaymentSuccess }) {
  const [copiedText, setCopiedText] = useState(false);
  const [notified, setNotified] = useState(false);
  const [loading, setLoading] = useState(false);

  const bankDetails = {
    banco: "BBVA Bancomer",
    beneficiario: "Escuela de Fútbol Club Colombia S.A.S.",
    cuenta: "0123 4567 8901 2345",
    clabe: "0121 8000 1234 5678 90",
    referencia: "MORA-2026"
  };

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
        onPaymentSuccess();
      }
    }, 1500);
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="w-full max-w-sm p-5 bg-[#0e121e] border border-slate-800 rounded-3xl shadow-2xl relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
        <span className="font-display font-black text-xs uppercase tracking-wider text-slate-300">
          Información de Pago Directo
        </span>
        <div className="flex items-center gap-1 text-[9px] text-slate-500 font-semibold uppercase tracking-wider">
          <ShieldCheck className="w-3.5 h-3.5 text-[#10b981]" />
          Cuenta Oficial
        </div>
      </div>

      {notified ? (
        <div className="flex flex-col items-center justify-center py-4 text-center animate-fade-in">
          <div className="w-11 h-11 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center mb-3 text-emerald-400">
            <Check className="w-6 h-6" />
          </div>
          <h3 className="font-display font-bold text-sm text-slate-100">¡Pago Notificado!</h3>
          <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
            Tu reporte de depósito fue enviado. En la demo real, la credencial QR se activa de inmediato para facilitar la prueba de acceso.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="text-center bg-[#07090e] border border-slate-800 p-3.5 rounded-2xl">
            <span className="text-[9px] text-slate-500 font-bold tracking-wider uppercase block">Valor Mensualidad</span>
            <span className="text-xl font-display font-black text-slate-100 mt-0.5 block">{formatCurrency(amount)}</span>
            <span className="text-[9px] text-slate-400 mt-0.5 block">Matrícula & Cobertura Club Colombia</span>
          </div>

          <div className="bg-[#07090e] border border-slate-800/80 p-3.5 rounded-2xl space-y-2.5 text-left font-sans text-xs">
            <span className="text-[8px] text-slate-500 font-black tracking-wider uppercase block border-b border-slate-900 pb-1">DATOS DE TRANSFERENCIA</span>
            
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
                  <span className="text-[9px] text-slate-500 block">CLABE Interbancaria:</span>
                  <span className="text-slate-200 font-mono font-bold text-[11px] block">{bankDetails.clabe}</span>
                </div>
                <button
                  onClick={() => copyToClipboard(bankDetails.clabe)}
                  className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer"
                  title="Copiar CLABE"
                >
                  {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          <div className="bg-[#10b981]/5 border border-[#10b981]/15 p-3 rounded-xl text-[10px] text-slate-400 leading-relaxed">
            💡 **Efectivo:** También puedes realizar el pago directamente en efectivo con el **Profe Luis López** en el horario de entrenamientos.
          </div>

          <button
            onClick={handleNotifyPayment}
            disabled={loading}
            className="w-full bg-[#10b981] hover:bg-[#059669] disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-display font-black text-xs py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <span className="animate-spin rounded-full h-4 w-4 border-2 border-slate-950 border-t-transparent" />
            ) : (
              "Reportar Transferencia / Efectivo"
            )}
          </button>
        </div>
      )}
    </div>
  );
}
