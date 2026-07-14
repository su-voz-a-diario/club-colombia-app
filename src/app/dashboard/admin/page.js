"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ShieldCheck, LogOut, Users, DollarSign, AlertTriangle, MessageSquare, PlusCircle, CheckCircle, RefreshCw, Calendar, Sparkles, Trash2, Trophy, Video, Pencil, Smartphone } from "lucide-react";
import { db } from "@/lib/firebase";
import { AdminService } from "@/services/admin";
import { categoryNameToId, normalizeStudentName, calculateLeaderboard } from "@/lib/studentModel";
import { normalizeAndValidatePhone } from "@/lib/phone";
import { collection, doc, onSnapshot, updateDoc, getDoc, query, where, getDocs, deleteDoc, serverTimestamp } from "firebase/firestore";
import { useAdminStudents, useAdminEvaluations, useAdminAttendance, useAdminEvents, useAdminAnnouncements, useAdminDrills, useAdminPhones, useAdminPayments } from "@/hooks";

export default function AdminDashboard() {
  const formatCurrency = (val) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      maximumFractionDigits: 0
    }).format(val);
  };

  const lifecycleActions = {
    reactivate: {
      label: "Reactivar Alumno",
      status: "active",
      tone: "emerald",
      description: "El alumno volverá a estar activo sin modificar historial, pagos, asistencias, evaluaciones, padre ni categoría."
    },
    suspend: {
      label: "Suspender Alumno",
      status: "suspended",
      tone: "amber",
      description: "El acceso del alumno será restringido por una razón administrativa. Toda la información histórica se conserva."
    },
    inactive: {
      label: "Dar de Baja",
      status: "inactive",
      tone: "slate",
      description: "El alumno dejará de formar parte de los alumnos activos, pero toda su información permanecerá almacenada."
    },
    delete: {
      label: "Eliminar Definitivamente",
      status: "",
      tone: "red",
      description: "Acción reservada para registros duplicados, pruebas o errores de captura. El borrado físico está bloqueado por seguridad."
    }
  };

  const lifecycleReasonOptions = {
    suspend: ["Adeudo administrativo", "Disciplina", "Documentación pendiente", "Solicitud del acudiente", "Otro"],
    inactive: ["Retiro temporal", "Cambio de club", "Cambio de ciudad", "Pausa familiar", "Otro"]
  };

  // Datos consumidos desde capa de servicios
  const { data: students, loading: studentsLoading, error: studentsError, manualRegisterStudent, applyCategoryOverride, confirmManualPayment } = useAdminStudents();
  
  const activeStudentsCount = React.useMemo(() => {
    return (students || []).filter(s => s.status === "active").length;
  }, [students]);

  const delinquentStudentsCount = React.useMemo(() => {
    return (students || []).filter(s => s.status === "active" && Number(s.dueDays || 0) > 5).length;
  }, [students]);

  const [activeTab, setActiveTab] = useState("students"); // 'students' | 'billing' | 'schedules' | 'notifications'
  
  // Estados para override
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [newCategory, setNewCategory] = useState("");
  const [overrideReason, setOverrideReason] = useState("");
  const [managedStudent, setManagedStudent] = useState(null);
  const [pendingLifecycleAction, setPendingLifecycleAction] = useState(null);
  const [lifecycleDeleteText, setLifecycleDeleteText] = useState("");
  const [lifecycleReason, setLifecycleReason] = useState("");
  const [lifecycleOtherReason, setLifecycleOtherReason] = useState("");
  const [lifecycleHistory, setLifecycleHistory] = useState(null);
  const [lifecycleLoading, setLifecycleLoading] = useState(false);
  const [lifecycleMessage, setLifecycleMessage] = useState("");
  const [lifecycleError, setLifecycleError] = useState("");

  // Estado para envío de notificación
  const [notificationText, setNotificationText] = useState("");
  const [notificationStatus, setNotificationStatus] = useState(false);

  // Estados para el formulario de inscripción manual
  const [showAddForm, setShowAddForm] = useState(false);
  const [manualStudentName, setManualStudentName] = useState("");
  const [manualStudentAge, setManualStudentAge] = useState("");
  const [manualParentName, setManualParentName] = useState("");
  const [manualParentPhone, setManualParentPhone] = useState("");
  const [manualPaidCash, setManualPaidCash] = useState(false);
  const [manualPaymentConcept, setManualPaymentConcept] = useState("monthly"); // "monthly" | "class"

  // Hook centralizado para pagos pendientes y validaciones
  const { 
    pendingPayments, 
    approvePayment, 
    holdPayment,
    processSuspensions, 
    actionLoading, 
    error: paymentActionError, 
    successMessage: paymentActionSuccess,
    clearError: clearPaymentError,
    clearSuccessMessage: clearPaymentSuccess
  } = useAdminPayments();
  const [approvingPaymentId, setApprovingPaymentId] = useState("");

  // Herramienta segura para vincular padres con alumnos concretos
  const [parentLinkIdentifierType, setParentLinkIdentifierType] = useState("phone");
  const [parentLinkIdentifier, setParentLinkIdentifier] = useState("");
  const [parentLinkLoading, setParentLinkLoading] = useState(false);
  const [parentLinkSaving, setParentLinkSaving] = useState(false);
  const [parentLinkResult, setParentLinkResult] = useState(null);
  const [parentLinkSelectedIds, setParentLinkSelectedIds] = useState([]);
  const [parentLinkMessage, setParentLinkMessage] = useState("");
  const [parentLinkError, setParentLinkError] = useState("");

  // Event form states
  const [eventTitle, setEventTitle] = useState("");
  const [eventType, setEventType] = useState("training");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [eventCategory, setEventCategory] = useState("Sub-10 Competitivo");
  const [eventDescription, setEventDescription] = useState("");
  const [eventSaved, setEventSaved] = useState(false);

  // Drill form states
  const [drillTitle, setDrillTitle] = useState("");
  const [drillDescription, setDrillDescription] = useState("");
  const [drillCategory, setDrillCategory] = useState("técnica");
  const [drillVideoUrl, setDrillVideoUrl] = useState("");
  const [drillSaved, setDrillSaved] = useState(false);
  const [editingDrillId, setEditingDrillId] = useState(null);

  // Phone update modal states
  const [phoneModalOpen, setPhoneModalOpen] = useState(false);
  const [selectedParentStudent, setSelectedParentStudent] = useState(null);
  const [newParentPhone, setNewParentPhone] = useState("");
  const { updatePhone, loading: phoneUpdating, error: phoneError, successMessage: phoneSuccess, clearState: clearPhoneState } = useAdminPhones();

  // Leaderboard lists
  const { data: evaluations } = useAdminEvaluations();
  const { data: allAttendance } = useAdminAttendance();
  const { events, createEvent, deleteEvent } = useAdminEvents();
  const { sendAnnouncement } = useAdminAnnouncements();
  const { drills, saveDrill, deleteDrill } = useAdminDrills();

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    if (!eventTitle || !eventDate || !eventTime) return;

    try {
      await createEvent({
        title: eventTitle,
        type: eventType,
        date: eventDate,
        time: eventTime,
        location: eventLocation,
        category: eventCategory,
        description: eventDescription
      });

      setEventSaved(true);
      setTimeout(() => {
        setEventSaved(false);
        setEventTitle("");
        setEventDate("");
        setEventTime("");
        setEventLocation("");
        setEventDescription("");
      }, 2500);
    } catch (err) {
      console.error("Error creating event:", err);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    const confirmDel = window.confirm("¿Seguro que deseas eliminar este evento?");
    if (!confirmDel) return;
    try {
      await deleteEvent(eventId);
    } catch (err) {
      console.error("Error deleting event:", err);
    }
  };

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

  const handleEditDrillClick = (drill) => {
    setDrillTitle(drill.title);
    setDrillDescription(drill.description || "");
    setDrillCategory(drill.category || "técnica");
    setDrillVideoUrl(drill.videoUrl);
    setEditingDrillId(drill.id);
  };

  const handleCancelEditDrill = () => {
    setDrillTitle("");
    setDrillDescription("");
    setDrillCategory("técnica");
    setDrillVideoUrl("");
    setEditingDrillId(null);
  };

  const handleCreateDrill = async (e) => {
    e.preventDefault();
    const titleClean = drillTitle.trim();
    const urlClean = drillVideoUrl.trim();
    const descClean = drillDescription.trim();
    const catClean = drillCategory.trim();

    if (!titleClean || !urlClean || !catClean) {
      alert("El título, la categoría y la URL son campos obligatorios.");
      return;
    }

    try {
      await saveDrill({
        title: titleClean,
        description: descClean,
        category: catClean,
        videoUrl: urlClean,
        date: new Date().toLocaleDateString("es-CO")
      }, editingDrillId);

      if (editingDrillId) {
        setEditingDrillId(null);
      }

      setDrillSaved(true);
      setTimeout(() => {
        setDrillSaved(false);
        setDrillTitle("");
        setDrillDescription("");
        setDrillVideoUrl("");
        setDrillCategory("técnica");
      }, 2500);
    } catch (err) {
      console.error("Error saving drill:", err);
    }
  };

  const handleDeleteDrill = async (drillId) => {
    const confirmDel = window.confirm("¿Seguro que deseas eliminar este ejercicio de la biblioteca permanentemente?");
    if (!confirmDel) return;
    try {
      await deleteDrill(drillId);
    } catch (err) {
      console.error("Error deleting drill:", err);
    }
  };

  const handleOpenPhoneModal = (student) => {
    setSelectedParentStudent(student);
    setNewParentPhone(student.parentPhone || "");
    clearPhoneState();
    setPhoneModalOpen(true);
  };

  const handleUpdatePhoneSubmit = async (e) => {
    e.preventDefault();
    if (!selectedParentStudent) return;
    
    try {
      await updatePhone(
        selectedParentStudent.parentUid || "",
        selectedParentStudent.parentPhone || "",
        newParentPhone
      );
      
      // La capa de servicios se actualizará automáticamente por el listener nativo
      setTimeout(() => {
        setPhoneModalOpen(false);
        setSelectedParentStudent(null);
        setNewParentPhone("");
      }, 2000);
    } catch (err) {
      // El error ya es manejado por el hook y mostrado en phoneError
      console.error("Error al actualizar teléfono desde modal:", err);
    }
  };

  const handleParentLinkSearch = async (e) => {
    e.preventDefault();
    setParentLinkLoading(true);
    setParentLinkError("");
    setParentLinkMessage("");
    setParentLinkResult(null);
    setParentLinkSelectedIds([]);

    try {
      const response = await fetch("/api/admin/link-parent-diagnostics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifierType: parentLinkIdentifierType,
          identifier: parentLinkIdentifier
        })
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "No fue posible diagnosticar la cuenta padre.");
      }
      setParentLinkResult(data);
    } catch (err) {
      setParentLinkError(err.message);
    } finally {
      setParentLinkLoading(false);
    }
  };

  const toggleParentLinkStudent = (studentId) => {
    setParentLinkSelectedIds(prev => (
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    ));
  };

  const handleParentLinkSubmit = async () => {
    if (!parentLinkResult?.parent?.uid || parentLinkSelectedIds.length === 0) return;
    const selectedStudents = parentLinkResult.students.filter(student => parentLinkSelectedIds.includes(student.studentId));
    const relatedPaymentCount = parentLinkResult.payments.filter(payment => (
      parentLinkSelectedIds.includes(payment.studentId) && !payment.parentUid
    )).length;
    const confirmed = window.confirm(
      [
        "Confirma la vinculación administrativa:",
        "",
        `Cuenta padre: ${parentLinkResult.parent.uid}`,
        `Alumnos seleccionados: ${selectedStudents.map(student => `${student.name || "Sin nombre"} (${student.studentId})`).join(", ")}`,
        "",
        "Se escribirá:",
        "- users/{parentUid}: role=parent, status=active, studentIds, updatedAt",
        "- students/{studentId}: parentUid, updatedAt",
        `- payments relacionados sin parentUid: parentUid, updatedAt (${relatedPaymentCount})`,
        "",
        "No se cambiará el status de alumnos ni pagos."
      ].join("\n")
    );
    if (!confirmed) return;

    setParentLinkSaving(true);
    setParentLinkError("");
    setParentLinkMessage("");

    try {
      const response = await fetch("/api/admin/link-parent-students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parentUid: parentLinkResult.parent.uid,
          studentIds: parentLinkSelectedIds
        })
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "No fue posible vincular la cuenta padre.");
      }
      setParentLinkMessage(`Vinculación exitosa. Alumnos vinculados: ${data.linkedStudentIds.length}. Pagos históricos actualizados: ${data.updatedPayments}.`);
      setParentLinkSelectedIds([]);
    } catch (err) {
      setParentLinkError(err.message);
    } finally {
      setParentLinkSaving(false);
    }
  };

  const openLifecycleModal = (student) => {
    setManagedStudent(student);
    setPendingLifecycleAction(null);
    setLifecycleDeleteText("");
    setLifecycleReason("");
    setLifecycleOtherReason("");
    setLifecycleHistory(null);
    setLifecycleMessage("");
    setLifecycleError("");
  };

  const closeLifecycleModal = () => {
    setManagedStudent(null);
    setPendingLifecycleAction(null);
    setLifecycleDeleteText("");
    setLifecycleReason("");
    setLifecycleOtherReason("");
    setLifecycleHistory(null);
    setLifecycleMessage("");
    setLifecycleError("");
  };

  const prepareLifecycleAction = async (actionKey) => {
    setPendingLifecycleAction(actionKey);
    setLifecycleDeleteText("");
    setLifecycleReason("");
    setLifecycleOtherReason("");
    setLifecycleMessage("");
    setLifecycleError("");
    setLifecycleHistory(null);

    if (actionKey === "delete" && managedStudent) {
      setLifecycleLoading(true);
      try {
        const history = await AdminService.getStudentLifecycleHistory(managedStudent);
        setLifecycleHistory(history);
      } catch (err) {
        setLifecycleError(err.message || "No fue posible revisar el historial del alumno.");
      } finally {
        setLifecycleLoading(false);
      }
    }
  };

  const executeLifecycleStatusAction = async () => {
    if (!managedStudent || !pendingLifecycleAction) return;
    const action = lifecycleActions[pendingLifecycleAction];
    if (!action?.status) return;

    setLifecycleLoading(true);
    setLifecycleError("");
    setLifecycleMessage("");

    try {
      const reasonDetail = lifecycleReason === "Otro" ? lifecycleOtherReason.trim() : "";
      await AdminService.updateStudentLifecycleStatus(managedStudent.studentId || managedStudent.id, action.status, {
        reason: lifecycleReason,
        reasonDetail
      });
      setLifecycleMessage(`${action.label} aplicado correctamente. No se modificó historial ni relaciones.`);
    } catch (err) {
      setLifecycleError(err.message || "No fue posible actualizar el estado del alumno.");
    } finally {
      setLifecycleLoading(false);
    }
  };

  const executeProtectedDelete = async () => {
    if (!managedStudent || lifecycleDeleteText !== "ELIMINAR") return;
    setLifecycleLoading(true);
    setLifecycleError("");
    setLifecycleMessage("");

    try {
      const result = await AdminService.deleteEmptyStudent(managedStudent);
      setLifecycleHistory(result.history || null);
      setLifecycleError("El borrado físico está bloqueado por seguridad. Utilice la opción Dar de Baja.");
    } catch (err) {
      setLifecycleError(err.message || "No fue posible validar la eliminación del alumno.");
    } finally {
      setLifecycleLoading(false);
    }
  };

  const memoizedLeaderboard = React.useMemo(() => {
    return calculateLeaderboard(students, evaluations, allAttendance);
  }, [students, evaluations, allAttendance]);


  useEffect(() => {
    // La suscripción a pagos ahora se maneja dentro del hook useAdminPayments
  }, []);



  // Confirmar pago manual para levantar suspensión (Directo desde lista)
  const handleConfirmManualPayment = async (studentIdOrName) => {
    try {
      await confirmManualPayment(studentIdOrName);
    } catch (err) {
      console.error("Error en confirmManualPayment:", err);
    }
  };

  // Confirmar y aprobar una solicitud de pago reportada
  const handleApprovePayment = async (paymentId) => {
    if (actionLoading) return;
    setApprovingPaymentId(paymentId);
    
    try {
      await approvePayment(paymentId);
    } catch (err) {
      // El error ya está en el hook
    } finally {
      setApprovingPaymentId("");
    }
  };

  // Poner una solicitud de pago en espera
  const handleHoldPayment = async (paymentId, studentIdOrNameFromPayment) => {
    if (actionLoading) return;
    try {
      await holdPayment(paymentId, studentIdOrNameFromPayment);
    } catch (err) {
      // El error ya está en el hook
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
      const studentData = {
        name: manualStudentName,
        normalizedName: normalizeStudentName(manualStudentName),
        age: ageNum,
        parentName: manualParentName,
        parentPhone: normalizeAndValidatePhone(manualParentPhone),
        parentEmail: "",
        parentUid: "",
        categoryId: categoryNameToId(category),
        category: category,
        assignedCoachUid: "",
        assignment: "automatic",
        status: manualPaidCash ? "active" : "suspended",
        billingStatus: manualPaidCash ? "paid" : "pending_payment",
        healthStatus: "optimal",
        dueDays: manualPaidCash ? 0 : 7,
      };

      await manualRegisterStudent(studentData, manualPaidCash, manualPaymentConcept);
      localStorage.setItem("simulatedStatus", manualPaidCash ? "active" : "suspended");
    } catch (err) {
      console.error("Error en registro manual de Firestore:", err);
    }

    // Resetear form
    setManualStudentName("");
    setManualStudentAge("");
    setManualParentName("");
    setManualParentPhone("");
    setManualPaidCash(false);
    setManualPaymentConcept("monthly");
    setShowAddForm(false);
  };

  // Aplicar override manual de categoría
  const handleApplyOverride = async (e) => {
    e.preventDefault();
    if (!selectedStudent) return;

    try {
      const studentId = selectedStudent.studentId || selectedStudent.id || selectedStudent.name;
      const newCategoryData = {
        categoryId: categoryNameToId(newCategory),
        category: newCategory,
        assignment: "manual",
        overrideReason: overrideReason || "Ajuste manual del cuerpo técnico"
      };
      
      await applyCategoryOverride(studentId, newCategoryData);
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
      await sendAnnouncement(notificationText);
      setNotificationStatus(true);
      setTimeout(() => {
        setNotificationStatus(false);
        setNotificationText("");
      }, 3000);
    } catch (err) {
      console.error("Error en envío de comunicado:", err);
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
                <span className="text-[9px] text-slate-400 font-bold uppercase block">Plantilla Activa</span>
                <span className="text-xl font-display font-black text-slate-200 flex items-center gap-1.5 mt-0.5">
                  <Users className="w-4 h-4 text-[#10b981]" />
                  {students.length > 0 ? activeStudentsCount : "Sin información"}
                </span>
                {students.length > 0 && (
                  <span className="text-[9px] text-slate-500 font-mono mt-1 block">
                    Histórico: {students.length} alumnos
                  </span>
                )}
              </div>

              {/* Stat 2 */}
              <div className="bg-[#07090e]/60 border border-slate-800/80 p-3 rounded-xl">
                <span className="text-[9px] text-slate-400 font-bold uppercase block">MRR Estimado (Mensual)</span>
                <span className="text-xl font-display font-black text-slate-200 flex items-center gap-1.5 mt-0.5">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                  Sin información
                </span>
              </div>

              {/* Stat 3 */}
              <div className="bg-[#07090e]/60 border border-slate-800/80 p-3 rounded-xl">
                <span className="text-[9px] text-slate-400 font-bold uppercase block">Tasa de Morosidad</span>
                <span className="text-xl font-display font-black text-amber-500 flex items-center gap-1.5 mt-0.5 animate-pulse">
                  <AlertTriangle className="w-4 h-4" />
                  {activeStudentsCount > 0
                    ? `${((delinquentStudentsCount / activeStudentsCount) * 100).toFixed(0)}%`
                    : "Sin información"}
                </span>
                {students.length > 0 && (
                  <span className="text-[9px] text-slate-500 font-mono mt-1 block">
                    Base: plantilla activa
                  </span>
                )}
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
              Control de Alumnos y Excepciones
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
              onClick={() => setActiveTab("parent-link")}
              className={`text-left px-4 py-2.5 rounded-xl text-xs font-bold font-display transition-all cursor-pointer ${
                activeTab === "parent-link" ? "bg-slate-800 text-slate-200 border-l-2 border-[#10b981]" : "text-slate-400 hover:bg-slate-900"
              }`}
            >
              Vincular Padre
            </button>
            <button
              onClick={() => setActiveTab("schedules")}
              className={`text-left px-4 py-2.5 rounded-xl text-xs font-bold font-display transition-all cursor-pointer ${
                activeTab === "schedules" ? "bg-slate-800 text-slate-200 border-l-2 border-[#10b981]" : "text-slate-400 hover:bg-slate-900"
              }`}
            >
              Planificación de Microciclos
            </button>
            <button
              onClick={() => setActiveTab("drills")}
              className={`text-left px-4 py-2.5 rounded-xl text-xs font-bold font-display transition-all cursor-pointer ${
                activeTab === "drills" ? "bg-slate-800 text-slate-200 border-l-2 border-[#10b981]" : "text-slate-400 hover:bg-slate-900"
              }`}
            >
              Biblioteca de Ejercicios
            </button>
            <button
              onClick={() => setActiveTab("leaderboard")}
              className={`text-left px-4 py-2.5 rounded-xl text-xs font-bold font-display transition-all cursor-pointer ${
                activeTab === "leaderboard" ? "bg-slate-800 text-slate-200 border-l-2 border-[#10b981]" : "text-slate-400 hover:bg-slate-900"
              }`}
            >
              Tabla de Honor (Leaderboard)
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
                  <p className="text-[10px] text-slate-500 mt-0.5">Gestión de deportistas activos y asignación excepcional de categorías por edad (Excepciones Manuales).</p>
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
                        placeholder="+57 300 123 4567"
                        value={manualParentPhone}
                        onChange={(e) => setManualParentPhone(e.target.value)}
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

              {/* VISTA MÓVIL (TARJETAS RESPONSIVAS) */}
              <div className="block md:hidden space-y-3 font-sans">
                {memoizedLeaderboard.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-500 bg-[#07090e]/50 border border-slate-850 rounded-2xl">
                    Aún no hay registros
                  </div>
                ) : (
                  memoizedLeaderboard.map((student) => (
                    <div key={student.id} className="bg-[#07090e] border border-slate-850 p-4 rounded-2xl space-y-3 text-left">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-slate-200 text-xs">{student.name}</h4>
                          <span className="text-[10px] text-slate-450 block mt-0.5">{student.age} años</span>
                        </div>
                        <span className="bg-[#0e121e] px-2 py-0.5 rounded border border-slate-800 text-[9px] text-slate-350 font-medium">
                          {student.category}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center pt-2 border-t border-slate-850/50">
                        <div>
                          <span className="text-[8px] text-slate-500 uppercase tracking-wider block font-bold">Asignación</span>
                          <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider mt-0.5 ${
                            student.assignment === "automatic"
                              ? "bg-emerald-500/10 text-emerald-400"
                              : "bg-amber-500/10 text-amber-500"
                          }`}>
                            {student.assignment === "automatic" ? "Automática" : "Excepción Manual"}
                          </span>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => setSelectedStudent(student)}
                            className="bg-slate-900 border border-slate-800 text-slate-400 hover:text-white text-[9px] font-bold px-3 py-2 rounded-lg transition-all cursor-pointer min-w-[80px] text-center"
                          >
                            Excepción
                          </button>
	                          <button
	                            onClick={() => handleOpenPhoneModal(student)}
	                            className="bg-slate-900 border border-slate-800 text-[#10b981] hover:text-[#34d399] text-[9px] font-bold px-3 py-2 rounded-lg transition-all cursor-pointer min-w-[80px] text-center"
	                            title="Editar teléfono del acudiente"
	                          >
	                            Teléfono
	                          </button>
	                          <button
	                            onClick={() => openLifecycleModal(student)}
	                            className="bg-slate-900 border border-slate-800 text-sky-400 hover:text-sky-300 text-[9px] font-bold px-3 py-2 rounded-lg transition-all cursor-pointer min-w-[80px] text-center"
	                          >
	                            Administrar
	                          </button>
	                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* VISTA ESCRITORIO (TABLA TRADICIONAL) */}
              <div className="hidden md:block overflow-x-auto">
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
                    {students.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-xs text-slate-500">
                          Aún no hay registros
                        </td>
                      </tr>
                    ) : students.map((student) => (
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
                            {student.assignment === "automatic" ? "Automática" : "Excepción Manual"}
                          </span>
                        </td>
                        <td className="py-3.5 text-right space-x-1.5">
                          <button
                            onClick={() => setSelectedStudent(student)}
                            className="bg-slate-900 border border-slate-800 text-slate-400 hover:text-white text-[9px] font-bold px-2.5 py-1.5 rounded-lg transition-all cursor-pointer"
                          >
                            Excepción
                          </button>
	                          <button
	                            onClick={() => handleOpenPhoneModal(student)}
	                            className="bg-slate-900 border border-slate-800 text-[#10b981] hover:text-[#34d399] text-[9px] font-bold px-2.5 py-1.5 rounded-lg transition-all cursor-pointer"
	                            title="Editar teléfono del acudiente"
	                          >
	                            Teléfono
	                          </button>
	                          <button
	                            onClick={() => openLifecycleModal(student)}
	                            className="bg-slate-900 border border-slate-800 text-sky-400 hover:text-sky-300 text-[9px] font-bold px-2.5 py-1.5 rounded-lg transition-all cursor-pointer"
	                          >
	                            Administrar
	                          </button>
	                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
	              </div>

	              {managedStudent && (
	                <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
	                  <div className="w-full max-w-3xl max-h-[92vh] overflow-y-auto bg-[#0e121e]/95 border border-slate-800 rounded-3xl shadow-2xl animate-fade-in">
	                    <div className="p-5 sm:p-6 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
	                      <div>
	                        <span className="text-[9px] font-mono text-sky-400 font-black uppercase tracking-widest block">Ciclo de vida del alumno</span>
	                        <h3 className="font-display font-black text-lg text-slate-100 uppercase tracking-wide mt-1">{managedStudent.name}</h3>
	                        <p className="text-[10px] text-slate-500 mt-0.5">
	                          Estado actual: <span className="text-slate-300 font-bold">{managedStudent.status || "Sin estado"}</span>
	                        </p>
	                      </div>
	                      <button
	                        onClick={closeLifecycleModal}
	                        className="self-start sm:self-center bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 text-[10px] font-bold px-4 py-2 rounded-xl transition-all cursor-pointer uppercase tracking-wider"
	                      >
	                        Cerrar
	                      </button>
	                    </div>

	                    <div className="p-5 sm:p-6 space-y-5">
	                      {lifecycleMessage && (
	                        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3.5 rounded-xl text-xs flex items-center gap-2">
	                          <CheckCircle className="w-4 h-4 shrink-0" />
	                          <span>{lifecycleMessage}</span>
	                        </div>
	                      )}

	                      {lifecycleError && (
	                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3.5 rounded-xl text-xs flex items-center gap-2">
	                          <AlertTriangle className="w-4 h-4 shrink-0" />
	                          <span>{lifecycleError}</span>
	                        </div>
	                      )}

	                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
	                        {Object.entries(lifecycleActions).map(([key, action]) => {
	                          const toneClasses = {
	                            emerald: "border-emerald-500/25 bg-emerald-500/5 text-emerald-400 hover:border-emerald-500/50",
	                            amber: "border-amber-500/25 bg-amber-500/5 text-amber-500 hover:border-amber-500/50",
	                            slate: "border-slate-700 bg-slate-900/50 text-slate-300 hover:border-slate-500",
	                            red: "border-red-500/25 bg-red-500/5 text-red-400 hover:border-red-500/50"
	                          };
	                          return (
	                            <button
	                              key={key}
	                              type="button"
	                              onClick={() => prepareLifecycleAction(key)}
	                              className={`text-left border rounded-2xl p-4 transition-all cursor-pointer ${toneClasses[action.tone]} ${
	                                pendingLifecycleAction === key ? "ring-1 ring-current" : ""
	                              }`}
	                            >
	                              <span className="font-display font-black text-xs uppercase tracking-wider block">{action.label}</span>
	                              <span className="text-[10px] text-slate-400 leading-relaxed block mt-2">{action.description}</span>
	                            </button>
	                          );
	                        })}
	                      </div>

	                      {pendingLifecycleAction && pendingLifecycleAction !== "delete" && (
	                        <div className="bg-[#07090e]/70 border border-slate-800 rounded-2xl p-4 space-y-4">
	                          <div>
	                            <h4 className="font-display font-black text-xs uppercase tracking-wider text-slate-200">
	                              Confirmar: {lifecycleActions[pendingLifecycleAction].label}
	                            </h4>
	                            <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
	                              Esta acción solo actualizará <span className="text-slate-300 font-mono">students.status</span> y conservará historial, pagos, asistencias, evaluaciones, padre y categoría.
	                            </p>
	                          </div>

	                          {(pendingLifecycleAction === "suspend" || pendingLifecycleAction === "inactive") && (
	                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
	                              <div>
	                                <label className="text-[9px] text-slate-500 font-black uppercase tracking-wider block mb-1">Motivo opcional</label>
	                                <select
	                                  value={lifecycleReason}
	                                  onChange={(e) => setLifecycleReason(e.target.value)}
	                                  className="w-full bg-[#07090e] border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-[#10b981]"
	                                >
	                                  <option value="">Sin motivo especificado</option>
	                                  {lifecycleReasonOptions[pendingLifecycleAction].map((reason) => (
	                                    <option key={reason} value={reason}>{reason}</option>
	                                  ))}
	                                </select>
	                              </div>
	                              {lifecycleReason === "Otro" && (
	                                <div>
	                                  <label className="text-[9px] text-slate-500 font-black uppercase tracking-wider block mb-1">Detalle opcional</label>
	                                  <input
	                                    value={lifecycleOtherReason}
	                                    onChange={(e) => setLifecycleOtherReason(e.target.value)}
	                                    placeholder="Describe el motivo"
	                                    className="w-full bg-[#07090e] border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-[#10b981]"
	                                  />
	                                </div>
	                              )}
	                            </div>
	                          )}

	                          {pendingLifecycleAction === "suspend" && (
	                            <div className="bg-amber-500/10 border border-amber-500/20 text-amber-500 p-3 rounded-xl text-[10px] leading-relaxed">
	                              Advertencia: el acceso del alumno al Portal Padre será restringido.
	                            </div>
	                          )}

	                          {pendingLifecycleAction === "inactive" && (
	                            <div className="bg-slate-900 border border-slate-700 text-slate-300 p-3 rounded-xl text-[10px] leading-relaxed">
	                              El alumno dejará de formar parte de los alumnos activos, pero toda su información permanecerá almacenada.
	                            </div>
	                          )}

	                          <div className="flex justify-end gap-2">
	                            <button
	                              type="button"
	                              onClick={() => setPendingLifecycleAction(null)}
	                              className="bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 text-[10px] font-bold px-4 py-2 rounded-xl transition-all cursor-pointer uppercase tracking-wider"
	                            >
	                              Cancelar
	                            </button>
	                            <button
	                              type="button"
	                              onClick={executeLifecycleStatusAction}
	                              disabled={lifecycleLoading}
	                              className="bg-[#10b981] hover:bg-[#059669] disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-display font-black text-[10px] px-5 py-2 rounded-xl transition-all cursor-pointer disabled:cursor-not-allowed uppercase tracking-wider"
	                            >
	                              {lifecycleLoading ? "Aplicando..." : "Confirmar"}
	                            </button>
	                          </div>
	                        </div>
	                      )}

	                      {pendingLifecycleAction === "delete" && (
	                        <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-4 space-y-4">
	                          <div>
	                            <h4 className="font-display font-black text-xs uppercase tracking-wider text-red-400">Eliminar Definitivamente</h4>
	                            <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
	                              Esta acción es irreversible, puede afectar información histórica y no podrá recuperarse posteriormente. Por seguridad, el borrado físico está bloqueado temporalmente.
	                            </p>
	                          </div>

	                          {lifecycleHistory && (
	                            <div className="grid grid-cols-3 gap-2 text-center">
	                              <div className="bg-[#07090e] border border-slate-800 rounded-xl p-3">
	                                <span className="text-lg font-black text-slate-200 block">{lifecycleHistory.payments}</span>
	                                <span className="text-[8px] text-slate-500 uppercase font-bold">Pagos</span>
	                              </div>
	                              <div className="bg-[#07090e] border border-slate-800 rounded-xl p-3">
	                                <span className="text-lg font-black text-slate-200 block">{lifecycleHistory.attendance}</span>
	                                <span className="text-[8px] text-slate-500 uppercase font-bold">Asistencias</span>
	                              </div>
	                              <div className="bg-[#07090e] border border-slate-800 rounded-xl p-3">
	                                <span className="text-lg font-black text-slate-200 block">{lifecycleHistory.evaluations}</span>
	                                <span className="text-[8px] text-slate-500 uppercase font-bold">Evaluaciones</span>
	                              </div>
	                            </div>
	                          )}

	                          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-[10px] leading-relaxed">
	                            Este alumno tiene historial o puede tener relaciones administrativas. Por seguridad no puede eliminarse definitivamente. Utilice la opción Dar de Baja.
	                          </div>

	                          <div>
	                            <label className="text-[9px] text-slate-500 font-black uppercase tracking-wider block mb-1">Escribe ELIMINAR para continuar</label>
	                            <input
	                              value={lifecycleDeleteText}
	                              onChange={(e) => setLifecycleDeleteText(e.target.value)}
	                              className="w-full bg-[#07090e] border border-red-500/20 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-red-500 font-mono"
	                              placeholder="ELIMINAR"
	                            />
	                          </div>

	                          <div className="flex justify-end gap-2">
	                            <button
	                              type="button"
	                              onClick={() => setPendingLifecycleAction(null)}
	                              className="bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 text-[10px] font-bold px-4 py-2 rounded-xl transition-all cursor-pointer uppercase tracking-wider"
	                            >
	                              Cancelar
	                            </button>
	                            <button
	                              type="button"
	                              onClick={executeProtectedDelete}
	                              disabled={lifecycleLoading || lifecycleDeleteText !== "ELIMINAR"}
	                              className="bg-red-500 hover:bg-red-600 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-display font-black text-[10px] px-5 py-2 rounded-xl transition-all cursor-pointer disabled:cursor-not-allowed uppercase tracking-wider"
	                            >
	                              {lifecycleLoading ? "Validando..." : "Validar eliminación"}
	                            </button>
	                          </div>
	                        </div>
	                      )}
	                    </div>
	                  </div>
	                </div>
	              )}

	              {/* MODAL / FORM DE OVERRIDE MANUAL */}
	              {selectedStudent && (
                <div className="bg-[#07090e] border border-slate-800 p-5 rounded-2xl animate-fade-in mt-6 space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1.5 text-amber-500">
                      <Sparkles className="w-4 h-4" />
                      <h3 className="font-display font-bold text-xs uppercase tracking-wider">Forzar Categoría (Excepción): {selectedStudent.name}</h3>
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

              {/* MODAL / FORM DE ACTUALIZACIÓN DE TELÉFONO DE ACUDIENTE */}
              {phoneModalOpen && selectedParentStudent && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fade-in font-sans">
                  <div className="bg-[#07090e] border border-slate-800 p-6 rounded-2xl w-full max-w-md space-y-4 text-left shadow-2xl relative">
                    <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                      <div className="flex items-center gap-1.5 text-[#10b981]">
                        <Smartphone className="w-4 h-4" />
                        <h3 className="font-display font-bold text-xs uppercase tracking-wider">Editar Teléfono del Acudiente</h3>
                      </div>
                      <button
                        onClick={() => {
                          setPhoneModalOpen(false);
                          setSelectedParentStudent(null);
                          setNewParentPhone("");
                        }}
                        className="text-slate-500 hover:text-slate-300 text-[10px] font-bold uppercase cursor-pointer"
                      >
                        Cancelar
                      </button>
                    </div>

                    <div className="text-[10px] text-slate-400 bg-slate-900/50 p-3.5 rounded-xl border border-slate-850 space-y-1.5">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Deportista:</span>
                        <span className="font-bold text-slate-200">{selectedParentStudent.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Nombre Acudiente:</span>
                        <span className="font-bold text-slate-200">{selectedParentStudent.parentName || "Sin nombre registrado"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Teléfono Actual:</span>
                        <span className="font-bold text-slate-200 font-mono">{selectedParentStudent.parentPhone || "No asignado"}</span>
                      </div>
                      <div className="pt-1.5 border-t border-slate-800 text-[9px] text-slate-500 italic">
                        {selectedParentStudent.parentUid ? (
                          <span className="text-emerald-400 font-medium">➔ El acudiente ya está registrado. Se actualizará su cuenta de autenticación SMS en Firebase Auth y su perfil.</span>
                        ) : (
                          <span className="text-amber-400 font-medium">➔ El acudiente no se ha registrado aún. Se corregirá el teléfono de enlace en la ficha del alumno.</span>
                        )}
                      </div>
                    </div>

                    {phoneError && (
                      <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-xl text-[10px] font-medium">
                        {phoneError}
                      </div>
                    )}

                    {phoneSuccess && (
                      <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-xl text-[10px] font-medium animate-pulse">
                        {phoneSuccess}
                      </div>
                    )}

                    <form onSubmit={handleUpdatePhoneSubmit} className="space-y-4">
                      <div>
                        <label className="text-[8px] text-slate-400 font-bold block mb-1">NUEVO NÚMERO DE TELÉFONO (E.164)</label>
                        <input
                          type="text"
                          required
                          placeholder="Ej. +521234567890 o 10 dígitos (se normalizará a +52...)"
                          value={newParentPhone}
                          onChange={(e) => setNewParentPhone(e.target.value)}
                          className="w-full bg-[#0e121e] border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-brand-green font-mono"
                          disabled={phoneUpdating}
                        />
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setPhoneModalOpen(false);
                            setSelectedParentStudent(null);
                            setNewParentPhone("");
                          }}
                          className="bg-slate-800 hover:bg-slate-700 text-slate-350 font-display font-bold text-[10px] px-5 py-2.5 rounded-xl transition-all cursor-pointer uppercase tracking-wider"
                          disabled={phoneUpdating}
                        >
                          Cerrar
                        </button>
                        <button
                          type="submit"
                          className="bg-[#10b981] hover:bg-[#059669] text-slate-950 font-display font-black text-[10px] px-6 py-2.5 rounded-xl transition-all cursor-pointer uppercase tracking-wider"
                          disabled={phoneUpdating}
                        >
                          {phoneUpdating ? "Guardando..." : "Guardar Cambios"}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: VINCULACIÓN SEGURA DE PADRES */}
          {activeTab === "parent-link" && (
            <div className="bg-[#0e121e] border border-slate-900 rounded-3xl p-5 space-y-5 font-sans">
              <div>
                <h2 className="font-display font-black text-sm uppercase tracking-wider text-slate-200">Vincular Cuenta Padre</h2>
                <p className="text-[10px] text-slate-500 mt-0.5">Diagnóstico y vinculación explícita de una cuenta Auth con alumnos concretos.</p>
              </div>

              <form onSubmit={handleParentLinkSearch} className="bg-[#07090e]/60 border border-slate-800/80 p-4 rounded-2xl grid grid-cols-1 md:grid-cols-[150px_1fr_auto] gap-3">
                <select
                  value={parentLinkIdentifierType}
                  onChange={(e) => setParentLinkIdentifierType(e.target.value)}
                  className="bg-[#07090e] border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-[#10b981]"
                >
                  <option value="phone">Teléfono</option>
                  <option value="uid">UID</option>
                  <option value="email">Correo</option>
                </select>
                <input
                  value={parentLinkIdentifier}
                  onChange={(e) => setParentLinkIdentifier(e.target.value)}
                  placeholder="Identificador de la cuenta padre"
                  className="bg-[#07090e] border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-[#10b981]"
                />
                <button
                  type="submit"
                  disabled={parentLinkLoading || !parentLinkIdentifier.trim()}
                  className="bg-[#10b981] hover:bg-[#059669] disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-display font-black text-[10px] px-4 py-2 rounded-xl transition-all cursor-pointer disabled:cursor-not-allowed"
                >
                  {parentLinkLoading ? "Buscando..." : "Diagnosticar"}
                </button>
              </form>

              {parentLinkError && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3.5 rounded-xl text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{parentLinkError}</span>
                </div>
              )}

              {parentLinkMessage && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3.5 rounded-xl text-xs flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  <span>{parentLinkMessage}</span>
                </div>
              )}

              {parentLinkResult && (
                <div className="space-y-4">
                  <div className="bg-[#07090e]/60 border border-slate-800/80 p-4 rounded-2xl space-y-2">
                    <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-wider">Usuario localizado</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[10px] text-slate-400">
                      <span className="min-w-0">UID: <b className="text-slate-200 font-mono break-all">{parentLinkResult.parent.uid}</b></span>
                      <span>Auth: <b className="text-slate-200">{parentLinkResult.parent.authExists ? "Existe" : "No existe"}</b></span>
                      <span className="min-w-0">Teléfono: <b className="text-slate-200 font-mono break-all">{parentLinkResult.parent.phone || "Sin registro"}</b></span>
                      <span className="min-w-0">Correo: <b className="text-slate-200 break-all">{parentLinkResult.parent.email || "Sin registro"}</b></span>
                      <span>Estado: <b className="text-slate-200">{parentLinkResult.parent.status || "Sin users/{uid}"}</b></span>
                      <span>Alumno(s) actuales: <b className="text-slate-200">{parentLinkResult.parent.studentIds?.length || 0}</b></span>
                    </div>
                  </div>

                  {parentLinkResult.warnings?.length > 0 && (
                    <div className="bg-amber-500/10 border border-amber-500/20 text-amber-500 p-3.5 rounded-xl text-xs space-y-1">
                      {parentLinkResult.warnings.map((warning) => (
                        <div key={warning} className="flex items-center gap-2">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          <span>{warning}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="bg-[#07090e]/60 border border-slate-800/80 p-4 rounded-2xl space-y-3">
                    <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-wider">Alumnos candidatos</h3>
                    {parentLinkResult.students.length === 0 ? (
                      <div className="text-xs text-slate-500">No hay alumnos candidatos.</div>
                    ) : parentLinkResult.students.map((student) => (
                      <label key={student.studentId} className={`flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 rounded-xl border ${
                        student.conflict ? "border-red-500/30 bg-red-500/5" : "border-slate-800 bg-[#0e121e]/70"
                      }`}>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={parentLinkSelectedIds.includes(student.studentId)}
                              onChange={() => toggleParentLinkStudent(student.studentId)}
                              disabled={!student.canLink}
                              className="accent-[#10b981]"
                            />
                            <span className="text-xs font-bold text-slate-200">{student.name || student.studentId}</span>
                            <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${
                              student.status === "active" ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-500"
                            }`}>
                              {student.status || "sin status"}
                            </span>
                          </div>
                          <div className="text-[9px] text-slate-500 font-mono break-all">ID: {student.studentId}</div>
                        </div>
                        <div className="text-[9px] text-slate-500 md:text-right">
                          <div>billingStatus: <b className="text-slate-300">{student.billingStatus || "sin dato"}</b></div>
                          <div className="break-all">parentUid: <b className={student.conflict ? "text-red-400" : "text-slate-300"}>{student.parentUid || "vacío"}</b></div>
                        </div>
                      </label>
                    ))}
                  </div>

                  <div className="bg-[#07090e]/60 border border-slate-800/80 p-4 rounded-2xl space-y-3">
                    <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-wider">Pagos relacionados</h3>
                    {parentLinkResult.payments.length === 0 ? (
                      <div className="text-xs text-slate-500">No hay pagos relacionados.</div>
                    ) : parentLinkResult.payments.map((payment) => (
                      <div key={payment.paymentId} className="grid grid-cols-1 md:grid-cols-4 gap-2 text-[10px] text-slate-400 border border-slate-850 rounded-xl p-3 min-w-0">
                        <span className="font-mono text-slate-300 break-all">{payment.paymentId}</span>
                        <span className="break-all">studentId: {payment.studentId || "vacío"}</span>
                        <span>status: {payment.status || "vacío"}</span>
                        <span className="break-all">parentUid: {payment.parentUid || "vacío"}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#07090e]/60 border border-slate-800/80 p-4 rounded-2xl">
                    <p className="text-[10px] text-slate-500 leading-relaxed">
                      La vinculación no cambia estados de alumnos ni pagos. Solo conecta la cuenta padre con los alumnos seleccionados y completa parentUid en pagos históricos exactos.
                    </p>
                    <button
                      type="button"
                      onClick={handleParentLinkSubmit}
                      disabled={parentLinkSaving || parentLinkSelectedIds.length === 0}
                      className="bg-[#10b981] hover:bg-[#059669] disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-display font-black text-[10px] px-5 py-2.5 rounded-xl transition-all cursor-pointer disabled:cursor-not-allowed"
                    >
                      {parentLinkSaving ? "Vinculando..." : `Vincular (${parentLinkSelectedIds.length})`}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: MORA Y RECONCILIACIÓN MP */}
{/* TAB 3: MORA Y RECONCILIACIÓN MP */}
          {activeTab === "billing" && (
            <div className="bg-[#0e121e] border border-slate-900 rounded-3xl p-5 space-y-4 font-sans">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="font-display font-black text-sm uppercase tracking-wider text-slate-200">Control de Mora y Recaudos</h2>
                  <p className="text-slate-400 text-xs sm:text-sm mt-1">El sistema verificará las fechas de corte y suspenderá los usuarios con deudas mayores a 5 días.</p>
                </div>
                
                <button
                  onClick={processSuspensions}
                  disabled={actionLoading}
                  className="w-full sm:w-auto mt-4 sm:mt-0 bg-blue-600 hover:bg-blue-700 text-white font-display font-bold text-xs px-6 py-3 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {actionLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Procesando...
                    </>
                  ) : (
                    <>
                      <AlertTriangle size={16} />
                      Procesar Suspensión por Mora
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

              {paymentActionError && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3.5 rounded-xl text-xs flex items-center gap-2 animate-fade-in">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{paymentActionError}</span>
                </div>
              )}

              {paymentActionSuccess && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3.5 rounded-xl text-xs flex items-center gap-2 animate-fade-in">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  <span>{paymentActionSuccess}</span>
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
                            onClick={() => handleApprovePayment(payment.id)}
                            disabled={approvingPaymentId === payment.id || actionLoading}
                            className="w-full sm:w-auto bg-[#10b981] hover:bg-[#059669] disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-display font-black text-[10px] px-4 py-2 rounded-xl transition-all cursor-pointer disabled:cursor-not-allowed font-sans"
                          >
                            {approvingPaymentId === payment.id ? "Aprobando..." : "OK (Aprobar)"}
                          </button>
                          <button
                            onClick={() => handleHoldPayment(payment.id, payment.studentId || payment.studentName)}
                            disabled={actionLoading}
                            className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-display font-black text-[10px] px-4 py-2 rounded-xl transition-all cursor-pointer font-sans"
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
                {students.length === 0 ? (
                  <div className="bg-[#07090e]/40 border border-slate-850 p-6 rounded-2xl text-center text-xs text-slate-500 font-sans">
                    Aún no hay registros
                  </div>
                ) : students.map((student) => (
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
	                                : student.status === "inactive"
	                                  ? "bg-slate-500/10 text-slate-300"
	                                  : "bg-red-500/10 text-red-400 animate-pulse"
	                        }`}>
	                          {student.status === "active" 
	                            ? "Activo (Al día)" 
	                            : student.status === "pending_validation"
	                              ? "DEPOSITADO" 
	                              : student.status === "on_hold"
	                                ? "EN ESPERA"
	                                : student.status === "inactive"
	                                  ? "BAJA"
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
                              const firstPending = pendingPayments.find(p => (p.studentId && p.studentId === (student.studentId || student.id)) || p.studentName === student.name);
                              if (firstPending) {
                                approvePendingPayment(firstPending.id);
                              } else {
                                confirmManualPayment(student.id);
                              }
                            }}
                            disabled={Boolean(approvingPaymentId)}
                            className="bg-emerald-500 text-slate-950 hover:bg-emerald-600 disabled:bg-slate-800 disabled:text-slate-500 font-display font-black text-[9px] px-3.5 py-2 rounded-xl transition-all cursor-pointer disabled:cursor-not-allowed font-sans"
                          >
                            {approvingPaymentId ? "Aprobando..." : "OK (Aprobar)"}
                          </button>
                          <button
                            onClick={() => {
                              const firstPending = pendingPayments.find(p => (p.studentId && p.studentId === (student.studentId || student.id)) || p.studentName === student.name) || pendingPayments[0];
                              if (firstPending) {
                                holdPendingPayment(firstPending.id, firstPending.studentId || student.studentId || student.id || student.name);
                              } else {
                                localStorage.setItem("simulatedStatus", "on_hold");
                                // La UI se actualizará al recibir el nuevo estado desde Firebase/Demo a través del hook.
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

          {/* TAB 3: PLANIFICACIÓN DE MICROCICLOS */}
          {activeTab === "schedules" && (
            <div className="bg-[#0e121e] border border-slate-900 rounded-3xl p-5 space-y-5">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <div>
                  <h2 className="font-display font-black text-sm uppercase tracking-wider text-slate-200">Planificación de Microciclos</h2>
                  <p className="text-[10px] text-slate-500 mt-0.5">Programa entrenamientos o partidos y recopila confirmaciones RSVP en tiempo real.</p>
                </div>
              </div>

              {eventSaved && (
                <div className="bg-[#10b981]/10 border border-[#10b981]/20 text-[#10b981] p-3.5 rounded-xl text-xs flex items-center gap-2 animate-fade-in font-sans">
                  <CheckCircle className="w-4 h-4" />
                  <span>Evento agendado y publicado en la agenda de los acudientes.</span>
                </div>
              )}

              {/* Formulario de Nuevo Evento */}
              <form onSubmit={handleCreateEvent} className="bg-[#07090e] border border-slate-800 p-5 rounded-2xl space-y-4 font-sans text-left">
                <div className="flex items-center gap-1.5 text-[#10b981] font-display font-bold text-xs uppercase tracking-wider">
                  <Calendar className="w-4 h-4" />
                  Agendar Nuevo Evento en Calendario
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] text-slate-400 font-bold block mb-1">TÍTULO DEL EVENTO</label>
                    <input
                      type="text" required placeholder="Ej. Jornada 5: Club Colombia vs Millonarios"
                      value={eventTitle} onChange={(e) => setEventTitle(e.target.value)}
                      className="w-full bg-[#0e121e] border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-brand-green"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] text-slate-400 font-bold block mb-1">TIPO DE EVENTO</label>
                    <select
                      value={eventType} onChange={(e) => setEventType(e.target.value)}
                      className="w-full bg-[#0e121e] border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-brand-green"
                    >
                      <option value="training">⚽ Entrenamiento Técnico</option>
                      <option value="match">🏆 Partido Oficial / Amistoso</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[9px] text-slate-400 font-bold block mb-1">FECHA</label>
                    <input
                      type="date" required value={eventDate} onChange={(e) => setEventDate(e.target.value)}
                      className="w-full bg-[#0e121e] border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] text-slate-400 font-bold block mb-1">HORA</label>
                    <input
                      type="time" required value={eventTime} onChange={(e) => setEventTime(e.target.value)}
                      className="w-full bg-[#0e121e] border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] text-slate-400 font-bold block mb-1">CATEGORÍA ASIGNADA</label>
                    <select
                      value={eventCategory} onChange={(e) => setEventCategory(e.target.value)}
                      className="w-full bg-[#0e121e] border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-brand-green"
                    >
                      <option value="Sub-8 Iniciación">Sub-8 Iniciación</option>
                      <option value="Sub-10 Competitivo">Sub-10 Competitivo</option>
                      <option value="Sub-12 Elite">Sub-12 Elite</option>
                      <option value="Sub-15 Avanzado">Sub-15 Avanzado</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[9px] text-slate-400 font-bold block mb-1">UBICACIÓN / CANCHA</label>
                    <input
                      type="text" placeholder="Ej. Cancha Principal, Club Colombia"
                      value={eventLocation} onChange={(e) => setEventLocation(e.target.value)}
                      className="w-full bg-[#0e121e] border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-brand-green"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[9px] text-slate-400 font-bold block mb-1">DESCRIPCIÓN / INSTRUCCIONES</label>
                  <textarea
                    rows={2} placeholder="Ej. Llegar 30 minutos antes. Traer uniforme verde completo y espinilleras."
                    value={eventDescription} onChange={(e) => setEventDescription(e.target.value)}
                    className="w-full bg-[#0e121e] border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-brand-green resize-none"
                  />
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    className="bg-[#10b981] hover:bg-[#059669] text-slate-950 font-display font-black text-[10px] px-6 py-2.5 rounded-xl transition-all cursor-pointer uppercase tracking-wider"
                  >
                    Publicar Evento
                  </button>
                </div>
              </form>

              {/* Lista de Eventos Agendados */}
              <div className="space-y-3 pt-2">
                <h3 className="text-[10px] font-mono text-slate-500 uppercase tracking-widest font-black text-left">Lista de Eventos Agendados</h3>
                {events.length === 0 ? (
                  <div className="text-center text-xs text-slate-500 bg-[#07090e]/40 p-4 rounded-xl font-sans">No hay eventos guardados.</div>
                ) : (
                  <div className="space-y-2">
                    {events.map((ev) => {
                      const yesCount = ev.rsvps ? Object.values(ev.rsvps).filter(r => r === "confirmed").length : 0;
                      const noCount = ev.rsvps ? Object.values(ev.rsvps).filter(r => r === "declined").length : 0;
                      return (
                        <div key={ev.id} className="bg-[#07090e]/60 border border-slate-800/80 p-3.5 rounded-xl flex items-center justify-between gap-4 text-left">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                                ev.type === "match" ? "bg-amber-500/10 text-amber-500" : "bg-emerald-500/10 text-[#10b981]"
                              }`}>
                                {ev.type === "match" ? "Partido" : "Entrenamiento"}
                              </span>
                              <span className="text-[9px] text-slate-500 font-mono">{ev.date} • {ev.time}</span>
                            </div>
                            <h4 className="font-bold text-slate-200 text-xs mt-1.5 truncate">{ev.title}</h4>
                            <span className="text-[9px] text-slate-500 block truncate mt-0.5">📍 {ev.location} • {ev.category}</span>
                            <div className="flex gap-3 text-[8px] font-bold uppercase tracking-wider mt-1.5">
                              <span className="text-[#10b981]">Confirmados: {yesCount}</span>
                              <span className="text-red-400">Declinados: {noCount}</span>
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeleteEvent(ev.id)}
                            className="bg-red-500/10 border border-red-500/20 hover:bg-red-500 hover:text-slate-950 text-red-400 p-2 rounded-xl transition-all cursor-pointer shrink-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3.5: GESTOR DE BIBLIOTECA DE EJERCICIOS */}
          {activeTab === "drills" && (
            <div className="bg-[#0e121e] border border-slate-900 rounded-3xl p-5 space-y-5">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <div>
                  <h2 className="font-display font-black text-sm uppercase tracking-wider text-slate-200">Biblioteca de Ejercicios</h2>
                  <p className="text-[10px] text-slate-500 mt-0.5">Sube videos educativos sobre tácticas y conducción de balón para los deportistas.</p>
                </div>
              </div>

              {drillSaved && (
                <div className="bg-[#10b981]/10 border border-[#10b981]/20 text-[#10b981] p-3.5 rounded-xl text-xs flex items-center gap-2 animate-fade-in font-sans">
                  <CheckCircle className="w-4 h-4" />
                  <span>Ejercicio guardado exitosamente en la biblioteca multimedia.</span>
                </div>
              )}

              {/* Formulario de Carga */}
              <form onSubmit={handleCreateDrill} className="bg-[#07090e] border border-slate-800 p-5 rounded-2xl space-y-4 font-sans text-left">
                <div className="flex items-center gap-1.5 text-[#10b981] font-display font-bold text-xs uppercase tracking-wider">
                  <Video className="w-4 h-4" />
                  {editingDrillId ? "Editar Video de Entrenamiento" : "Publicar Nuevo Video de Entrenamiento"}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] text-slate-400 font-bold block mb-1">TÍTULO DEL EJERCICIO</label>
                    <input
                      type="text" required placeholder="Ej. Control de Balón y Pase Rápido"
                      value={drillTitle} onChange={(e) => setDrillTitle(e.target.value)}
                      className="w-full bg-[#0e121e] border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-brand-green"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] text-slate-400 font-bold block mb-1">CATEGORÍA DEL EJERCICIO</label>
                    <select
                      value={drillCategory} onChange={(e) => setDrillCategory(e.target.value)}
                      className="w-full bg-[#0e121e] border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-brand-green"
                    >
                      <option value="técnica">⚽ Técnica Individual</option>
                      <option value="físico">🏃 Físico y Coordinación</option>
                      <option value="táctica">🧠 Táctica de Juego</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-[9px] text-slate-400 font-bold block mb-1">URL DEL VIDEO (YOUTUBE, VIMEO O MP4)</label>
                    <input
                      type="url" required placeholder="Ej. https://www.youtube.com/watch?v=... o archivo .mp4"
                      value={drillVideoUrl} onChange={(e) => setDrillVideoUrl(e.target.value)}
                      className="w-full bg-[#0e121e] border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-brand-green"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[9px] text-slate-400 font-bold block mb-1">DESCRIPCIÓN DEL TRABAJO / REPETICIONES</label>
                  <textarea
                    rows={2} placeholder="Explica detalladamente la postura técnica y cuántas repeticiones debe hacer el niño."
                    value={drillDescription} onChange={(e) => setDrillDescription(e.target.value)}
                    className="w-full bg-[#0e121e] border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-brand-green resize-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  {editingDrillId && (
                    <button
                      type="button"
                      onClick={handleCancelEditDrill}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-350 font-display font-bold text-[10px] px-5 py-2.5 rounded-xl transition-all cursor-pointer uppercase tracking-wider"
                    >
                      Cancelar Edición
                    </button>
                  )}
                  <button
                    type="submit"
                    className="bg-[#10b981] hover:bg-[#059669] text-slate-950 font-display font-black text-[10px] px-6 py-2.5 rounded-xl transition-all cursor-pointer uppercase tracking-wider"
                  >
                    {editingDrillId ? "Guardar Cambios" : "Publicar Video"}
                  </button>
                </div>
              </form>

              {/* Lista de Videos en la Biblioteca */}
              <div className="space-y-3 pt-2">
                <h3 className="text-[10px] font-mono text-slate-500 uppercase tracking-widest font-black text-left">Videos de la Biblioteca</h3>
                {drills.length === 0 ? (
                  <div className="text-center text-xs text-slate-500 bg-[#07090e]/40 p-4 rounded-xl font-sans">No hay videos en la biblioteca.</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {drills.map((drill) => (
                      <div key={drill.id} className="bg-[#07090e]/60 border border-slate-800/80 p-3.5 rounded-xl flex flex-col justify-between gap-3 text-left animate-fade-in">
                        <div>
                          <div className="flex justify-between items-start gap-2">
                            <span className="text-[8px] bg-slate-900 border border-slate-800 px-2 py-0.5 rounded font-mono text-slate-400 uppercase tracking-wider">{drill.category}</span>
                            <div className="flex items-center">
                              <button
                                type="button"
                                onClick={() => handleEditDrillClick(drill)}
                                className="text-emerald-500 hover:text-emerald-400 transition-all cursor-pointer mr-3"
                                title="Editar ejercicio"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteDrill(drill.id)}
                                className="text-red-500 hover:text-red-400 transition-all cursor-pointer"
                                title="Eliminar ejercicio"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                          <h4 className="font-bold text-slate-200 text-xs mt-1.5">{drill.title}</h4>
                          <p className="text-[10px] text-slate-450 mt-1 line-clamp-2 leading-relaxed font-sans">{drill.description}</p>
                        </div>
                        {(() => {
                          const videoInfo = parseVideoUrl(drill.videoUrl);
                          if (videoInfo.type === "youtube" || videoInfo.type === "vimeo") {
                            return (
                              <iframe
                                src={videoInfo.embedUrl}
                                title={drill.title}
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                className="w-full rounded-xl bg-slate-950 border border-slate-900 aspect-video"
                              />
                            );
                          } else {
                            return (
                              <video src={drill.videoUrl} className="w-full rounded-lg bg-slate-950 aspect-video object-cover" controls />
                            );
                          }
                        })()}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3.6: TABLA DE HONOR (GAMIFICACIÓN DEL LEADERBOARD) */}
          {activeTab === "leaderboard" && (
            <div className="bg-[#0e121e] border border-slate-900 rounded-3xl p-5 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <div>
                  <h2 className="font-display font-black text-sm uppercase tracking-wider text-slate-200">🏆 Tabla de Honor (Leaderboard)</h2>
                  <p className="text-[10px] text-slate-500 mt-0.5">Gamificación mensual de deportistas basada en asistencia (40%) y promedio de calificación técnica (60%).</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse font-sans">
                  <thead>
                    <tr className="border-b border-slate-850 text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="pb-3 text-center w-12">Rango</th>
                      <th className="pb-3">Deportista</th>
                      <th className="pb-3">Categoría</th>
                      <th className="pb-3 text-center">Ficha Técnica (Promedio)</th>
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
                        "text-amber-400 bg-amber-500/10 border border-amber-500/20", // Oro
                        "text-slate-300 bg-slate-500/10 border border-slate-500/20", // Plata
                        "text-amber-600 bg-amber-700/10 border border-amber-800/20", // Bronce
                      ];
                      return (
                        <tr key={item.id} className="text-xs">
                          <td className="py-3 text-center font-black">
                            {isTop3 ? (
                              <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full font-bold text-[10px] ${placeColors[index]}`}>
                                {index === 0 && "🥇"}
                                {index === 1 && "🥈"}
                                {index === 2 && "🥉"}
                              </span>
                            ) : (
                              <span className="text-slate-500 font-mono">#{index + 1}</span>
                            )}
                          </td>
                          <td className="py-3 font-bold text-slate-200">{item.name}</td>
                          <td className="py-3 text-slate-400">
                            <span className="bg-[#07090e] px-2 py-0.5 rounded border border-slate-850 text-[8px] uppercase tracking-wider font-mono">
                              {item.category}
                            </span>
                          </td>
                          <td className="py-3 text-center font-mono font-bold text-slate-350">
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
