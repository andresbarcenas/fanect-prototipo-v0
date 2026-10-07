import { CONTEXT_OF, canTransition, resolveTabTarget } from "../domain/machine.js";
import { QrCodec } from "../domain/qr-codec.js";
import { findTicket } from "../domain/tickets.js";
import { EVENT_NAME, EVENT_CODE } from "../domain/event.js";
import { uid, nowLabel, QR_TTL_MS } from "../domain/util.js";
import { showError, showHint, setInvalid } from "../ui/inlineValidate.js";

export class AppController {
  /**
   * @param {{ store: import('../persist/Store.js').Store, router: import('./Router.js').Router, viewHost: import('./ViewHost.js').ViewHost, clock?: () => number }} deps
   */
  constructor({ store, router, viewHost, clock = () => Date.now() }) {
    this.store = store;
    this.router = router;
    this.viewHost = viewHost;
    this.clock = clock;
    /** @type {ReturnType<typeof setInterval> | null} */
    this._ttlTimer = null;
    /** @type {ReturnType<typeof setTimeout> | null} */
    this._providerTimer = null;
    this._booting = true;
  }

  start() {
    this.store.hydrate();
    // Presenter safety: always boot hub
    this.store.patch({ context: "hub", screen: "hub", selectedFixture: null, uiHint: null });
    this.router.start((parsed) => {
      if (this._booting) return; // ignore hash during first paint
      this._onHashChange(parsed);
    });
    this._go("hub", { force: true, skipHash: false });
    this._booting = false;
    this.router.replace("hub", "hub");
  }

  /** @param {any} intent */
  dispatch(intent) {
    switch (intent.type) {
      case "nav/go":
        return this._navGo(intent.screen, intent);
      case "nav/switchApp":
        return this._go("hub", { force: true });
      case "nav/tab":
        return this._navTab(intent.navKey);
      case "hincha/submitRegistro":
        return this._submitRegistro(intent.form);
      case "hincha/submitConsents":
        return this._submitConsents(intent.consents);
      case "hincha/chooseAsistida":
        this.store.patch({ verifyPath: "asistida" });
        this.store.persist();
        return this._go("asistida");
      case "hincha/chooseProveedor":
        this.store.patch({ verifyPath: "proveedor" });
        this.store.persist();
        return this._go("proveedor");
      case "hincha/submitAsistida":
        return this._submitAsistida(intent.agentStatus);
      case "hincha/activateFanPass":
        return this._activateFanPass();
      case "hincha/bindTicket":
        return this._bindTicket(intent.ticketId);
      case "hincha/rotateQr":
        return this._rotateQr();
      case "operador/selectFixture":
        this.store.patch({ selectedFixture: intent.fixture });
        setInvalid("stateGrid", false);
        showError("scannerError", null);
        return;
      case "operador/scan":
        return this._scan(intent.fixture);
      case "operador/openAuditoria":
        return this._go("auditoria");
      case "demo/reset":
        this.store.reset();
        location.reload();
        return;
      default:
        console.warn("Intent desconocido", intent);
    }
  }

  /** @param {string} screen @param {any} [meta] */
  _navGo(screen, meta = {}) {
    if (screen === "home") screen = "hub";
    // Tab buttons use data-nav — handled separately
    if (meta.fromTab) return this._navTab(meta.navKey || screen);
    return this._go(/** @type {any} */ (screen), { force: !!meta.force });
  }

  /** @param {string} navKey */
  _navTab(navKey) {
    const state = this.store.get();
    const resolved = resolveTabTarget(state, navKey);
    if (resolved.hint) {
      this.store.patch({ uiHint: resolved.hint });
      showHint("globalHint", resolved.hint);
    } else {
      this.store.patch({ uiHint: null });
      showHint("globalHint", null);
    }
    return this._go(resolved.screen, { force: true });
  }

  /**
   * @param {import('../domain/types.js').ScreenId} screen
   * @param {{ force?: boolean, skipHash?: boolean }} [opts]
   */
  _go(screen, opts = {}) {
    if (screen === /** @type {any} */ ("home")) screen = "hub";
    const prev = this.store.get().screen;
    const check = canTransition(this.store.get(), screen, { force: opts.force });
    if (!check.ok) {
      if (check.redirect) {
        showHint("globalHint", check.reason);
        this.store.patch({ uiHint: check.reason });
        return this._go(check.redirect, { force: true });
      }
      showError("globalError", check.reason);
      return;
    }
    showError("globalError", null);
    this._onLeave(prev);
    const ctx = CONTEXT_OF[screen] || "hub";
    this.store.patch({ screen, context: ctx });
    this.viewHost.activate(screen, this.store.get(), prev);
    this._onEnter(screen);
    if (!opts.skipHash) this.router.replace(ctx, screen);
  }

  _onHashChange(parsed) {
    const screen = /** @type {import('../domain/types.js').ScreenId} */ (parsed.screen);
    if (screen === this.store.get().screen) return;
    // Never invent cross-app jumps from URL
    if (parsed.context === "hub") return this._go("hub", { force: true, skipHash: true });
    const check = canTransition(
      { ...this.store.get(), screen: parsed.context === "hincha" ? "hincha-home" : "operador-home" },
      screen,
      { force: false }
    );
    if (!check.ok && check.redirect) {
      return this._go(check.redirect, { force: true });
    }
    // Mid-session deep link within app
    this._go(screen, { force: true, skipHash: true });
  }

  /** @param {import('../domain/types.js').Registration} form */
  _submitRegistro(form) {
    const fields = [
      ["regNombre", form.nombre],
      ["regDoc", form.doc],
      ["regCel", form.cel],
      ["regEmail", form.email],
    ];
    let firstBad = "";
    for (const [id, value] of fields) {
      const bad = !String(value || "").trim();
      setInvalid(id, bad);
      if (bad && !firstBad) firstBad = id;
    }
    if (firstBad) {
      showError("registroError", "Completa todos los campos del registro.");
      document.getElementById(firstBad)?.focus();
      return;
    }
    showError("registroError", null);
    this.store.patch({
      registration: {
        nombre: form.nombre.trim(),
        doc: form.doc.trim(),
        cel: form.cel.trim(),
        email: form.email.trim(),
      },
    });
    this.store.persist();
    this._go("consentimientos");
  }

  /** @param {import('../domain/types.js').Consents} consents */
  _submitConsents(consents) {
    const idItem = document.getElementById("consentId")?.closest(".consent-item");
    const accesoItem = document.getElementById("consentAcceso")?.closest(".consent-item");
    idItem?.classList.toggle("is-invalid", !consents.identidad);
    accesoItem?.classList.toggle("is-invalid", !consents.acceso);
    document.getElementById("consentHint")?.classList.toggle("is-error", !consents.identidad || !consents.acceso);
    if (!consents.identidad || !consents.acceso) {
      showError("consentError", "Debes aceptar Identidad y Acceso para continuar.");
      return;
    }
    showError("consentError", null);
    document.getElementById("consentHint")?.classList.remove("is-error");
    this.store.patch({ consents });
    this.store.persist();
    this._go("verificacion");
  }

  /** @param {'pendiente'|'aprobado'|'rechazado'} status */
  _submitAsistida(status) {
    const bad = status !== "aprobado";
    setInvalid("asistidaEstado", bad);
    if (status === "rechazado") {
      showError(
        "asistidaError",
        "Verificación rechazada por el agente (demo). Elige «Aprobado» para continuar el happy path."
      );
      return;
    }
    if (status === "pendiente") {
      showError("asistidaError", "Aún pendiente de revisión. En el demo, marca «Aprobado por agente».");
      return;
    }
    showError("asistidaError", null);
    setInvalid("asistidaEstado", false);
    this._go("resultado");
  }

  _activateFanPass() {
    const s = this.store.get();
    if (!s.fanPass) {
      const passId = uid(6);
      this.store.patch({
        fanPass: {
          passId,
          nombre: s.registration.nombre,
          eventLabel: EVENT_NAME,
          status: "activo",
          createdAt: this.clock(),
        },
      });
      this.store.persist();
    }
    this._go("fanpass", { force: true });
  }

  /** @param {string} ticketId */
  _bindTicket(ticketId) {
    const ticket = findTicket(ticketId);
    if (!ticket) {
      showError("boletaError", "Selecciona una boleta válida.");
      setInvalid("ticketList", true);
      return;
    }
    setInvalid("ticketList", false);
    showError("boletaError", null);
    const s = this.store.get();
    if (!s.fanPass) {
      showError("boletaError", "Activa el Fan Pass primero.");
      return this._go("fanpass", { force: true });
    }
    const session = QrCodec.createSession(s.fanPass.passId, ticket.id, this.clock(), QR_TTL_MS);
    this.store.patch({ ticket, qrSession: session });
    this.store.persist();
    this._go("pase");
  }

  _rotateQr() {
    const s = this.store.get();
    if (!s.fanPass || !s.ticket) {
      showError("globalError", "No hay pase emitido. Completa Fan Pass + boleta.");
      return;
    }
    const base = s.qrSession || {
      eventCode: EVENT_CODE,
      passId: s.fanPass.passId,
      ticketId: s.ticket.id,
      nonce: "",
      rotation: 0,
      expiresAt: 0,
      payload: /** @type {any} */ (null),
    };
    const next = QrCodec.rotate(base, this.clock(), QR_TTL_MS);
    this.store.patch({ qrSession: next });
    this.store.persist();
    if (s.screen === "pase") this.viewHost.refresh("pase", this.store.get());
  }

  /** @param {import('../domain/types.js').DemoFixture | null | undefined} fixture */
  _scan(fixture) {
    showError("scannerError", null);
    const s = this.store.get();
    const selected = fixture || s.selectedFixture;
    let payload = s.qrSession?.payload || null;

    if (!payload && !selected) {
      showError("scannerError", "Emite un pase en App Hincha primero, o elige un estado demo.");
      setInvalid("stateGrid", true);
      return;
    }
    setInvalid("stateGrid", false);
    showError("scannerError", null);

    // Fixture theater without live payload: synthesize claims from last known / demo
    if (!payload && selected) {
      const passId = s.fanPass?.passId || "DEMO00";
      const ticketId = s.ticket?.id || "T-NORTE-12-08";
      payload = {
        version: 0,
        eventCode: EVENT_CODE,
        passId,
        ticketId,
        nonce: uid(8),
        rotation: 1,
        expiresAt: this.clock() + QR_TTL_MS,
      };
    }

    const result = QrCodec.evaluate(
      payload,
      {
        now: this.clock(),
        usedNonces: s.usedNonces,
        redeemedTicketIds: s.redeemedTicketIds,
      },
      { fixture: selected || null }
    );

    /** @type {import('../domain/types.js').Decision} */
    const decision = {
      allow: result.allow,
      title: result.title,
      reason: result.reason,
      at: nowLabel(new Date(this.clock())),
      passId: payload?.passId || s.fanPass?.passId || "—",
      ticketId: payload?.ticketId || s.ticket?.id || "—",
      nombre: s.registration.nombre,
      qrNonce: payload?.nonce || "—",
      correlationId: "AUD-" + uid(8),
      fixtureApplied: selected || null,
      kind: result.kind,
      payloadSnapshot: payload,
    };

    const usedNonces = [...s.usedNonces];
    const redeemedTicketIds = [...s.redeemedTicketIds];
    if (result.kind === "valido" && payload) {
      usedNonces.push(payload.nonce);
      redeemedTicketIds.push(payload.ticketId);
    } else if (payload && (result.kind === "replay" || selected === "replay")) {
      if (!usedNonces.includes(payload.nonce)) usedNonces.push(payload.nonce);
    }

    this.store.patch({
      lastDecision: decision,
      auditLog: [...s.auditLog, decision].slice(-20),
      usedNonces,
      redeemedTicketIds,
      selectedFixture: null,
    });
    this.store.persist();
    this._go("decision");
  }

  /** @param {string} screen */
  _onEnter(screen) {
    if (screen === "pase") this._startTtl();
    if (screen === "scanner") {
      this.store.patch({ selectedFixture: null });
      document.querySelectorAll(".state-btn").forEach((b) => b.classList.remove("selected"));
      const btn = document.getElementById("btnScan");
      const hasLive = !!this.store.get().qrSession?.payload;
      if (btn) /** @type {HTMLButtonElement} */ (btn).disabled = !hasLive;
      this._updateScannerLiveNote();
    }
    if (screen === "proveedor") this._runProviderMock();
    if (screen === "fanpass") {
      const s = this.store.get();
      if (!s.fanPass) {
        const passId = uid(6);
        this.store.patch({
          fanPass: {
            passId,
            nombre: s.registration.nombre,
            eventLabel: EVENT_NAME,
            status: "activo",
            createdAt: this.clock(),
          },
        });
        this.store.persist();
      }
      this.viewHost.refresh("fanpass", this.store.get());
    }
  }

  /** @param {string} screen */
  _onLeave(screen) {
    if (screen === "pase") this._stopTtl();
    if (screen === "proveedor") {
      if (this._providerTimer) clearTimeout(this._providerTimer);
      this._providerTimer = null;
    }
  }

  _startTtl() {
    this._stopTtl();
    this._ttlTimer = setInterval(() => {
      const s = this.store.get();
      if (s.screen !== "pase") return this._stopTtl();
      this.viewHost.refresh("pase", s);
      if (s.qrSession && this.clock() >= s.qrSession.expiresAt) {
        this._rotateQr(); // auto-rotate on TTL expiry
      }
    }, 250);
  }

  _stopTtl() {
    if (this._ttlTimer) clearInterval(this._ttlTimer);
    this._ttlTimer = null;
  }

  _runProviderMock() {
    if (this._providerTimer) clearTimeout(this._providerTimer);
    const text = document.getElementById("provText");
    if (text) text.textContent = "Conectando con proveedor de identidad…";
    this._providerTimer = setTimeout(() => {
      if (text) text.textContent = "Validando documento (mock)…";
      this._providerTimer = setTimeout(() => {
        if (text) text.textContent = "Verificación completada (simulado).";
        this._providerTimer = setTimeout(() => this._go("resultado"), 600);
      }, 900);
    }, 800);
  }

  _updateScannerLiveNote() {
    const el = document.getElementById("livePayloadNote");
    if (!el) return;
    const s = this.store.get();
    const live = !!s.qrSession?.payload;
    el.classList.toggle("is-empty", !live);
    if (live) {
      el.innerHTML =
        "Payload vivo disponible de App Hincha · pass <strong>FP-" +
        s.qrSession.passId +
        "</strong> · ticket <strong>" +
        s.qrSession.ticketId +
        "</strong>. Elige «Válido» para ALLOW sobre ese payload, u otros estados como override demo.";
    } else {
      el.textContent =
        "Sin payload vivo. Emite un pase en App Hincha, o usa los estados demo (sintetizan claims).";
    }
  }
}
