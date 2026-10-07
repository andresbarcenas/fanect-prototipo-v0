import { defaultState, readStorage, writeStorage, clearStorage } from "./schema.js";

export class Store {
  constructor() {
    /** @type {import('../domain/types.js').AppState} */
    this._state = defaultState();
    /** @type {Set<(s: import('../domain/types.js').AppState) => void>} */
    this._subs = new Set();
  }

  hydrate() {
    const { state } = readStorage();
    this._state = state;
    return this._state;
  }

  get() {
    return this._state;
  }

  /** Frozen-ish projection for FanectDemo.state */
  getProjection() {
    return structuredClone
      ? structuredClone(this._state)
      : JSON.parse(JSON.stringify(this._state));
  }

  /**
   * @param {Partial<import('../domain/types.js').AppState>} patch
   */
  patch(patch) {
    this._state = { ...this._state, ...patch };
    this._emit();
  }

  /** @param {import('../domain/types.js').AppState} state */
  replace(state) {
    this._state = state;
    this._emit();
  }

  persist() {
    writeStorage(this._state);
  }

  reset() {
    clearStorage();
  }

  /** @param {(s: import('../domain/types.js').AppState) => void} fn */
  subscribe(fn) {
    this._subs.add(fn);
    return () => this._subs.delete(fn);
  }

  _emit() {
    for (const fn of this._subs) fn(this._state);
  }
}
