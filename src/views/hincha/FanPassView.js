export function createFanPassView() {
  return {
    render(state) {
      const nombre = document.getElementById("passNombre");
      const pid = document.getElementById("passId");
      if (nombre) nombre.textContent = state.fanPass?.nombre || state.registration.nombre;
      if (pid) pid.textContent = state.fanPass?.passId || "—";
    },
  };
}
