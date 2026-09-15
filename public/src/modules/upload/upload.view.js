/**
 * Upload View
 * -----------------------------------------------------------------------
 * Route: /projects/:id/upload
 * Guarded to "client" only (see core/main.js). Ownership + project status
 * are re-checked here as well, since a client could still guess another
 * client's project id in the URL — Firestore rules are the real
 * enforcement, but a friendly message here beats a raw permission error.
 * -----------------------------------------------------------------------
 */

import { getProject, submitUpload, VIEW_TYPES } from './upload.service.js';
import { getCurrentUser } from '../auth/auth.service.js';
import { router } from '../../core/router.js';
import { isValidImageFile, isNumberInRange } from '../../utils/validators.js';
import { REFERENCE_OBJECTS } from '../../utils/reference-objects.js';

const VIEW_LABELS = {
  top: 'Vista superior (Top)',
  side: 'Vista lateral (Side)',
  rear: 'Vista trasera (Rear)',
};

const LAST_LENGTH_RANGE = { min: 50, max: 400 }; // mm — plausible shoe last length range
const CUSTOM_REFERENCE_RANGE = { min: 1, max: 500 }; // mm

/**
 * @param {Record<string, string>} params
 * @param {HTMLElement} container
 */
export async function renderUploadView(params, container) {
  const user = getCurrentUser();
  const projectId = params.id;

  container.innerHTML = `
    <main style="padding: var(--space-6);">
      <p class="text-muted" style="font-size: var(--font-size-sm);">Cargando proyecto…</p>
    </main>
  `;

  const project = await getProject(projectId);

  if (!project) {
    renderMessage(container, 'Proyecto no encontrado.', true);
    return;
  }

  if (project.clientId !== user.uid) {
    renderMessage(container, 'No tienes acceso a este proyecto.', true);
    return;
  }

  const isRecoverable = project.status === 'draft' || project.status === 'error' || project.status === 'processing';

  if (!isRecoverable) {
    renderMessage(
      container,
      `Este proyecto ya está en estado "${project.status}" — las fotos ya fueron enviadas.`,
      false,
    );
    return;
  }

  renderForm(container, project);
}

/**
 * @param {HTMLElement} container
 * @param {string} text
 * @param {boolean} isError
 */
function renderMessage(container, text, isError) {
  container.innerHTML = `
    <main class="stack" style="align-items:center; justify-content:center; min-height:100vh; text-align:center;">
      <section class="panel" style="padding: var(--space-6); width: 380px;">
        <p style="font-size: var(--font-size-sm); color: ${isError ? 'var(--color-danger)' : 'var(--color-text-secondary)'};">
          ${text}
        </p>
        <button id="back-btn" class="btn btn-secondary" style="margin-top: var(--space-4); width: 100%; justify-content: center;">
          Volver a proyectos
        </button>
      </section>
    </main>
  `;

  container.querySelector('#back-btn').addEventListener('click', () => router.navigate('/projects'));
}

/**
 * @param {HTMLElement} container
 * @param {Record<string, any>} project
 */
function renderForm(container, project) {
  const isRetry = project.status === 'error' || project.status === 'processing';

  container.innerHTML = `
    <main style="padding: var(--space-6); max-width: 640px; margin: 0 auto;">
      <button id="back-btn" class="btn btn-secondary" style="margin-bottom: var(--space-5);">← Volver</button>

      <h1 style="font-size: var(--font-size-xl); margin-bottom: var(--space-1);">${project.name}</h1>
      <p class="text-secondary" style="font-size: var(--font-size-sm); margin-bottom: var(--space-6);">
        Sube las 3 vistas de la horma, junto con un objeto de referencia visible en cada foto.
      </p>

      ${isRetry ? `
        <div class="panel" style="padding: var(--space-4); margin-bottom: var(--space-5); border-color: var(--color-warning);">
          <p style="font-size: var(--font-size-sm); color: var(--color-warning); margin-bottom: var(--space-1);">
            ${project.status === 'error'
              ? `El intento anterior falló${project.errorMessage ? `: ${project.errorMessage}` : '.'}`
              : 'El procesamiento anterior quedó incompleto (por ejemplo, si cerraste la pestaña antes de que terminara).'}
          </p>
          <p class="text-secondary" style="font-size: var(--font-size-sm);">
            Puedes volver a subir las 3 fotos para reintentar el procesamiento.
          </p>
        </div>
      ` : ''}

      <form id="upload-form" class="stack gap-5" novalidate>
        ${VIEW_TYPES.map((viewType) => renderFileField(viewType)).join('')}

        <div class="field">
          <label for="last-length">Last Length (mm)</label>
          <input id="last-length" name="lastLength" type="number" step="0.1" min="${LAST_LENGTH_RANGE.min}" max="${LAST_LENGTH_RANGE.max}" required />
        </div>

        <div class="field">
          <label for="reference-type">Objeto de referencia fotografiado</label>
          <select id="reference-type" name="referenceType" required>
            ${Object.entries(REFERENCE_OBJECTS).map(([key, config]) => `<option value="${key}">${config.label}</option>`).join('')}
          </select>
        </div>

        <div class="field" id="custom-reference-field" style="display: none;">
          <label for="reference-custom-size">Medida del objeto (mm)</label>
          <input id="reference-custom-size" name="referenceCustomSize" type="number" step="0.1" min="${CUSTOM_REFERENCE_RANGE.min}" max="${CUSTOM_REFERENCE_RANGE.max}" />
        </div>

        <p id="upload-error" role="alert" style="color: var(--color-danger); font-size: var(--font-size-sm); min-height: 1.2em; margin: 0;"></p>
        <p id="upload-progress" style="color: var(--color-accent); font-size: var(--font-size-sm); min-height: 1.2em; margin: 0;"></p>

        <button id="upload-submit" type="submit" class="btn btn-primary" style="justify-content: center;">
          Enviar
        </button>
      </form>
    </main>
  `;

  container.querySelector('#back-btn').addEventListener('click', () => router.navigate('/projects'));

  wireFilePreviews(container);
  wireReferenceObjectToggle(container);
  wireSubmit(container, project.id);
}

/**
 * @param {'top'|'side'|'rear'} viewType
 */
function renderFileField(viewType) {
  return `
    <div class="field">
      <label for="file-${viewType}">${VIEW_LABELS[viewType]}</label>
      <input id="file-${viewType}" name="file-${viewType}" type="file" accept="image/jpeg,image/png,image/webp" data-view-type="${viewType}" required />
      <img id="preview-${viewType}" alt="Previsualización de ${VIEW_LABELS[viewType]}" style="display:none; margin-top: var(--space-2); max-height: 200px; max-width: 100%; width: auto; align-self: flex-start; object-fit: contain; border-radius: var(--radius-sm); border: 1px solid var(--color-border);" />
    </div>
  `;
}

/**
 * @param {HTMLElement} container
 */
function wireFilePreviews(container) {
  for (const viewType of VIEW_TYPES) {
    const input = container.querySelector(`#file-${viewType}`);
    const preview = container.querySelector(`#preview-${viewType}`);

    input.addEventListener('change', () => {
      const file = input.files?.[0];
      if (!file) {
        preview.style.display = 'none';
        return;
      }
      preview.src = URL.createObjectURL(file);
      preview.style.display = 'block';
    });
  }
}

/**
 * @param {HTMLElement} container
 */
function wireReferenceObjectToggle(container) {
  const select = container.querySelector('#reference-type');
  const customField = container.querySelector('#custom-reference-field');
  const customInput = container.querySelector('#reference-custom-size');

  select.addEventListener('change', () => {
    const isCustom = REFERENCE_OBJECTS[select.value].knownSizeMm === null;
    customField.style.display = isCustom ? 'flex' : 'none';
    customInput.required = isCustom;
  });
}

/**
 * @param {HTMLElement} container
 * @param {string} projectId
 */
function wireSubmit(container, projectId) {
  const form = container.querySelector('#upload-form');
  const errorEl = container.querySelector('#upload-error');
  const progressEl = container.querySelector('#upload-progress');
  const submitButton = container.querySelector('#upload-submit');

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    errorEl.textContent = '';
    progressEl.textContent = '';

    const files = {};
    for (const viewType of VIEW_TYPES) {
      const input = container.querySelector(`#file-${viewType}`);
      const file = input.files?.[0];
      if (!isValidImageFile(file)) {
        errorEl.textContent = `Selecciona una imagen válida (JPEG/PNG/WebP, máx. 15MB) para "${VIEW_LABELS[viewType]}".`;
        return;
      }
      files[viewType] = file;
    }

    const lastLengthValue = Number(container.querySelector('#last-length').value);
    if (!isNumberInRange(lastLengthValue, LAST_LENGTH_RANGE.min, LAST_LENGTH_RANGE.max)) {
      errorEl.textContent = `Ingresa un Last Length entre ${LAST_LENGTH_RANGE.min} y ${LAST_LENGTH_RANGE.max} mm.`;
      return;
    }

    const referenceType = container.querySelector('#reference-type').value;
    const referenceConfig = REFERENCE_OBJECTS[referenceType];
    let knownSizeMm = referenceConfig.knownSizeMm;

    if (knownSizeMm === null) {
      knownSizeMm = Number(container.querySelector('#reference-custom-size').value);
      if (!isNumberInRange(knownSizeMm, CUSTOM_REFERENCE_RANGE.min, CUSTOM_REFERENCE_RANGE.max)) {
        errorEl.textContent = `Ingresa una medida del objeto de referencia entre ${CUSTOM_REFERENCE_RANGE.min} y ${CUSTOM_REFERENCE_RANGE.max} mm.`;
        return;
      }
    }

    submitButton.disabled = true;

    try {
      await submitUpload(
        projectId,
        {
          files,
          lastLength: lastLengthValue,
          referenceObject: { type: referenceType, knownSizeMm },
        },
        (stepLabel) => { progressEl.textContent = stepLabel; },
      );

      progressEl.textContent = 'Listo — proyecto enviado.';
      router.navigate('/projects');
    } catch (error) {
      console.error('[upload] submit failed:', error);
      errorEl.textContent = 'No se pudo completar la subida. Inténtalo de nuevo.';
      submitButton.disabled = false;
      progressEl.textContent = '';
    }
  });
}
