#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const admin = require("firebase-admin");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");

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

async function main() {
  const apply = process.argv.includes("--apply");
  initializeFirebaseAdmin();
  const db = getFirestore();
  const snap = await db.collection("students").get();
  const report = {
    mode: apply ? "apply" : "dry-run",
    updated: [],
    skipped: [],
    ambiguous: []
  };

  for (const studentDoc of snap.docs) {
    const student = studentDoc.data();
    const parsed = parseLegacyCategory(student.category);

    if (!parsed.changed) {
      report.skipped.push({
        id: redactId(studentDoc.id),
        category: student.category || "",
        reason: "no_legacy_level_suffix"
      });
      continue;
    }

    const patch = {
      category: parsed.category,
      level: student.level || parsed.level,
      updatedAt: FieldValue.serverTimestamp()
    };

    report.updated.push({
      id: redactId(studentDoc.id),
      name: student.name ? `${student.name.slice(0, 2)}...` : "",
      from: { category: student.category || "", level: student.level || "" },
      to: { category: patch.category, level: patch.level }
    });

    if (apply) {
      await studentDoc.ref.set(patch, { merge: true });
    }
  }

  console.log(JSON.stringify(report, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
