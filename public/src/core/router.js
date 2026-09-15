/**
 * Router
 * -----------------------------------------------------------------------
 * Minimal hash-based router. No external dependency, no build step.
 *
 * A route is: { path, render, guard? }
 *   - path:   string, e.g. '/login', '/projects', '/projects/:id'
 *   - render: async (params, container) => (void | () => void)
 *             mounts the view. May optionally return a cleanup function
 *             (e.g. to unsubscribe a Firestore real-time listener) —
 *             the router calls it automatically right before the next
 *             navigation, so views never have to manage this themselves.
 *   - guard:  () => true | string                 — return true to allow
 *             navigation, or a redirect path (string) to block it.
 *
 * Usage:
 *   import { router } from '../core/router.js';
 *   router.register({ path: '/login', render: renderLogin });
 *   router.start(document.getElementById('app'));
 * -----------------------------------------------------------------------
 */

class Router {
  #routes = [];
  #container = null;
  #notFoundRender = null;
  #errorFallbackRender = null;
  #currentCleanup = null;

  register({ path, render, guard }) {
    this.#routes.push({ path, render, guard, segments: path.split('/').filter(Boolean) });
  }

  setNotFound(render) {
    this.#notFoundRender = render;
  }

  /**
   * Optional fallback UI shown if a view's `render` throws. Without
   * this, an uncaught error in a view leaves the user on a blank page
   * with nothing but a console error.
   * @param {(error: Error, container: HTMLElement) => void} render
   */
  setErrorFallback(render) {
    this.#errorFallbackRender = render;
  }

  start(container) {
    this.#container = container;
    window.addEventListener('hashchange', () => this.#resolve());
    this.#resolve();
  }

  navigate(path) {
    window.location.hash = path;
  }

  #currentPath() {
    const hash = window.location.hash.replace(/^#/, '');
    return hash === '' ? '/' : hash;
  }

  #match(path) {
    const pathSegments = path.split('/').filter(Boolean);

    for (const route of this.#routes) {
      if (route.segments.length !== pathSegments.length) continue;

      const params = {};
      const isMatch = route.segments.every((segment, i) => {
        if (segment.startsWith(':')) {
          params[segment.slice(1)] = pathSegments[i];
          return true;
        }
        return segment === pathSegments[i];
      });

      if (isMatch) return { route, params };
    }

    return null;
  }

  #runCleanup() {
    if (typeof this.#currentCleanup === 'function') {
      try {
        this.#currentCleanup();
      } catch (error) {
        console.error('[router] cleanup for previous view threw:', error);
      }
    }
    this.#currentCleanup = null;
  }

  async #resolve() {
    const path = this.#currentPath();
    const matched = this.#match(path);

    this.#runCleanup();

    if (!matched) {
      if (this.#notFoundRender) await this.#notFoundRender(this.#container);
      return;
    }

    const { route, params } = matched;

    if (route.guard) {
      const guardResult = route.guard();
      if (guardResult !== true) {
        this.navigate(typeof guardResult === 'string' ? guardResult : '/login');
        return;
      }
    }

    // Clear previous view before mounting the next one.
    this.#container.innerHTML = '';

    try {
      const cleanup = await route.render(params, this.#container);
      if (typeof cleanup === 'function') {
        this.#currentCleanup = cleanup;
      }
    } catch (error) {
      console.error(`[router] view for "${path}" threw during render:`, error);
      if (this.#errorFallbackRender) {
        this.#errorFallbackRender(error, this.#container);
      }
    }
  }
}

export const router = new Router();
