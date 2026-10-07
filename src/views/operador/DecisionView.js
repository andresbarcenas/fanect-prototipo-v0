import { escapeHtml } from "../../domain/util.js";

export function createDecisionView() {
  return {
    render(state) {
      const d = state.lastDecision;
      const banner = document.getElementById("decisionBanner");
      const meta = document.getElementById("decisionMeta");
      if (!banner || !meta) return;
      if (!d) {
        banner.className = "decision-banner is-empty";
        banner.textContent = "SIN DECISIÓN";
        meta.innerHTML =
          "<div class='empty-state'><strong>Nada que decidir</strong><p>Escanea un QR primero.</p></div>";
        return;
      }
      banner.className = "decision-banner " + (d.allow ? "allow" : "deny");
      banner.textContent = d.title;
      meta.innerHTML =
        "<dl>" +
        "<dt>Resultado</dt><dd>" +
        (d.allow ? "ALLOW" : "DENY") +
        "</dd>" +
        "<dt>Motivo</dt><dd>" +
        escapeHtml(d.reason) +
        "</dd>" +
        "<dt>Estado QR</dt><dd>" +
        escapeHtml(d.kind + (d.fixtureApplied ? " (fixture)" : " (live)")) +
        "</dd>" +
        "<dt>Hora</dt><dd>" +
        escapeHtml(d.at) +
        "</dd>" +
        "<dt>Correlación</dt><dd class='mono'>" +
        escapeHtml(d.correlationId) +
        "</dd></dl>";
    },
  };
}
