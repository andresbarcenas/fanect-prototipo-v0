import { EVENT_NAME } from "../../domain/event.js";
import { escapeHtml } from "../../domain/util.js";

export function createAuditoriaView() {
  return {
    render(state) {
      const d = state.lastDecision;
      const card = document.getElementById("auditCard");
      if (!card) return;
      if (!d) {
        card.innerHTML =
          "<div class='empty-state'><strong>Sin eventos</strong><p>No hay evento de validación aún.</p></div>";
        return;
      }
      const t = state.ticket;
      const sector = t
        ? t.sector + " · " + t.fila + "-" + t.asiento
        : "—";
      card.innerHTML =
        "<dl>" +
        "<dt>ID correlación</dt><dd>" +
        escapeHtml(d.correlationId) +
        "</dd>" +
        "<dt>Hincha</dt><dd>" +
        escapeHtml(d.nombre) +
        "</dd>" +
        "<dt>Fan Pass</dt><dd>FP-" +
        escapeHtml(d.passId) +
        "</dd>" +
        "<dt>Boleta</dt><dd>" +
        escapeHtml(d.ticketId) +
        "</dd>" +
        "<dt>Sector</dt><dd>" +
        escapeHtml(sector) +
        "</dd>" +
        "<dt>Nonce QR</dt><dd class='mono'>" +
        escapeHtml(d.qrNonce) +
        "</dd>" +
        "<dt>Decisión</dt><dd>" +
        (d.allow ? "ALLOW" : "DENY") +
        "</dd>" +
        "<dt>Motivo</dt><dd>" +
        escapeHtml(d.reason) +
        "</dd>" +
        "<dt>Timestamp</dt><dd>" +
        escapeHtml(d.at) +
        "</dd>" +
        "<dt>Evento</dt><dd>" +
        escapeHtml(EVENT_NAME) +
        "</dd>" +
        "<dt>Canal</dt><dd>Escáner puerta · SIMULADO</dd></dl>";
    },
  };
}
