/**
 * FANECT / Tribuna Segura — P0 estático (sin backend)
 * Dos apps: Hincha y Operador, con hub de entrada.
 * Estado en memoria + localStorage.
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
  const DEFAULT_EVENT = "MFC-DEMO-2026";

  /* CLASICO-DEMO-2026 is not a third event. It only resolves from a deep link. */
  const EVENT_ALIAS = "CLASICO-DEMO-2026";

  const EVENTS = {
    "MFC-DEMO-2026": {
      code: "MFC-DEMO-2026",
      club: "millonarios",
      chip: "Evento: Millonarios",
      clubName: "Millonarios FC",
      title: "Millonarios vs Atlético Nacional",
      subtitle: "Liga BetPlay",
      venue: "El Campín",
      city: "Bogotá",
      when: "Sábado 20:00",
      placeLine: "El Campín · Bogotá · Sábado 20:00",
      gate: "Puerta 3 · El Campín",
      shift: "20:00 – 22:30",
      desk: "Entradas Millonarios",
      tickets: [
        { id: "T-MFC-NORTE-12-08", sector: "Lateral Norte", fila: "12", asiento: "08", titular: "Andrés Díaz" },
        { id: "T-MFC-SUR-05-21", sector: "Lateral Sur", fila: "05", asiento: "21", titular: "Andrés Díaz" },
        { id: "T-MFC-OCC-A-14", sector: "Occidental", fila: "A", asiento: "14", titular: "Andrés Díaz" },
      ],
      history: [
        { rival: "Millonarios vs Atlético Nacional", stadium: "El Campín", city: "Bogotá", date: "12 sep 2026", sector: "Occidental", season: true, attend: "Asistí · QR validado" },
        { rival: "Millonarios vs Independiente Santa Fe", stadium: "El Campín", city: "Bogotá", date: "20 ago 2026", sector: "Lateral Norte", season: true, attend: "Asistí" },
        { rival: "Millonarios vs Junior", stadium: "El Campín", city: "Bogotá", date: "02 ago 2026", sector: "Lateral Sur", season: true, attend: "Asistí" },
      ],
    },
    "NAC-DEMO-2026": {
      code: "NAC-DEMO-2026",
      club: "nacional",
      chip: "Evento: Nacional",
      clubName: "Atlético Nacional",
      title: "Atlético Nacional vs Millonarios",
      subtitle: "Liga BetPlay",
      venue: "Atanasio",
      city: "Medellín",
      when: "Jueves 19:30",
      placeLine: "Atanasio · Medellín · Jueves 19:30",
      gate: "Acceso Occidental · Atanasio",
      shift: "19:30 – 22:00",
      desk: "Tribuna Verde",
      tickets: [
        { id: "T-NAC-OCC-B-10", sector: "Occidental Baja", fila: "10", asiento: "10", titular: "Andrés Díaz" },
        { id: "T-NAC-ORI-A-22", sector: "Oriental Alta", fila: "A", asiento: "22", titular: "Andrés Díaz" },
        { id: "T-NAC-NORTE-08-15", sector: "Norte", fila: "08", asiento: "15", titular: "Andrés Díaz" },
      ],
      history: [
        { rival: "Atlético Nacional vs Millonarios", stadium: "Atanasio", city: "Medellín", date: "12 sep 2026", sector: "Occidental Baja", season: true, attend: "Asistí · QR validado" },
        { rival: "Atlético Nacional vs Deportivo Cali", stadium: "Atanasio", city: "Medellín", date: "20 ago 2026", sector: "Oriental", season: true, attend: "Asistí" },
        { rival: "Atlético Nacional vs América de Cali", stadium: "Atanasio", city: "Medellín", date: "02 ago 2026", sector: "Norte", season: true, attend: "Asistí" },
      ],
    },
  };
  const TIER_UNLOCKED = [
    { title: "Fan Pass del evento", desc: "Identidad confirmada para este piloto" },
    { title: "QR de ingreso", desc: "Boleta nominativa y pase dinámico" },
    { title: "Fila preferencial", desc: "Beneficio de categoría en el piloto" },
  ];
  const TIER_LOCKED = [
    { title: "Hincha frecuente", desc: "Se abre al llegar a 5 asistencias de temporada" },
    { title: "Experiencias de temporada", desc: "Servicio futuro del piloto" },
  ];

  function currentEvent() {
    return EVENTS[state.eventCode] || EVENTS[DEFAULT_EVENT];
  }

  function eventTickets() {
    return currentEvent().tickets;
  }

  function eventHistory() {
    return currentEvent().history;
  }

  function ticketBelongs(ticket, code) {
    const ev = EVENTS[code];
    if (!ticket || !ticket.id || !ev) return false;
    return ev.tickets.some((t) => t.id === ticket.id);
  }

  function boundTicket() {
    return ticketBelongs(state.ticket, state.eventCode) ? state.ticket : null;
  }

  function clubToEvent(club) {
    const key = String(club || "").trim().toLowerCase();
    if (key === "nacional" || key === "atletico-nacional" || key === "atleticonacional" || key === "nac") {
      return "NAC-DEMO-2026";
    }
    if (key === "millonarios" || key === "millonarios-fc" || key === "mfc") {
      return "MFC-DEMO-2026";
    }
    return null;
  }

  function readLaunchEvent() {
    let params;
    try {
      params = new URLSearchParams(window.location.search);
    } catch (_) {
      return null;
    }
    const raw = (params.get("event") || "").trim().toUpperCase();
    const fromClub = clubToEvent(params.get("club"));
    if (raw === EVENT_ALIAS) {
      return { code: fromClub || DEFAULT_EVENT, alias: EVENT_ALIAS };
    }
    if (EVENTS[raw]) return { code: raw, alias: null };
    if (fromClub) return { code: fromClub, alias: null };
    return null;
  }

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
    nombre: "Andrés Díaz",
    doc: "1.234.567.890",
    cel: "300 123 4567",
    email: "andres@fanect.co",
    consents: { identidad: false, acceso: false, comms: false },
    prefs: { noAds: true, accesoRapido: false },
    consentsKnown: false,
    eventCode: DEFAULT_EVENT,
    pendingEventCode: null,
    aliasFrom: null,
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
        eventCode: state.eventCode,
        auditLog: state.auditLog.slice(-20),
      }));
    } catch (_) {}
  }
  function load() {
    try {
      const raw = localStorage.getItem("fanect_p0");
      if (!raw) {
        /* Deep link still applies on a fresh device. */
      } else {
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
      if (d.eventCode && EVENTS[d.eventCode]) state.eventCode = d.eventCode;
      if (Array.isArray(d.auditLog)) state.auditLog = d.auditLog;
      if (state.nombre === "Andrés Demo") state.nombre = "Andrés Díaz";
      if (String(state.email).toLowerCase() === "demo@fanect.co") state.email = "andres@fanect.co";
      if (state.ticket) {
        if (state.ticket.titular === "Andrés Demo") state.ticket.titular = state.nombre;
        if (/simulado/i.test(state.ticket.origenBoleta || "")) state.ticket.origenBoleta = "Quentro";
      }
      state.auditLog.forEach((row) => {
        if (!row) return;
        if (row.nombre === "Andrés Demo") row.nombre = state.nombre;
        if (row.gate) row.gate = String(row.gate).replace(/\s*\(demo\)/gi, "");
        if (/simulado/i.test(row.origenBoleta || "")) row.origenBoleta = "Quentro";
      });
      if (!ticketBelongs(state.ticket, state.eventCode)) {
        state.ticket = null;
        state.qrNonce = null;
        state.qrExpiresAt = null;
      }
      }
    } catch (_) {}
    const launch = readLaunchEvent();
    if (launch) {
      state.aliasFrom = launch.alias;
      if (launch.code !== state.eventCode) {
        if (state.passId || state.ticket) state.pendingEventCode = launch.code;
        else state.eventCode = launch.code;
      }
    }
  }

  function hasCredential() {
    return !!(state.passId || state.ticket);
  }

  function clearCredential() {
    state.passId = null;
    state.ticket = null;
    state.qrNonce = null;
    state.qrExpiresAt = null;
    state.qrRotation = 0;
    state.lastDecision = null;
    state.auditLog = [];
    state.selectedQrState = null;
  }

  function paintClubLabel(el) {
    if (!el) return;
    const ev = currentEvent();
    el.textContent = ev.chip;
    el.setAttribute("data-club", ev.club);
  }

  function applyEvent(code) {
    if (!EVENTS[code]) return;
    state.eventCode = code;
    state.pendingEventCode = null;
    save();
    renderEntrada();
  }

  function requestEvent(code) {
    if (!EVENTS[code]) return;
    if (code === state.eventCode) {
      state.pendingEventCode = null;
      renderEntrada();
      return;
    }
    if (hasCredential()) {
      state.pendingEventCode = code;
      renderEntrada();
      return;
    }
    applyEvent(code);
  }

  function confirmEventReset() {
    const code = state.pendingEventCode;
    if (!EVENTS[code]) return;
    clearCredential();
    applyEvent(code);
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
    if (name === "entrada") renderEntrada();
    if (name === "operador-home") renderOperador();
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
      alert("Verificación rechazada por el agente. Elige «Aprobado» para continuar.");
      return;
    }
    if (est === "pendiente") {
      alert("Aún pendiente de revisión. Marca «Aprobado por agente» para continuar.");
      return;
    }
    go("resultado");
  }

  function runProviderMock() {
    clearTimeout(providerTimer);
    $("#provText").textContent = "Conectando con proveedor de identidad…";
    providerTimer = setTimeout(() => {
      $("#provText").textContent = "Validando documento…";
      providerTimer = setTimeout(() => {
        $("#provText").textContent = "Verificación completada.";
        providerTimer = setTimeout(() => go("resultado"), 600);
      }, 900);
    }, 800);
  }

  function renderResultado() {
    const pathLabel =
      state.verifyPath === "asistida"
        ? "Ruta asistida no biométrica"
        : "Proveedor de identidad";
    $("#resultadoTitulo").textContent = "Identidad verificada";
    $("#resultadoDesc").textContent =
      state.verifyPath === "asistida"
        ? "Confirmada por agente del piloto (sin biometría 1:N)."
        : "Confirmada con el proveedor de identidad. No hay integración real.";
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
      "<dt>Evento</dt><dd>" +
      escapeHtml(currentEvent().title) +
      "</dd>" +
      "<dt>Código</dt><dd>" +
      escapeHtml(currentEvent().code) +
      "</dd>" +
      "<dt>Categoría</dt><dd>" +
      escapeHtml(CATEGORY_NAME) +
      "</dd>" +
      "</dl>";
    const tier = $("#resultadoTier");
    if (tier) tier.textContent = CATEGORY_NAME;
  }

  function origenLabel(value) {
    const raw = String(value || "").trim();
    if (!raw || /simulado/i.test(raw)) return "Quentro";
    return raw;
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
    const ev = currentEvent();
    paintClubLabel($("#passClubLabel"));
    const passEvento = $("#passEvento");
    if (passEvento) passEvento.textContent = ev.title + " · " + ev.subtitle;
    const passPlace = $("#passPlace");
    if (passPlace) passPlace.textContent = ev.placeLine;
    const tier = $("#fanpassTier");
    if (tier) tier.textContent = CATEGORY_NAME;
  }

  function renderEntrada() {
    const ev = currentEvent();
    paintClubLabel($("#eventClubLabel"));
    const title = $("#eventTitle");
    if (title) title.textContent = ev.title;
    const comp = $("#eventComp");
    if (comp) comp.textContent = ev.subtitle;
    const place = $("#eventPlace");
    if (place) place.textContent = ev.placeLine;
    const code = $("#eventCode");
    if (code && document.activeElement !== code) code.value = ev.code;
    const alias = $("#aliasHint");
    if (alias) {
      alias.hidden = !state.aliasFrom;
      if (state.aliasFrom) {
        alias.textContent = "Deep link " + state.aliasFrom + " abre " + ev.code + ". No es un tercer código en la lista.";
      }
    }
    $all("[data-event]").forEach((btn) => {
      const id = btn.getAttribute("data-event");
      const on = id === state.eventCode;
      const pending = id === state.pendingEventCode;
      btn.classList.toggle("is-selected", on);
      btn.classList.toggle("is-pending", pending && !on);
      btn.setAttribute("aria-checked", on ? "true" : "false");
    });
    const warn = $("#eventResetWarn");
    const next = EVENTS[state.pendingEventCode];
    if (warn) {
      warn.hidden = !next;
      if (next) warn.scrollIntoView({ block: "nearest" });
    }
    const copy = $("#eventResetCopy");
    if (copy && next) {
      const prefix = ev.code.indexOf("MFC") === 0 ? "T-MFC" : "T-NAC";
      copy.textContent =
        "Cambia el evento y reinicia el pase. Una boleta " +
        prefix +
        " no se mezcla con " +
        next.title +
        ".";
    }
  }

  function renderOperador() {
    const ev = currentEvent();
    paintClubLabel($("#opClubLabel"));
    const gate = $("#opGate");
    if (gate) gate.textContent = ev.gate;
    const evento = $("#opEvento");
    if (evento) evento.textContent = ev.title + " · " + ev.code;
    const turno = $("#opTurno");
    if (turno) turno.textContent = ev.shift;
  }

  function boletaSyncCopy(ev) {
    return (
      "La boleta nominativa figura en Quentro. La tiquetera de este evento es " +
      ev.desk +
      ". FANECT no llama a una API Quentro: en la puerta el operador lee el QR Fanect."
    );
  }

  function renderTickets() {
    const list = $("#ticketList");
    const ev = currentEvent();
    const hint = $("#boletaHint");
    if (hint) hint.textContent = boletaSyncCopy(ev);
    list.innerHTML = "";
    const selected = boundTicket();
    eventTickets().forEach((t) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "ticket-item" + (selected && selected.id === t.id ? " selected" : "");
      btn.setAttribute("role", "option");
      btn.setAttribute("aria-selected", selected && selected.id === t.id ? "true" : "false");
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
        escapeHtml(state.nombre || t.titular) +
        "</span>";
      btn.addEventListener("click", () => {
        state.ticket = {
          id: t.id,
          sector: t.sector,
          fila: t.fila,
          asiento: t.asiento,
          titular: state.nombre || t.titular,
          eventCode: ev.code,
          origenBoleta: "Quentro",
        };
        renderTickets();
        $("#btnVincular").disabled = false;
      });
      list.appendChild(btn);
    });
    $("#btnVincular").disabled = !boundTicket();
  }

  function vincularBoleta() {
    if (!boundTicket()) return;
    save();
    rotateQr(true);
    go("pase");
  }

  function ticketSnapshot(t) {
    const src = t || eventTickets()[0];
    return {
      id: src.id,
      sector: src.sector,
      fila: src.fila,
      asiento: src.asiento,
      titular: state.nombre || src.titular,
      eventCode: state.eventCode,
      origenBoleta: "Quentro",
    };
  }

  function ensureQr() {
    if (!state.passId) state.passId = uid(6);
    if (!boundTicket()) state.ticket = ticketSnapshot(eventTickets()[0]);
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
    const ev = currentEvent();
    const t = boundTicket() || {};
    return [
      "FANECT",
      "v0",
      "event=" + ev.code,
      "club=" + ev.club,
      "origen=quentro",
      "pass=" + (state.passId || ""),
      "ticket=" + (t.id || ""),
      "nonce=" + (state.qrNonce || ""),
      "rot=" + state.qrRotation,
      "exp=" + Math.floor((state.qrExpiresAt || 0) / 1000),
    ].join("|");
  }

  function renderPase() {
    const ev = currentEvent();
    const t = boundTicket() || eventTickets()[0];
    paintClubLabel($("#paseClubLabel"));
    const paseEvento = $("#paseEvento");
    if (paseEvento) paseEvento.textContent = ev.title + " · " + ev.placeLine;
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
    const ev = currentEvent();
    const t = ticketSnapshot(boundTicket() || eventTickets()[0]);
    const decision = {
      state: st,
      allow: copy.allow,
      title: copy.title,
      reason: copy.reason,
      at: nowLabel(),
      passId: state.passId || "—",
      ticketId: t.id,
      sector: t.sector,
      fila: t.fila,
      asiento: t.asiento,
      nombre: state.nombre,
      qrNonce: state.qrNonce || uid(8),
      correlationId: "AUD-" + uid(8),
      eventCode: ev.code,
      eventTitle: ev.title,
      club: ev.clubName,
      gate: ev.gate,
      origenBoleta: "Quentro",
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
      "<dt>Estado del QR</dt><dd>" +
      escapeHtml(d.state) +
      "</dd>" +
      "<dt>Hora</dt><dd>" +
      escapeHtml(d.at) +
      "</dd>" +
      "<dt>Correlación</dt><dd class='mono'>" +
      escapeHtml(d.correlationId) +
      "</dd>" +
      "<dt>Club</dt><dd>" +
      escapeHtml(d.club || "—") +
      "</dd>" +
      "<dt>Evento</dt><dd>" +
      escapeHtml(d.eventTitle ? (d.eventCode || "") + " · " + d.eventTitle : (d.eventCode || "—")) +
      "</dd>" +
      "<dt>Boleta</dt><dd>" +
      escapeHtml(d.ticketId || "—") +
      "</dd>" +
      "<dt>Origen boleta</dt><dd>" +
      escapeHtml(origenLabel(d.origenBoleta)) +
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
    const sector = (d.sector || "—") + " · " + (d.fila || "—") + "-" + (d.asiento || "—");
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
      escapeHtml(sector) +
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
      "<dt>Club</dt><dd>" +
      escapeHtml(d.club || "—") +
      "</dd>" +
      "<dt>Evento</dt><dd>" +
      escapeHtml((d.eventCode || "") + (d.eventTitle ? " · " + d.eventTitle : "")) +
      "</dd>" +
      "<dt>Origen boleta</dt><dd>" +
      escapeHtml(origenLabel(d.origenBoleta)) +
      "</dd>" +
      "<dt>Puerta</dt><dd>" +
      escapeHtml(d.gate || "—") +
      "</dd>" +
      "<dt>Canal</dt><dd>Escáner puerta · QR Fanect</dd>" +
      "</dl>";
  }

  function hasPass() {
    return !!state.passId;
  }

  function seasonMatches() {
    return eventHistory().filter((m) => m.season);
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
    const ev = currentEvent();
    const lede = $("#hinchaLede");
    if (lede) lede.textContent = "Identidad digital + boleta nominativa para " + ev.title + ".";
    const pending = $("#hinchaPending");
    if (pending) pending.hidden = !state.pendingEventCode;
    if (!ready) return;
    $("#dashNombre").textContent = "Hola, " + firstName(state.nombre);
    paintClubLabel($("#dashClubLabel"));
    $("#dashEvento").textContent = ev.title + " · " + ev.venue + " · " + ev.city;
    const t = boundTicket();
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
    const ev = currentEvent();
    $("#perfilIniciales").textContent = initials(state.nombre);
    $("#perfilNombre").textContent = state.nombre;
    paintClubLabel($("#perfilClubLabel"));
    $("#perfilEvento").textContent = ev.title + " · " + ev.placeLine;
    const favorito = $("#perfilFavorito");
    if (favorito) favorito.textContent = "Club del evento: " + ev.clubName;
    $("#perfilDoc").textContent = maskDoc(state.doc);
    $("#perfilCel").textContent = maskPhone(state.cel);
    $("#perfilEmail").textContent = maskEmail(state.email);
    $("#perfilPassBadge").innerHTML = ready
      ? '<span class="badge badge-ok">FAN PASS ACTIVO</span>'
      : '<span class="badge badge-lock">FAN PASS PENDIENTE</span>';
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
    const ev = currentEvent();
    const season = seasonMatches();
    $("#historialCount").textContent = String(season.length);
    paintClubLabel($("#historialClubLabel"));
    const clubLine = $("#historialClub");
    if (clubLine) clubLine.textContent = ev.clubName + " · piloto";
    const list = $("#historialList");
    list.innerHTML = "";
    eventHistory().forEach((m) => {
      const article = document.createElement("article");
      article.className = "history-item";
      article.innerHTML =
        '<div class="history-top"><h3>' +
        escapeHtml(m.rival) +
        "</h3></div>" +
        '<p class="history-meta">' +
        escapeHtml(m.stadium + " · " + m.city) +
        "</p>" +
        '<p class="history-meta">' +
        escapeHtml(m.date + " · " + m.sector) +
        "</p>" +
        '<p class="history-meta">Marcador ficticio · no es un resultado oficial</p>' +
        '<p class="attend-pill">' +
        escapeHtml(m.attend || "Asistí") +
        "</p>";
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
        desc: "Ligado a la categoría verificada.",
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
        : "Preferencia para permitir publicidad. En este piloto igual no hay anuncios ni venta de datos.";
    }
    if (comms) {
      comms.textContent = state.consents.comms
        ? "Avisos activados para " + currentEvent().title + ". Puedes apagarlos cuando quieras."
        : "Avisos apagados. El ingreso con QR o documento sigue igual.";
    }
    if (rapido) {
      rapido.textContent = state.prefs.accesoRapido
        ? "Atajo activo. El QR y el documento en la ruta asistida siguen disponibles. Sin reconocimiento facial en la puerta."
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
      const eventEl = e.target.closest("[data-event]");
      if (eventEl) {
        e.preventDefault();
        requestEvent(eventEl.getAttribute("data-event"));
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
    const confirmEvent = $("#btnConfirmEvent");
    if (confirmEvent) confirmEvent.addEventListener("click", confirmEventReset);
    const cancelEvent = $("#btnCancelEvent");
    if (cancelEvent) {
      cancelEvent.addEventListener("click", () => {
        state.pendingEventCode = null;
        renderEntrada();
      });
    }
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
    setEvent(code) { requestEvent(code); },
    reset() {
      localStorage.removeItem("fanect_p0");
      location.reload();
    },
  };
})();
