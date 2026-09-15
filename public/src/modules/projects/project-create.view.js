/**
 * Project Create Form
 * -----------------------------------------------------------------------
 * Renders the "new project" form into a given container (typically the
 * panel of an <app-modal>). Only `name` is collected here — per the
 * data model, lastLength/referenceObject are attached later during
 * upload (Phase 3).
 *
 * This is intentionally NOT a router view: project creation happens in a
 * modal on top of the dashboard, not as its own page.
 * -----------------------------------------------------------------------
 */

import { isRequired, isWithinMaxLength } from '../../utils/validators.js';

const MAX_NAME_LENGTH = 100; // must match firestore.rules' projects create check

/**
 * @param {HTMLElement} container - typically an <app-modal>'s panel element
 * @param {{ onSubmit: (name: string) => Promise<void> }} options
 */
export function renderProjectCreateForm(container, { onSubmit }) {
  container.innerHTML = `
    <h2 style="font-size: var(--font-size-lg); margin-bottom: var(--space-4);">Nuevo proyecto</h2>

    <form id="project-create-form" class="stack gap-4" novalidate>
      <div class="field">
        <label for="project-name">Nombre del proyecto</label>
        <input id="project-name" name="name" type="text" maxlength="100" required />
      </div>

      <p id="project-create-error" role="alert" style="color: var(--color-danger); font-size: var(--font-size-sm); min-height: 1.2em; margin: 0;"></p>

      <div class="row gap-3" style="justify-content: flex-end;">
        <button type="button" id="project-create-cancel" class="btn btn-secondary">Cancelar</button>
        <button type="submit" id="project-create-submit" class="btn btn-primary">Crear</button>
      </div>
    </form>
  `;

  const form = container.querySelector('#project-create-form');
  const nameInput = container.querySelector('#project-name');
  const errorEl = container.querySelector('#project-create-error');
  const submitButton = container.querySelector('#project-create-submit');
  const cancelButton = container.querySelector('#project-create-cancel');

  cancelButton.addEventListener('click', () => {
    container.dispatchEvent(new CustomEvent('cancelled', { bubbles: true }));
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    errorEl.textContent = '';

    const name = nameInput.value.trim();
    if (!isRequired(name)) {
      errorEl.textContent = 'Ingresa un nombre para el proyecto.';
      return;
    }
    if (!isWithinMaxLength(name, MAX_NAME_LENGTH)) {
      errorEl.textContent = `El nombre no puede superar los ${MAX_NAME_LENGTH} caracteres.`;
      return;
    }

    submitButton.disabled = true;
    submitButton.textContent = 'Creando…';

    try {
      await onSubmit(name);
    } catch (error) {
      console.error('[project-create] failed to create project:', error);
      errorEl.textContent = 'No se pudo crear el proyecto. Inténtalo de nuevo.';
      submitButton.disabled = false;
      submitButton.textContent = 'Crear';
    }
  });
}
