"use client";

const DIAG_KEY = "__clubAdminDiagnostics";
const DIAG_ENDPOINT = "/api/admin-diagnostics";
const MAX_STACK_LENGTH = 2000;
const REMOTE_CHECKPOINTS = new Set([
  "ADMIN_STEP_01",
  "ADMIN_STEP_05",
  "ADMIN_STEP_10",
  "ADMIN_STEP_15",
  "ADMIN_STEP_20",
  "ADMIN_STEP_25",
  "ADMIN_STEP_30",
  "ADMIN_STEP_40",
  "ADMIN_STEP_50",
  "ADMIN_STEP_60",
  "ADMIN_STEP_70",
  "ADMIN_STEP_80",
  "ADMIN_READY"
]);
const ERROR_CHECKPOINTS = new Set([
  "ADMIN_STEP_98",
  "ADMIN_STEP_99",
  "ADMIN_STEP_100"
]);

function getDiagnosticsState() {
  const root = typeof window !== "undefined" ? window : globalThis;
  if (!root[DIAG_KEY]) {
    root[DIAG_KEY] = {
      startedAt: Date.now(),
      listeners: 0,
      renderBlocks: 0,
      sentSteps: new Set(),
      lastAdminStep: ""
    };
  }
  return root[DIAG_KEY];
}

function getMemorySnapshot() {
  if (typeof window === "undefined" || !window.performance?.memory) {
    return { jsHeapMb: "unavailable" };
  }

  const memory = window.performance.memory;
  return {
    jsHeapUsedMb: Math.round(memory.usedJSHeapSize / 1024 / 1024),
    jsHeapTotalMb: Math.round(memory.totalJSHeapSize / 1024 / 1024),
    jsHeapLimitMb: Math.round(memory.jsHeapSizeLimit / 1024 / 1024)
  };
}

function numberOrUnavailable(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : "unavailable";
}

function getPathname() {
  return typeof window !== "undefined" ? window.location.pathname : "server";
}

function getMemoryUsedJSHeapSize() {
  if (typeof window === "undefined" || !window.performance?.memory) {
    return undefined;
  }

  const value = window.performance.memory.usedJSHeapSize;
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function getCheckpointKey(step) {
  if (step === "ADMIN_READY") return "ADMIN_READY";
  const match = step.match(/^(ADMIN_STEP_\d+)/);
  return match ? match[1] : "";
}

function getErrorType(checkpoint, details) {
  if (typeof details.type === "string") return details.type;
  if (checkpoint === "ADMIN_STEP_98") return "error_boundary";
  if (checkpoint === "ADMIN_STEP_99") return "window_error";
  if (checkpoint === "ADMIN_STEP_100") return "unhandled_rejection";
  return "unknown_error";
}

function updateLastAdminStep(step) {
  const state = getDiagnosticsState();
  state.lastAdminStep = step;
  if (typeof window !== "undefined") {
    window.__lastAdminStep = step;
  }
}

function buildRemotePayload(checkpoint, details = {}) {
  const state = getDiagnosticsState();
  const safePayload = {
    step: checkpoint,
    timestamp: new Date().toISOString(),
    pathname: getPathname(),
    elapsedMs: numberOrUnavailable(details.elapsedMs),
    listeners: numberOrUnavailable(details.listeners),
    lastAdminStep: state.lastAdminStep || checkpoint
  };

  const memoryUsedJSHeapSize = getMemoryUsedJSHeapSize();
  if (memoryUsedJSHeapSize !== undefined) {
    safePayload.memoryUsedJSHeapSize = memoryUsedJSHeapSize;
  }

  if (!ERROR_CHECKPOINTS.has(checkpoint)) {
    return safePayload;
  }

  safePayload.errorType = getErrorType(checkpoint, details);
  if (typeof details.message === "string") safePayload.message = details.message.slice(0, 500);
  if (typeof details.source === "string") safePayload.source = details.source.slice(0, 500);
  if (typeof details.file === "string") safePayload.source = details.file.slice(0, 500);
  if (typeof details.lineno === "number") safePayload.line = details.lineno;
  if (typeof details.line === "number") safePayload.line = details.line;
  if (typeof details.colno === "number") safePayload.column = details.colno;
  if (typeof details.column === "number") safePayload.column = details.column;
  if (typeof details.stack === "string") safePayload.stack = details.stack.slice(0, MAX_STACK_LENGTH);

  return safePayload;
}

function shouldSendStep(checkpoint) {
  if (typeof window === "undefined") return false;

  const state = getDiagnosticsState();
  const isErrorStep = ERROR_CHECKPOINTS.has(checkpoint);

  if (!isErrorStep && state.sentSteps.has(checkpoint)) {
    return false;
  }

  state.sentSteps.add(checkpoint);
  return REMOTE_CHECKPOINTS.has(checkpoint) || isErrorStep;
}

function sendRemoteDiagnostics(payload) {
  if (typeof window === "undefined") return;

  const body = JSON.stringify(payload);
  const blob = new Blob([body], { type: "application/json" });

  if (navigator.sendBeacon && navigator.sendBeacon(DIAG_ENDPOINT, blob)) {
    return;
  }

  fetch(DIAG_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
    credentials: "omit"
  }).catch(() => {});
}

export function adminStep(step, details = {}) {
  const state = getDiagnosticsState();
  updateLastAdminStep(step);
  const payload = {
    elapsedMs: Date.now() - state.startedAt,
    listeners: state.listeners,
    ...getMemorySnapshot(),
    ...details
  };

  console.log(`[${step}]`, payload);

  const checkpoint = getCheckpointKey(step);
  if (shouldSendStep(checkpoint)) {
    const remotePayload = buildRemotePayload(checkpoint, payload);
    sendRemoteDiagnostics(remotePayload);
  }
}

export function adminRenderBlock(step, details = {}) {
  const state = getDiagnosticsState();
  state.renderBlocks += 1;
  adminStep(step, {
    renderBlocks: state.renderBlocks,
    ...details
  });
  return null;
}

export function adminListenerStarted(step, details = {}) {
  const state = getDiagnosticsState();
  state.listeners += 1;
  adminStep(step, details);
}

export function adminListenerStopped(step, details = {}) {
  const state = getDiagnosticsState();
  state.listeners = Math.max(0, state.listeners - 1);
  adminStep(step, details);
}

export function getAdminDiagnosticsSnapshot() {
  const state = getDiagnosticsState();
  const nodeCount = typeof document !== "undefined"
    ? document.getElementsByTagName("*").length
    : "unavailable";

  return {
    elapsedMs: Date.now() - state.startedAt,
    listeners: state.listeners,
    renderBlocks: state.renderBlocks,
    nodeCount,
    ...getMemorySnapshot()
  };
}
