/**
 * FANECT theme + status clock.
 * Shared by the hub and both apps. The choice persists in localStorage
 * (`fanect_theme`) so a route picked on the hub is already applied
 * when Hincha or Operador opens.
 */
(function () {
  "use strict";

  var THEMES = ["umbral", "vinculo", "pulso"];
  var THEME_KEY = "fanect_theme";
  var THEME_COLOR = {
    umbral: "#121a24",
    vinculo: "#0e1628",
    pulso: "#120c16",
  };

  function apply(name, persist) {
    var theme = THEMES.indexOf(name) >= 0 ? name : "umbral";
    document.documentElement.setAttribute("data-theme", theme);
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", THEME_COLOR[theme]);
    var buttons = document.querySelectorAll("[data-theme-choice]");
    Array.prototype.forEach.call(buttons, function (btn) {
      var on = btn.getAttribute("data-theme-choice") === theme;
      btn.classList.toggle("is-active", on);
      btn.setAttribute("aria-checked", on ? "true" : "false");
    });
    if (persist) {
      try { localStorage.setItem(THEME_KEY, theme); } catch (e) {}
    }
  }

  function tickClock() {
    var el = document.getElementById("statusTime");
    if (!el) return;
    var d = new Date();
    el.textContent =
      String(d.getHours()).padStart(2, "0") +
      ":" +
      String(d.getMinutes()).padStart(2, "0");
  }

  document.body.addEventListener("click", function (e) {
    var themeEl = e.target.closest("[data-theme-choice]");
    if (!themeEl) return;
    e.preventDefault();
    apply(themeEl.getAttribute("data-theme-choice"), true);
  });

  apply(document.documentElement.getAttribute("data-theme"), false);
  tickClock();
  setInterval(tickClock, 30000);

  window.FanectTheme = { apply: apply };
})();
