"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ShieldCheck, LogOut, Check, X, AlertCircle, Dumbbell, ClipboardList, TrendingUp, Mic, Send, Star, Volume2 } from "lucide-react";

export default function CoachDashboard() {
  // Lista de alumnos de la categoría asignada (Sub-10 Competitivo)
  const [attendance, setAttendance] = useState([
    { id: 1, name: "Juan Andrés García", status: null },
    { id: 2, name: "Mateo Ospina Díaz", status: null },
    { id: 3, name: "Sebastián Bedoya", status: null },
    { id: 4, name: "Santiago Valencia", status: null },
    { id: 5, name: "Nicolás Restrepo", status: null }
  ]);

  const [activeTab, setActiveTab] = useState("attendance"); // 'attendance' | 'evaluation'
  const [attendanceSaved, setAttendanceSaved] = useState(false);

  // Estados para evaluación técnica
  const [selectedStudent, setSelectedStudent] = useState(1);
  const [speed, setSpeed] = useState(7);
  const [passing, setPassing] = useState(8);
  const [dribbling, setDribbling] = useState(6);
  const [shooting, setShooting] = useState(7);
  const [physical, setPhysical] = useState(8);
  const [discipline, setDiscipline] = useState(9);
  const [tacticalNotes, setTacticalNotes] = useState("");
  const [dictating, setDictating] = useState(false);
  const [evaluationSaved, setEvaluationSaved] = useState(false);

  // Simular guardado de asistencia
  const saveAttendance = () => {
    setAttendanceSaved(true);
    setTimeout(() => setAttendanceSaved(false), 3000);
  };

  // Dictado por voz real usando Web Speech API del navegador
  const handleVoiceDictation = () => {
    if (typeof window === "undefined") return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("El reconocimiento de voz no está soportado en este navegador o dispositivo. Por favor intenta usando Google Chrome o Safari.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "es-CO"; // Español Colombia
    recognition.continuous = false;
    recognition.interimResults = false;

    setDictating(true);

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setTacticalNotes((prev) => prev ? `${prev} ${transcript}` : transcript);
      setDictating(false);
    };

    recognition.onerror = (event) => {
      console.error("Error en dictado de voz:", event.error);
      setDictating(false);
    };

    recognition.onend = () => {
      setDictating(false);
    };

    recognition.start();
  };

  // Simular guardado de evaluación técnica
  const saveEvaluation = (e) => {
    e.preventDefault();
    setEvaluationSaved(true);

    // Guardar en localStorage para que el Dashboard del Padre lo lea dinámicamente si es Juan Andrés (ID 1)
    if (Number(selectedStudent) === 1) {
      const metricsObj = { speed, passing, dribbling, shooting, physical, discipline };
      localStorage.setItem("simulatedMetrics", JSON.stringify(metricsObj));
      localStorage.setItem("simulatedNotes", tacticalNotes);
    }

    setTimeout(() => {
      setEvaluationSaved(false);
      // Resetear sliders
      setSpeed(7); setPassing(8); setDribbling(6); setShooting(7); setPhysical(8); setDiscipline(9);
      setTacticalNotes("");
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-[#07090e] flex flex-col max-w-md mx-auto border-x border-slate-900 shadow-2xl">
      {/* Header optimizado para celular */}
      <header className="glass-panel border-b border-slate-900 px-5 py-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <Dumbbell className="w-5 h-5 text-[#10b981]" />
          <div>
            <h1 className="font-display font-black text-xs uppercase text-slate-200">Prof. Mario Silva</h1>
            <p className="text-[9px] text-[#10b981] font-bold uppercase tracking-wider">Director Técnico Sub-10</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Link 
            href="/"
            className="text-slate-400 hover:text-[#10b981] font-display font-semibold text-xs transition-all"
          >
            Inicio
          </Link>
          <Link href="/login" className="text-slate-500 hover:text-slate-300">
            <LogOut className="w-4.5 h-4.5" />
          </Link>
        </div>
      </header>

      {/* Selector de módulos en cabecera */}
      <div className="px-4 pt-4 pb-2 grid grid-cols-2 gap-2 bg-[#090d16]/30">
        <button
          onClick={() => setActiveTab("attendance")}
          className={`py-2.5 rounded-xl text-xs font-bold font-display transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === "attendance" ? "bg-slate-800 text-[#10b981] border border-slate-700/50" : "bg-[#0e121e] text-slate-400"
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          Toma de Asistencia
        </button>
        <button
          onClick={() => setActiveTab("evaluation")}
          className={`py-2.5 rounded-xl text-xs font-bold font-display transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === "evaluation" ? "bg-slate-800 text-amber-500 border border-slate-700/50" : "bg-[#0e121e] text-slate-400"
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          Ficha de Evaluación
        </button>
      </div>

      {/* Cuerpo principal */}
      <div className="flex-1 px-4 py-4 space-y-4 overflow-y-auto">

        {/* TAB 1: ASISTENCIA TÁCTIL RÁPIDA */}
        {activeTab === "attendance" && (
          <div className="bg-[#0e121e] border border-slate-900 p-4 rounded-2xl space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-display font-bold text-xs uppercase tracking-wider text-slate-300">Asistencia de Hoy</h3>
                <p className="text-[9px] text-slate-500 font-mono mt-0.5">{new Date().toLocaleDateString("es-CO", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
            </div>

            {attendanceSaved && (
              <div className="bg-[#10b981]/10 border border-[#10b981]/20 text-[#10b981] p-3 rounded-xl text-[10px] flex items-center gap-1.5 animate-fade-in">
                <Check className="w-4 h-4" />
                Asistencia guardada y sincronizada en tiempo real.
              </div>
            )}

            <div className="divide-y divide-slate-800/60">
              {attendance.map((athlete) => (
                <div key={athlete.id} className="py-3 flex items-center justify-between gap-4">
                  <span className="text-xs font-bold text-slate-300">{athlete.name}</span>
                  
                  {/* Selector Táctil */}
                  <div className="flex items-center gap-1 bg-[#07090e] p-1 rounded-lg border border-slate-900">
                    <button
                      onClick={() => setAttendance(prev => prev.map(a => a.id === athlete.id ? { ...a, status: "P" } : a))}
                      className={`w-7 h-7 rounded text-[10px] font-black transition-all cursor-pointer ${
                        athlete.status === "P" ? "bg-emerald-500 text-slate-950 shadow" : "text-emerald-500 hover:bg-emerald-500/10"
                      }`}
                    >
                      P
                    </button>
                    <button
                      onClick={() => setAttendance(prev => prev.map(a => a.id === athlete.id ? { ...a, status: "A" } : a))}
                      className={`w-7 h-7 rounded text-[10px] font-black transition-all cursor-pointer ${
                        athlete.status === "A" ? "bg-red-500 text-slate-950 shadow" : "text-red-500 hover:bg-red-500/10"
                      }`}
                    >
                      A
                    </button>
                    <button
                      onClick={() => setAttendance(prev => prev.map(a => a.id === athlete.id ? { ...a, status: "J" } : a))}
                      className={`w-7 h-7 rounded text-[10px] font-black transition-all cursor-pointer ${
                        athlete.status === "J" ? "bg-amber-500 text-slate-950 shadow" : "text-amber-500 hover:bg-amber-500/10"
                      }`}
                    >
                      J
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={saveAttendance}
              className="w-full bg-[#10b981] hover:bg-[#059669] text-slate-950 font-display font-black text-xs py-3 rounded-xl transition-all cursor-pointer"
            >
              Guardar Reporte de Asistencia
            </button>
          </div>
        )}

        {/* TAB 2: EVALUACIÓN TÉCNICA */}
        {activeTab === "evaluation" && (
          <form onSubmit={saveEvaluation} className="bg-[#0e121e] border border-slate-900 p-4 rounded-2xl space-y-4">
            <div>
              <h3 className="font-display font-bold text-xs uppercase tracking-wider text-slate-300">Calificación del Trimestre</h3>
              <p className="text-[9px] text-slate-500 mt-0.5">Define las habilidades individuales del atleta para el informe de rendimiento.</p>
            </div>

            {evaluationSaved && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-[#10b981] p-3 rounded-xl text-[10px] flex items-center gap-1.5 animate-fade-in">
                <Check className="w-4 h-4" />
                Informe técnico enviado y notificado al representante.
              </div>
            )}

            {/* Selector de alumno */}
            <div>
              <label className="text-[8px] text-slate-400 font-bold block mb-1">ATLETA A EVALUAR</label>
              <select
                value={selectedStudent}
                onChange={(e) => setSelectedStudent(e.target.value)}
                className="w-full bg-[#07090e] border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-brand-green"
              >
                <option value={1}>Juan Andrés García</option>
                <option value={2}>Mateo Ospina Díaz</option>
                <option value={3}>Sebastián Bedoya</option>
                <option value={4}>Santiago Valencia</option>
                <option value={5}>Nicolás Restrepo</option>
              </select>
            </div>

            {/* Sliders de Habilidades */}
            <div className="space-y-3 pt-2">
              {/* Velocidad */}
              <div>
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-300 uppercase">
                  <span>Velocidad</span>
                  <span className="text-[#10b981] font-mono">{speed}/10</span>
                </div>
                <input
                  type="range" min="1" max="10" value={speed} onChange={(e) => setSpeed(Number(e.target.value))}
                  className="w-full h-1 bg-[#07090e] rounded-lg appearance-none cursor-pointer accent-[#10b981] mt-1"
                />
              </div>

              {/* Pase */}
              <div>
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-300 uppercase">
                  <span>Pase</span>
                  <span className="text-[#10b981] font-mono">{passing}/10</span>
                </div>
                <input
                  type="range" min="1" max="10" value={passing} onChange={(e) => setPassing(Number(e.target.value))}
                  className="w-full h-1 bg-[#07090e] rounded-lg appearance-none cursor-pointer accent-[#10b981] mt-1"
                />
              </div>

              {/* Regate */}
              <div>
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-300 uppercase">
                  <span>Regate</span>
                  <span className="text-[#10b981] font-mono">{dribbling}/10</span>
                </div>
                <input
                  type="range" min="1" max="10" value={dribbling} onChange={(e) => setDribbling(Number(e.target.value))}
                  className="w-full h-1 bg-[#07090e] rounded-lg appearance-none cursor-pointer accent-[#10b981] mt-1"
                />
              </div>

              {/* Tiro */}
              <div>
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-300 uppercase">
                  <span>Tiro</span>
                  <span className="text-[#10b981] font-mono">{shooting}/10</span>
                </div>
                <input
                  type="range" min="1" max="10" value={shooting} onChange={(e) => setShooting(Number(e.target.value))}
                  className="w-full h-1 bg-[#07090e] rounded-lg appearance-none cursor-pointer accent-[#10b981] mt-1"
                />
              </div>

              {/* Fisico */}
              <div>
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-300 uppercase">
                  <span>Físico</span>
                  <span className="text-[#10b981] font-mono">{physical}/10</span>
                </div>
                <input
                  type="range" min="1" max="10" value={physical} onChange={(e) => setPhysical(Number(e.target.value))}
                  className="w-full h-1 bg-[#07090e] rounded-lg appearance-none cursor-pointer accent-[#10b981] mt-1"
                />
              </div>

              {/* Disciplina */}
              <div>
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-300 uppercase">
                  <span>Disciplina</span>
                  <span className="text-[#10b981] font-mono">{discipline}/10</span>
                </div>
                <input
                  type="range" min="1" max="10" value={discipline} onChange={(e) => setDiscipline(Number(e.target.value))}
                  className="w-full h-1 bg-[#07090e] rounded-lg appearance-none cursor-pointer accent-[#10b981] mt-1"
                />
              </div>
            </div>

            {/* Notas tácticas con dictado de voz simulado */}
            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between items-center">
                <label className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">OBSERVACIONES TÁCTICAS</label>
                <button
                  type="button"
                  onClick={handleVoiceDictation}
                  disabled={dictating}
                  className={`text-[9px] font-bold flex items-center gap-1 cursor-pointer transition-all ${
                    dictating ? "text-red-500 animate-pulse" : "text-amber-500 hover:text-amber-400"
                  }`}
                >
                  <Mic className="w-3 h-3" />
                  {dictating ? "Escuchando micrófono..." : "Dictado por Voz Real"}
                </button>
              </div>
              <textarea
                rows={3}
                placeholder="Escribe comentarios sobre posicionamiento, disciplina o metas de entrenamiento..."
                value={tacticalNotes}
                onChange={(e) => setTacticalNotes(e.target.value)}
                className="w-full bg-[#07090e] border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-700 focus:outline-none focus:border-brand-green resize-none leading-relaxed"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-display font-black text-xs py-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              Publicar Informe Técnico
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
