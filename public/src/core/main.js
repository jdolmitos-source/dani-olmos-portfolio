/**
 * App entry point
 * -----------------------------------------------------------------------
 * Bootstraps the whole app: wires the auth listener, registers every
 * route, and starts the router. Keep this file thin — it should only
 * orchestrate, never contain business logic.
 * -----------------------------------------------------------------------
 */

import { router } from './router.js';
import { store } from './store.js';
import { initAuthListener } from '../modules/auth/auth.service.js';
import { requireAuth, requireGuest, requireClient, requireDesigner } from '../modules/auth/auth.guard.js';
import { renderLogin } from '../modules/auth/login.view.js';
import { renderProjectList } from '../modules/projects/project-list.view.js';
import { renderUploadView } from '../modules/upload/upload.view.js';
import { renderWorkspace } from '../modules/workspace/workspace.view.js';

function registerRoutes() {
  router.register({ path: '/login', render: renderLogin, guard: requireGuest });
  router.register({ path: '/projects', render: renderProjectList, guard: requireAuth });
  router.register({ path: '/projects/:id/upload', render: renderUploadView, guard: requireClient });
  router.register({ path: '/projects/:id/workspace', render: renderWorkspace, guard: requireDesigner });

  router.setNotFound(async (container) => {
    container.innerHTML = `<main style="padding:var(--space-6)"><p class="text-secondary">404 — ruta no encontrada.</p></main>`;
  });

  // Last line of defense: if a view throws an uncaught error, show a
  // plain recovery screen instead of leaving a blank page with only a
  // console error nobody but a developer would ever see.
  router.setErrorFallback((error, container) => {
    container.innerHTML = `
      <main class="stack" style="align-items:center; justify-content:center; min-height:100vh; text-align:center;">
        <section class="panel" style="padding: var(--space-6); width: 380px;">
          <h1 style="font-size: var(--font-size-lg); margin-bottom: var(--space-3); color: var(--color-danger);">
            Algo salió mal
          </h1>
          <p class="text-secondary" style="font-size: var(--font-size-sm); margin-bottom: var(--space-5);">
            Ocurrió un error inesperado al cargar esta pantalla. Intenta volver a los proyectos.
          </p>
          <button id="error-fallback-back" class="btn btn-primary" style="width: 100%; justify-content: center;">
            Volver a proyectos
          </button>
        </section>
      </main>
    `;
    container.querySelector('#error-fallback-back').addEventListener('click', () => router.navigate('/projects'));
  });
}

function bootstrap() {
  const container = document.getElementById('app');

  registerRoutes();
  initAuthListener();

  // Wait for the first auth resolution before starting the router, so
  // guards never make a decision based on a stale/empty currentUser.
  const unsubscribeInitial = store.subscribe((state) => {
    if (!state.isBooting) {
      unsubscribeInitial();
      router.start(container);
      if (!window.location.hash) router.navigate(state.currentUser ? '/projects' : '/login');
    }
  });

  // Reactive safety net: if the session ends in another tab (or the ID
  // token becomes invalid) while the user is on a protected route, send
  // them to /login instead of leaving a stale, now-unauthorized screen
  // up. Route guards alone only run at navigation time, not continuously.
  store.subscribe((state) => {
    const currentPath = window.location.hash.replace(/^#/, '') || '/';
    if (!state.isBooting && !state.currentUser && currentPath !== '/login') {
      router.navigate('/login');
    }
  });
}

document.addEventListener('DOMContentLoaded', bootstrap);
