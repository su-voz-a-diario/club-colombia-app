#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const admin = require("firebase-admin");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { getAuth } = require("firebase-admin/auth");

const REQUIRED_FIELDS = ["name", "parentName", "parentPhone", "category"];
const VALID_STATUSES = new Set(["active", "inactive", "suspended", "pending_validation", "on_hold"]);
const VALID_BILLING_STATUSES = new Set(["paid", "pending_payment", "pending_validation", "on_hold"]);
const DEFAULT_STATUS = "suspended";
const DEFAULT_BILLING_STATUS = "pending_payment";
const DEFAULT_HEALTH_STATUS = "optimal";

function parseArgs(argv) {
  const args = {
    file: "",
    commit: false
  };

  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--file") {
      args.file = argv[i + 1] || "";
      i += 1;
    } else if (arg === "--commit") {
      args.commit = true;
    }
  }

  return args;
}

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} es obligatorio para usar Firebase Admin SDK`);
  }
  return value;
}

function initializeFirebaseAdmin() {
  if (admin.getApps().length > 0) return;

  const localServiceAccountPath = path.join(process.cwd(), "club-colombia-futbol-firebase-adminsdk-fbsvc-2aa1a9a36c.json");
  if (fs.existsSync(localServiceAccountPath)) {
    const serviceAccount = JSON.parse(fs.readFileSync(localServiceAccountPath, "utf8"));
    admin.initializeApp({
      credential: admin.cert(serviceAccount)
    });
    return;
  }

  admin.initializeApp({
    credential: admin.cert({
      projectId: requireEnv("FIREBASE_PROJECT_ID"),
      clientEmail: requireEnv("FIREBASE_CLIENT_EMAIL"),
      privateKey: requireEnv("FIREBASE_PRIVATE_KEY").replace(/\\n/g, "\n")
    })
  });
}

function normalizeStudentName(name) {
  return (name || "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function categoryNameToId(categoryName) {
  return normalizeStudentName(categoryName)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "sin-categoria";
}

function splitCsvLine(line) {
  const values = [];
  let current = "";
  let quoted = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"' && quoted && next === '"') {
      current += '"';
      i += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      values.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  values.push(current.trim());
  return values;
}

function parseCsv(content) {
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) return [];

  const headers = splitCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const values = splitCsvLine(line);
    return headers.reduce((row, header, index) => {
      row[header] = values[index] || "";
      return row;
    }, {});
  });
}

function loadStudents(filePath) {
  const resolvedPath = path.resolve(filePath);
  const content = fs.readFileSync(resolvedPath, "utf8");
  const extension = path.extname(resolvedPath).toLowerCase();

  if (extension === ".json") {
    const parsed = JSON.parse(content);
    if (!Array.isArray(parsed)) {
      throw new Error("El archivo JSON debe contener un arreglo de alumnos");
    }
    return parsed;
  }

  if (extension === ".csv") {
    return parseCsv(content);
  }

  throw new Error("Formato no soportado. Usa .json o .csv");
}

function normalizeEmail(email) {
  return (email || "").trim().toLowerCase();
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

function isValidE164Phone(phone) {
  return /^\+[1-9]\d{7,14}$/.test(String(phone || ""));
}

function normalizeAndValidatePhone(phone) {
  const normalizedPhone = normalizePhoneNumber(phone);
  if (!isValidE164Phone(normalizedPhone)) {
    throw new Error("parentPhone debe ser valido y estar en formato internacional E.164");
  }
  return normalizedPhone;
}

function getMissingFields(student) {
  return REQUIRED_FIELDS.filter((field) => !String(student[field] || "").trim());
}

async function findParentUid(parentPhone, explicitParentUid) {
  if (explicitParentUid) return explicitParentUid;

  try {
    const userRecord = await getAuth().getUserByPhoneNumber(parentPhone);
    return userRecord.uid;
  } catch (error) {
    if (error.code === "auth/user-not-found") {
      return "";
    }
    throw error;
  }
}

async function findExistingStudent(db, student) {
  if (student.studentId) {
    const ref = db.collection("students").doc(student.studentId);
    const snap = await ref.get();
    if (snap.exists) return { ref, snap, reason: "studentId" };
  }

  const normalizedName = normalizeStudentName(student.name);
  const parentPhone = normalizeAndValidatePhone(student.parentPhone);
  const querySnap = await db
    .collection("students")
    .where("normalizedName", "==", normalizedName)
    .where("parentPhone", "==", parentPhone)
    .limit(1)
    .get();

  if (!querySnap.empty) {
    const snap = querySnap.docs[0];
    return { ref: snap.ref, snap, reason: "normalizedName+parentEmail" };
  }

  return null;
}

function pickMissingFields(existingData, candidateData) {
  return Object.entries(candidateData).reduce((patch, [key, value]) => {
    const isMissing = existingData[key] === undefined || existingData[key] === null || existingData[key] === "";
    const hasValue = value !== undefined && value !== null && value !== "";
    if (isMissing && hasValue) {
      patch[key] = value;
    }
    return patch;
  }, {});
}

async function upsertParentUser(db, studentData, commit, report) {
  if (!studentData.parentUid) {
    report.parentsPendingLogin.push(studentData.parentPhone);
    return;
  }

  const userRef = db.collection("users").doc(studentData.parentUid);
  const userSnap = await userRef.get();

  if (!userSnap.exists) {
    report.parentsCreated.push(studentData.parentPhone);
    if (commit) {
      await userRef.set({
        uid: studentData.parentUid,
        phone: studentData.parentPhone,
        email: studentData.parentEmail || "",
        role: "parent",
        displayName: studentData.parentName,
        studentId: studentData.studentId,
        studentIds: [studentData.studentId],
        studentName: studentData.name,
        categoryName: studentData.category,
        status: studentData.status,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      });
    }
    return;
  }

  report.parentsExisting.push(studentData.parentPhone);
  const existing = userSnap.data();
  const missingPatch = pickMissingFields(existing, {
    uid: studentData.parentUid,
    phone: studentData.parentPhone,
    email: studentData.parentEmail || "",
    role: "parent",
    displayName: studentData.parentName,
    studentId: studentData.studentId,
    studentName: studentData.name,
    categoryName: studentData.category,
    status: studentData.status
  });

  const patch = {
    ...missingPatch,
    studentIds: FieldValue.arrayUnion(studentData.studentId),
    updatedAt: FieldValue.serverTimestamp()
  };

  if (commit) {
    await userRef.set(patch, { merge: true });
  }
}

function buildStudentData(rawStudent, studentId, parentUid) {
  const parentEmail = normalizeEmail(rawStudent.parentEmail);
  const parentPhone = normalizeAndValidatePhone(rawStudent.parentPhone);
  const category = String(rawStudent.category || "").trim();
  const status = VALID_STATUSES.has(rawStudent.status) ? rawStudent.status : DEFAULT_STATUS;
  const billingStatus = VALID_BILLING_STATUSES.has(rawStudent.billingStatus)
    ? rawStudent.billingStatus
    : DEFAULT_BILLING_STATUS;

  return {
    studentId,
    name: String(rawStudent.name || "").trim(),
    normalizedName: normalizeStudentName(rawStudent.name),
    parentName: String(rawStudent.parentName || "").trim(),
    parentEmail,
    parentPhone,
    parentUid: parentUid || "",
    categoryId: rawStudent.categoryId || categoryNameToId(category),
    category,
    assignedCoachUid: rawStudent.assignedCoachUid || "",
    status,
    billingStatus,
    healthStatus: rawStudent.healthStatus || DEFAULT_HEALTH_STATUS,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp()
  };
}

async function importStudent(db, rawStudent, index, commit, report) {
  const missingFields = getMissingFields(rawStudent);
  if (missingFields.length > 0) {
    report.missingFields.push({ row: index + 1, name: rawStudent.name || "", fields: missingFields });
    report.skipped.push({ row: index + 1, name: rawStudent.name || "", reason: "missing_required_fields" });
    return;
  }

  const parentPhone = normalizeAndValidatePhone(rawStudent.parentPhone);
  const parentEmail = normalizeEmail(rawStudent.parentEmail);
  const existingStudent = await findExistingStudent(db, { ...rawStudent, parentEmail, parentPhone });

  if (existingStudent) {
    const existingData = existingStudent.snap.data();
    report.skipped.push({
      row: index + 1,
      name: rawStudent.name,
      studentId: existingData.studentId || existingStudent.ref.id,
      reason: `already_exists:${existingStudent.reason}`
    });
    return;
  }

  const studentRef = rawStudent.studentId
    ? db.collection("students").doc(rawStudent.studentId)
    : db.collection("students").doc();
  const studentId = studentRef.id;
  const parentUid = await findParentUid(parentPhone, rawStudent.parentUid);
  const studentData = buildStudentData(rawStudent, studentId, parentUid);

  report.studentsCreated.push({ name: studentData.name, studentId });

  if (commit) {
    await studentRef.set(studentData);
  }

  await upsertParentUser(db, studentData, commit, report);
}

async function main() {
  const args = parseArgs(process.argv);
  if (!args.file) {
    throw new Error("Uso: node scripts/import-students.js --file alumnos.json|alumnos.csv [--commit]");
  }

  initializeFirebaseAdmin();
  const db = getFirestore();
  const students = loadStudents(args.file);
  const report = {
    mode: args.commit ? "commit" : "dry-run",
    studentsCreated: [],
    skipped: [],
    parentsCreated: [],
    parentsExisting: [],
    parentsPendingLogin: [],
    errors: [],
    missingFields: []
  };

  for (let i = 0; i < students.length; i += 1) {
    try {
      await importStudent(db, students[i], i, args.commit, report);
    } catch (error) {
      report.errors.push({
        row: i + 1,
        name: students[i]?.name || "",
        message: error.message
      });
    }
  }

  console.log(JSON.stringify(report, null, 2));
}

main().catch((error) => {
  console.error("Error fatal al importar alumnos:", error.message);
  process.exit(1);
});
