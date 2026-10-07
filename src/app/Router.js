import { CONTEXT_OF } from "../domain/machine.js";

/** Hash router: #/hub, #/hincha/pase, #/operador/scanner */
export class Router {
  /**
   * @param {(parsed: { context: string, screen: string }) => void} onChange
   */
  start(onChange) {
    this._onChange = onChange;
    window.addEventListener("hashchange", () => {
      if (this._suppress) return;
      onChange(this.parse(location.hash));
    });
  }

  /**
   * @param {string} hashOrPath
   */
  parse(hashOrPath) {
    const raw = (hashOrPath || "").replace(/^#\/?/, "").replace(/^\//, "");
    const parts = raw.split("/").filter(Boolean);
    if (parts.length === 0) return { context: "hub", screen: "hub" };
    if (parts[0] === "hub") return { context: "hub", screen: "hub" };
    if (parts[0] === "hincha") {
      const screen = parts[1] || "hincha-home";
      if (CONTEXT_OF[screen] !== "hincha") return { context: "hincha", screen: "hincha-home" };
      return { context: "hincha", screen };
    }
    if (parts[0] === "operador") {
      const screen = parts[1] || "operador-home";
      if (CONTEXT_OF[screen] !== "operador") return { context: "operador", screen: "operador-home" };
      return { context: "operador", screen };
    }
    // bare screen id
    const screen = parts[0];
    const ctx = CONTEXT_OF[screen];
    if (!ctx) return { context: "hub", screen: "hub" };
    return { context: ctx, screen };
  }

  /**
   * @param {string} ctx
   * @param {string} screen
   */
  replace(ctx, screen) {
    let hash = "#/hub";
    if (ctx === "hincha") hash = `#/hincha/${screen === "hincha-home" ? "hincha-home" : screen}`;
    else if (ctx === "operador") hash = `#/operador/${screen === "operador-home" ? "operador-home" : screen}`;
    if (location.hash === hash) return;
    this._suppress = true;
    location.hash = hash;
    queueMicrotask(() => {
      this._suppress = false;
    });
  }
}
