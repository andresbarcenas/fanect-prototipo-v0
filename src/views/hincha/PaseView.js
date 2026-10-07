import { QrCodec } from "../../domain/qr-codec.js";

export function createPaseView() {
  return {
    render(state) {
      const session = state.qrSession;
      const ticket = state.ticket;
      const sector = document.getElementById("paseSector");
      const estado = document.getElementById("paseEstado");
      const ttl = document.getElementById("qrTtl");
      const payloadEl = document.getElementById("qrPayload");
      const canvas = /** @type {HTMLCanvasElement | null} */ (document.getElementById("qrCanvas"));
      const card = document.querySelector("#screen-pase .qr-card");
      if (!session || !ticket) {
        card?.classList.add("is-empty");
        if (sector) sector.textContent = "Sin boleta vinculada";
        if (estado) {
          estado.textContent = "VACÍO";
          estado.className = "badge badge-sim";
        }
        if (ttl) ttl.textContent = "—";
        if (payloadEl) payloadEl.textContent = "Emite el Fan Pass y vincula una boleta para ver el QR.";
        if (canvas) {
          const ctx = canvas.getContext("2d");
          ctx?.clearRect(0, 0, canvas.width, canvas.height);
        }
        return;
      }
      card?.classList.remove("is-empty");
      if (sector) {
        sector.textContent =
          ticket.sector + " · Fila " + ticket.fila + " · Asiento " + ticket.asiento;
      }
      const left = Math.max(0, Math.ceil((session.expiresAt - Date.now()) / 1000));
      if (ttl) ttl.textContent = left + " s";
      if (estado) {
        if (left <= 0) {
          estado.textContent = "EXPIRADO";
          estado.className = "badge badge-sim";
        } else {
          estado.textContent = "VÁLIDO";
          estado.className = "badge badge-ok";
        }
      }
      const wire = QrCodec.encode(session.payload || session);
      if (payloadEl) payloadEl.textContent = wire;
      QrCodec.drawSeed(canvas, QrCodec.visualSeed(session));
    },
  };
}
