import { EVENT_NAME } from "../domain/event.js";

export const STORAGE_KEY = "fanect_p1";
export const LEGACY_KEY = "fanect_p0";
export const CURRENT = 2;

/** @returns {import('../domain/types.js').AppState} */
export function defaultState() {
  return {
    context: "hub",
    screen: "hub",
    registration: {
      nombre: "Andrés Demo",
      doc: "1.234.567.890",
      cel: "300 123 4567",
      email: "demo@fanect.co",
    },
    consents: { identidad: false, acceso: false, comunicaciones: false },
    verifyPath: null,
    fanPass: null,
    ticket: null,
    qrSession: null,
    selectedFixture: null,
    lastDecision: null,
    auditLog: [],
    usedNonces: [],
    redeemedTicketIds: [],
    operator: {
      operadorLabel: "Operador Demo",
      puerta: "Norte A · Acceso 3",
      turno: "20:00 – 22:30",
    },
    uiHint: null,
  };
}

/**
 * @param {unknown} raw
 * @returns {{ schemaVersion: number, state: import('../domain/types.js').AppState }}
 */
export function migrate(raw) {
  const base = defaultState();
  if (!raw || typeof raw !== "object") {
    return { schemaVersion: CURRENT, state: base };
  }
  const bag = /** @type {Record<string, any>} */ (raw);

  // Legacy v0/v1 bag (flat fanect_p0)
  if (bag.schemaVersion == null && (bag.nombre != null || bag.passId != null || bag.ticket != null)) {
    if (bag.nombre) base.registration.nombre = bag.nombre;
    if (bag.passId) {
      base.fanPass = {
        passId: bag.passId,
        nombre: bag.nombre || base.registration.nombre,
        eventLabel: EVENT_NAME,
        status: "activo",
        createdAt: Date.now(),
      };
    }
    if (bag.ticket) base.ticket = bag.ticket;
    if (bag.verifyPath) base.verifyPath = bag.verifyPath;
    if (Array.isArray(bag.auditLog)) base.auditLog = bag.auditLog.slice(-20);
    return { schemaVersion: CURRENT, state: base };
  }

  const version = Number(bag.schemaVersion) || 1;
  const src = bag.state && typeof bag.state === "object" ? bag.state : bag;
  const state = { ...base, ...src };
  state.registration = { ...base.registration, ...(src.registration || {}) };
  state.consents = { ...base.consents, ...(src.consents || {}) };
  state.operator = { ...base.operator, ...(src.operator || {}) };
  state.auditLog = Array.isArray(src.auditLog) ? src.auditLog.slice(-20) : [];
  state.usedNonces = Array.isArray(src.usedNonces) ? src.usedNonces : [];
  state.redeemedTicketIds = Array.isArray(src.redeemedTicketIds) ? src.redeemedTicketIds : [];
  state.selectedFixture = null; // ephemeral
  state.uiHint = null;
  // Always boot hub (presenter safety) — screen/context restored only mid-session via router
  state.context = "hub";
  state.screen = "hub";
  return { schemaVersion: Math.max(version, CURRENT), state };
}

/** @param {string | null} rawString */
export function hydrate(rawString) {
  if (!rawString) return migrate(null);
  try {
    return migrate(JSON.parse(rawString));
  } catch {
    return migrate(null);
  }
}

/** @param {import('../domain/types.js').AppState} state */
export function serialize(state) {
  return JSON.stringify({
    schemaVersion: CURRENT,
    state: {
      registration: state.registration,
      consents: state.consents,
      verifyPath: state.verifyPath,
      fanPass: state.fanPass,
      ticket: state.ticket,
      qrSession: state.qrSession,
      auditLog: (state.auditLog || []).slice(-20),
      usedNonces: state.usedNonces || [],
      redeemedTicketIds: state.redeemedTicketIds || [],
      operator: state.operator,
      lastDecision: state.lastDecision,
    },
  });
}

export function readStorage() {
  try {
    const v1 = localStorage.getItem(STORAGE_KEY);
    if (v1) return hydrate(v1);
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (legacy) {
      const migrated = hydrate(legacy);
      try {
        localStorage.setItem(STORAGE_KEY, serialize(migrated.state));
      } catch { /* ignore */ }
      return migrated;
    }
  } catch { /* ignore */ }
  return migrate(null);
}

/** @param {import('../domain/types.js').AppState} state */
export function writeStorage(state) {
  try {
    localStorage.setItem(STORAGE_KEY, serialize(state));
  } catch { /* ignore */ }
}

export function clearStorage() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(LEGACY_KEY);
  } catch { /* ignore */ }
}
