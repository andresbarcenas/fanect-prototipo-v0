import { EVENT_NAME } from "../../domain/event.js";
import { escapeHtml } from "../../domain/util.js";

export function createResultadoView() {
  return {
    render(state) {
      const pathLabel =
        state.verifyPath === "asistida"
          ? "Ruta asistida no biométrica"
          : "Proveedor de identidad (mock)";
      const titulo = document.getElementById("resultadoTitulo");
      const desc = document.getElementById("resultadoDesc");
      const meta = document.getElementById("resultadoMeta");
      if (titulo) titulo.textContent = "Identidad verificada";
      if (desc) {
        desc.textContent =
          state.verifyPath === "asistida"
            ? "Confirmada por agente del piloto (sin biometría 1:N)."
            : "Confirmada vía flujo de proveedor simulado.";
      }
      if (meta) {
        meta.innerHTML =
          "<dl>" +
          "<dt>Nombre</dt><dd>" +
          escapeHtml(state.registration.nombre) +
          "</dd>" +
          "<dt>Documento</dt><dd>" +
          escapeHtml(state.registration.doc) +
          "</dd>" +
          "<dt>Método</dt><dd>" +
          escapeHtml(pathLabel) +
          "</dd>" +
          "<dt>Evento</dt><dd>" +
          escapeHtml(EVENT_NAME) +
          "</dd></dl>";
      }
    },
  };
}
