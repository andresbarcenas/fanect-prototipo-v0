/**
 * FANECT / Tribuna Segura — prototipo P0 (sin backend)
 * Dos apps demos: Hincha y Operador, con hub de entrada.
 * Estado en memoria + localStorage. Todo simulado.
 */
(function () {
  "use strict";

  const FAN_STEPS = {
    entrada: 1,
    registro: 2,
    consentimientos: 3,
    verificacion: 4,
    asistida: 4,
    proveedor: 4,
    resultado: 5,
    fanpass: 6,
    boleta: 7,
    pase: 8,
  };
  const FAN_TOTAL = 8;
  const QR_TTL_SECONDS = 45;

  const HINCHA_SCREENS = {
    "hincha-home": true,
    entrada: true,
    registro: true,
    consentimientos: true,
    verificacion: true,
    asistida: true,
    proveedor: true,
    resultado: true,
    fanpass: true,
    boleta: true,
    pase: true,
    perfil: true,
    historial: true,
    categoria: true,
    beneficios: true,
    privacidad: true,
  };
  const OPERADOR_SCREENS = {
    "operador-home": true,
    scanner: true,
    decision: true,
    auditoria: true,
  };

  const CATEGORY_NAME = "Hincha verificado · Piloto";
  const CATEGORY_NEXT = "Frecuente";
  const CATEGORY_GOAL = 5;
  const HISTORY = [
    {
      rival: "Club Alpha vs Rival Norte",
      stadium: "Estadio Demo",
      city: "Bogotá",
      date: "12 sep 2026",
      sector: "Tribuna Norte",
      season: true,
    },
    {
      rival: "Club Alpha vs Rival Sur",
      stadium: "Estadio Demo",
      city: "Bogotá",
      date: "20 ago 2026",
      sector: "Occidental",
      season: true,
    },
    {
      rival: "Amistoso Demo",
      stadium: "Estadio Demo",
      city: "Bogotá",
      date: "2 ago 2026",
      sector: "General",
      season: true,
    },
    {
      rival: "Club Alpha vs Rival Costa",
      stadium: "Estadio Demo",
      city: "Bogotá",
      date: "15 nov 2025",
      sector: "Tribuna Sur",
      season: false,
    },
  ];
  const TIER_UNLOCKED = [
    { title: "Fan Pass del evento", desc: "Identidad confirmada para este piloto" },
    { title: "QR de ingreso", desc: "Boleta nominativa y pase dinámico" },
    { title: "Fila preferencial", desc: "Mock de categoría · beneficio de demostración" },
  ];
  const TIER_LOCKED = [
    { title: "Hincha frecuente", desc: "Se abre al llegar a 5 asistencias de temporada" },
    { title: "Experiencias de temporada", desc: "Servicio futuro del piloto" },
  ];

  const TICKETS = [
    { id: "T-NORTE-12-08", sector: "Tribuna Norte", fila: "12", asiento: "08", titular: "Andrés Demo" },
    { id: "T-SUR-05-21", sector: "Tribuna Sur", fila: "05", asiento: "21", titular: "Andrés Demo" },
    { id: "T-ORIENTE-A-14", sector: "Preferencial Oriente", fila: "A", asiento: "14", titular: "Andrés Demo" },
  ];

  const DECISION_COPY = {
    valido: {
      allow: true,
      title: "PERMITIR INGRESO",
      reason: "QR válido · boleta nominativa vinculada · TTL vigente",
    },
    usado: {
      allow: false,
      title: "DENEGAR INGRESO",
      reason: "Boleta ya utilizada (estado: usado)",
    },
    expirado: {
      allow: false,
      title: "DENEGAR INGRESO",
      reason: "QR expirado (TTL agotado)",
    },
    replay: {
      allow: false,
      title: "DENEGAR INGRESO",
      reason: "Replay detectado · token QR ya presentado",
    },
  };

  const THEMES = ["umbral", "vinculo", "pulso"];
  const THEME_KEY = "fanect_theme";
  const THEME_COLOR = {
    umbral: "#121a24",
    vinculo: "#0e1628",
    pulso: "#120c16",
  };

  const state = {
    app: "hub",
    screen: "hub",
    nombre: "Andrés Demo",
    doc: "1.234.567.890",
    cel: "300 123 4567",
    email: "demo@fanect.co",
    consents: { identidad: false, acceso: false, comms: false },
    prefs: { noAds: true, accesoRapido: false },
    consentsKnown: false,
    verifyPath: null,
    passId: null,
    ticket: null,
    qrNonce: null,
    qrExpiresAt: null,
    qrRotation: 0,
    selectedQrState: null,
    lastDecision: null,
    auditLog: [],
  };

  let ttlTimer = null;
  let providerTimer = null;

  function $(sel, root) {
    return (root || document).querySelector(sel);
  }
  function $all(sel, root) {
    return Array.from((root || document).querySelectorAll(sel));
  }
  function uid(len) {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let s = "";
    for (let i = 0; i < (len || 6); i++) s += chars[(Math.random() * chars.length) | 0];
    return s;
  }
  function nowLabel() {
    return new Date().toLocaleString("es-CO", {
      timeZone: "America/New_York",
      dateStyle: "short",
      timeStyle: "medium",
    }) + " ET";
  }
  function save() {
    try {
      localStorage.setItem("fanect_p0", JSON.stringify({
        nombre: state.nombre,
        doc: state.doc,
        cel: state.cel,
        email: state.email,
        passId: state.passId,
        ticket: state.ticket,
        verifyPath: state.verifyPath,
        consents: state.consents,
        prefs: state.prefs,
        consentsKnown: state.consentsKnown,
        auditLog: state.auditLog.slice(-20),
      }));
    } catch (_) {}
  }
  function load() {
    try {
      const raw = localStorage.getItem("fanect_p0");
      if (!raw) return;
      const d = JSON.parse(raw);
      if (d.nombre) state.nombre = d.nombre;
      if (d.doc) state.doc = d.doc;
      if (d.cel) state.cel = d.cel;
      if (d.email) state.email = d.email;
      if (d.passId) state.passId = d.passId;
      if (d.ticket) state.ticket = d.ticket;
      if (d.verifyPath) state.verifyPath = d.verifyPath;
      if (d.consents && typeof d.consents === "object") {
        state.consents = Object.assign(state.consents, d.consents);
        state.consentsKnown = true;
      } else if (d.passId) {
        state.consents.identidad = true;
        state.consents.acceso = true;
      }
      if (d.consentsKnown) state.consentsKnown = true;
      if (d.prefs && typeof d.prefs === "object") {
        state.prefs = Object.assign(state.prefs, d.prefs);
      }
      if (Array.isArray(d.auditLog)) state.auditLog = d.auditLog;
    } catch (_) {}
  }

  function appFor(screen) {
    if (screen === "hub" || screen === "home") return "hub";
    if (HINCHA_SCREENS[screen]) return "hincha";
    if (OPERADOR_SCREENS[screen]) return "operador";
    return state.app || "hub";
  }

  function navKeyFor(screen) {
    if (screen === "pase" || screen === "fanpass" || screen === "boleta") return "pase";
    if (screen === "beneficios") return "beneficios";
    if (screen === "perfil" || screen === "historial" || screen === "categoria" || screen === "privacidad") {
      return "perfil";
    }
    if (screen === "scanner" || screen === "decision" || screen === "auditoria") return "scanner";
    if (screen === "operador-home") return "operador-home";
    if (screen === "hincha-home" || HINCHA_SCREENS[screen]) return "hincha-home";
    return null;
  }

  function syncTabBar(screen) {
    const app = appFor(screen);
    const barH = $("#tabBarHincha");
    const barO = $("#tabBarOperador");
    if (barH) barH.hidden = app !== "hincha";
    if (barO) barO.hidden = app !== "operador";
    const key = navKeyFor(screen);
    const activeBar = app === "hincha" ? barH : app === "operador" ? barO : null;
    if (!activeBar) return;
    $all(".tab-item", activeBar).forEach((btn) => {
      const on = key && btn.getAttribute("data-nav") === key;
      btn.classList.toggle("is-active", on);
      if (on) btn.setAttribute("aria-current", "page");
      else btn.removeAttribute("aria-current");
    });
  }

  function go(name) {
    if (name === "home") name = "hub";
    const next = document.getElementById("screen-" + name);
    if (!next) {
      console.warn("Pantalla no encontrada:", name);
      return;
    }
    $all(".screen").forEach((s) => s.classList.remove("active"));
    next.classList.add("active");
    state.app = appFor(name);
    state.screen = name;
    const frame = $("#app");
    if (frame) frame.setAttribute("data-app", state.app);
    syncTabBar(name);
    updateProgress(name);
    onEnter(name);
    window.scrollTo(0, 0);
    if (frame) frame.scrollTop = 0;
    const body = next.querySelector(".screen-body");
    if (body) body.scrollTop = 0;
  }

  function updateProgress(name) {
    const bar = $("#progressBar");
    const fill = $("#progressFill");
    const label = $("#progressLabel");
    const step = FAN_STEPS[name];
    if (!step) {
      bar.hidden = true;
      return;
    }
    bar.hidden = false;
    fill.style.width = (step / FAN_TOTAL) * 100 + "%";
    label.textContent = "Paso " + step + " de " + FAN_TOTAL;
  }

  function onEnter(name) {
    if (name === "hincha-home") renderHinchaHome();
    if (name === "registro") {
      $("#regNombre").value = state.nombre;
      $("#regDoc").value = state.doc;
      $("#regCel").value = state.cel;
      $("#regEmail").value = state.email;
    }
    if (name === "consentimientos") {
      writeConsentForm();
      syncConsentBtn();
    }
    if (name === "perfil") renderPerfil();
    if (name === "historial") renderHistorial();
    if (name === "categoria") renderCategoria();
    if (name === "beneficios") renderBeneficios();
    if (name === "privacidad") renderPrivacidad();
    if (name === "resultado") renderResultado();
    if (name === "fanpass") renderFanPass();
    if (name === "boleta") renderTickets();
    if (name === "pase") {
      ensureQr();
      renderPase();
      startTtl();
    } else {
      stopTtl();
    }
    if (name === "scanner") {
      state.selectedQrState = null;
      $all(".state-btn").forEach((b) => b.classList.remove("selected"));
      $("#btnScan").disabled = true;
    }
    if (name === "decision") renderDecision();
    if (name === "auditoria") renderAuditoria();
    if (name === "proveedor") runProviderMock();
  }

  function syncConsentBtn() {
    const ok = $("#consentId").checked && $("#consentAcceso").checked;
    $("#btnConsent").disabled = !ok;
    $("#consentHint").textContent = ok
      ? "Identidad y Acceso aceptados. Comunicaciones es opcional."
      : "Debes aceptar Identidad y Acceso para continuar.";
  }

  function readConsentForm() {
    state.consents.identidad = $("#consentId").checked;
    state.consents.acceso = $("#consentAcceso").checked;
    state.consents.comms = $("#consentComms").checked;
    state.consentsKnown = true;
    save();
  }

  function writeConsentForm() {
    $("#consentId").checked = !!state.consents.identidad;
    $("#consentAcceso").checked = !!state.consents.acceso;
    $("#consentComms").checked = !!state.consents.comms;
  }

  function onConsentChange() {
    readConsentForm();
    syncConsentBtn();
  }

  function submitRegistro() {
    const nombre = $("#regNombre").value.trim();
    const doc = $("#regDoc").value.trim();
    const cel = $("#regCel").value.trim();
    const email = $("#regEmail").value.trim();
    if (!nombre || !doc || !cel || !email) {
      alert("Completa todos los campos del registro.");
      return;
    }
    state.nombre = nombre;
    state.doc = doc;
    state.cel = cel;
    state.email = email;
    save();
    go("consentimientos");
  }

  function startAsistida() {
    state.verifyPath = "asistida";
    save();
    go("asistida");
  }

  function startProveedor() {
    state.verifyPath = "proveedor";
    save();
    go("proveedor");
  }

  function submitAsistida() {
    const est = $("#asistidaEstado").value;
    if (est === "rechazado") {
      alert("Verificación rechazada por el agente (demo). Elige «Aprobado» para continuar el happy path.");
      return;
    }
    if (est === "pendiente") {
      alert("Aún pendiente de revisión. En el demo, marca «Aprobado por agente».");
      return;
    }
    go("resultado");
  }

  function runProviderMock() {
    clearTimeout(providerTimer);
    $("#provText").textContent = "Conectando con proveedor de identidad…";
    providerTimer = setTimeout(() => {
      $("#provText").textContent = "Validando documento (mock)…";
      providerTimer = setTimeout(() => {
        $("#provText").textContent = "Verificación completada (simulado).";
        providerTimer = setTimeout(() => go("resultado"), 600);
      }, 900);
    }, 800);
  }

  function renderResultado() {
    const pathLabel =
      state.verifyPath === "asistida"
        ? "Ruta asistida no biométrica"
        : "Proveedor de identidad (mock)";
    $("#resultadoTitulo").textContent = "Identidad verificada";
    $("#resultadoDesc").textContent =
      state.verifyPath === "asistida"
        ? "Confirmada por agente del piloto (sin biometría 1:N)."
        : "Confirmada vía flujo de proveedor simulado.";
    $("#resultadoMeta").innerHTML =
      "<dl>" +
      "<dt>Nombre</dt><dd>" +
      escapeHtml(state.nombre) +
      "</dd>" +
      "<dt>Documento</dt><dd>" +
      escapeHtml(state.doc) +
      "</dd>" +
      "<dt>Método</dt><dd>" +
      escapeHtml(pathLabel) +
      "</dd>" +
      "<dt>Evento</dt><dd>Evento demo — Club Alpha</dd>" +
      "<dt>Categoría</dt><dd>" +
      escapeHtml(CATEGORY_NAME) +
      "</dd>" +
      "</dl>";
    const tier = $("#resultadoTier");
    if (tier) tier.textContent = CATEGORY_NAME;
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function renderFanPass() {
    if (!state.passId) {
      state.passId = uid(6);
      save();
    }
    $("#passNombre").textContent = state.nombre;
    $("#passId").textContent = state.passId;
    const tier = $("#fanpassTier");
    if (tier) tier.textContent = CATEGORY_NAME;
  }

  function renderTickets() {
    const list = $("#ticketList");
    list.innerHTML = "";
    TICKETS.forEach((t) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "ticket-item" + (state.ticket && state.ticket.id === t.id ? " selected" : "");
      btn.setAttribute("role", "option");
      btn.setAttribute("aria-selected", state.ticket && state.ticket.id === t.id ? "true" : "false");
      btn.innerHTML =
        "<strong>" +
        escapeHtml(t.sector) +
        " · Fila " +
        escapeHtml(t.fila) +
        " · Asiento " +
        escapeHtml(t.asiento) +
        "</strong>" +
        "<span>ID " +
        escapeHtml(t.id) +
        " · Titular: " +
        escapeHtml(t.titular) +
        "</span>";
      btn.addEventListener("click", () => {
        state.ticket = t;
        renderTickets();
        $("#btnVincular").disabled = false;
      });
      list.appendChild(btn);
    });
    $("#btnVincular").disabled = !state.ticket;
  }

  function vincularBoleta() {
    if (!state.ticket) return;
    save();
    rotateQr(true);
    go("pase");
  }

  function ensureQr() {
    if (!state.passId) state.passId = uid(6);
    if (!state.ticket) state.ticket = TICKETS[0];
    if (!state.qrNonce || !state.qrExpiresAt) rotateQr(true);
  }

  function rotateQr(silent) {
    state.qrNonce = uid(10);
    state.qrRotation += 1;
    state.qrExpiresAt = Date.now() + QR_TTL_SECONDS * 1000;
    save();
    if (!silent && state.screen === "pase") renderPase();
  }

  function qrPayload() {
    const t = state.ticket || {};
    return [
      "FANECT",
      "v0",
      "event=ALPHA-DEMO-2026",
      "pass=" + (state.passId || ""),
      "ticket=" + (t.id || ""),
      "nonce=" + (state.qrNonce || ""),
      "rot=" + state.qrRotation,
      "exp=" + Math.floor((state.qrExpiresAt || 0) / 1000),
    ].join("|");
  }

  function renderPase() {
    const t = state.ticket || TICKETS[0];
    $("#paseSector").textContent =
      t.sector + " · Fila " + t.fila + " · Asiento " + t.asiento;
    $("#paseEstado").textContent = "VÁLIDO";
    $("#qrPayload").textContent = qrPayload();
    drawQrPattern($("#qrCanvas"), state.qrNonce + String(state.qrRotation));
    const tier = $("#paseTierSub");
    if (tier) tier.textContent = CATEGORY_NAME;
    updateTtlDisplay();
  }

  function drawQrPattern(canvas, seed) {
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const size = 200;
    const cells = 21;
    const cell = size / cells;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, size, size);
    let h = 0;
    for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
    function bit(x, y) {
      const n = (h ^ (x * 73856093) ^ (y * 19349663)) >>> 0;
      return (n % 3) !== 0;
    }
    function finder(ox, oy) {
      ctx.fillStyle = "#000";
      ctx.fillRect(ox * cell, oy * cell, 7 * cell, 7 * cell);
      ctx.fillStyle = "#fff";
      ctx.fillRect((ox + 1) * cell, (oy + 1) * cell, 5 * cell, 5 * cell);
      ctx.fillStyle = "#000";
      ctx.fillRect((ox + 2) * cell, (oy + 2) * cell, 3 * cell, 3 * cell);
    }
    for (let y = 0; y < cells; y++) {
      for (let x = 0; x < cells; x++) {
        const inFinder =
          (x < 8 && y < 8) ||
          (x > cells - 9 && y < 8) ||
          (x < 8 && y > cells - 9);
        if (inFinder) continue;
        if (bit(x, y)) {
          ctx.fillStyle = "#070707";
          ctx.fillRect(x * cell, y * cell, cell, cell);
        }
      }
    }
    finder(0, 0);
    finder(cells - 7, 0);
    finder(0, cells - 7);
  }

  function updateTtlDisplay() {
    const el = $("#qrTtl");
    if (!el || !state.qrExpiresAt) return;
    const left = Math.max(0, Math.ceil((state.qrExpiresAt - Date.now()) / 1000));
    el.textContent = left + " s";
    const expired = left <= 0;
    el.classList.toggle("is-expired", expired);
    if (expired) {
      $("#paseEstado").textContent = "EXPIRADO";
      $("#paseEstado").className = "badge badge-expired";
    } else {
      $("#paseEstado").textContent = "VÁLIDO";
      $("#paseEstado").className = "badge badge-ok";
    }
  }

  function startTtl() {
    stopTtl();
    ttlTimer = setInterval(() => {
      updateTtlDisplay();
    }, 250);
  }
  function stopTtl() {
    if (ttlTimer) clearInterval(ttlTimer);
    ttlTimer = null;
  }

  function selectQrState(st, btn) {
    state.selectedQrState = st;
    $all(".state-btn").forEach((b) => b.classList.remove("selected"));
    if (btn) btn.classList.add("selected");
    $("#btnScan").disabled = false;
  }

  function doScan() {
    const st = state.selectedQrState;
    if (!st || !DECISION_COPY[st]) return;
    const copy = DECISION_COPY[st];
    const decision = {
      state: st,
      allow: copy.allow,
      title: copy.title,
      reason: copy.reason,
      at: nowLabel(),
      passId: state.passId || "—",
      ticketId: (state.ticket && state.ticket.id) || TICKETS[0].id,
      nombre: state.nombre,
      qrNonce: state.qrNonce || uid(8),
      correlationId: "AUD-" + uid(8),
    };
    state.lastDecision = decision;
    state.auditLog.push(decision);
    save();
    go("decision");
  }

  function renderDecision() {
    const d = state.lastDecision;
    const banner = $("#decisionBanner");
    const meta = $("#decisionMeta");
    if (!d) {
      banner.className = "decision-banner deny";
      banner.textContent = "SIN DECISIÓN";
      meta.innerHTML = "<p class='muted'>Escanea un QR primero.</p>";
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
      "<dt>Estado QR demo</dt><dd>" +
      escapeHtml(d.state) +
      "</dd>" +
      "<dt>Hora</dt><dd>" +
      escapeHtml(d.at) +
      "</dd>" +
      "<dt>Correlación</dt><dd class='mono'>" +
      escapeHtml(d.correlationId) +
      "</dd>" +
      "</dl>";
  }

  function renderAuditoria() {
    const d = state.lastDecision;
    const card = $("#auditCard");
    if (!d) {
      card.innerHTML = "<p class='muted'>No hay evento de validación aún.</p>";
      return;
    }
    const t = state.ticket || TICKETS[0];
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
      escapeHtml(t.sector + " · " + t.fila + "-" + t.asiento) +
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
      "<dt>Evento</dt><dd>Evento demo — Club Alpha</dd>" +
      "<dt>Canal</dt><dd>Escáner puerta · SIMULADO</dd>" +
      "</dl>";
  }

  function hasPass() {
    return !!state.passId;
  }

  function seasonMatches() {
    return HISTORY.filter((m) => m.season);
  }

  function firstName(nombre) {
    const part = String(nombre || "").trim().split(/\s+/)[0];
    return part || "hincha";
  }

  function initials(nombre) {
    const parts = String(nombre || "").trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return "HD";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }

  function maskDoc(doc) {
    const digits = String(doc || "").replace(/\D/g, "");
    return "CC ···· " + (digits.slice(-3) || "•••");
  }

  function maskPhone(cel) {
    const digits = String(cel || "").replace(/\D/g, "");
    return "··· ··· " + (digits.slice(-4) || "••••");
  }

  function maskEmail(email) {
    const raw = String(email || "");
    const at = raw.indexOf("@");
    if (at < 1) return "•••@•••";
    return raw.charAt(0) + "•••" + raw.slice(at);
  }

  function chip(label, on) {
    return (
      '<span class="chip ' +
      (on ? "on" : "off") +
      '">' +
      (on ? "✓ " : "✗ ") +
      escapeHtml(label) +
      "</span>"
    );
  }

  function renderHinchaHome() {
    const ready = hasPass();
    const body = $("#hinchaBody");
    $("#hinchaLauncher").hidden = ready;
    $("#hinchaDash").hidden = !ready;
    $("#hinchaActionsLauncher").hidden = ready;
    $("#hinchaActionsDash").hidden = !ready;
    if (body) {
      body.classList.toggle("centered", !ready);
      body.classList.toggle("home-body", !ready);
    }
    if (!ready) return;
    $("#dashNombre").textContent = "Hola, " + firstName(state.nombre);
    $("#dashEvento").textContent = "Evento demo — Club Alpha · Estadio Demo";
    const t = state.ticket;
    $("#dashPaseSub").textContent = t
      ? "FP-" + state.passId + " · " + t.sector + " · Fila " + t.fila
      : "FP-" + state.passId + " · QR de ingreso";
    $("#dashTierTitle").textContent = CATEGORY_NAME;
    const n = seasonMatches().length;
    $("#dashTierSub").textContent = n + " de " + CATEGORY_GOAL + " hacia " + CATEGORY_NEXT;
    const last = seasonMatches()[0];
    $("#dashLastTitle").textContent = last ? last.rival : "Última asistencia";
    $("#dashLastSub").textContent = last
      ? last.date + " · " + last.sector + " · Asistí"
      : "Sin asistencias de la temporada";
  }

  function renderPerfil() {
    const ready = hasPass();
    $("#perfilIniciales").textContent = initials(state.nombre);
    $("#perfilNombre").textContent = state.nombre;
    $("#perfilEvento").textContent = "Evento demo — Club Alpha · Estadio Demo · Bogotá";
    $("#perfilDoc").textContent = maskDoc(state.doc);
    $("#perfilCel").textContent = maskPhone(state.cel);
    $("#perfilEmail").textContent = maskEmail(state.email);
    $("#perfilPassBadge").innerHTML = ready
      ? '<span class="badge badge-ok">FAN PASS ACTIVO</span>'
      : '<span class="badge badge-sim">FAN PASS PENDIENTE</span>';
    const fp = $("#perfilFp");
    fp.textContent = ready ? "FP-" + state.passId : "Sin Fan Pass";
    fp.classList.toggle("is-pending", !ready);
    $("#perfilChips").innerHTML =
      chip("Identidad", state.consents.identidad) +
      chip("Acceso", state.consents.acceso) +
      chip("Comunicaciones", state.consents.comms);
    const n = seasonMatches().length;
    $("#perfilHistorialSub").textContent = ready
      ? n + " partidos esta temporada"
      : "Se activa con el Fan Pass";
    $("#perfilTierLabel").textContent = ready ? CATEGORY_NAME : "Aún sin categoría";
    const cta = $("#perfilCtaPase");
    cta.textContent = ready ? "Ver mi pase" : "Entrar al evento";
    cta.setAttribute("data-go", ready ? "pase" : "entrada");
  }

  function renderHistorial() {
    const ready = hasPass();
    $("#historialFilled").hidden = !ready;
    $("#historialEmpty").hidden = ready;
    $("#historialActionsEmpty").hidden = ready;
    if (!ready) return;
    const season = seasonMatches();
    $("#historialCount").textContent = String(season.length);
    const list = $("#historialList");
    list.innerHTML = "";
    HISTORY.forEach((m) => {
      const article = document.createElement("article");
      article.className = "history-item";
      article.innerHTML =
        '<div class="history-top"><h3>' +
        escapeHtml(m.rival) +
        "</h3>" +
        (m.season
          ? ""
          : '<span class="badge badge-lock">Temporada anterior</span>') +
        "</div>" +
        '<p class="history-meta">' +
        escapeHtml(m.stadium + " · " + m.city) +
        "</p>" +
        '<p class="history-meta">' +
        escapeHtml(m.date + " · " + m.sector) +
        "</p>" +
        '<p class="attend-pill">Asistí · QR validado</p>';
      list.appendChild(article);
    });
  }

  function unlockItem(item, on) {
    return (
      '<li class="unlock-item"><span class="unlock-mark ' +
      (on ? "on" : "off") +
      '" aria-hidden="true">' +
      (on ? "✓" : "–") +
      "</span><div><strong>" +
      escapeHtml(item.title) +
      "</strong><span>" +
      escapeHtml(item.desc) +
      "</span></div></li>"
    );
  }

  function renderCategoria() {
    const ready = hasPass();
    const n = ready ? seasonMatches().length : 0;
    const nombre = $("#categoriaNombre");
    const next = $("#categoriaNext");
    const label = $("#tierProgressLabel");
    const goal = $("#tierGoalLabel");
    const fill = $("#tierFill");
    const bar = $("#tierBar");
    nombre.textContent = ready ? CATEGORY_NAME : "Sin Fan Pass";
    next.textContent = ready
      ? "Siguiente nivel: " + CATEGORY_NEXT
      : "La categoría del piloto aparece al activar el Fan Pass.";
    label.textContent = n + " de " + CATEGORY_GOAL + " asistencias";
    goal.textContent = CATEGORY_NEXT;
    const pct = Math.max(0, Math.min(100, Math.round((n / CATEGORY_GOAL) * 100)));
    fill.style.width = pct + "%";
    if (bar) {
      bar.setAttribute("aria-valuenow", String(n));
      bar.setAttribute("aria-valuemax", String(CATEGORY_GOAL));
      bar.setAttribute(
        "aria-label",
        n + " de " + CATEGORY_GOAL + " asistencias hacia " + CATEGORY_NEXT
      );
    }
    $("#tierUnlocked").innerHTML = ready
      ? TIER_UNLOCKED.map((item) => unlockItem(item, true)).join("")
      : '<li class="unlock-item"><span class="unlock-mark off" aria-hidden="true">–</span><div><strong>Nada desbloqueado</strong><span>Entra al evento y activa el Fan Pass.</span></div></li>';
    const locked = ready ? TIER_LOCKED : TIER_UNLOCKED.concat(TIER_LOCKED);
    $("#tierLocked").innerHTML = locked.map((item) => unlockItem(item, false)).join("");
  }

  function benefitCards() {
    const ready = hasPass();
    const comms = !!state.consents.comms;
    return [
      {
        title: "QR de ingreso",
        desc: "Pase dinámico para la puerta del evento.",
        status: ready ? "Disponible" : "Requiere Fan Pass",
        kind: ready ? "ok" : "lock",
        featured: true,
        go: ready ? "pase" : "entrada",
      },
      {
        title: "Avisos del evento",
        desc: "Comunicaciones del piloto, según tu permiso.",
        status: comms ? "Disponible" : "Requiere permiso",
        kind: comms ? "ok" : "soon",
        go: "privacidad",
      },
      {
        title: "Fila preferencial",
        desc: "Mock ligado a la categoría verificada.",
        status: ready ? "Disponible" : "Requiere categoría",
        kind: ready ? "ok" : "lock",
        go: "categoria",
      },
      {
        title: "Merch",
        desc: "Descuentos de tienda. Servicio futuro.",
        status: "Próximamente",
        kind: "soon",
      },
      {
        title: "Contenido",
        desc: "Contenido exclusivo. Servicio futuro.",
        status: "Próximamente",
        kind: "soon",
      },
      {
        title: "Apuestas",
        desc: "Sin cuotas ni pagos en este piloto.",
        status: "Próximamente",
        kind: "soon",
      },
    ];
  }

  function renderBeneficios() {
    const grid = $("#beneficiosGrid");
    grid.innerHTML = "";
    benefitCards().forEach((b) => {
      const el = document.createElement(b.go ? "button" : "article");
      el.className = "benefit-card" + (b.featured ? " featured" : "") + (b.kind === "soon" && !b.go ? " soon" : "");
      if (b.go) {
        el.type = "button";
        el.setAttribute("data-go", b.go);
      }
      const badgeClass = b.kind === "ok" ? "badge-ok" : b.kind === "lock" ? "badge-lock" : "badge-soon";
      el.innerHTML =
        '<span class="badge ' +
        badgeClass +
        '">' +
        escapeHtml(b.status) +
        "</span><h3>" +
        escapeHtml(b.title) +
        "</h3><p>" +
        escapeHtml(b.desc) +
        "</p>";
      grid.appendChild(el);
    });
  }

  function updatePrivacyCopy() {
    const noAds = $("#prefNoAdsCopy");
    const comms = $("#prefCommsCopy");
    const rapido = $("#prefRapidoCopy");
    if (noAds) {
      noAds.textContent = state.prefs.noAds
        ? "Protegido en el piloto: los datos de acceso no alimentan anuncios ni se venden."
        : "Preferencia simulada para permitir publicidad. En este piloto igual no hay anuncios ni venta de datos.";
    }
    if (comms) {
      comms.textContent = state.consents.comms
        ? "Avisos activados para el evento demo. Puedes apagarlos cuando quieras."
        : "Avisos apagados. El ingreso con QR o documento sigue igual.";
    }
    if (rapido) {
      rapido.textContent = state.prefs.accesoRapido
        ? "Atajo activo (simulado). El QR y el documento en la ruta asistida siguen disponibles. Sin reconocimiento facial en la puerta."
        : "Apagado. Entras con el QR del Fan Pass o con documento en la ruta asistida. Sin reconocimiento facial en la puerta.";
    }
  }

  function renderPrivacidad() {
    $("#prefNoAds").checked = !!state.prefs.noAds;
    $("#prefComms").checked = !!state.consents.comms;
    $("#prefRapido").checked = !!state.prefs.accesoRapido;
    updatePrivacyCopy();
  }

  function tickClock() {
    const el = $("#statusTime");
    if (!el) return;
    const d = new Date();
    el.textContent =
      String(d.getHours()).padStart(2, "0") +
      ":" +
      String(d.getMinutes()).padStart(2, "0");
  }

  function applyTheme(name, persist) {
    const theme = THEMES.indexOf(name) >= 0 ? name : "umbral";
    document.documentElement.setAttribute("data-theme", theme);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", THEME_COLOR[theme]);
    $all("[data-theme-choice]").forEach((btn) => {
      const on = btn.getAttribute("data-theme-choice") === theme;
      btn.classList.toggle("is-active", on);
      btn.setAttribute("aria-checked", on ? "true" : "false");
    });
    if (persist) {
      try { localStorage.setItem(THEME_KEY, theme); } catch (_) {}
    }
  }

  function bind() {
    document.body.addEventListener("click", (e) => {
      const themeEl = e.target.closest("[data-theme-choice]");
      if (themeEl) {
        e.preventDefault();
        applyTheme(themeEl.getAttribute("data-theme-choice"), true);
        return;
      }
      const goEl = e.target.closest("[data-go]");
      if (goEl) {
        e.preventDefault();
        go(goEl.getAttribute("data-go"));
        return;
      }
      const stBtn = e.target.closest("[data-qr-state]");
      if (stBtn) {
        selectQrState(stBtn.getAttribute("data-qr-state"), stBtn);
      }
    });

    $("#btnRegistro").addEventListener("click", submitRegistro);
    $("#consentId").addEventListener("change", onConsentChange);
    $("#consentAcceso").addEventListener("change", onConsentChange);
    $("#consentComms").addEventListener("change", onConsentChange);
    $("#prefNoAds").addEventListener("change", () => {
      state.prefs.noAds = $("#prefNoAds").checked;
      save();
      updatePrivacyCopy();
    });
    $("#prefComms").addEventListener("change", () => {
      state.consents.comms = $("#prefComms").checked;
      state.consentsKnown = true;
      const box = $("#consentComms");
      if (box) box.checked = state.consents.comms;
      save();
      updatePrivacyCopy();
    });
    $("#prefRapido").addEventListener("change", () => {
      state.prefs.accesoRapido = $("#prefRapido").checked;
      save();
      updatePrivacyCopy();
    });
    $("#btnConsent").addEventListener("click", () => {
      if ($("#consentId").checked && $("#consentAcceso").checked) {
        readConsentForm();
        go("verificacion");
      }
    });
    $("#choiceAsistida").addEventListener("click", startAsistida);
    $("#choiceProvider").addEventListener("click", startProveedor);
    $("#btnAsistida").addEventListener("click", submitAsistida);
    $("#btnVincular").addEventListener("click", vincularBoleta);
    $("#btnRotar").addEventListener("click", () => {
      rotateQr(false);
      updateTtlDisplay();
    });
    $("#btnScan").addEventListener("click", doScan);
    $("#btnAuditoria").addEventListener("click", () => go("auditoria"));
  }

  load();
  bind();
  applyTheme(document.documentElement.getAttribute("data-theme"), false);
  tickClock();
  setInterval(tickClock, 30000);
  go("hub");

  window.FanectDemo = {
    go,
    state,
    rotateQr,
    setTheme(name) { applyTheme(name, true); },
    reset() {
      localStorage.removeItem("fanect_p0");
      location.reload();
    },
  };
})();
