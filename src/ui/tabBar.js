import { CONTEXT_OF, navKeyFor } from "../domain/machine.js";

/** @param {string} screen */
export function syncTabBar(screen) {
  const app = CONTEXT_OF[screen] || "hub";
  const barH = document.getElementById("tabBarHincha");
  const barO = document.getElementById("tabBarOperador");
  if (barH) barH.hidden = app !== "hincha";
  if (barO) barO.hidden = app !== "operador";
  const key = navKeyFor(/** @type {any} */ (screen));
  const activeBar = app === "hincha" ? barH : app === "operador" ? barO : null;
  if (!activeBar) return;
  activeBar.querySelectorAll(".tab-item").forEach((btn) => {
    const on = key && btn.getAttribute("data-nav") === key;
    btn.classList.toggle("is-active", !!on);
    if (on) btn.setAttribute("aria-current", "page");
    else btn.removeAttribute("aria-current");
  });
}
