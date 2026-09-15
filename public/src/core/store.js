/**
 * Store
 * -----------------------------------------------------------------------
 * A tiny reactive state container — no external framework, no magic.
 * Holds state that genuinely needs to be shared across unrelated modules
 * (current session, active project, active role). Anything local to a
 * single view should stay in that view's own module scope instead.
 *
 * Usage:
 *   import { store } from '../core/store.js';
 *
 *   store.setState({ currentUser: user });
 *   const unsubscribe = store.subscribe((state) => { ... });
 *   const { currentUser } = store.getState();
 * -----------------------------------------------------------------------
 */

const initialState = Object.freeze({
  currentUser: null,      // { uid, email, role } | null
  activeProject: null,    // project document currently open, or null
  isBooting: true,        // true until the initial auth check resolves
});

class Store {
  #state;
  #subscribers = new Set();

  constructor(state) {
    this.#state = { ...state };
  }

  getState() {
    return this.#state;
  }

  /**
   * Shallow-merges the given partial state into the current state and
   * notifies every subscriber.
   * @param {Partial<typeof initialState>} partialState
   */
  setState(partialState) {
    this.#state = { ...this.#state, ...partialState };
    this.#notify();
  }

  /**
   * @param {(state: typeof initialState) => void} callback
   * @returns {() => void} unsubscribe function
   */
  subscribe(callback) {
    this.#subscribers.add(callback);
    return () => this.#subscribers.delete(callback);
  }

  #notify() {
    this.#subscribers.forEach((callback) => callback(this.#state));
  }
}

export const store = new Store(initialState);
