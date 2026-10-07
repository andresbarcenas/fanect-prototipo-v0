import { Store } from "../persist/Store.js";
import { Router } from "./Router.js";
import { ViewHost } from "./ViewHost.js";
import { AppController } from "./AppController.js";
import { createRegistroView, bindRegistro } from "../views/hincha/RegistroView.js";
import { createConsentimientosView, bindConsentimientos } from "../views/hincha/ConsentimientosView.js";
import { createFanPassView } from "../views/hincha/FanPassView.js";
import { createBoletaView } from "../views/hincha/BoletaView.js";
import { createPaseView } from "../views/hincha/PaseView.js";
import { createResultadoView } from "../views/hincha/ResultadoView.js";
import { createDecisionView } from "../views/operador/DecisionView.js";
import { createAuditoriaView } from "../views/operador/AuditoriaView.js";
import { showHint } from "../ui/inlineValidate.js";

const store = new Store();
const router = new Router();
const viewHost = new ViewHost();
const controller = new AppController({ store, router, viewHost });

/** @type {string | null} */
let selectedTicketId = null;

const boletaView = createBoletaView((id) => {
  selectedTicketId = id;
});

viewHost.register("registro", createRegistroView((i) => controller.dispatch(i)));
viewHost.register("consentimientos", createConsentimientosView());
viewHost.register("resultado", createResultadoView());
viewHost.register("fanpass", createFanPassView());
viewHost.register("boleta", boletaView);
viewHost.register("pase", createPaseView());
viewHost.register("decision", createDecisionView());
viewHost.register("auditoria", createAuditoriaView());

function bindGlobal() {
  document.body.addEventListener("click", (e) => {
    const t = /** @type {HTMLElement} */ (e.target);
    const goEl = t.closest?.("[data-go]");
    if (goEl) {
      e.preventDefault();
      const screen = goEl.getAttribute("data-go");
      const navKey = goEl.getAttribute("data-nav");
      if (navKey) {
        controller.dispatch({ type: "nav/tab", navKey });
        return;
      }
      controller.dispatch({ type: "nav/go", screen });
      return;
    }
    const stBtn = t.closest?.("[data-qr-state]");
    if (stBtn) {
      document.querySelectorAll(".state-btn").forEach((b) => b.classList.remove("selected"));
      stBtn.classList.add("selected");
      const btn = /** @type {HTMLButtonElement} */ (document.getElementById("btnScan"));
      if (btn) btn.disabled = false;
      controller.dispatch({
        type: "operador/selectFixture",
        fixture: stBtn.getAttribute("data-qr-state"),
      });
    }
  });

  bindRegistro((i) => controller.dispatch(i));
  bindConsentimientos((i) => controller.dispatch(i));

  document.getElementById("choiceAsistida")?.addEventListener("click", () => {
    controller.dispatch({ type: "hincha/chooseAsistida" });
  });
  document.getElementById("choiceProvider")?.addEventListener("click", () => {
    controller.dispatch({ type: "hincha/chooseProveedor" });
  });
  document.getElementById("btnAsistida")?.addEventListener("click", () => {
    const est = /** @type {HTMLSelectElement} */ (document.getElementById("asistidaEstado")).value;
    controller.dispatch({ type: "hincha/submitAsistida", agentStatus: est });
  });
  document.getElementById("btnVincular")?.addEventListener("click", () => {
    const sel = document.querySelector("#ticketList .ticket-item.selected");
    const id =
      selectedTicketId ||
      sel?.getAttribute("data-ticket-id") ||
      store.get().ticket?.id ||
      null;
    if (id) controller.dispatch({ type: "hincha/bindTicket", ticketId: id });
  });
  document.getElementById("btnRotar")?.addEventListener("click", () => {
    controller.dispatch({ type: "hincha/rotateQr" });
  });
  document.getElementById("btnScan")?.addEventListener("click", () => {
    controller.dispatch({ type: "operador/scan" });
  });
  document.getElementById("btnAuditoria")?.addEventListener("click", () => {
    controller.dispatch({ type: "operador/openAuditoria" });
  });
}

function tickClock() {
  const el = document.getElementById("statusTime");
  if (!el) return;
  el.textContent = new Intl.DateTimeFormat("es-CO", {
    timeZone: "America/Bogota",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date());
}

bindGlobal();
tickClock();
setInterval(tickClock, 30_000);
controller.start();

window.FanectDemo = {
  go(name) {
    controller.dispatch({ type: "nav/go", screen: name, force: true });
  },
  rotateQr() {
    controller.dispatch({ type: "hincha/rotateQr" });
  },
  reset() {
    controller.dispatch({ type: "demo/reset" });
  },
  get state() {
    return store.getProjection();
  },
};

showHint("globalHint", null);
export { controller, store };
