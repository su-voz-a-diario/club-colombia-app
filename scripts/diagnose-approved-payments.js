#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const admin = require("firebase-admin");
const { getFirestore } = require("firebase-admin/firestore");

function initializeFirebaseAdmin() {
  if (admin.getApps().length > 0) return;

  const localServiceAccountPath = path.join(__dirname, "../club-colombia-futbol-firebase-adminsdk-fbsvc-2aa1a9a36c.json");
  if (fs.existsSync(localServiceAccountPath)) {
    const serviceAccount = JSON.parse(fs.readFileSync(localServiceAccountPath, "utf8"));
    admin.initializeApp({
      credential: admin.cert(serviceAccount)
    });
    return;
  }

  admin.initializeApp();
}

function printable(value) {
  return value === undefined || value === null || value === "" ? "(vacío)" : String(value);
}

async function resolveStudent(db, payment) {
  const declaredStudentId = typeof payment.studentId === "string" ? payment.studentId.trim() : "";
  if (declaredStudentId) {
    const studentSnap = await db.collection("students").doc(declaredStudentId).get();
    if (!studentSnap.exists) {
      return {
        method: "studentId",
        resolved: false,
        ambiguous: false,
        reason: "studentId inválido",
        declaredStudentId
      };
    }

    return {
      method: "studentId",
      resolved: true,
      ambiguous: false,
      studentId: declaredStudentId,
      studentSnap
    };
  }

  const studentName = typeof payment.studentName === "string" ? payment.studentName.trim() : "";
  if (!studentName) {
    return {
      method: "none",
      resolved: false,
      ambiguous: false,
      reason: "sin studentId ni studentName"
    };
  }

  const legacySnap = await db.collection("students").where("name", "==", studentName).get();
  if (legacySnap.empty) {
    return {
      method: "studentName",
      resolved: false,
      ambiguous: false,
      reason: "sin coincidencia legacy",
      studentName
    };
  }

  if (legacySnap.size > 1) {
    return {
      method: "studentName",
      resolved: false,
      ambiguous: true,
      reason: "coincidencia legacy ambigua",
      studentName,
      matches: legacySnap.docs.map((doc) => doc.id)
    };
  }

  const studentSnap = legacySnap.docs[0];
  const studentData = studentSnap.data();
  return {
    method: "studentName",
    resolved: true,
    ambiguous: false,
    studentId: studentData.studentId || studentSnap.id,
    studentSnap
  };
}

function getRecommendedAction(payment, resolution, studentData) {
  if (!resolution.resolved) {
    if (resolution.ambiguous) {
      return "Revisar manualmente y asignar resolvedStudentId/studentId correcto antes de reparar.";
    }
    return "Revisar manualmente el pago; no se puede activar alumno sin identificación segura.";
  }

  if (studentData.status !== "active") {
    return "Reparar con aprobación atómica/manual controlada: activar solo este alumno y actualizar resolvedStudentId.";
  }

  if (!studentData.parentUid && !payment.parentUid) {
    return "Completar vinculación parentUid cuando el padre inicie sesión por SMS o mediante revisión administrativa.";
  }

  return "Sin corrección requerida.";
}

async function run() {
  initializeFirebaseAdmin();
  const db = getFirestore();
  const paymentsSnap = await db.collection("payments").where("status", "==", "approved").get();
  const inconsistent = [];
  let checked = 0;

  for (const paymentDoc of paymentsSnap.docs) {
    checked += 1;
    const payment = paymentDoc.data();
    const resolution = await resolveStudent(db, payment);
    const studentData = resolution.resolved ? resolution.studentSnap.data() : null;
    const parentUid = studentData?.parentUid || payment.parentUid || "";
    const issues = [];

    if (!payment.studentId) issues.push("payment.studentId ausente");
    if (!resolution.resolved) issues.push(resolution.reason);
    if (resolution.ambiguous) issues.push("coincidencias legacy ambiguas");
    if (studentData && studentData.status !== "active") issues.push(`students.status=${studentData.status || "(vacío)"}`);
    if (!parentUid) issues.push("parentUid ausente");

    if (issues.length > 0) {
      inconsistent.push({
        paymentId: paymentDoc.id,
        declaredStudentId: printable(payment.studentId),
        studentName: printable(payment.studentName),
        resolvedBy: resolution.method,
        resolvedStudentId: printable(resolution.studentId),
        studentStatus: printable(studentData?.status),
        parentUid: printable(parentUid),
        issues,
        recommendedAction: getRecommendedAction(payment, resolution, studentData || {})
      });
    }
  }

  console.log("=== DRY RUN: diagnóstico de pagos aprobados ===");
  console.log(`Pagos approved revisados: ${checked}`);
  console.log(`Registros con inconsistencias: ${inconsistent.length}`);

  if (inconsistent.length === 0) {
    console.log("No se encontraron pagos approved inconsistentes.");
    return;
  }

  console.log(JSON.stringify(inconsistent, null, 2));
}

run().catch((error) => {
  console.error("Error en diagnóstico DRY RUN:", error.message);
  process.exit(1);
});
