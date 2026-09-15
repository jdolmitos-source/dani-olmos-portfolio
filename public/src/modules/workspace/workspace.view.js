/**
 * Workspace View
 * -----------------------------------------------------------------------
 * Route: /projects/:id/workspace — designer-only (see core/main.js).
 * Shows the 3 processed views (top/side/rear) as tabs, each rendered on
 * a Konva canvas with the extracted contour overlaid. Read-only in this
 * phase: drawing/flattening tools are out of MVP scope (see README).
 * -----------------------------------------------------------------------
 */

import { getProjectWithViews } from './workspace.service.js';
import { router } from '../../core/router.js';
import { CanvasEngine } from './canvas-engine.js';
import { renderImageLayer } from './layers/image-layer.js';
import { renderContourLayer } from './layers/contour-layer.js';

const VIEW_ORDER = ['top', 'side', 'rear'];
const VIEW_LABELS = { top: 'Top', side: 'Side', rear: 'Rear' };

/**
 * @param {Record<string, string>} params
 * @param {HTMLElement} container
 * @returns {(() => void) | void} cleanup function
 */
export async function renderWorkspace(params, container) {
  const projectId = params.id;

  container.innerHTML = `
    <main style="padding: var(--space-6);">
      <p class="text-muted" style="font-size: var(--font-size-sm);">Cargando workspace…</p>
    </main>
  `;

  const data = await getProjectWithViews(projectId);

  if (!data) {
    renderMessage(container, 'Proyecto no encontrado.');
    return;
  }

  const { project, views } = data;

  if (project.status !== 'ready_for_workspace') {
    renderMessage(
      container,
      `Este proyecto todavía no está listo para el workspace (estado actual: "${project.status}").`,
    );
    return;
  }

  container.innerHTML = `
    <main class="stack" style="height: 100vh;">
      <div class="row" style="justify-content: space-between; align-items: center; padding: var(--space-4) var(--space-6); border-bottom: 1px solid var(--color-border-subtle);">
        <div>
          <button id="back-btn" class="btn btn-secondary" style="margin-bottom: var(--space-2);">← Volver</button>
          <h1 style="font-size: var(--font-size-lg);">${project.name}</h1>
        </div>
        <div class="row gap-2" id="view-tabs"></div>
      </div>
      <div id="canvas-container" style="flex: 1; position: relative;"></div>
    </main>
  `;

  container.querySelector('#back-btn').addEventListener('click', () => router.navigate('/projects'));

  const tabsEl = container.querySelector('#view-tabs');
  const canvasContainer = container.querySelector('#canvas-container');

  tabsEl.innerHTML = VIEW_ORDER
    .map((viewType) => `<button class="btn btn-secondary view-tab" data-view-type="${viewType}">${VIEW_LABELS[viewType]}</button>`)
    .join('');

  const engine = new CanvasEngine(canvasContainer, {
    width: canvasContainer.clientWidth || 800,
    height: canvasContainer.clientHeight || 600,
  });

  const handleResize = () => {
    engine.resize(canvasContainer.clientWidth, canvasContainer.clientHeight);
  };
  window.addEventListener('resize', handleResize);

  function setCanvasMessage(text) {
    let messageEl = canvasContainer.querySelector('.canvas-message');
    if (!messageEl) {
      messageEl = document.createElement('p');
      messageEl.className = 'canvas-message text-muted';
      messageEl.style.cssText = 'position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); font-size: var(--font-size-sm); margin:0;';
      canvasContainer.appendChild(messageEl);
    }
    messageEl.textContent = text;
    messageEl.style.display = text ? 'block' : 'none';
  }

  async function showView(viewType) {
    tabsEl.querySelectorAll('.view-tab').forEach((btn) => {
      const isActive = btn.dataset.viewType === viewType;
      btn.classList.toggle('btn-primary', isActive);
      btn.classList.toggle('btn-secondary', !isActive);
    });

    engine.resetView();
    engine.imageLayer.destroyChildren();
    engine.contourLayer.destroyChildren();
    setCanvasMessage('');

    const viewData = views[viewType];

    if (!viewData || viewData.status !== 'done') {
      const label = viewData?.status ?? 'sin datos';
      console.warn(`[workspace] view "${viewType}" is not ready (status: ${label})`);
      setCanvasMessage(`Esta vista todavía no está lista (estado: ${label}).`);
      return;
    }

    try {
      await renderImageLayer(engine.imageLayer, viewData.processedImageUrl);
      renderContourLayer(engine.contourLayer, viewData.contourPoints);
    } catch (error) {
      console.error(`[workspace] failed to render view "${viewType}":`, error);
      setCanvasMessage('No se pudo cargar esta vista. Revisa la consola para más detalles.');
    }
  }

  tabsEl.querySelectorAll('.view-tab').forEach((btn) => {
    btn.addEventListener('click', () => showView(btn.dataset.viewType));
  });

  await showView(VIEW_ORDER[0]);

  return () => {
    window.removeEventListener('resize', handleResize);
    engine.destroy();
  };
}

/**
 * @param {HTMLElement} container
 * @param {string} text
 */
function renderMessage(container, text) {
  container.innerHTML = `
    <main class="stack" style="align-items:center; justify-content:center; min-height:100vh; text-align:center;">
      <section class="panel" style="padding: var(--space-6); width: 380px;">
        <p style="font-size: var(--font-size-sm); color: var(--color-text-secondary);">${text}</p>
        <button id="back-btn" class="btn btn-secondary" style="margin-top: var(--space-4); width: 100%; justify-content: center;">
          Volver a proyectos
        </button>
      </section>
    </main>
  `;

  container.querySelector('#back-btn').addEventListener('click', () => router.navigate('/projects'));
}
