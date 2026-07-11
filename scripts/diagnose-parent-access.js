#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const admin = require("firebase-admin");
const { getFirestore } = require("firebase-admin/firestore");
const { getAuth } = require("firebase-admin/auth");

function parseArgs(argv) {
  const args = {};
  for (const arg of argv.slice(2)) {
    if (arg.startsWith("--uid=")) args.uid = arg.slice("--uid=".length).trim();
    if (arg.startsWith("--phone=")) args.phone = arg.slice("--phone=".length).trim();
    if (arg.startsWith("--email=")) args.email = arg.slice("--email=".length).trim().toLowerCase();
    if (arg === "--approved-missing-parent") args.approvedMissingParent = true;
  }
  args.uid = args.uid || process.env.PARENT_UID || "";
  args.phone = args.phone || process.env.PARENT_PHONE || "";
  args.email = args.email || (process.env.PARENT_EMAIL || "").toLowerCase();
  return args;
}

function normalizePhoneNumber(phone, defaultRegionCode = "57") {
  const rawPhone = String(phone || "").trim();
  if (!rawPhone) return "";
  const hasInternationalPrefix = rawPhone.startsWith("+");
  const digits = rawPhone.replace(/\D/g, "");
  if (!digits) return "";

  let normalizedDigits = digits;
  if (hasInternationalPrefix) {
    normalizedDigits = digits;
  } else if (digits.startsWith("00")) {
    normalizedDigits = digits.slice(2);
  } else if (digits.length === 10) {
    normalizedDigits = `${defaultRegionCode}${digits}`;
  }

  return `+${normalizedDigits}`;
}

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

function compactStudent(docSnap, expectedParentUid = "") {
  if (!docSnap?.exists) return null;
  const data = docSnap.data();
  return {
    documentId: docSnap.id,
    studentId: data.studentId || docSnap.id,
    name: data.name || "",
    status: data.status || "",
    billingStatus: data.billingStatus || "",
    parentUid: data.parentUid || "",
    parentPhone: data.parentPhone || "",
    parentEmail: data.parentEmail || "",
    parentUidMatchesUser: expectedParentUid ? data.parentUid === expectedParentUid : null
  };
}

function compactPayment(docSnap) {
  const data = docSnap.data();
  return {
    paymentId: docSnap.id,
    studentId: data.studentId || "",
    resolvedStudentId: data.resolvedStudentId || "",
    studentName: data.studentName || "",
    parentUid: data.parentUid || "",
    parentEmail: data.parentEmail || "",
    status: data.status || ""
  };
}

async function findUser(db, auth, args) {
  if (args.uid) {
    const userSnap = await db.collection("users").doc(args.uid).get();
    return userSnap.exists ? { uid: args.uid, userSnap, locatedBy: "uid" } : { uid: args.uid, userSnap: null, locatedBy: "uid" };
  }

  if (args.phone) {
    const normalizedPhone = normalizePhoneNumber(args.phone);
    let uid = "";
    try {
      const authUser = await auth.getUserByPhoneNumber(normalizedPhone);
      uid = authUser.uid;
    } catch (error) {
      if (error.code !== "auth/user-not-found") throw error;
    }

    if (uid) {
      const userSnap = await db.collection("users").doc(uid).get();
      return { uid, userSnap: userSnap.exists ? userSnap : null, locatedBy: "phone-auth", normalizedPhone };
    }

    const usersSnap = await db.collection("users").where("phone", "==", normalizedPhone).get();
    if (usersSnap.size === 1) {
      const userSnap = usersSnap.docs[0];
      return { uid: userSnap.id, userSnap, locatedBy: "phone-users", normalizedPhone };
    }

    return { uid: "", userSnap: null, locatedBy: "phone", normalizedPhone, ambiguityCount: usersSnap.size };
  }

  if (args.email) {
    let uid = "";
    try {
      const authUser = await auth.getUserByEmail(args.email);
      uid = authUser.uid;
    } catch (error) {
      if (error.code !== "auth/user-not-found") throw error;
    }

    if (uid) {
      const userSnap = await db.collection("users").doc(uid).get();
      return { uid, userSnap: userSnap.exists ? userSnap : null, locatedBy: "email-auth" };
    }

    const legacySnap = await db.collection("users").doc(args.email).get();
    return { uid: legacySnap.exists ? legacySnap.id : "", userSnap: legacySnap.exists ? legacySnap : null, locatedBy: "email-users" };
  }

  return { uid: "", userSnap: null, locatedBy: "none" };
}

async function getStudentDocsForUser(db, uid, userData) {
  const studentIds = Array.isArray(userData?.studentIds) ? userData.studentIds : [];
  const byId = [];

  for (const studentId of studentIds) {
    const studentSnap = await db.collection("students").doc(studentId).get();
    byId.push({ declaredStudentId: studentId, snap: studentSnap });
  }

  const byParentUidSnap = uid
    ? await db.collection("students").where("parentUid", "==", uid).get()
    : { docs: [] };

  const byPhoneSnap = userData?.phone
    ? await db.collection("students").where("parentPhone", "==", userData.phone).get()
    : { docs: [] };

  const map = new Map();
  for (const item of byId) {
    if (item.snap.exists) map.set(item.snap.id, item.snap);
  }
  for (const snap of byParentUidSnap.docs) map.set(snap.id, snap);
  for (const snap of byPhoneSnap.docs) map.set(snap.id, snap);

  return {
    declaredStudentIds: studentIds,
    missingStudentIds: byId.filter((item) => !item.snap.exists).map((item) => item.declaredStudentId),
    studentSnaps: [...map.values()]
  };
}

async function getStudentDocsByPhone(db, phone) {
  if (!phone) return [];
  const snap = await db.collection("students").where("parentPhone", "==", phone).get();
  return snap.docs;
}

async function getPaymentsForStudentsAndParent(db, uid, email, studentIds) {
  const map = new Map();
  for (const studentId of studentIds.filter(Boolean)) {
    const snap = await db.collection("payments").where("studentId", "==", studentId).get();
    for (const doc of snap.docs) map.set(doc.id, doc);
  }
  if (uid) {
    const snap = await db.collection("payments").where("parentUid", "==", uid).get();
    for (const doc of snap.docs) map.set(doc.id, doc);
  }
  if (email) {
    const snap = await db.collection("payments").where("parentEmail", "==", email).get();
    for (const doc of snap.docs) map.set(doc.id, doc);
  }
  return [...map.values()];
}

function describePortalResolution(userData, students) {
  const studentIds = Array.isArray(userData?.studentIds) ? userData.studentIds : [];
  const initialStudentId = studentIds[0] || userData?.studentId || "";
  const selected = students.find((student) => student.studentId === initialStudentId || student.documentId === initialStudentId) || null;
  const studentStatus = selected?.status || userData?.status || "";
  const activeStudents = students.filter((student) => student.status === "active");
  const paidActiveStudents = activeStudents.map((student) => student.studentId);

  let reason = "";
  if (!initialStudentId) {
    reason = "BLOQUEADO: users.studentIds está vacío y no existe users.studentId legacy.";
  } else if (!selected) {
    reason = "BLOQUEADO: el studentId seleccionado por el portal no existe o no fue localizado.";
  } else if (studentStatus === "active") {
    reason = "DESBLOQUEADO: el alumno seleccionado por studentIds[0] tiene status active.";
  } else {
    reason = `BLOQUEADO: el alumno seleccionado tiene status ${printable(studentStatus)}.`;
  }

  const suggestedStudentId = selected?.status === "active"
    ? selected.studentId
    : activeStudents[0]?.studentId || "";

  return {
    selectedStudentId: initialStudentId,
    studentStatus,
    reason,
    suggestedStudentId,
    activeStudentIds: paidActiveStudents,
    isMultiStudent: students.length > 1
  };
}

async function diagnoseParent(db, auth, args) {
  const located = await findUser(db, auth, args);
  const userData = located.userSnap?.exists ? located.userSnap.data() : null;
  const uid = located.uid || userData?.uid || "";
  const userStudentInfo = await getStudentDocsForUser(db, uid, userData);
  const studentMap = new Map(userStudentInfo.studentSnaps.map((snap) => [snap.id, snap]));

  if (located.normalizedPhone && !userData) {
    const byPhoneDocs = await getStudentDocsByPhone(db, located.normalizedPhone);
    for (const snap of byPhoneDocs) studentMap.set(snap.id, snap);
  }

  const students = [...studentMap.values()].map((snap) => compactStudent(snap, uid));
  const paymentSnaps = await getPaymentsForStudentsAndParent(
    db,
    uid,
    userData?.email || args.email,
    students.map((student) => student.studentId)
  );
  const payments = paymentSnaps.map(compactPayment);
  const portal = describePortalResolution(userData, students);

  const cases = [];
  if (!userData) cases.push("No se encontró users/{parentUid}.");
  if (userData && userData.status !== "active") cases.push(`Usuario con status distinto de active: ${printable(userData.status)}.`);
  if (userData && !Array.isArray(userData.studentIds)) cases.push("Usuario sin studentIds.");
  if (userData && Array.isArray(userData.studentIds) && userData.studentIds.length === 0) cases.push("Usuario con studentIds vacío.");
  if (!userData && located.normalizedPhone && students.length > 0) cases.push("Existen alumnos con este parentPhone, pero no existe usuario/sesión vinculada.");
  if (userStudentInfo.missingStudentIds.length > 0) cases.push(`studentIds inexistentes: ${userStudentInfo.missingStudentIds.join(", ")}.`);
  for (const student of students) {
    if (student.status === "active" && !student.parentUid) cases.push(`Alumno active sin parentUid: ${student.studentId}.`);
    if (student.parentUid && uid && student.parentUid !== uid) cases.push(`Alumno con parentUid diferente al UID localizado: ${student.studentId}.`);
  }
  if (portal.isMultiStudent) cases.push("Padre vinculado a más de un alumno; el portal selecciona studentIds[0].");
  if (portal.selectedStudentId && portal.studentStatus !== "active" && portal.activeStudentIds.length > 0) {
    cases.push("Primer studentIds[0] bloqueado mientras otro alumno está active.");
  }
  for (const payment of payments.filter((payment) => payment.status === "approved")) {
    if (payment.studentId && payment.studentId !== portal.selectedStudentId) {
      cases.push(`Pago aprobado asociado a un alumno diferente al seleccionado por el portal: ${payment.paymentId}.`);
    }
  }
  if (located.uid && userData?.uid && located.uid !== userData.uid) cases.push("Sesión/UID localizado no coincide con users.uid.");

  return {
    parentSessionUser: {
      uid: printable(uid),
      locatedBy: located.locatedBy,
      status: printable(userData?.status),
      role: printable(userData?.role),
      studentIds: Array.isArray(userData?.studentIds) ? userData.studentIds : [],
      phone: printable(userData?.phone || located.normalizedPhone),
      email: printable(userData?.email || args.email),
      usersUidField: printable(userData?.uid)
    },
    students,
    missingStudentIds: userStudentInfo.missingStudentIds,
    payments,
    portalResolution: portal,
    detectedCases: cases
  };
}

async function resolveHistoricalPaymentParent(db, paymentDoc) {
  const payment = paymentDoc.data();
  const studentId = payment.studentId || payment.resolvedStudentId || "";
  const studentSnap = studentId ? await db.collection("students").doc(studentId).get() : null;
  const student = compactStudent(studentSnap, "");
  const candidateUsers = new Map();

  if (student?.parentUid) {
    const userSnap = await db.collection("users").doc(student.parentUid).get();
    if (userSnap.exists) candidateUsers.set(userSnap.id, userSnap);
  }

  if (student?.parentPhone) {
    const usersByPhone = await db.collection("users").where("phone", "==", student.parentPhone).get();
    for (const userSnap of usersByPhone.docs) candidateUsers.set(userSnap.id, userSnap);
  }

  if (payment.parentEmail) {
    const usersByEmail = await db.collection("users").where("email", "==", payment.parentEmail).get();
    for (const userSnap of usersByEmail.docs) candidateUsers.set(userSnap.id, userSnap);
    const legacySnap = await db.collection("users").doc(payment.parentEmail).get();
    if (legacySnap.exists) candidateUsers.set(legacySnap.id, legacySnap);
  }

  const candidates = [...candidateUsers.entries()].map(([uid, snap]) => ({
    uid,
    status: snap.data().status || "",
    role: snap.data().role || "",
    studentIds: Array.isArray(snap.data().studentIds) ? snap.data().studentIds : []
  }));

  return {
    payment: compactPayment(paymentDoc),
    student,
    candidateUsers: candidates,
    safeToLink: candidates.length === 1 && Boolean(student),
    ambiguity: candidates.length === 0 ? "sin usuario candidato" : candidates.length > 1 ? "más de un usuario candidato" : ""
  };
}

async function diagnoseApprovedMissingParent(db) {
  const paymentsSnap = await db.collection("payments").where("status", "==", "approved").get();
  const targets = paymentsSnap.docs.filter((doc) => {
    const data = doc.data();
    return !data.parentUid;
  });

  const results = [];
  for (const paymentDoc of targets) {
    results.push(await resolveHistoricalPaymentParent(db, paymentDoc));
  }

  return {
    mode: "approved-missing-parent",
    reviewedApprovedPayments: paymentsSnap.size,
    approvedPaymentsWithoutParentUid: targets.length,
    records: results
  };
}

function printReport(report) {
  console.log(JSON.stringify(report, null, 2));
}

async function run() {
  const args = parseArgs(process.argv);
  const selectorCount = [args.uid, args.phone, args.email].filter(Boolean).length;

  if (!args.approvedMissingParent && selectorCount !== 1) {
    console.error("Uso: node scripts/diagnose-parent-access.js --uid=\"...\" | --phone=\"...\" | --email=\"...\" | --approved-missing-parent");
    process.exit(1);
  }

  initializeFirebaseAdmin();
  const db = getFirestore();
  const auth = getAuth();

  if (args.approvedMissingParent) {
    printReport(await diagnoseApprovedMissingParent(db));
    return;
  }

  printReport(await diagnoseParent(db, auth, args));
}

run().catch((error) => {
  console.error("Error en diagnóstico de acceso de padre:", error.message);
  process.exit(1);
});
