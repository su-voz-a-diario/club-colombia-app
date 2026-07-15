"use client";

import { useState } from "react";
import Link from "next/link";
import { LogOut } from "lucide-react";
import { useAdminPayments } from "@/hooks/useAdminPayments";
import { useAdminStudents } from "@/hooks/useAdminStudents";

const tabs = [
  { id: "students", label: "Control de Alumnos y Excepciones", title: "Control de Alumnos" },
  { id: "billing", label: "Mora y Validaciones", title: "Mora y Validaciones" },
  { id: "parent-link", label: "Vincular Padre", title: "Vincular Padre" },
  { id: "schedules", label: "Planificación de Microciclos", title: "Planificación" },
  { id: "drills", label: "Biblioteca de Ejercicios", title: "Biblioteca de Ejercicios" },
  { id: "leaderboard", label: "Tabla de Honor (Leaderboard)", title: "Tabla de Honor" },
  { id: "notifications", label: "Notificaciones Omnicanal", title: "Notificaciones" }
];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("students");
  const { data: students } = useAdminStudents();
  const { pendingPayments } = useAdminPayments();
  const currentTab = tabs.find((tab) => tab.id === activeTab) || tabs[0];

  return (
    <div className="min-h-screen bg-[#07090e] flex flex-col">
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

      <div className="flex-1 max-w-6xl w-full mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        <aside className="lg:col-span-1">
          <nav className="bg-[#0e121e] border border-slate-900 rounded-2xl p-2.5 flex flex-col gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`text-left px-4 py-2.5 rounded-xl text-xs font-bold font-display transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? "bg-slate-800 text-slate-200 border-l-2 border-[#10b981]"
                    : "text-slate-400 hover:bg-slate-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </aside>

        <main className="lg:col-span-3">
          <section className="bg-[#0e121e] border border-slate-900 rounded-3xl p-5 min-h-[360px]">
            <div className="border-b border-slate-800 pb-3">
              <h1 className="font-display font-black text-sm uppercase tracking-wider text-slate-200">
                {currentTab.title}
              </h1>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Diagnóstico temporal: layout y navegación cargados correctamente.
              </p>
            </div>
            {activeTab === "students" ? (
              <div className="pt-4">
                <p className="text-xs text-slate-500 mb-3">
                  Pagos pendientes: {pendingPayments.length}
                </p>
                <p className="text-xs text-slate-500 mb-3">
                  Cantidad de alumnos: {students.length}
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse font-sans">
                    <thead>
                      <tr className="border-b border-slate-850 text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                        <th className="pb-3">Nombre</th>
                        <th className="pb-3">Categoría</th>
                        <th className="pb-3">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40">
                      {students.map((student) => (
                        <tr key={student.id} className="text-xs">
                          <td className="py-3 font-bold text-slate-200">{student.name}</td>
                          <td className="py-3 text-slate-400">{student.category}</td>
                          <td className="py-3 text-slate-400">{student.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-center">
                <p className="text-xs text-slate-500 max-w-sm">
                  El contenido administrativo de esta pestaña permanece desactivado durante esta etapa.
                </p>
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
