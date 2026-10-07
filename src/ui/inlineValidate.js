/**
 * @param {string} id element id for .inline-error
 * @param {string | null} message
 */
export function showError(id, message) {
  const el = document.getElementById(id);
  if (!el) return;
  if (!message) {
    el.textContent = "";
    el.classList.remove("is-visible");
    el.hidden = true;
    return;
  }
  el.textContent = message;
  el.classList.add("is-visible");
  el.hidden = false;
}

/**
 * @param {string} id
 * @param {string | null} message
 */
export function showHint(id, message) {
  const el = document.getElementById(id);
  if (!el) return;
  if (!message) {
    el.textContent = "";
    el.hidden = true;
    return;
  }
  el.textContent = message;
  el.hidden = false;
}

/**
 * Mark a control invalid (red ring + aria-invalid) or clear it.
 * @param {string} id
 * @param {boolean} invalid
 */
export function setInvalid(id, invalid) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.toggle("is-invalid", Boolean(invalid));
  if (invalid) el.setAttribute("aria-invalid", "true");
  else el.removeAttribute("aria-invalid");
}
