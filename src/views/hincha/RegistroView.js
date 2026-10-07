/** @param {(i:any)=>void} dispatch */
export function createRegistroView(dispatch) {
  return {
    render(state) {
      const r = state.registration;
      const set = (id, v) => {
        const el = document.getElementById(id);
        if (el && "value" in el) /** @type {HTMLInputElement} */ (el).value = v;
      };
      set("regNombre", r.nombre);
      set("regDoc", r.doc);
      set("regCel", r.cel);
      set("regEmail", r.email);
    },
  };
}

/** @param {string} id */
function fieldValue(id) {
  const el = document.getElementById(id);
  return el && "value" in el ? /** @type {HTMLInputElement} */ (el).value : "";
}

/** @param {(i:any)=>void} dispatch */
export function bindRegistro(dispatch) {
  const submit = () => {
    dispatch({
      type: "hincha/submitRegistro",
      form: {
        nombre: fieldValue("regNombre"),
        doc: fieldValue("regDoc"),
        cel: fieldValue("regCel"),
        email: fieldValue("regEmail"),
      },
    });
  };
  document.getElementById("formRegistro")?.addEventListener("submit", (e) => {
    e.preventDefault();
    submit();
  });
  ["regNombre", "regDoc", "regCel", "regEmail"].forEach((id) => {
    document.getElementById(id)?.addEventListener("input", () => {
      const el = document.getElementById(id);
      if (!el || !("value" in el) || !String(/** @type {HTMLInputElement} */ (el).value).trim()) return;
      el.classList.remove("is-invalid");
      el.removeAttribute("aria-invalid");
    });
  });
}
