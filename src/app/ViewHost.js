import { CONTEXT_OF } from "../domain/machine.js";
import { syncTabBar } from "../ui/tabBar.js";
import { updateProgress } from "../ui/progress.js";

export class ViewHost {
  /**
   * @param {{ onRender?: (screen: string, state: any) => void }} [opts]
   */
  constructor(opts = {}) {
    this._onRender = opts.onRender || null;
    /** @type {Record<string, { render?: Function, onEnter?: Function, onLeave?: Function }> } */
    this._views = {};
  }

  /** @param {string} screen @param {object} view */
  register(screen, view) {
    this._views[screen] = view;
  }

  /**
   * @param {string} screen
   * @param {import('../domain/types.js').AppState} state
   * @param {string} [prev]
   */
  activate(screen, state, prev) {
    if (prev && this._views[prev]?.onLeave) this._views[prev].onLeave(state);
    document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
    const next = document.getElementById("screen-" + screen);
    if (!next) {
      console.warn("Pantalla no encontrada:", screen);
      return;
    }
    next.classList.add("active");
    const frame = document.getElementById("app");
    const ctx = CONTEXT_OF[screen] || "hub";
    if (frame) frame.setAttribute("data-app", ctx);
    syncTabBar(screen);
    updateProgress(screen);
    const view = this._views[screen];
    if (view?.render) view.render(state);
    if (view?.onEnter) view.onEnter(state);
    if (this._onRender) this._onRender(screen, state);
    window.scrollTo(0, 0);
    if (frame) frame.scrollTop = 0;
    const body = next.querySelector(".screen-body");
    if (body) body.scrollTop = 0;
    const header = next.querySelector(".screen-header h2, .brand-name");
    if (header && typeof header.focus === "function") {
      try {
        /** @type {HTMLElement} */ (header).setAttribute("tabindex", "-1");
        /** @type {HTMLElement} */ (header).focus({ preventScroll: true });
      } catch { /* ignore */ }
    }
  }

  /** @param {string} screen @param {import('../domain/types.js').AppState} state */
  refresh(screen, state) {
    const view = this._views[screen];
    if (view?.render) view.render(state);
  }
}
