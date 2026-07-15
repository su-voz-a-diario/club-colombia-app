"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle, LogOut, Trophy, Video } from "lucide-react";
import { useAdminAttendance } from "@/hooks/useAdminAttendance";
import { useAdminDrills } from "@/hooks/useAdminDrills";
import { useAdminEvaluations } from "@/hooks/useAdminEvaluations";
import { useAdminEvents } from "@/hooks/useAdminEvents";
import { useAdminPayments } from "@/hooks/useAdminPayments";
import { useAdminStudents } from "@/hooks/useAdminStudents";
import { calculateLeaderboard } from "@/lib/studentModel";

const tabs = [
  { id: "students", label: "Control de Alumnos y Excepciones", title: "Control de Alumnos" },
  { id: "billing", label: "Mora y Validaciones", title: "Mora y Validaciones" },
  { id: "evaluations", label: "Evaluaciones Técnicas", title: "Evaluaciones Técnicas" },
  { id: "parent-link", label: "Vincular Padre", title: "Vincular Padre" },
  { id: "schedules", label: "Planificación de Microciclos", title: "Planificación" },
  { id: "drills", label: "Biblioteca de Ejercicios", title: "Biblioteca de Ejercicios" },
  { id: "leaderboard", label: "Tabla de Honor (Leaderboard)", title: "Tabla de Honor" },
  { id: "notifications", label: "Notificaciones Omnicanal", title: "Notificaciones" }
];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("students");
  const [paymentSearch, setPaymentSearch] = useState("");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("all");
  const [paymentSort, setPaymentSort] = useState("newest");
  const [attendanceSearch, setAttendanceSearch] = useState("");
  const [attendanceStatusFilter, setAttendanceStatusFilter] = useState("all");
  const [attendanceSort, setAttendanceSort] = useState("newest");
  const [evaluationSearch, setEvaluationSearch] = useState("");
  const [evaluationHealthFilter, setEvaluationHealthFilter] = useState("all");
  const [evaluationSort, setEvaluationSort] = useState("newest");
  const [eventSearch, setEventSearch] = useState("");
  const [eventTypeFilter, setEventTypeFilter] = useState("all");
  const [eventSort, setEventSort] = useState("date-asc");
  const [drillSearch, setDrillSearch] = useState("");
  const [drillCategoryFilter, setDrillCategoryFilter] = useState("all");
  const [drillSort, setDrillSort] = useState("title-asc");
  const [approvingPaymentId, setApprovingPaymentId] = useState("");
  const { data: students } = useAdminStudents();
  const { data: attendance, loading: attendanceLoading, error: attendanceError } = useAdminAttendance();
  const { drills, loading: drillsLoading, error: drillsError } = useAdminDrills();
  const { data: evaluations, loading: evaluationsLoading, error: evaluationsError } = useAdminEvaluations();
  const { events, loading: eventsLoading, error: eventsError } = useAdminEvents();
  const {
    pendingPayments,
    loading: paymentsLoading,
    error: paymentsError,
    successMessage: paymentSuccessMessage,
    actionLoading: paymentActionLoading,
    approvePayment,
    holdPayment,
    processSuspensions,
    clearError: clearPaymentError,
    clearSuccessMessage: clearPaymentSuccessMessage
  } = useAdminPayments();
  const currentTab = tabs.find((tab) => tab.id === activeTab) || tabs[0];
  const allAttendance = attendance;
  const getTimeValue = (value) => {
    if (!value) return 0;
    if (typeof value?.toDate === "function") return value.toDate().getTime();
    return Date.parse(value) || 0;
  };

  const filteredPayments = useMemo(() => {
    const normalizedSearch = paymentSearch.trim().toLowerCase();

    return [...pendingPayments]
      .filter((payment) => {
        const status = payment.status || "pending";
        if (paymentStatusFilter !== "all" && status !== paymentStatusFilter) return false;

        if (!normalizedSearch) return true;

        return [
          payment.studentName,
          payment.categoryName,
          payment.paymentType,
          payment.studentId,
          payment.id,
          payment.date
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(normalizedSearch));
      })
      .sort((a, b) => {
        if (paymentSort === "amount-desc") return Number(b.amount || 0) - Number(a.amount || 0);
        if (paymentSort === "amount-asc") return Number(a.amount || 0) - Number(b.amount || 0);

        const aTime = getTimeValue(a.date) || getTimeValue(a.createdAt);
        const bTime = getTimeValue(b.date) || getTimeValue(b.createdAt);
        return paymentSort === "oldest" ? aTime - bTime : bTime - aTime;
      });
  }, [paymentSearch, paymentSort, paymentStatusFilter, pendingPayments]);

  const filteredAttendance = useMemo(() => {
    const normalizedSearch = attendanceSearch.trim().toLowerCase();

    return [...attendance]
      .filter((entry) => {
        const records = Array.isArray(entry.records) ? entry.records : [];
        const hasStatus = (status) => records.some((record) => (record.status || "").toLowerCase() === status);

        if (attendanceStatusFilter === "present" && !hasStatus("p")) return false;
        if (attendanceStatusFilter === "absent" && !hasStatus("a")) return false;

        if (!normalizedSearch) return true;

        return [
          entry.id,
          entry.date,
          entry.category,
          entry.studentId,
          entry.studentName,
          ...records.flatMap((record) => [record.name, record.status])
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(normalizedSearch));
      })
      .sort((a, b) => {
        const aTime = getTimeValue(a.date) || getTimeValue(a.timestamp);
        const bTime = getTimeValue(b.date) || getTimeValue(b.timestamp);
        if (attendanceSort === "records-desc") {
          return (b.records?.length || 0) - (a.records?.length || 0);
        }
        if (attendanceSort === "records-asc") {
          return (a.records?.length || 0) - (b.records?.length || 0);
        }
        return attendanceSort === "oldest" ? aTime - bTime : bTime - aTime;
      });
  }, [attendance, attendanceSearch, attendanceSort, attendanceStatusFilter]);

  const getEvaluationAverage = (evaluation) => {
    const metrics = evaluation.metrics || {};
    const values = ["speed", "passing", "dribbling", "shooting", "physical", "discipline"]
      .map((key) => Number(metrics[key] || 0))
      .filter((value) => Number.isFinite(value));

    if (values.length === 0) return 0;
    return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10;
  };

  const filteredEvaluations = useMemo(() => {
    const normalizedSearch = evaluationSearch.trim().toLowerCase();

    return [...evaluations]
      .filter((evaluation) => {
        const healthStatus = evaluation.healthStatus || "optimal";
        if (evaluationHealthFilter !== "all" && healthStatus !== evaluationHealthFilter) return false;

        if (!normalizedSearch) return true;

        return [
          evaluation.id,
          evaluation.studentId,
          evaluation.studentName,
          evaluation.date,
          evaluation.healthStatus,
          evaluation.tacticalNotes
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(normalizedSearch));
      })
      .sort((a, b) => {
        if (evaluationSort === "average-desc") return getEvaluationAverage(b) - getEvaluationAverage(a);
        if (evaluationSort === "average-asc") return getEvaluationAverage(a) - getEvaluationAverage(b);

        const aTime = getTimeValue(a.date) || getTimeValue(a.timestamp) || getTimeValue(a.createdAt);
        const bTime = getTimeValue(b.date) || getTimeValue(b.timestamp) || getTimeValue(b.createdAt);
        return evaluationSort === "oldest" ? aTime - bTime : bTime - aTime;
      });
  }, [evaluationHealthFilter, evaluationSearch, evaluationSort, evaluations]);

  const filteredEvents = useMemo(() => {
    const normalizedSearch = eventSearch.trim().toLowerCase();

    return [...events]
      .filter((event) => {
        const eventType = event.type || "training";
        if (eventTypeFilter !== "all" && eventType !== eventTypeFilter) return false;

        if (!normalizedSearch) return true;

        return [
          event.id,
          event.title,
          event.type,
          event.date,
          event.time,
          event.location,
          event.category,
          event.description
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(normalizedSearch));
      })
      .sort((a, b) => {
        if (eventSort === "title-asc") return String(a.title || "").localeCompare(String(b.title || ""));
        if (eventSort === "title-desc") return String(b.title || "").localeCompare(String(a.title || ""));

        const aTime = getTimeValue(a.date);
        const bTime = getTimeValue(b.date);
        if (aTime !== bTime) return eventSort === "date-desc" ? bTime - aTime : aTime - bTime;

        return eventSort === "date-desc"
          ? String(b.time || "").localeCompare(String(a.time || ""))
          : String(a.time || "").localeCompare(String(b.time || ""));
      });
  }, [eventSearch, eventSort, eventTypeFilter, events]);

  const parseVideoUrl = (url) => {
    if (!url) return { type: "unknown", embedUrl: "" };
    const trimmed = url.trim();
    const ytRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/ ]{11})/;
    const ytMatch = trimmed.match(ytRegex);
    if (ytMatch && ytMatch[1]) {
      return {
        type: "youtube",
        embedUrl: `https://www.youtube.com/embed/${ytMatch[1]}`
      };
    }
    const vimeoRegex = /(?:vimeo\.com\/|player\.vimeo\.com\/video\/)([0-9]+)/;
    const vimeoMatch = trimmed.match(vimeoRegex);
    if (vimeoMatch && vimeoMatch[1]) {
      return {
        type: "vimeo",
        embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}`
      };
    }
    return {
      type: "mp4",
      embedUrl: trimmed
    };
  };

  const filteredDrills = useMemo(() => {
    const normalizedSearch = drillSearch.trim().toLowerCase();

    return [...drills]
      .filter((drill) => {
        const category = drill.category || "sin categoría";
        if (drillCategoryFilter !== "all" && category !== drillCategoryFilter) return false;

        if (!normalizedSearch) return true;

        return [
          drill.id,
          drill.title,
          drill.description,
          drill.category,
          drill.videoUrl,
          drill.date
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(normalizedSearch));
      })
      .sort((a, b) => {
        if (drillSort === "title-desc") return String(b.title || "").localeCompare(String(a.title || ""));
        if (drillSort === "category-asc") return String(a.category || "").localeCompare(String(b.category || ""));
        if (drillSort === "category-desc") return String(b.category || "").localeCompare(String(a.category || ""));

        return String(a.title || "").localeCompare(String(b.title || ""));
      });
  }, [drillCategoryFilter, drillSearch, drillSort, drills]);

  const memoizedLeaderboard = React.useMemo(
    () => calculateLeaderboard(
      students,
      evaluations,
      allAttendance
    ),
    [students, evaluations, allAttendance]
  );

  console.log(
    "leaderboard size:",
    memoizedLeaderboard.length
  );

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      maximumFractionDigits: 0
    }).format(Number(amount || 0));
  };

  const handleApprovePayment = async (paymentId) => {
    if (paymentActionLoading || !paymentId) return;
    const confirmed = window.confirm("¿Confirmas que este pago fue validado correctamente?");
    if (!confirmed) return;

    setApprovingPaymentId(paymentId);
    clearPaymentError();
    clearPaymentSuccessMessage();

    try {
      await approvePayment(paymentId);
    } catch (err) {
      // El hook expone el error para la UI.
    } finally {
      setApprovingPaymentId("");
    }
  };

  const handleHoldPayment = async (paymentId, studentIdOrName) => {
    if (paymentActionLoading || !paymentId) return;
    const confirmed = window.confirm("¿Deseas poner este pago en espera?");
    if (!confirmed) return;

    clearPaymentError();
    clearPaymentSuccessMessage();

    try {
      await holdPayment(paymentId, studentIdOrName);
    } catch (err) {
      // El hook expone el error para la UI.
    }
  };

  const handleProcessSuspensions = async () => {
    if (paymentActionLoading) return;
    const confirmed = window.confirm("¿Procesar suspensiones por mora para alumnos activos con más de 5 días de deuda?");
    if (!confirmed) return;

    clearPaymentError();
    clearPaymentSuccessMessage();

    try {
      await processSuspensions();
    } catch (err) {
      // El hook expone el error para la UI.
    }
  };

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
                <p className="text-xs text-slate-500 mb-3">
                  Asistencias: {attendance.length}
                </p>
                <p className="text-xs text-slate-500 mb-3">
                  Evaluaciones: {evaluations.length}
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
                <div className="mt-6 pt-5 border-t border-slate-800 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="bg-[#07090e]/60 border border-slate-800 rounded-2xl p-4">
                      <p className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">Asistencias</p>
                      <p className="text-2xl font-black text-slate-100 mt-1">{attendance.length}</p>
                    </div>
                    <div className="bg-[#07090e]/60 border border-slate-800 rounded-2xl p-4">
                      <p className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">Mostradas</p>
                      <p className="text-2xl font-black text-slate-100 mt-1">{filteredAttendance.length}</p>
                    </div>
                    <div className="bg-[#07090e]/60 border border-slate-800 rounded-2xl p-4">
                      <p className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">Estado</p>
                      <p className="text-xs font-bold text-[#10b981] mt-2">
                        {attendanceLoading ? "Cargando" : "Sincronizado"}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input
                      type="search"
                      value={attendanceSearch}
                      onChange={(event) => setAttendanceSearch(event.target.value)}
                      placeholder="Buscar asistencia"
                      className="bg-[#07090e] border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder:text-slate-600 outline-none focus:border-[#10b981]"
                    />
                    <select
                      value={attendanceStatusFilter}
                      onChange={(event) => setAttendanceStatusFilter(event.target.value)}
                      className="bg-[#07090e] border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-[#10b981]"
                    >
                      <option value="all">Todos los registros</option>
                      <option value="present">Con presentes</option>
                      <option value="absent">Con ausentes</option>
                    </select>
                    <select
                      value={attendanceSort}
                      onChange={(event) => setAttendanceSort(event.target.value)}
                      className="bg-[#07090e] border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-[#10b981]"
                    >
                      <option value="newest">Más recientes</option>
                      <option value="oldest">Más antiguos</option>
                      <option value="records-desc">Más registros</option>
                      <option value="records-asc">Menos registros</option>
                    </select>
                  </div>

                  {attendanceError && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3.5 rounded-xl text-xs">
                      {attendanceError}
                    </div>
                  )}

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse font-sans">
                      <thead>
                        <tr className="border-b border-slate-850 text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                          <th className="pb-3">Fecha</th>
                          <th className="pb-3">Categoría</th>
                          <th className="pb-3">Registros</th>
                          <th className="pb-3">Presentes</th>
                          <th className="pb-3">Ausentes</th>
                          <th className="pb-3">Documento</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/40">
                        {attendanceLoading ? (
                          <tr>
                            <td colSpan={6} className="py-6 text-center text-xs text-slate-500">
                              Cargando asistencias...
                            </td>
                          </tr>
                        ) : filteredAttendance.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="py-6 text-center text-xs text-slate-500">
                              No hay asistencias para mostrar.
                            </td>
                          </tr>
                        ) : filteredAttendance.map((entry) => {
                          const records = Array.isArray(entry.records) ? entry.records : [];
                          const present = records.filter((record) => (record.status || "").toLowerCase() === "p").length;
                          const absent = records.filter((record) => (record.status || "").toLowerCase() === "a").length;

                          return (
                            <tr key={entry.id} className="text-xs">
                              <td className="py-3 text-slate-200 font-bold">{entry.date || "Sin fecha"}</td>
                              <td className="py-3 text-slate-400">{entry.category || "Sin categoría"}</td>
                              <td className="py-3 text-slate-400">{records.length}</td>
                              <td className="py-3 text-[#10b981] font-bold">{present}</td>
                              <td className="py-3 text-amber-400 font-bold">{absent}</td>
                              <td className="py-3 text-slate-500 font-mono text-[10px]">{entry.id}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : activeTab === "billing" ? (
              <div className="pt-4 space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h2 className="font-display font-black text-sm uppercase tracking-wider text-slate-200">
                      Control de Mora y Recaudos
                    </h2>
                    <p className="text-slate-400 text-xs mt-1">
                      Valida pagos reportados y procesa suspensiones por mora cuando corresponda.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleProcessSuspensions}
                    disabled={paymentActionLoading}
                    className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 disabled:bg-slate-800 disabled:text-slate-500 text-white font-display font-bold text-xs px-5 py-3 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
                  >
                    {paymentActionLoading ? (
                      "Procesando..."
                    ) : (
                      <>
                        <AlertTriangle className="w-4 h-4" />
                        Procesar Suspensión por Mora
                      </>
                    )}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="bg-[#07090e]/60 border border-slate-800 rounded-2xl p-4">
                    <p className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">Pendientes</p>
                    <p className="text-2xl font-black text-slate-100 mt-1">{pendingPayments.length}</p>
                  </div>
                  <div className="bg-[#07090e]/60 border border-slate-800 rounded-2xl p-4">
                    <p className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">Mostrados</p>
                    <p className="text-2xl font-black text-slate-100 mt-1">{filteredPayments.length}</p>
                  </div>
                  <div className="bg-[#07090e]/60 border border-slate-800 rounded-2xl p-4">
                    <p className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">Estado</p>
                    <p className="text-xs font-bold text-[#10b981] mt-2">
                      {paymentsLoading ? "Cargando" : "Sincronizado"}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input
                    type="search"
                    value={paymentSearch}
                    onChange={(event) => setPaymentSearch(event.target.value)}
                    placeholder="Buscar pago"
                    className="bg-[#07090e] border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder:text-slate-600 outline-none focus:border-[#10b981]"
                  />
                  <select
                    value={paymentStatusFilter}
                    onChange={(event) => setPaymentStatusFilter(event.target.value)}
                    className="bg-[#07090e] border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-[#10b981]"
                  >
                    <option value="all">Todos los estados</option>
                    <option value="pending">Pendiente</option>
                    <option value="on_hold">En espera</option>
                  </select>
                  <select
                    value={paymentSort}
                    onChange={(event) => setPaymentSort(event.target.value)}
                    className="bg-[#07090e] border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-[#10b981]"
                  >
                    <option value="newest">Más recientes</option>
                    <option value="oldest">Más antiguos</option>
                    <option value="amount-desc">Monto mayor</option>
                    <option value="amount-asc">Monto menor</option>
                  </select>
                </div>

                {paymentsError && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3.5 rounded-xl text-xs">
                    {paymentsError}
                  </div>
                )}

                {paymentSuccessMessage && (
                  <div className="bg-[#10b981]/10 border border-[#10b981]/20 text-[#10b981] p-3.5 rounded-xl text-xs flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    <span>{paymentSuccessMessage}</span>
                  </div>
                )}

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse font-sans">
                    <thead>
                      <tr className="border-b border-slate-850 text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                        <th className="pb-3">Alumno</th>
                        <th className="pb-3">Categoría</th>
                        <th className="pb-3">Monto</th>
                        <th className="pb-3">Tipo</th>
                        <th className="pb-3">Fecha</th>
                        <th className="pb-3">Estado</th>
                        <th className="pb-3 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40">
                      {paymentsLoading ? (
                        <tr>
                          <td colSpan={7} className="py-6 text-center text-xs text-slate-500">
                            Cargando pagos pendientes...
                          </td>
                        </tr>
                      ) : filteredPayments.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-6 text-center text-xs text-slate-500">
                            No hay pagos pendientes para mostrar.
                          </td>
                        </tr>
                      ) : filteredPayments.map((payment) => (
                        <tr key={payment.id} className="text-xs">
                          <td className="py-3 font-bold text-slate-200">{payment.studentName || "Sin nombre"}</td>
                          <td className="py-3 text-slate-400">{payment.categoryName || "Sin categoría"}</td>
                          <td className="py-3 text-red-400 font-bold">{formatCurrency(payment.amount)}</td>
                          <td className="py-3 text-slate-400">{payment.paymentType || "Mensualidad"}</td>
                          <td className="py-3 text-slate-500 font-mono text-[10px]">{payment.date || "Sin fecha"}</td>
                          <td className="py-3">
                            <span className="px-2 py-1 rounded-lg bg-amber-500/10 text-amber-400 text-[9px] font-black uppercase">
                              {payment.status || "pending"}
                            </span>
                          </td>
                          <td className="py-3">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => handleApprovePayment(payment.id)}
                                disabled={approvingPaymentId === payment.id || paymentActionLoading}
                                className="bg-[#10b981] hover:bg-[#059669] disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-display font-black text-[10px] px-3 py-2 rounded-xl transition-all cursor-pointer disabled:cursor-not-allowed"
                              >
                                {approvingPaymentId === payment.id ? "Aprobando..." : "OK"}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleHoldPayment(payment.id, payment.studentId || payment.studentName)}
                                disabled={paymentActionLoading}
                                className="bg-amber-500 hover:bg-amber-600 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-display font-black text-[10px] px-3 py-2 rounded-xl transition-all cursor-pointer disabled:cursor-not-allowed"
                              >
                                En Espera
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : activeTab === "evaluations" ? (
              <div className="pt-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="bg-[#07090e]/60 border border-slate-800 rounded-2xl p-4">
                    <p className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">Evaluaciones</p>
                    <p className="text-2xl font-black text-slate-100 mt-1">{evaluations.length}</p>
                  </div>
                  <div className="bg-[#07090e]/60 border border-slate-800 rounded-2xl p-4">
                    <p className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">Mostradas</p>
                    <p className="text-2xl font-black text-slate-100 mt-1">{filteredEvaluations.length}</p>
                  </div>
                  <div className="bg-[#07090e]/60 border border-slate-800 rounded-2xl p-4">
                    <p className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">Estado</p>
                    <p className="text-xs font-bold text-[#10b981] mt-2">
                      {evaluationsLoading ? "Cargando" : "Sincronizado"}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input
                    type="search"
                    value={evaluationSearch}
                    onChange={(event) => setEvaluationSearch(event.target.value)}
                    placeholder="Buscar evaluación"
                    className="bg-[#07090e] border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder:text-slate-600 outline-none focus:border-[#10b981]"
                  />
                  <select
                    value={evaluationHealthFilter}
                    onChange={(event) => setEvaluationHealthFilter(event.target.value)}
                    className="bg-[#07090e] border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-[#10b981]"
                  >
                    <option value="all">Todos los estados físicos</option>
                    <option value="optimal">Óptimo</option>
                    <option value="fatigue">Fatiga</option>
                    <option value="injured">Lesión</option>
                  </select>
                  <select
                    value={evaluationSort}
                    onChange={(event) => setEvaluationSort(event.target.value)}
                    className="bg-[#07090e] border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-[#10b981]"
                  >
                    <option value="newest">Más recientes</option>
                    <option value="oldest">Más antiguas</option>
                    <option value="average-desc">Promedio mayor</option>
                    <option value="average-asc">Promedio menor</option>
                  </select>
                </div>

                {evaluationsError && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3.5 rounded-xl text-xs">
                    {evaluationsError}
                  </div>
                )}

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse font-sans">
                    <thead>
                      <tr className="border-b border-slate-850 text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                        <th className="pb-3">Alumno</th>
                        <th className="pb-3">Fecha</th>
                        <th className="pb-3">Promedio</th>
                        <th className="pb-3">Vel.</th>
                        <th className="pb-3">Pase</th>
                        <th className="pb-3">Físico</th>
                        <th className="pb-3">Estado físico</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40">
                      {evaluationsLoading ? (
                        <tr>
                          <td colSpan={7} className="py-6 text-center text-xs text-slate-500">
                            Cargando evaluaciones...
                          </td>
                        </tr>
                      ) : filteredEvaluations.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-6 text-center text-xs text-slate-500">
                            No hay evaluaciones para mostrar.
                          </td>
                        </tr>
                      ) : filteredEvaluations.map((evaluation) => {
                        const metrics = evaluation.metrics || {};
                        const healthStatus = evaluation.healthStatus || "optimal";

                        return (
                          <tr key={evaluation.id} className="text-xs">
                            <td className="py-3 font-bold text-slate-200">{evaluation.studentName || "Sin nombre"}</td>
                            <td className="py-3 text-slate-500 font-mono text-[10px]">{evaluation.date || "Sin fecha"}</td>
                            <td className="py-3 text-[#10b981] font-bold">{getEvaluationAverage(evaluation)}</td>
                            <td className="py-3 text-slate-400">{metrics.speed ?? "-"}</td>
                            <td className="py-3 text-slate-400">{metrics.passing ?? "-"}</td>
                            <td className="py-3 text-slate-400">{metrics.physical ?? "-"}</td>
                            <td className="py-3">
                              <span className="px-2 py-1 rounded-lg bg-slate-800 text-slate-300 text-[9px] font-black uppercase">
                                {healthStatus}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : activeTab === "schedules" ? (
              <div className="pt-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="bg-[#07090e]/60 border border-slate-800 rounded-2xl p-4">
                    <p className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">Eventos</p>
                    <p className="text-2xl font-black text-slate-100 mt-1">{events.length}</p>
                  </div>
                  <div className="bg-[#07090e]/60 border border-slate-800 rounded-2xl p-4">
                    <p className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">Mostrados</p>
                    <p className="text-2xl font-black text-slate-100 mt-1">{filteredEvents.length}</p>
                  </div>
                  <div className="bg-[#07090e]/60 border border-slate-800 rounded-2xl p-4">
                    <p className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">Estado</p>
                    <p className="text-xs font-bold text-[#10b981] mt-2">
                      {eventsLoading ? "Cargando" : "Sincronizado"}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input
                    type="search"
                    value={eventSearch}
                    onChange={(event) => setEventSearch(event.target.value)}
                    placeholder="Buscar evento"
                    className="bg-[#07090e] border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder:text-slate-600 outline-none focus:border-[#10b981]"
                  />
                  <select
                    value={eventTypeFilter}
                    onChange={(event) => setEventTypeFilter(event.target.value)}
                    className="bg-[#07090e] border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-[#10b981]"
                  >
                    <option value="all">Todos los tipos</option>
                    <option value="training">Entrenamiento</option>
                    <option value="match">Partido</option>
                    <option value="meeting">Reunión</option>
                    <option value="other">Otro</option>
                  </select>
                  <select
                    value={eventSort}
                    onChange={(event) => setEventSort(event.target.value)}
                    className="bg-[#07090e] border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-[#10b981]"
                  >
                    <option value="date-asc">Fecha ascendente</option>
                    <option value="date-desc">Fecha descendente</option>
                    <option value="title-asc">Título A-Z</option>
                    <option value="title-desc">Título Z-A</option>
                  </select>
                </div>

                {eventsError && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3.5 rounded-xl text-xs">
                    {eventsError}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {eventsLoading ? (
                    <div className="md:col-span-2 py-8 text-center text-xs text-slate-500">
                      Cargando eventos...
                    </div>
                  ) : filteredEvents.length === 0 ? (
                    <div className="md:col-span-2 py-8 text-center text-xs text-slate-500">
                      No hay eventos para mostrar.
                    </div>
                  ) : filteredEvents.map((event) => (
                    <article key={event.id} className="bg-[#07090e]/60 border border-slate-800 rounded-2xl p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-black text-slate-100">{event.title || "Evento sin título"}</p>
                          <p className="text-[10px] text-slate-500 mt-1">{event.description || "Sin descripción"}</p>
                        </div>
                        <span className="px-2 py-1 rounded-lg bg-slate-800 text-slate-300 text-[9px] font-black uppercase shrink-0">
                          {event.type || "training"}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 mt-4 text-[10px]">
                        <div>
                          <p className="text-slate-600 uppercase font-bold tracking-wider">Fecha</p>
                          <p className="text-slate-300 font-mono mt-1">{event.date || "Sin fecha"}</p>
                        </div>
                        <div>
                          <p className="text-slate-600 uppercase font-bold tracking-wider">Hora</p>
                          <p className="text-slate-300 font-mono mt-1">{event.time || "Sin hora"}</p>
                        </div>
                        <div>
                          <p className="text-slate-600 uppercase font-bold tracking-wider">Categoría</p>
                          <p className="text-slate-300 mt-1">{event.category || "Todas"}</p>
                        </div>
                        <div>
                          <p className="text-slate-600 uppercase font-bold tracking-wider">Lugar</p>
                          <p className="text-slate-300 mt-1">{event.location || "Sin sede"}</p>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse font-sans">
                    <thead>
                      <tr className="border-b border-slate-850 text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                        <th className="pb-3">Fecha</th>
                        <th className="pb-3">Hora</th>
                        <th className="pb-3">Evento</th>
                        <th className="pb-3">Tipo</th>
                        <th className="pb-3">Categoría</th>
                        <th className="pb-3">Lugar</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40">
                      {eventsLoading ? (
                        <tr>
                          <td colSpan={6} className="py-6 text-center text-xs text-slate-500">
                            Cargando calendario...
                          </td>
                        </tr>
                      ) : filteredEvents.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-6 text-center text-xs text-slate-500">
                            No hay eventos para mostrar.
                          </td>
                        </tr>
                      ) : filteredEvents.map((event) => (
                        <tr key={event.id} className="text-xs">
                          <td className="py-3 text-slate-500 font-mono text-[10px]">{event.date || "Sin fecha"}</td>
                          <td className="py-3 text-slate-500 font-mono text-[10px]">{event.time || "Sin hora"}</td>
                          <td className="py-3 font-bold text-slate-200">{event.title || "Evento sin título"}</td>
                          <td className="py-3 text-slate-400">{event.type || "training"}</td>
                          <td className="py-3 text-slate-400">{event.category || "Todas"}</td>
                          <td className="py-3 text-slate-400">{event.location || "Sin sede"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : activeTab === "drills" ? (
              <div className="pt-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="bg-[#07090e]/60 border border-slate-800 rounded-2xl p-4">
                    <p className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">Ejercicios</p>
                    <p className="text-2xl font-black text-slate-100 mt-1">{drills.length}</p>
                  </div>
                  <div className="bg-[#07090e]/60 border border-slate-800 rounded-2xl p-4">
                    <p className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">Mostrados</p>
                    <p className="text-2xl font-black text-slate-100 mt-1">{filteredDrills.length}</p>
                  </div>
                  <div className="bg-[#07090e]/60 border border-slate-800 rounded-2xl p-4">
                    <p className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">Estado</p>
                    <p className="text-xs font-bold text-[#10b981] mt-2">
                      {drillsLoading ? "Cargando" : "Sincronizado"}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input
                    type="search"
                    value={drillSearch}
                    onChange={(event) => setDrillSearch(event.target.value)}
                    placeholder="Buscar ejercicio"
                    className="bg-[#07090e] border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder:text-slate-600 outline-none focus:border-[#10b981]"
                  />
                  <select
                    value={drillCategoryFilter}
                    onChange={(event) => setDrillCategoryFilter(event.target.value)}
                    className="bg-[#07090e] border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-[#10b981]"
                  >
                    <option value="all">Todas las categorías</option>
                    <option value="técnica">Técnica individual</option>
                    <option value="físico">Físico y coordinación</option>
                    <option value="táctica">Táctica de juego</option>
                  </select>
                  <select
                    value={drillSort}
                    onChange={(event) => setDrillSort(event.target.value)}
                    className="bg-[#07090e] border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-[#10b981]"
                  >
                    <option value="title-asc">Título A-Z</option>
                    <option value="title-desc">Título Z-A</option>
                    <option value="category-asc">Categoría A-Z</option>
                    <option value="category-desc">Categoría Z-A</option>
                  </select>
                </div>

                {drillsError && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3.5 rounded-xl text-xs">
                    {drillsError}
                  </div>
                )}

                <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                  <Video className="w-4 h-4 text-[#10b981]" />
                  <div>
                    <h2 className="font-display font-black text-sm uppercase tracking-wider text-slate-200">
                      Videos de la Biblioteca
                    </h2>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Ejercicios y recursos multimedia disponibles para seguimiento deportivo.
                    </p>
                  </div>
                </div>

                {drillsLoading ? (
                  <div className="text-center text-xs text-slate-500 bg-[#07090e]/40 p-6 rounded-xl font-sans">
                    Cargando biblioteca de ejercicios...
                  </div>
                ) : filteredDrills.length === 0 ? (
                  <div className="text-center text-xs text-slate-500 bg-[#07090e]/40 p-6 rounded-xl font-sans">
                    No hay videos en la biblioteca.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {filteredDrills.map((drill) => (
                      <div
                        key={drill.id}
                        className="bg-[#07090e]/60 border border-slate-800/80 p-3.5 rounded-xl flex flex-col justify-between gap-3 text-left animate-fade-in"
                      >
                        <div>
                          <div className="flex justify-between items-start gap-2">
                            <span className="text-[8px] bg-slate-900 border border-slate-800 px-2 py-0.5 rounded font-mono text-slate-400 uppercase tracking-wider">
                              {drill.category || "Sin categoría"}
                            </span>
                            <span className="text-[8px] font-mono text-slate-600">
                              {drill.date || ""}
                            </span>
                          </div>
                          <h4 className="font-bold text-slate-200 text-xs mt-1.5">
                            {drill.title || "Ejercicio sin título"}
                          </h4>
                          <p className="text-[10px] text-slate-450 mt-1 line-clamp-2 leading-relaxed font-sans">
                            {drill.description || "Sin descripción"}
                          </p>
                        </div>
                        {(() => {
                          const videoInfo = parseVideoUrl(drill.videoUrl);
                          if (videoInfo.type === "youtube" || videoInfo.type === "vimeo") {
                            return (
                              <iframe
                                src={videoInfo.embedUrl}
                                title={drill.title || "Video de entrenamiento"}
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                className="w-full rounded-xl bg-slate-950 border border-slate-900 aspect-video"
                              />
                            );
                          }

                          if (videoInfo.embedUrl) {
                            return (
                              <video
                                src={videoInfo.embedUrl}
                                className="w-full rounded-lg bg-slate-950 aspect-video object-cover"
                                controls
                              />
                            );
                          }

                          return (
                            <div className="w-full rounded-xl bg-slate-950 border border-slate-900 aspect-video flex items-center justify-center text-[10px] text-slate-600">
                              Video no disponible
                            </div>
                          );
                        })()}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : activeTab === "leaderboard" ? (
              <div className="pt-4 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {memoizedLeaderboard.slice(0, 3).map((item, index) => {
                    const podiumStyles = [
                      "border-amber-500/30 bg-amber-500/10 text-amber-300",
                      "border-slate-500/30 bg-slate-500/10 text-slate-300",
                      "border-orange-700/30 bg-orange-700/10 text-orange-300"
                    ];
                    const podiumLabels = ["1er Lugar", "2do Lugar", "3er Lugar"];

                    return (
                      <div key={item.id} className={`border rounded-2xl p-4 ${podiumStyles[index]}`}>
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-[9px] font-black uppercase tracking-wider">{podiumLabels[index]}</span>
                          <Trophy className="w-4 h-4" />
                        </div>
                        <p className="mt-3 text-sm font-black text-slate-100">{item.name}</p>
                        <p className="mt-1 text-[10px] text-slate-400">{item.category || "Sin categoría"}</p>
                        <p className="mt-3 text-xs font-mono font-black">
                          {item.overallPoints !== null ? `${item.overallPoints} pts` : "Sin información"}
                        </p>
                      </div>
                    );
                  })}
                  {memoizedLeaderboard.length === 0 && (
                    <div className="md:col-span-3 bg-[#07090e]/60 border border-slate-800 rounded-2xl p-6 text-center">
                      <Trophy className="w-6 h-6 text-slate-600 mx-auto mb-2" />
                      <p className="text-xs text-slate-500">Aún no hay registros para la tabla de honor.</p>
                    </div>
                  )}
                </div>

                <div className="bg-[#07090e]/60 border border-slate-800 rounded-2xl p-4">
                  <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-3 mb-3">
                    <div>
                      <h2 className="font-display font-black text-sm uppercase tracking-wider text-slate-200">
                        Tabla de Honor
                      </h2>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        Ranking mensual basado en asistencia (40%) y promedio técnico (60%).
                      </p>
                    </div>
                    <Trophy className="w-5 h-5 text-[#10b981]" />
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse font-sans">
                      <thead>
                        <tr className="border-b border-slate-850 text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                          <th className="pb-3 text-center w-12">Rango</th>
                          <th className="pb-3">Deportista</th>
                          <th className="pb-3">Categoría</th>
                          <th className="pb-3 text-center">Ficha Técnica</th>
                          <th className="pb-3 text-center">Asistencia</th>
                          <th className="pb-3 text-right pr-4">Puntaje Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/40">
                        {memoizedLeaderboard.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="py-6 text-center text-xs text-slate-500">
                              Aún no hay registros
                            </td>
                          </tr>
                        ) : memoizedLeaderboard.map((item, index) => {
                          const isTop3 = index < 3;
                          const placeColors = [
                            "text-amber-400 bg-amber-500/10 border border-amber-500/20",
                            "text-slate-300 bg-slate-500/10 border border-slate-500/20",
                            "text-orange-300 bg-orange-700/10 border border-orange-700/20"
                          ];

                          return (
                            <tr key={item.id} className="text-xs">
                              <td className="py-3 text-center font-black">
                                {isTop3 ? (
                                  <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full font-black text-[10px] ${placeColors[index]}`}>
                                    {index + 1}
                                  </span>
                                ) : (
                                  <span className="text-slate-500 font-mono">#{index + 1}</span>
                                )}
                              </td>
                              <td className="py-3 font-bold text-slate-200">{item.name}</td>
                              <td className="py-3 text-slate-400">
                                <span className="bg-[#07090e] px-2 py-0.5 rounded border border-slate-850 text-[8px] uppercase tracking-wider font-mono">
                                  {item.category || "Sin categoría"}
                                </span>
                              </td>
                              <td className="py-3 text-center font-mono font-bold text-slate-300">
                                {item.avgScore !== null ? `${item.avgScore}/10` : "Sin información"}
                              </td>
                              <td className="py-3 text-center font-mono font-bold text-[#10b981]">
                                {item.attendanceRate !== null ? `${item.attendanceRate}%` : "Sin información"}
                              </td>
                              <td className="py-3 text-right font-mono font-black text-[#10b981] pr-4">
                                {item.overallPoints !== null ? (
                                  <>
                                    <span className="text-[13px]">{item.overallPoints}</span> pts
                                  </>
                                ) : (
                                  "Sin información"
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
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
