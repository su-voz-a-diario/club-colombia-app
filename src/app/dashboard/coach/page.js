"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ShieldCheck, LogOut, Check, X, AlertCircle, Dumbbell, ClipboardList, TrendingUp, Send, Star, Volume2 } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, doc, onSnapshot, query, where, addDoc, updateDoc, setDoc, serverTimestamp } from "firebase/firestore";

export default function CoachDashboard() {
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [activeTab, setActiveTab] = useState("attendance"); // 'attendance' | 'evaluation'
  const [attendanceSaved, setAttendanceSaved] = useState(false);

  // Estados para evaluación técnica y salud
  const [selectedStudent, setSelectedStudent] = useState("");
  const [speed, setSpeed] = useState(7);
  const [passing, setPassing] = useState(8);
  const [dribbling, setDribbling] = useState(6);
  const [shooting, setShooting] = useState(7);
  const [physical, setPhysical] = useState(8);
  const [discipline, setDiscipline] = useState(9);
  const [healthStatus, setHealthStatus] = useState("optimal"); // 'optimal' | 'fatigue' | 'injured'
  const [tacticalNotes, setTacticalNotes] = useState("");
  const [evaluationSaved, setEvaluationSaved] = useState(false);
  const [nextEvent, setNextEvent] = useState(null);

  useEffect(() => {
    // Escuchar alumnos registrados en tiempo real
    const unsubscribe = onSnapshot(collection(db, "students"), (snapshot) => {
      const studs = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        studs.push({ id: doc.id, studentId: data.studentId || doc.id, ...data });
      });
      setStudents(studs);
      
      // Inicializar estado de asistencia si aún no se ha modificado manualmente
      setAttendance(prev => {
        return studs.map(s => {
          const existing = prev.find(a => a.id === s.id);
          return {
            id: s.id,
            studentId: s.studentId || s.id,
            name: s.name,
            status: existing ? existing.status : null,
            healthStatus: s.healthStatus || "optimal"
          };
        });
      });
    });

    return () => unsubscribe();
  }, []);

  // Escuchar el siguiente evento del microciclo para contar RSVPs
  useEffect(() => {
    const unsubscribeEvents = onSnapshot(collection(db, "events"), (snapshot) => {
      const evs = [];
      snapshot.forEach(doc => {
        evs.push({ id: doc.id, ...doc.data() });
      });
      const nowStr = new Date().toISOString().split("T")[0];
      const upcoming = evs
        .filter(e => e.date >= nowStr)
        .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))[0];
      setNextEvent(upcoming || null);
    });
    return () => unsubscribeEvents();
  }, []);

  // Pre-cargar estado de salud cuando se selecciona un alumno
  useEffect(() => {
    if (selectedStudent) {
      const student = students.find(s => (s.studentId || s.id) === selectedStudent);
      if (student && student.healthStatus) {
        setHealthStatus(student.healthStatus);
      } else {
        setHealthStatus("optimal");
      }
    }
  }, [selectedStudent, students]);

  // Manejar el click de asistencia con alertas de salud para lesionados
  const handleAttendanceClick = (athlete, newStatus) => {
    if (newStatus === "P" && athlete.healthStatus === "injured") {
      const confirmBypass = window.confirm(`ALERTA MÉDICA: ${athlete.name} está registrado como LESIONADO. ¿Deseas autorizar su participación bajo tu supervisión en esta sesión?`);
      if (!confirmBypass) return;
    }
    setAttendance(prev => prev.map(a => a.id === athlete.id ? { ...a, status: newStatus } : a));
  };

  // Guardar reporte de asistencia en Firestore
  const saveAttendance = async () => {
    try {
      const dateStr = new Date().toLocaleDateString("es-CO");
      await setDoc(doc(db, "attendance", `attendance-${dateStr.replace(/\//g, "-")}`), {
        date: dateStr,
        category: "Sin información disponible",
        records: attendance.map(a => ({ name: a.name, status: a.status || "P" })),
        timestamp: new Date().toISOString()
      });
      setAttendanceSaved(true);
      setTimeout(() => setAttendanceSaved(false), 3000);
    } catch (err) {
      console.error("Error al guardar asistencia en Firestore:", err);
    }
  };

  // Guardar reporte de evaluación técnica en Firestore como histórico
  const saveEvaluation = async (e) => {
    e.preventDefault();
    if (!selectedStudent) return;

    try {
      const selectedStudentDoc = students.find(s => (s.studentId || s.id) === selectedStudent);
      if (!selectedStudentDoc) return;
      const targetStudentId = selectedStudentDoc.studentId || selectedStudentDoc.id;
      const targetName = selectedStudentDoc.name;
      const metricsObj = { speed, passing, dribbling, shooting, physical, discipline };
      
      // Guardar evaluación histórica en evaluations
      await addDoc(collection(db, "evaluations"), {
        studentId: targetStudentId,
        studentName: targetName,
        metrics: metricsObj,
        tacticalNotes: tacticalNotes,
        date: new Date().toLocaleDateString("es-CO"),
        timestamp: new Date().toISOString(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Actualizar el estado de salud del estudiante en su ficha de deportista
      await updateDoc(doc(db, "students", targetStudentId), {
        healthStatus: healthStatus,
        updatedAt: serverTimestamp()
      });

      setEvaluationSaved(true);
      setTimeout(() => {
        setEvaluationSaved(false);
        // Resetear sliders
        setSpeed(7); setPassing(8); setDribbling(6); setShooting(7); setPhysical(8); setDiscipline(9);
        setTacticalNotes("");
      }, 3000);
    } catch (err) {
      console.error("Error al guardar evaluación en Firestore:", err);
    }
  };

  return (
    <div className="min-h-screen bg-[#07090e] flex flex-col max-w-md mx-auto border-x border-slate-900 shadow-2xl">
      {/* Header optimizado para celular */}
      <header className="glass-panel border-b border-slate-900 px-5 py-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div>
            <h1 className="font-display font-black text-xs uppercase text-slate-200">Portal del Entrenador</h1>
            <p className="text-[9px] text-[#10b981] font-bold uppercase tracking-wider">Sin información disponible</p>
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

      {/* Portal Welcome Section */}
      <div className="px-4 pt-6 pb-2 text-center flex flex-col items-center border-b border-slate-900/40 bg-[#090d16]/10">
        <img 
          src="/logo.png" 
          alt="Escudo Club Colombia" 
          className="w-16 h-16 object-contain mb-2 filter drop-shadow-[0_0_12px_rgba(16,185,129,0.15)] animate-pulse-subtle" 
        />
        <h2 className="font-display font-black text-sm text-slate-100 uppercase tracking-wider">
          Portal del Entrenador
        </h2>
        <p className="text-[8px] font-mono text-slate-500 uppercase tracking-widest">
          Club Colombia • Sin información disponible
        </p>
      </div>

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

            {/* Siguiente Evento y RSVP */}
            {nextEvent && (
              <div className="bg-[#07090e]/60 border border-slate-800/80 p-3 rounded-xl flex items-center justify-between text-xs">
                <div className="min-w-0 flex-1 pr-2">
                  <span className="text-[8px] text-[#10b981] font-bold uppercase tracking-wider block">Próximo Evento (RSVP)</span>
                  <span className="font-bold text-slate-200 block truncate">{nextEvent.title}</span>
                  <span className="text-[8px] text-slate-500 font-mono mt-0.5 block">{nextEvent.date} • {nextEvent.time}</span>
                </div>
                <div className="bg-[#10b981]/15 border border-[#10b981]/25 text-[#10b981] font-bold px-3 py-1.5 rounded-xl text-center shrink-0">
                  <span className="block text-[13px] font-black leading-none">
                    {nextEvent.rsvps ? Object.values(nextEvent.rsvps).filter(v => v === "confirmed").length : 0}
                  </span>
                  <span className="text-[6px] uppercase tracking-wider block mt-0.5 leading-none">Confirmados</span>
                </div>
              </div>
            )}

            {attendanceSaved && (
              <div className="bg-[#10b981]/10 border border-[#10b981]/20 text-[#10b981] p-3 rounded-xl text-[10px] flex items-center gap-1.5 animate-fade-in">
                <Check className="w-4 h-4" />
                Asistencia guardada y sincronizada en tiempo real.
              </div>
            )}

            <div className="divide-y divide-slate-800/60">
              {attendance.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-500 font-sans">
                  Aún no hay registros
                </div>
              ) : attendance.map((athlete) => (
                <div key={athlete.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="text-xs font-bold text-slate-300 truncate">{athlete.name}</span>
                    <div className="flex items-center gap-1">
                      {athlete.healthStatus === "injured" && (
                        <span className="text-[7px] bg-red-500/10 text-red-400 border border-red-500/20 px-1.5 py-0.5 rounded-full font-bold inline-flex items-center gap-0.5 leading-none">
                          <span className="w-1 h-1 bg-red-500 rounded-full animate-pulse" /> Lesionado
                        </span>
                      )}
                      {athlete.healthStatus === "fatigue" && (
                        <span className="text-[7px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded-full font-bold inline-flex items-center gap-0.5 leading-none">
                          <span className="w-1 h-1 bg-amber-500 rounded-full" /> Fatiga
                        </span>
                      )}
                      {athlete.healthStatus === "optimal" && (
                        <span className="text-[7px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded-full font-bold inline-flex items-center gap-0.5 leading-none">
                          <span className="w-1 h-1 bg-emerald-500 rounded-full" /> Óptimo
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Selector Táctil */}
                  <div className="flex items-center gap-1 bg-[#07090e] p-1 rounded-lg border border-slate-900 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleAttendanceClick(athlete, "P")}
                      className={`w-7 h-7 rounded text-[10px] font-black transition-all cursor-pointer ${
                        athlete.status === "P" ? "bg-emerald-500 text-slate-950 shadow" : "text-emerald-500 hover:bg-emerald-500/10"
                      }`}
                    >
                      P
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAttendanceClick(athlete, "A")}
                      className={`w-7 h-7 rounded text-[10px] font-black transition-all cursor-pointer ${
                        athlete.status === "A" ? "bg-red-500 text-slate-950 shadow" : "text-red-500 hover:bg-red-500/10"
                      }`}
                    >
                      A
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAttendanceClick(athlete, "J")}
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
                <option value="">-- Seleccionar Atleta --</option>
                {students.length === 0 && (
                  <option value="" disabled>Aún no hay registros</option>
                )}
                {students.map((s) => (
                  <option key={s.id} value={s.studentId || s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            {/* Selector de Estado Físico */}
            {selectedStudent && (
              <div className="animate-fade-in">
                <label className="text-[8px] text-slate-400 font-bold block mb-1">ESTADO FÍSICO / SALUD</label>
                <select
                  value={healthStatus}
                  onChange={(e) => setHealthStatus(e.target.value)}
                  className="w-full bg-[#07090e] border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-250 focus:outline-none focus:border-brand-green"
                >
                  <option value="optimal">🟢 Óptimo (Listo para entrenar)</option>
                  <option value="fatigue">🟡 Fatiga / Carga moderada (Precaución)</option>
                  <option value="injured">🔴 Lesionado (Protocolo de descanso activo)</option>
                </select>
              </div>
            )}

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

            {/* Notas tácticas */}
            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between items-center">
                <label className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">OBSERVACIONES TÁCTICAS</label>
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
