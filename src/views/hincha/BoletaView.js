import { TICKETS } from "../../domain/tickets.js";
import { escapeHtml } from "../../domain/util.js";

/** @param {(ticketId: string) => void} onSelect */
export function createBoletaView(onSelect) {
  return {
    /** @param {import('../../domain/types.js').AppState} state */
    render(state) {
      const selectedId = state.ticket?.id || null;
      const list = document.getElementById("ticketList");
      if (!list) return;
      list.innerHTML = "";
      list.classList.remove("is-invalid");
      if (!TICKETS.length) {
        list.innerHTML =
          "<div class='empty-state'><strong>Sin boletas</strong><p>No hay boletas nominativas en este demo.</p></div>";
        const emptyBtn = /** @type {HTMLButtonElement | null} */ (document.getElementById("btnVincular"));
        if (emptyBtn) emptyBtn.disabled = true;
        return;
      }
      TICKETS.forEach((t) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "ticket-item" + (selectedId === t.id ? " selected" : "");
        btn.setAttribute("role", "option");
        btn.setAttribute("data-ticket-id", t.id);
        btn.setAttribute("aria-selected", selectedId === t.id ? "true" : "false");
        btn.innerHTML =
          "<strong>" +
          escapeHtml(t.sector) +
          " · Fila " +
          escapeHtml(t.fila) +
          " · Asiento " +
          escapeHtml(t.asiento) +
          "</strong><span>ID " +
          escapeHtml(t.id) +
          " · Titular: " +
          escapeHtml(t.titular) +
          "</span>";
        btn.addEventListener("click", () => {
          list.querySelectorAll(".ticket-item").forEach((el) => {
            const on = el === btn;
            el.classList.toggle("selected", on);
            el.setAttribute("aria-selected", on ? "true" : "false");
          });
          const vbtn = /** @type {HTMLButtonElement} */ (document.getElementById("btnVincular"));
          if (vbtn) vbtn.disabled = false;
          list.classList.remove("is-invalid");
          list.removeAttribute("aria-invalid");
          onSelect(t.id);
        });
        list.appendChild(btn);
      });
      const vbtn = /** @type {HTMLButtonElement} */ (document.getElementById("btnVincular"));
      if (vbtn) vbtn.disabled = !selectedId && !list.querySelector(".ticket-item.selected");
      if (selectedId && vbtn) vbtn.disabled = false;
    },
  };
}
