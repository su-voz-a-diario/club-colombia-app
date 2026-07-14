import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 8192;
const MAX_STRING_LENGTH = 2000;

const ALLOWED_KEYS = new Set([
  "step",
  "timestamp",
  "pathname",
  "elapsedMs",
  "listeners",
  "lastAdminStep",
  "memoryUsedJSHeapSize",
  "errorType",
  "message",
  "source",
  "line",
  "column",
  "stack"
]);

function sanitizeString(value) {
  return value.slice(0, MAX_STRING_LENGTH);
}

function sanitizeValue(value) {
  if (typeof value === "string") return sanitizeString(value);
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "boolean") return value;
  if (value === null) return null;
  return undefined;
}

function sanitizePayload(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return null;
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(payload)) {
    if (!ALLOWED_KEYS.has(key)) continue;
    const cleanValue = sanitizeValue(value);
    if (cleanValue !== undefined) {
      sanitized[key] = cleanValue;
    }
  }

  return typeof sanitized.step === "string" ? sanitized : null;
}

export async function POST(request) {
  const contentType = request.headers.get("content-type") || "";
  if (!contentType.toLowerCase().includes("application/json")) {
    return NextResponse.json({ error: "Content-Type JSON requerido" }, { status: 415 });
  }

  const rawBody = await request.text();
  if (new TextEncoder().encode(rawBody).length > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "Payload demasiado grande" }, { status: 413 });
  }

  let parsed;
  try {
    parsed = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const payload = sanitizePayload(parsed);
  if (!payload) {
    return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
  }

  console.log("[ADMIN_DIAGNOSTICS]", payload);

  return new Response(null, { status: 204 });
}
