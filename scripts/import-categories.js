#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const admin = require("firebase-admin");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");

let categoryModel;

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

function loadCategories(filePath) {
  const resolvedPath = path.resolve(filePath);
  const content = fs.readFileSync(resolvedPath, "utf8");
  const extension = path.extname(resolvedPath).toLowerCase();

  if (extension === ".json") {
    const parsed = JSON.parse(content);
    if (!Array.isArray(parsed)) {
      throw new Error("El archivo JSON debe contener un arreglo de categorias");
    }
    return parsed;
  }

  if (extension === ".csv") {
    return parseCsv(content);
  }

  throw new Error("Formato no soportado. Usa .json o .csv");
}

function validateCategory(rawCategory) {
  const result = categoryModel.validateCategoryInput(rawCategory);
  return {
    category: result.normalized,
    errors: result.errors,
    warnings: result.warnings
  };
}

function getChangedFields(existing, incoming) {
  return Object.entries(incoming).reduce((changes, [key, value]) => {
    if (key === "createdAt" || key === "updatedAt") return changes;
    const current = existing[key];
    const equal = Array.isArray(value)
      ? JSON.stringify(current || []) === JSON.stringify(value)
      : current === value;
    if (!equal) {
      changes[key] = value;
    }
    return changes;
  }, {});
}

async function importCategory(db, rawCategory, index, seenCategoryIds, commit, report) {
  const { category, errors, warnings } = validateCategory(rawCategory);
  const row = index + 1;

  if (warnings.length > 0) {
    report.warnings.push({ row, categoryId: category.categoryId, warnings });
  }

  if (errors.length > 0) {
    report.errors.push({ row, categoryId: category.categoryId, errors });
    report.skipped.push({ row, categoryId: category.categoryId, reason: "validation_error" });
    return;
  }

  if (seenCategoryIds.has(category.categoryId)) {
    report.errors.push({ row, categoryId: category.categoryId, errors: ["categoryId duplicado en archivo"] });
    report.skipped.push({ row, categoryId: category.categoryId, reason: "duplicate_in_file" });
    return;
  }
  seenCategoryIds.add(category.categoryId);

  const categoryRef = db.collection("categories").doc(category.categoryId);
  const categorySnap = await categoryRef.get();
  const timestamp = FieldValue.serverTimestamp();

  if (!categorySnap.exists) {
    report.created.push({ row, categoryId: category.categoryId, name: category.name });
    if (commit) {
      await categoryRef.set({
        ...category,
        createdAt: timestamp,
        updatedAt: timestamp
      });
    }
    return;
  }

  const existing = categorySnap.data();
  const changes = getChangedFields(existing, category);

  if (Object.keys(changes).length === 0) {
    report.skipped.push({ row, categoryId: category.categoryId, reason: "no_changes" });
    return;
  }

  report.updated.push({
    row,
    categoryId: category.categoryId,
    fields: Object.keys(changes)
  });

  if (commit) {
    await categoryRef.set({
      ...changes,
      updatedAt: timestamp
    }, { merge: true });
  }
}

async function main() {
  const args = parseArgs(process.argv);
  if (!args.file) {
    throw new Error("Uso: node scripts/import-categories.js --file categorias.json|categorias.csv [--commit]");
  }

  categoryModel = await import("../src/lib/categoryModel.js");
  initializeFirebaseAdmin();
  const db = getFirestore();
  const categories = loadCategories(args.file);
  const seenCategoryIds = new Set();
  const report = {
    mode: args.commit ? "commit" : "dry-run",
    created: [],
    updated: [],
    skipped: [],
    errors: [],
    warnings: []
  };

  for (let i = 0; i < categories.length; i += 1) {
    try {
      await importCategory(db, categories[i], i, seenCategoryIds, args.commit, report);
    } catch (error) {
      report.errors.push({
        row: i + 1,
        categoryId: categories[i]?.categoryId || "",
        errors: [error.message]
      });
    }
  }

  console.log(JSON.stringify(report, null, 2));
}

main().catch((error) => {
  console.error("Error fatal al importar categorias:", error.message);
  process.exit(1);
});
