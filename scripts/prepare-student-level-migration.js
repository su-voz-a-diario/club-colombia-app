#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const admin = require("firebase-admin");
const { getFirestore } = require("firebase-admin/firestore");

const LEVEL_SUFFIXES = [
  { suffix: "iniciación", level: "initiation" },
  { suffix: "iniciacion", level: "initiation" },
  { suffix: "intermedio", level: "intermediate" },
  { suffix: "competitivo", level: "intermediate" },
  { suffix: "avanzado", level: "advanced" },
  { suffix: "elite", level: "advanced" }
];

function initializeFirebaseAdmin() {
  if (admin.getApps().length > 0) return;

  const serviceAccountPath = path.join(process.cwd(), "club-colombia-futbol-firebase-adminsdk-fbsvc-2aa1a9a36c.json");
  if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));
    admin.initializeApp({ credential: admin.cert(serviceAccount) });
    return;
  }

  admin.initializeApp({
    credential: admin.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n")
    })
  });
}

function parseLegacyCategory(category) {
  const original = String(category || "").trim();
  const lowered = original.toLowerCase();
  const match = LEVEL_SUFFIXES.find(({ suffix }) => lowered.endsWith(` ${suffix}`));
  if (!match) return { category: original, level: "", changed: false };
  const categoryOnly = original.slice(0, original.length - match.suffix.length).trim();
  return { category: categoryOnly, level: match.level, changed: !!categoryOnly };
}

function redactId(id) {
  if (!id) return "";
  return `${id.slice(0, 4)}...${id.slice(-4)}`;
}

function parseArgs(argv) {
  return {
    apply: argv.includes("--apply"),
    backupDir: "backups"
  };
}

function serializeFirestoreValue(value) {
  if (!value) return value;
  if (typeof value.toDate === "function") {
    const date = value.toDate();
    return {
      __type: "timestamp",
      seconds: value.seconds,
      nanoseconds: value.nanoseconds,
      iso: date.toISOString()
    };
  }
  if (value instanceof Date) {
    return { __type: "date", iso: value.toISOString() };
  }
  if (Array.isArray(value)) {
    return value.map(serializeFirestoreValue);
  }
  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, childValue]) => [key, serializeFirestoreValue(childValue)])
    );
  }
  return value;
}

function buildBackupPath(backupDir) {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  return path.join(process.cwd(), backupDir, `student-level-migration-${stamp}.json`);
}

async function main() {
  const args = parseArgs(process.argv);
  initializeFirebaseAdmin();
  const db = getFirestore();
  const snap = await db.collection("students").get();
  const report = {
    mode: args.apply ? "apply" : "dry-run",
    totalFound: snap.size,
    totalMigrated: 0,
    totalSkipped: 0,
    backupPath: "",
    updated: [],
    skipped: [],
    ambiguous: [],
    errors: [],
    verification: []
  };
  const backup = {
    createdAt: new Date().toISOString(),
    collection: "students",
    operation: "legacy_category_to_category_level",
    documents: []
  };

  for (const studentDoc of snap.docs) {
    const student = studentDoc.data();
    const parsed = parseLegacyCategory(student.category);

    if (!parsed.changed) {
      report.totalSkipped += 1;
      report.skipped.push({
        id: redactId(studentDoc.id),
        category: student.category || "",
        reason: "no_legacy_level_suffix"
      });
      continue;
    }

    const patch = {
      category: parsed.category,
      level: parsed.level
    };

    backup.documents.push({
      id: studentDoc.id,
      path: studentDoc.ref.path,
      data: serializeFirestoreValue(student)
    });

    report.updated.push({
      id: studentDoc.id,
      name: student.name || "",
      from: { category: student.category || "", level: student.level || "" },
      to: { category: patch.category, level: patch.level }
    });

    if (args.apply) {
      await studentDoc.ref.set(patch, { merge: true });
      report.totalMigrated += 1;
    }
  }

  if (backup.documents.length > 0) {
    const backupPath = buildBackupPath(args.backupDir);
    fs.mkdirSync(path.dirname(backupPath), { recursive: true });
    fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2));
    report.backupPath = path.relative(process.cwd(), backupPath);
  }

  if (!args.apply) {
    report.totalMigrated = report.updated.length;
  } else {
    for (const migrated of report.updated) {
      const verifySnap = await db.collection("students").doc(migrated.id).get();
      const data = verifySnap.data() || {};
      report.verification.push({
        id: migrated.id,
        name: data.name || migrated.name,
        category: data.category || "",
        level: data.level || "",
        ok: data.category === migrated.to.category && data.level === migrated.to.level
      });
    }
  }

  console.log(JSON.stringify(report, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
