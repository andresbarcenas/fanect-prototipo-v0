function syncConsentBtn() {
  const id = /** @type {HTMLInputElement} */ (document.getElementById("consentId"));
  const acceso = /** @type {HTMLInputElement} */ (document.getElementById("consentAcceso"));
  const btn = /** @type {HTMLButtonElement} */ (document.getElementById("btnConsent"));
  const hint = document.getElementById("consentHint");
  const ok = id?.checked && acceso?.checked;
  if (btn) btn.disabled = !ok;
  if (hint) {
    hint.textContent = ok
      ? "Identidad y Acceso aceptados. Comunicaciones es opcional."
      : "Debes aceptar Identidad y Acceso para continuar.";
    hint.classList.toggle("is-ok", !!ok);
    if (ok) hint.classList.remove("is-error");
  }
  if (ok) {
    id?.closest(".consent-item")?.classList.remove("is-invalid");
    acceso?.closest(".consent-item")?.classList.remove("is-invalid");
    const err = document.getElementById("consentError");
    if (err) {
      err.textContent = "";
      err.classList.remove("is-visible");
      err.hidden = true;
    }
  }
}

export function createConsentimientosView() {
  return { onEnter() { syncConsentBtn(); } };
}

/** @param {(i:any)=>void} dispatch */
export function bindConsentimientos(dispatch) {
  ["consentId", "consentAcceso", "consentComms"].forEach((id) => {
    document.getElementById(id)?.addEventListener("change", syncConsentBtn);
  });
  document.getElementById("btnConsent")?.addEventListener("click", () => {
    dispatch({
      type: "hincha/submitConsents",
      consents: {
        identidad: /** @type {HTMLInputElement} */ (document.getElementById("consentId")).checked,
        acceso: /** @type {HTMLInputElement} */ (document.getElementById("consentAcceso")).checked,
        comunicaciones: /** @type {HTMLInputElement} */ (document.getElementById("consentComms")).checked,
      },
    });
  });
}
