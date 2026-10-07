import { FAN_STEPS, FAN_TOTAL } from "../domain/machine.js";

/** @param {string} name */
export function updateProgress(name) {
  const bar = document.getElementById("progressBar");
  const fill = document.getElementById("progressFill");
  const label = document.getElementById("progressLabel");
  if (!bar || !fill || !label) return;
  const step = FAN_STEPS[/** @type {keyof typeof FAN_STEPS} */ (name)];
  if (!step) {
    bar.hidden = true;
    return;
  }
  bar.hidden = false;
  fill.style.width = (step / FAN_TOTAL) * 100 + "%";
  label.textContent = "Paso " + step + " de " + FAN_TOTAL;
}
