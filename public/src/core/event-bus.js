/**
 * Event Bus
 * -----------------------------------------------------------------------
 * A minimal pub-sub mechanism so modules can communicate without holding
 * direct references to each other. Use this for cross-cutting signals
 * (e.g. "project:statusChanged", "auth:userChanged") — NOT as a
 * replacement for the Store, which holds actual shared state.
 *
 * Usage:
 *   import { eventBus } from '../core/event-bus.js';
 *
 *   const unsubscribe = eventBus.on('project:created', (project) => { ... });
 *   eventBus.emit('project:created', project);
 *   unsubscribe(); // stop listening
 * -----------------------------------------------------------------------
 */

class EventBus {
  #listeners = new Map();

  /**
   * @param {string} eventName
   * @param {(payload: any) => void} callback
   * @returns {() => void} unsubscribe function
   */
  on(eventName, callback) {
    if (!this.#listeners.has(eventName)) {
      this.#listeners.set(eventName, new Set());
    }
    this.#listeners.get(eventName).add(callback);

    return () => this.off(eventName, callback);
  }

  /**
   * @param {string} eventName
   * @param {(payload: any) => void} callback
   */
  off(eventName, callback) {
    this.#listeners.get(eventName)?.delete(callback);
  }

  /**
   * @param {string} eventName
   * @param {any} [payload]
   */
  emit(eventName, payload) {
    this.#listeners.get(eventName)?.forEach((callback) => {
      try {
        callback(payload);
      } catch (error) {
        // A single faulty subscriber must never break the others.
        console.error(`[event-bus] listener for "${eventName}" threw:`, error);
      }
    });
  }
}

export const eventBus = new EventBus();
