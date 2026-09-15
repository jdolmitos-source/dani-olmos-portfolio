/**
 * Project List View — Dashboard (Phase 2)
 * -----------------------------------------------------------------------
 * Real-time list of projects, scoped by role:
 *   - client:   only their own projects, plus a "New project" action.
 *   - designer: every project in the system, read-only for now.
 *
 * Returns a cleanup function so the router can unsubscribe the Firestore
 * real-time listener when the user navigates away (see core/router.js).
 * -----------------------------------------------------------------------
 */

import { getCurrentUser, signOutUser } from '../auth/auth.service.js';
import { router } from '../../core/router.js';
import { subscribeToProjects, createProject } from './projects.service.js';
import { renderProjectCreateForm } from './project-create.view.js';
import '../../components/project-card.js';
import '../../components/modal.js';

/**
 * @param {Record<string, string>} params
 * @param {HTMLElement} container
 * @returns {(() => void) | void} cleanup function
 */
export async function renderProjectList(params, container) {
  const user = getCurrentUser();

  if (!user.role) {
    renderNoRoleState(container, user);
    return;
  }

  container.innerHTML = `
    <main style="padding: var(--space-6); max-width: 960px; margin: 0 auto;">
      <div class="row" style="justify-content: space-between; align-items:center; margin-bottom: var(--space-5);">
        <div>
          <h1 style="font-size: var(--font-size-xl); margin-bottom: var(--space-1);">Projects</h1>
          <p class="text-secondary" style="font-size: var(--font-size-sm);">
            ${user.email} · <span style="text-transform: capitalize;">${user.role}</span>
          </p>
        </div>
        <div class="row gap-3">
          ${user.role === 'client' ? '<button id="create-project-btn" class="btn btn-primary">+ Nuevo proyecto</button>' : ''}
          <button id="logout-btn" class="btn btn-secondary">Cerrar sesión</button>
        </div>
      </div>

      <section>
        <h2 style="font-size: var(--font-size-sm); color: var(--color-text-secondary); font-weight: var(--font-weight-medium); margin-bottom: var(--space-3); text-transform: uppercase; letter-spacing: 0.04em;">
          Recent Projects
        </h2>
        <div id="project-list-body" class="stack gap-3">
          <p class="text-muted" style="font-size: var(--font-size-sm);">Cargando proyectos…</p>
        </div>
      </section>

      <app-modal id="create-project-modal"></app-modal>
    </main>
  `;

  container.querySelector('#logout-btn').addEventListener('click', async () => {
    await signOutUser();
    router.navigate('/login');
  });

  const listBody = container.querySelector('#project-list-body');
  const modal = container.querySelector('#create-project-modal');
  const modalPanel = modal.querySelector('.app-modal-panel');

  if (user.role === 'client') {
    container.querySelector('#create-project-btn').addEventListener('click', () => {
      renderProjectCreateForm(modalPanel, {
        onSubmit: async (name) => {
          await createProject({ name, clientId: user.uid });
          modal.close();
        },
      });
      modal.open();
    });

    modal.addEventListener('cancelled', () => modal.close());
  }

  let lastProjects = [];

  function renderProjects(projects) {
    lastProjects = projects;

    if (projects.length === 0) {
      listBody.innerHTML = `
        <p class="text-muted" style="font-size: var(--font-size-sm);">
          ${user.role === 'client' ? 'Aún no has creado ningún proyecto.' : 'No hay proyectos todavía.'}
        </p>
      `;
      return;
    }

    listBody.innerHTML = '';
    for (const project of projects) {
      const card = document.createElement('project-card');
      card.project = project;
      listBody.appendChild(card);
    }
  }

  listBody.addEventListener('project-selected', (event) => {
    const { projectId } = event.detail;
    const selectedProject = lastProjects.find((p) => p.id === projectId);

    const isRecoverableByClient = selectedProject?.status === 'draft'
      || selectedProject?.status === 'error'
      || selectedProject?.status === 'processing';

    if (user.role === 'client' && isRecoverableByClient) {
      router.navigate(`/projects/${projectId}/upload`);
      return;
    }

    if (user.role === 'designer' && selectedProject?.status === 'ready_for_workspace') {
      router.navigate(`/projects/${projectId}/workspace`);
      return;
    }

    console.log('[project-list] selected project (no detail view yet for this status):', projectId, selectedProject?.status);
  });

  const unsubscribeProjects = subscribeToProjects(user, renderProjects);

  return () => unsubscribeProjects();
}

/**
 * Shown when a user authenticates successfully but has no "role" custom
 * claim yet (e.g. an account just created in the Firebase Console before
 * running functions/scripts/set-role.js).
 * @param {HTMLElement} container
 * @param {{email: string}} user
 */
function renderNoRoleState(container, user) {
  container.innerHTML = `
    <main class="stack" style="align-items:center; justify-content:center; min-height:100vh; text-align:center;">
      <section class="panel" style="padding: var(--space-6); width: 380px;">
        <h1 style="font-size: var(--font-size-lg); margin-bottom: var(--space-3); color: var(--color-warning);">
          Cuenta sin rol asignado
        </h1>
        <p class="text-secondary" style="font-size: var(--font-size-sm); margin-bottom: var(--space-5);">
          La cuenta <strong>${user.email}</strong> existe pero todavía no tiene un rol
          (cliente o designer) asignado. Contacta al administrador para que ejecute
          el script de asignación de roles.
        </p>
        <button id="logout-btn" class="btn btn-secondary" style="width: 100%; justify-content:center;">
          Cerrar sesión
        </button>
      </section>
    </main>
  `;

  container.querySelector('#logout-btn').addEventListener('click', async () => {
    await signOutUser();
    router.navigate('/login');
  });
}
