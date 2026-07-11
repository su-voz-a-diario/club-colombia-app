"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ShieldCheck, LogOut, Users, DollarSign, AlertTriangle, MessageSquare, PlusCircle, CheckCircle, RefreshCw, Calendar, Sparkles, Trash2, Trophy, Video, Pencil, Smartphone } from "lucide-react";
import { db } from "@/lib/firebase";
import { categoryNameToId, normalizeStudentName } from "@/lib/studentModel";
import { normalizeAndValidatePhone } from "@/lib/phone";
import { collection, doc, onSnapshot, updateDoc, setDoc, getDoc, query, where, getDocs, deleteDoc, addDoc, serverTimestamp } from "firebase/firestore";

export default function AdminDashboard() {
  const formatCurrency = (val) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      maximumFractionDigits: 0
    }).format(val);
  };

  // Datos de Firestore en estado
  const [students, setStudents] = useState([]);
  const [activeTab, setActiveTab] = useState("students"); // 'students' | 'billing' | 'schedules' | 'notifications'
  
  // Estados para override
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [newCategory, setNewCategory] = useState("");
  const [overrideReason, setOverrideReason] = useState("");

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

  // Cargar estudiantes y lista de validaciones de pago de Firestore
  const [pendingPayments, setPendingPayments] = useState([]);

  // Event form states
  const [eventTitle, setEventTitle] = useState("");
  const [eventType, setEventType] = useState("training");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [eventCategory, setEventCategory] = useState("Sub-10 Competitivo");
  const [eventDescription, setEventDescription] = useState("");
  const [eventSaved, setEventSaved] = useState(false);
  const [events, setEvents] = useState([]);

  // Drill form states
  const [drillTitle, setDrillTitle] = useState("");
  const [drillDescription, setDrillDescription] = useState("");
  const [drillCategory, setDrillCategory] = useState("técnica");
  const [drillVideoUrl, setDrillVideoUrl] = useState("");
  const [drillSaved, setDrillSaved] = useState(false);
  const [drills, setDrills] = useState([]);
  const [editingDrillId, setEditingDrillId] = useState(null);

  // Phone update modal states
  const [phoneModalOpen, setPhoneModalOpen] = useState(false);
  const [selectedParentStudent, setSelectedParentStudent] = useState(null);
  const [newParentPhone, setNewParentPhone] = useState("");
  const [phoneUpdating, setPhoneUpdating] = useState(false);
  const [phoneError, setPhoneError] = useState("");
  const [phoneSuccess, setPhoneSuccess] = useState("");

  // Leaderboard lists
  const [evaluations, setEvaluations] = useState([]);
  const [allAttendance, setAllAttendance] = useState([]);

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    if (!eventTitle || !eventDate || !eventTime) return;

    try {
      const eventId = eventTitle.toLowerCase().replace(/[^a-z0-9]/g, "-");
      await setDoc(doc(db, "events", eventId), {
        title: eventTitle,
        type: eventType,
        date: eventDate,
        time: eventTime,
        location: eventLocation || "Club Colombia Cancha Principal",
        category: eventCategory,
        description: eventDescription,
        rsvps: {}
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
      await deleteDoc(doc(db, "events", eventId));
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
      if (editingDrillId) {
        // Guardar cambios del video existente
        await setDoc(doc(db, "drills", editingDrillId), {
          title: titleClean,
          description: descClean,
          category: catClean,
          videoUrl: urlClean,
          date: new Date().toLocaleDateString("es-CO")
        }, { merge: true });
        
        setEditingDrillId(null);
      } else {
        // Crear nuevo video
        const drillId = titleClean.toLowerCase().replace(/[^a-z0-9]/g, "-");
        await setDoc(doc(db, "drills", drillId), {
          title: titleClean,
          description: descClean,
          category: catClean,
          videoUrl: urlClean,
          date: new Date().toLocaleDateString("es-CO")
        });
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
      await deleteDoc(doc(db, "drills", drillId));
    } catch (err) {
      console.error("Error deleting drill:", err);
    }
  };

  const handleOpenPhoneModal = (student) => {
    setSelectedParentStudent(student);
    setNewParentPhone(student.parentPhone || "");
    setPhoneError("");
    setPhoneSuccess("");
    setPhoneModalOpen(true);
  };

  const handleUpdatePhoneSubmit = async (e) => {
    e.preventDefault();
    if (!selectedParentStudent) return;
    setPhoneUpdating(true);
    setPhoneError("");
    setPhoneSuccess("");

    try {
      const response = await fetch("/api/admin/update-parent-phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parentUid: selectedParentStudent.parentUid || "",
          oldPhone: selectedParentStudent.parentPhone || "",
          newPhone: newParentPhone
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Error al actualizar el teléfono.");
      }

      setPhoneSuccess(`Teléfono actualizado exitosamente a ${data.phone}.`);
      
      // Actualizar el estado local de estudiantes
      setStudents(prev => prev.map(s => {
        const matchesUid = selectedParentStudent.parentUid && s.parentUid === selectedParentStudent.parentUid;
        const matchesPhone = !selectedParentStudent.parentUid && s.parentPhone === selectedParentStudent.parentPhone;
        if (matchesUid || matchesPhone) {
          return { ...s, parentPhone: data.phone };
        }
        return s;
      }));

      setTimeout(() => {
        setPhoneModalOpen(false);
        setSelectedParentStudent(null);
        setNewParentPhone("");
      }, 2000);

    } catch (err) {
      setPhoneError(err.message);
    } finally {
      setPhoneUpdating(false);
    }
  };

  const getLeaderboard = () => {
    return students.map(student => {
      // 1. Average rating
      const studentEvals = evaluations.filter(ev => ev.studentName === student.name);
      let avgScore = null;
      if (studentEvals.length > 0) {
        const sum = studentEvals.reduce((acc, curr) => {
          const m = curr.metrics || {};
          const itemAvg = ((m.speed || 0) + (m.passing || 0) + (m.dribbling || 0) + (m.shooting || 0) + (m.physical || 0) + (m.discipline || 0)) / 6;
          return acc + itemAvg;
        }, 0);
        avgScore = sum / studentEvals.length;
      }

      // 2. Attendance rate
      let totalSessions = 0;
      let presentSessions = 0;
      allAttendance.forEach(att => {
        const record = att.records?.find(r => r.name === student.name);
        if (record) {
          totalSessions++;
          if (record.status === "P" || record.status === "J") {
            presentSessions++;
          }
        }
      });
      const attendanceRate = totalSessions > 0 ? (presentSessions / totalSessions) * 100 : null;

      // 3. Score weighting
      const overallPoints = avgScore !== null && attendanceRate !== null
        ? (avgScore * 10) * 0.6 + attendanceRate * 0.4
        : null;

      return {
        id: student.id,
        name: student.name,
        category: student.category,
        avgScore: avgScore !== null ? Math.round(avgScore * 10) / 10 : null,
        attendanceRate: attendanceRate !== null ? Math.round(attendanceRate) : null,
        overallPoints: overallPoints !== null ? Math.round(overallPoints) : null
      };
    })
      .filter(item => item.avgScore !== null || item.attendanceRate !== null)
      .sort((a, b) => (b.overallPoints ?? -1) - (a.overallPoints ?? -1));
  };


  useEffect(() => {
    // Escuchar estudiantes en tiempo real
    const unsubscribeStudents = onSnapshot(collection(db, "students"), (snapshot) => {
      const studs = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        studs.push({ id: doc.id, studentId: data.studentId || doc.id, ...data });
      });
      setStudents(studs);
    });

    // Escuchar pagos pendientes en tiempo real
    const qPayments = query(collection(db, "payments"), where("status", "==", "pending"));
    const unsubscribePayments = onSnapshot(qPayments, (snapshot) => {
      const pays = [];
      snapshot.forEach((doc) => {
        pays.push({ id: doc.id, ...doc.data() });
      });
      setPendingPayments(pays);
    });

    // Escuchar evaluaciones para la tabla de honor
    const unsubscribeEvals = onSnapshot(collection(db, "evaluations"), (snapshot) => {
      const evs = [];
      snapshot.forEach((doc) => {
        evs.push({ id: doc.id, ...doc.data() });
      });
      setEvaluations(evs);
    });

    // Escuchar todas las asistencias para la tabla de honor
    const unsubscribeAttendance = onSnapshot(collection(db, "attendance"), (snapshot) => {
      const atts = [];
      snapshot.forEach((doc) => {
        atts.push({ id: doc.id, ...doc.data() });
      });
      setAllAttendance(atts);
    });

    // Escuchar todos los eventos
    const unsubscribeEvents = onSnapshot(collection(db, "events"), (snapshot) => {
      const evs = [];
      snapshot.forEach((doc) => {
        evs.push({ id: doc.id, ...doc.data() });
      });
      evs.sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
      setEvents(evs);
    });

    // Escuchar biblioteca de drills
    const unsubscribeDrills = onSnapshot(collection(db, "drills"), (snapshot) => {
      const drs = [];
      snapshot.forEach((doc) => {
        drs.push({ id: doc.id, ...doc.data() });
      });
      setDrills(drs);
    });

    return () => {
      unsubscribeStudents();
      unsubscribePayments();
      unsubscribeEvals();
      unsubscribeAttendance();
      unsubscribeEvents();
      unsubscribeDrills();
    };
  }, []);

  // Simular la reconciliación o envío de alertas de mora
  const [sendingAlerts, setSendingAlerts] = useState(false);
  const [alertSuccess, setAlertSuccess] = useState(false);

  const triggerMoraAlerts = async () => {
    setSendingAlerts(true);
    try {
      // En una base de datos real, podemos simular que marcamos al primer alumno suspendido 
      // o consultar a la API. Para que sea real en Firestore, buscamos alumnos activos con retraso 
      // y actualizamos su estado a suspendido.
      const q = query(collection(db, "students"), where("status", "==", "active"), where("dueDays", ">", 5));
      const querySnapshot = await getDocs(q);
      for (const d of querySnapshot.docs) {
        await updateDoc(doc(db, "students", d.id), { status: "suspended" });
        // También actualizar en user
        const studentData = d.data();
        if (studentData.parentUid) {
          await updateDoc(doc(db, "users", studentData.parentUid), { status: "suspended" });
        } else if (studentData.parentEmail) {
          // Legacy compatibility
          // TODO: eliminar cuando toda la base de datos tenga parentUid
          await updateDoc(doc(db, "users", studentData.parentEmail.toLowerCase()), { status: "suspended" });
        }
      }
      
      setAlertSuccess(true);
      setTimeout(() => setAlertSuccess(false), 3000);
    } catch (err) {
      console.error("Error auditing mora:", err);
    } finally {
      setSendingAlerts(false);
    }
  };

  const getStudentDocRefByIdOrLegacyName = async (studentIdOrName) => {
    let studentDocRef = doc(db, "students", studentIdOrName);
    let studentSnap = await getDoc(studentDocRef);

    if (!studentSnap.exists()) {
      // Compatibilidad legacy: buscar por nombre solo para datos anteriores sin studentId.
      const q = query(collection(db, "students"), where("name", "==", studentIdOrName));
      const qSnap = await getDocs(q);
      if (!qSnap.empty) {
        studentDocRef = doc(db, "students", qSnap.docs[0].id);
        studentSnap = qSnap.docs[0];
      }
    }

    return { studentDocRef, studentSnap };
  };

  // Confirmar pago manual para levantar suspensión (Directo desde lista)
  const confirmManualPayment = async (studentIdOrName) => {
    try {
      const { studentDocRef, studentSnap } = await getStudentDocRefByIdOrLegacyName(studentIdOrName);
      if (!studentSnap.exists()) {
        console.error("No se encontró el alumno a confirmar pago manual:", studentIdOrName);
        return;
      }

      const studentData = studentSnap.data();
      
      // Actualizar en Firestore a 'active'
      await updateDoc(studentDocRef, {
        status: "active",
        billingStatus: "paid",
        dueDays: 0,
        updatedAt: serverTimestamp()
      });

      if (studentData.parentUid) {
        await updateDoc(doc(db, "users", studentData.parentUid), { status: "active" });
      } else if (studentData.parentEmail) {
        // Legacy compatibility
        // TODO: eliminar cuando toda la base de datos tenga parentUid
        const parentRef = doc(db, "users", studentData.parentEmail.toLowerCase());
        await updateDoc(parentRef, {
          status: "active"
        });
      }

    } catch (err) {
      console.error("Error en confirmManualPayment:", err);
    }
  };

  // Confirmar y aprobar una solicitud de pago reportada
  const approvePendingPayment = async (paymentId, studentIdOrNameFromPayment) => {
    try {
      // 1. Marcar el pago como aprobado en Firestore
      const paymentRef = doc(db, "payments", paymentId);
      await updateDoc(paymentRef, { status: "approved", updatedAt: serverTimestamp() });

      // 2. Reactivar al alumno en la colección 'students' de Firestore
      const { studentDocRef, studentSnap } = await getStudentDocRefByIdOrLegacyName(studentIdOrNameFromPayment);
      
      if (studentSnap.exists()) {
        const studentData = studentSnap.data();
        await updateDoc(studentDocRef, {
          status: "active",
          billingStatus: "paid",
          dueDays: 0,
          updatedAt: serverTimestamp()
        });

        if (studentData.parentUid) {
          await updateDoc(doc(db, "users", studentData.parentUid), { status: "active" });
        } else if (studentData.parentEmail) {
          // Legacy compatibility
          // TODO: eliminar cuando toda la base de datos tenga parentUid
          const parentRef = doc(db, "users", studentData.parentEmail.toLowerCase());
          await updateDoc(parentRef, { status: "active" });
        }
      }

    } catch (err) {
      console.error("Error al aprobar pago:", err);
    }
  };

  // Poner una solicitud de pago en espera
  const holdPendingPayment = async (paymentId, studentIdOrNameFromPayment) => {
    try {
      // 1. Marcar el pago como en espera en Firestore
      const paymentRef = doc(db, "payments", paymentId);
      await updateDoc(paymentRef, { status: "on_hold", updatedAt: serverTimestamp() });

      // 2. Cambiar estado del alumno a en espera
      const { studentDocRef, studentSnap } = await getStudentDocRefByIdOrLegacyName(studentIdOrNameFromPayment);

      if (studentSnap.exists()) {
        const studentData = studentSnap.data();
        await updateDoc(studentDocRef, { status: "on_hold", billingStatus: "on_hold", updatedAt: serverTimestamp() });

        if (studentData.parentUid) {
          await updateDoc(doc(db, "users", studentData.parentUid), { status: "on_hold" });
        } else if (studentData.parentEmail) {
          // Legacy compatibility
          // TODO: eliminar cuando toda la base de datos tenga parentUid
          const parentRef = doc(db, "users", studentData.parentEmail.toLowerCase());
          await updateDoc(parentRef, { status: "on_hold" });
        }
      }

    } catch (err) {
      console.error("Error al poner pago en espera:", err);
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
      const studentDocRef = doc(collection(db, "students"));
      const newStudentId = studentDocRef.id;
      const normalizedName = normalizeStudentName(manualStudentName);
      const categoryId = categoryNameToId(category);
      const normalizedParentPhone = normalizeAndValidatePhone(manualParentPhone);
      const parentUid = "";

      localStorage.setItem("simulatedStatus", manualPaidCash ? "active" : "suspended");

      // 1. Guardar deportista en la colección 'students' con ID estable.
      await setDoc(studentDocRef, {
        studentId: newStudentId,
        name: manualStudentName,
        normalizedName,
        age: ageNum,
        parentName: manualParentName,
        parentPhone: normalizedParentPhone,
        parentEmail: "",
        parentUid,
        categoryId,
        category: category,
        assignedCoachUid: "",
        assignment: "automatic",
        status: manualPaidCash ? "active" : "suspended",
        billingStatus: manualPaidCash ? "paid" : "pending_payment",
        healthStatus: "optimal",
        dueDays: manualPaidCash ? 0 : 7,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // 3. Si pagó en efectivo/transferencia directa, registrar en Firestore pagos
      if (manualPaidCash) {
        await addDoc(collection(db, "payments"), {
          studentId: newStudentId,
          studentName: manualStudentName,
          categoryName: category,
          amount: manualPaymentConcept === "monthly" ? 300 : 50,
          paymentType: manualPaymentConcept === "monthly" ? "Mensualidad Completa" : "Clase Individual",
          date: new Date().toLocaleDateString("es-MX") + " " + new Date().toLocaleTimeString("es-MX", { hour: '2-digit', minute: '2-digit' }),
          status: "approved",
          parentEmail: "",
          parentUid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
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
      // Modificar en Firestore
      const studentRef = doc(db, "students", selectedStudent.studentId || selectedStudent.id || selectedStudent.name);
      await updateDoc(studentRef, {
        categoryId: categoryNameToId(newCategory),
        category: newCategory,
        assignment: "manual",
        overrideReason: overrideReason || "Ajuste manual del cuerpo técnico",
        updatedAt: serverTimestamp()
      });
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
      await setDoc(doc(db, "settings", "announcements"), {
        notice: notificationText,
        date: new Date().toISOString()
      });
      localStorage.setItem("adminNotice", notificationText);
      setNotificationStatus(true);
      setTimeout(() => {
        setNotificationStatus(false);
        setNotificationText("");
      }, 3000);
    } catch (err) {
      console.error("Error en envío de comunicado a Firestore:", err);
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
                <span className="text-[9px] text-slate-400 font-bold uppercase block">Alumnos Activos</span>
                <span className="text-xl font-display font-black text-slate-200 flex items-center gap-1.5 mt-0.5">
                  <Users className="w-4 h-4 text-[#10b981]" />
                  {students.length > 0 ? `${students.filter(s => s.status === "active").length} / ${students.length}` : "Sin información"}
                </span>
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
                  {students.length > 0
                    ? `${((students.filter(s => s.status === "suspended").length / students.length) * 100).toFixed(0)}%`
                    : "Sin información"}
                </span>
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
                {students.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-500 bg-[#07090e]/50 border border-slate-850 rounded-2xl">
                    Aún no hay registros
                  </div>
                ) : (
                  students.map((student) => (
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
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

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

          {/* TAB 2: MORA Y RECONCILIACIÓN MP */}
          {activeTab === "billing" && (
            <div className="bg-[#0e121e] border border-slate-900 rounded-3xl p-5 space-y-4 font-sans">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="font-display font-black text-sm uppercase tracking-wider text-slate-200">Control de Mora y Recaudos</h2>
                  <p className="text-[10px] text-slate-500 mt-0.5">Control de suspensiones automáticas de QR al expirar el período de gracia (5 días hábiles).</p>
                </div>
                
                <button
                  onClick={triggerMoraAlerts}
                  disabled={sendingAlerts}
                  className="bg-[#10b981] hover:bg-[#059669] disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-display font-black text-[10px] px-5 py-2.5 rounded-full transition-all flex items-center gap-1.5 shadow-lg shadow-emerald-500/10 cursor-pointer font-sans"
                >
                  {sendingAlerts ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Auditar Mora & Enviar Avisos
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
                            onClick={() => approvePendingPayment(payment.id, payment.studentId || payment.studentName)}
                            className="w-full sm:w-auto bg-[#10b981] hover:bg-[#059669] text-slate-950 font-display font-black text-[10px] px-4 py-2 rounded-xl transition-all cursor-pointer font-sans"
                          >
                            OK (Aprobar)
                          </button>
                          <button
                            onClick={() => holdPendingPayment(payment.id, payment.studentId || payment.studentName)}
                            className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600 text-slate-950 font-display font-black text-[10px] px-4 py-2 rounded-xl transition-all cursor-pointer font-sans"
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
                                : "bg-red-500/10 text-red-400 animate-pulse"
                        }`}>
                          {student.status === "active" 
                            ? "Activo (Al día)" 
                            : student.status === "pending_validation"
                              ? "DEPOSITADO" 
                              : student.status === "on_hold"
                                ? "EN ESPERA"
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
                              const firstPending = pendingPayments.find(p => (p.studentId && p.studentId === (student.studentId || student.id)) || p.studentName === student.name) || pendingPayments[0];
                              if (firstPending) {
                                approvePendingPayment(firstPending.id, firstPending.studentId || student.studentId || student.id || student.name);
                              } else {
                                confirmManualPayment(student.id);
                              }
                            }}
                            className="bg-emerald-500 text-slate-950 hover:bg-emerald-600 font-display font-black text-[9px] px-3.5 py-2 rounded-xl transition-all cursor-pointer font-sans"
                          >
                            OK (Aprobar)
                          </button>
                          <button
                            onClick={() => {
                              const firstPending = pendingPayments.find(p => (p.studentId && p.studentId === (student.studentId || student.id)) || p.studentName === student.name) || pendingPayments[0];
                              if (firstPending) {
                                holdPendingPayment(firstPending.id, firstPending.studentId || student.studentId || student.id || student.name);
                              } else {
                                localStorage.setItem("simulatedStatus", "on_hold");
                                setStudents(prev => prev.map(s => s.id === student.id ? { ...s, status: "on_hold" } : s));
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
                    {getLeaderboard().length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-xs text-slate-500">
                          Aún no hay registros
                        </td>
                      </tr>
                    ) : getLeaderboard().map((item, index) => {
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
