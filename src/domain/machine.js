/** @typedef {import('./types.js').AppState} AppState */
/** @typedef {import('./types.js').ScreenId} ScreenId */
/** @typedef {import('./types.js').AppContext} AppContext */

/** @type {Record<string, AppContext>} */
export const CONTEXT_OF = {
  hub: "hub",
  "hincha-home": "hincha",
  entrada: "hincha",
  registro: "hincha",
  consentimientos: "hincha",
  verificacion: "hincha",
  asistida: "hincha",
  proveedor: "hincha",
  resultado: "hincha",
  fanpass: "hincha",
  boleta: "hincha",
  pase: "hincha",
  "operador-home": "operador",
  scanner: "operador",
  decision: "operador",
  auditoria: "operador",
};

export const FAN_STEPS = {
  entrada: 1,
  registro: 2,
  consentimientos: 3,
  verificacion: 4,
  asistida: 4,
  proveedor: 4,
  resultado: 5,
  fanpass: 6,
  boleta: 7,
  pase: 8,
};
export const FAN_TOTAL = 8;

/** Soft legal edges (guards applied in canTransition). */
export const TRANSITIONS = {
  hub: ["hincha-home", "operador-home"],
  "hincha-home": ["entrada", "hub", "pase", "fanpass", "boleta"],
  entrada: ["registro", "hincha-home"],
  registro: ["consentimientos", "entrada"],
  consentimientos: ["verificacion", "registro"],
  verificacion: ["asistida", "proveedor", "consentimientos"],
  asistida: ["resultado", "verificacion"],
  proveedor: ["resultado", "verificacion"],
  resultado: ["fanpass"],
  fanpass: ["boleta", "pase", "hincha-home"],
  boleta: ["pase", "fanpass"],
  pase: ["hub", "fanpass", "boleta", "hincha-home"],
  "operador-home": ["scanner", "hub"],
  scanner: ["decision", "operador-home"],
  decision: ["auditoria", "scanner", "operador-home"],
  auditoria: ["operador-home", "scanner", "decision", "hub"],
};

/**
 * @param {AppState} state
 * @param {ScreenId} to
 * @param {{ force?: boolean }} [opts]
 * @returns {{ ok: true } | { ok: false, reason: string, redirect?: ScreenId }}
 */
export function canTransition(state, to, opts = {}) {
  if (to === "home") to = /** @type {ScreenId} */ ("hub");
  if (!CONTEXT_OF[to]) return { ok: false, reason: "Pantalla desconocida." };

  if (opts.force) return { ok: true };

  const from = state.screen;
  const allowed = TRANSITIONS[from] || [];
  // Allow same-context soft jumps via tab (handled by resolveTabTarget) and hub switch
  if (to === "hub") return { ok: true };
  if (from === to) return { ok: true };

  // Within same app, allow back/forward along known edges OR same-context screens for data-go
  const fromCtx = CONTEXT_OF[from];
  const toCtx = CONTEXT_OF[to];
  if (fromCtx && toCtx && fromCtx !== toCtx && to !== "hub" && from !== "hub") {
    return { ok: false, reason: "Cambia de app desde el hub. No hay flujo continuo hincha↔operador." };
  }

  if (to === "pase") {
    if (!state.fanPass) {
      return { ok: false, reason: "Activa el Fan Pass primero.", redirect: "fanpass" };
    }
    if (!state.ticket) {
      return { ok: false, reason: "Vincula una boleta nominativa antes de abrir el pase.", redirect: "boleta" };
    }
  }

  if (to === "boleta" && !state.fanPass) {
    return { ok: false, reason: "Activa el Fan Pass antes de vincular boleta.", redirect: "fanpass" };
  }

  // Hub may only enter app homes
  if (from === "hub" && to !== "hincha-home" && to !== "operador-home") {
    return { ok: false, reason: "Entra por el home de la app." };
  }

  // data-go within app: allow if same context
  if (fromCtx === toCtx) return { ok: true };
  if (allowed.includes(to)) return { ok: true };

  return { ok: false, reason: "Transición no permitida." };
}

/**
 * Tab soft-nav: never invent ticket#0.
 * @param {AppState} state
 * @param {string} navKey
 */
export function resolveTabTarget(state, navKey) {
  if (navKey === "pase") {
    if (!state.fanPass) {
      // Prefer fanpass if verification done; else home with hint — never invent ticket#0
      const target = state.verifyPath ? "fanpass" : "hincha-home";
      return {
        screen: /** @type {ScreenId} */ (target),
        hint: state.verifyPath
          ? "Activa el Fan Pass antes de abrir el pase."
          : "Completa registro y verificación antes de abrir el pase.",
      };
    }
    if (!state.ticket) {
      return { screen: /** @type {ScreenId} */ ("boleta"), hint: "Selecciona y vincula una boleta nominativa." };
    }
    return { screen: /** @type {ScreenId} */ ("pase"), hint: null };
  }
  if (navKey === "hincha-home") return { screen: /** @type {ScreenId} */ ("hincha-home"), hint: null };
  if (navKey === "operador-home") return { screen: /** @type {ScreenId} */ ("operador-home"), hint: null };
  if (navKey === "scanner") return { screen: /** @type {ScreenId} */ ("scanner"), hint: null };
  return { screen: /** @type {ScreenId} */ (navKey), hint: null };
}

/** @param {ScreenId} screen */
export function navKeyFor(screen) {
  if (screen === "pase" || screen === "fanpass" || screen === "boleta") return "pase";
  if (screen === "scanner" || screen === "decision" || screen === "auditoria") return "scanner";
  if (screen === "operador-home") return "operador-home";
  if (CONTEXT_OF[screen] === "hincha") return "hincha-home";
  return null;
}
