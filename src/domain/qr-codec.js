import { EVENT_CODE } from "./event.js";
import { DECISION_COPY } from "./decisions.js";
import { uid } from "./util.js";

/**
 * Shared QR encode / decode / evaluate / drawSeed.
 * Visual canvas is pseudo-QR only (honesty: SIMULADO).
 */
export const QrCodec = {
  /**
   * @param {{ eventCode?: string, passId: string, ticketId: string, nonce: string, rotation: number, expiresAt: number }} input
   */
  encode(input) {
    const eventCode = input.eventCode || EVENT_CODE;
    return [
      "FANECT",
      "v0",
      "event=" + eventCode,
      "pass=" + input.passId,
      "ticket=" + input.ticketId,
      "nonce=" + input.nonce,
      "rot=" + input.rotation,
      "exp=" + Math.floor(input.expiresAt / 1000),
    ].join("|");
  },

  /**
   * @param {string} wire
   * @returns {import('./types.js').QrPayload | null}
   */
  decode(wire) {
    if (!wire || typeof wire !== "string") return null;
    const parts = wire.split("|");
    if (parts.length < 8 || parts[0] !== "FANECT" || parts[1] !== "v0") return null;
    /** @type {Record<string,string>} */
    const map = {};
    for (let i = 2; i < parts.length; i++) {
      const eq = parts[i].indexOf("=");
      if (eq < 0) continue;
      map[parts[i].slice(0, eq)] = parts[i].slice(eq + 1);
    }
    if (!map.event || !map.pass || !map.ticket || !map.nonce || map.rot == null || map.exp == null) {
      return null;
    }
    const rotation = Number(map.rot);
    const expSec = Number(map.exp);
    if (!Number.isFinite(rotation) || !Number.isFinite(expSec)) return null;
    return {
      version: 0,
      eventCode: map.event,
      passId: map.pass,
      ticketId: map.ticket,
      nonce: map.nonce,
      rotation,
      expiresAt: expSec * 1000,
    };
  },

  /**
   * @param {import('./types.js').QrPayload | null} payload
   * @param {{ now: number, usedNonces: Iterable<string>, redeemedTicketIds?: Iterable<string> }} gateCtx
   * @param {{ fixture?: import('./types.js').DemoFixture | null }} [demo]
   */
  evaluate(payload, gateCtx, demo = {}) {
    const fixture = demo.fixture || null;
    if (fixture && DECISION_COPY[fixture]) {
      const copy = DECISION_COPY[fixture];
      return {
        kind: /** @type {import('./types.js').QrEvalKind} */ (fixture),
        allow: copy.allow,
        title: copy.title,
        reason: copy.reason,
        payload,
      };
    }

    if (!payload) {
      const copy = DECISION_COPY.invalido;
      return { kind: "invalido", allow: false, title: copy.title, reason: copy.reason, payload: null };
    }
    if (payload.eventCode !== EVENT_CODE) {
      const copy = DECISION_COPY.invalido;
      return {
        kind: "invalido",
        allow: false,
        title: copy.title,
        reason: "Evento desconocido · " + payload.eventCode,
        payload,
      };
    }
    const used = new Set(gateCtx.usedNonces || []);
    if (used.has(payload.nonce)) {
      const copy = DECISION_COPY.replay;
      return { kind: "replay", allow: false, title: copy.title, reason: copy.reason, payload };
    }
    const redeemed = new Set(gateCtx.redeemedTicketIds || []);
    if (redeemed.has(payload.ticketId)) {
      const copy = DECISION_COPY.usado;
      return { kind: "usado", allow: false, title: copy.title, reason: copy.reason, payload };
    }
    if (gateCtx.now >= payload.expiresAt) {
      const copy = DECISION_COPY.expirado;
      return { kind: "expirado", allow: false, title: copy.title, reason: copy.reason, payload };
    }
    const copy = DECISION_COPY.valido;
    return { kind: "valido", allow: true, title: copy.title, reason: copy.reason, payload };
  },

  /** @param {{ nonce: string, rotation: number }} claims */
  visualSeed(claims) {
    return String(claims.nonce) + String(claims.rotation);
  },

  /**
   * @param {import('./types.js').QrSession} session
   * @param {number} [now]
   * @param {number} [ttlMs]
   * @returns {import('./types.js').QrSession}
   */
  rotate(session, now = Date.now(), ttlMs = 45_000) {
    const payload = {
      version: /** @type {0} */ (0),
      eventCode: session.eventCode || EVENT_CODE,
      passId: session.passId,
      ticketId: session.ticketId,
      nonce: uid(10),
      rotation: (session.rotation || 0) + 1,
      expiresAt: now + ttlMs,
    };
    return { ...payload, payload };
  },

  /**
   * @param {string} passId
   * @param {string} ticketId
   * @param {number} [now]
   * @param {number} [ttlMs]
   */
  createSession(passId, ticketId, now = Date.now(), ttlMs = 45_000) {
    return QrCodec.rotate(
      { eventCode: EVENT_CODE, passId, ticketId, nonce: "", rotation: 0, expiresAt: 0, payload: /** @type {any} */ (null) },
      now,
      ttlMs
    );
  },

  /**
   * Pseudo-QR canvas (not a real codec).
   * @param {HTMLCanvasElement | null} canvas
   * @param {string} seed
   */
  drawSeed(canvas, seed) {
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const size = 200;
    const cells = 21;
    const cell = size / cells;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, size, size);
    let h = 0;
    for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
    function bit(x, y) {
      const n = (h ^ (x * 73856093) ^ (y * 19349663)) >>> 0;
      return n % 3 !== 0;
    }
    function finder(ox, oy) {
      ctx.fillStyle = "#000";
      ctx.fillRect(ox * cell, oy * cell, 7 * cell, 7 * cell);
      ctx.fillStyle = "#fff";
      ctx.fillRect((ox + 1) * cell, (oy + 1) * cell, 5 * cell, 5 * cell);
      ctx.fillStyle = "#000";
      ctx.fillRect((ox + 2) * cell, (oy + 2) * cell, 3 * cell, 3 * cell);
    }
    for (let y = 0; y < cells; y++) {
      for (let x = 0; x < cells; x++) {
        const inFinder =
          (x < 8 && y < 8) || (x > cells - 9 && y < 8) || (x < 8 && y > cells - 9);
        if (inFinder) continue;
        if (bit(x, y)) {
          ctx.fillStyle = "#070707";
          ctx.fillRect(x * cell, y * cell, cell, cell);
        }
      }
    }
    finder(0, 0);
    finder(cells - 7, 0);
    finder(0, cells - 7);
    ctx.fillStyle = "#c8ff3d";
    ctx.fillRect(9 * cell, 9 * cell, 3 * cell, 3 * cell);
  },
};
