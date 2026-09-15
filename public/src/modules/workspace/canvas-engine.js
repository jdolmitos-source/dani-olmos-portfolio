/**
 * Canvas Engine
 * -----------------------------------------------------------------------
 * Thin wrapper around Konva.js: stage/layer setup and zoom/pan. The rest
 * of the workspace module talks to THIS API, never to Konva directly —
 * if Konva is ever swapped out, this is the only file that changes.
 *
 * Loaded from a CDN ESM build (no bundler in this project, same pattern
 * as core/firebase-config.js).
 * -----------------------------------------------------------------------
 */

import Konva from 'https://cdn.jsdelivr.net/npm/konva@9.3.14/+esm';

const ZOOM_STEP = 1.05;
const MIN_SCALE = 0.1;
const MAX_SCALE = 8;

export class CanvasEngine {
  /**
   * @param {HTMLElement} containerEl
   * @param {{ width: number, height: number }} size
   */
  constructor(containerEl, { width, height }) {
    this.stage = new Konva.Stage({ container: containerEl, width, height, draggable: true });
    this.imageLayer = new Konva.Layer();
    this.contourLayer = new Konva.Layer();

    this.stage.add(this.imageLayer);
    this.stage.add(this.contourLayer);

    this.#wireWheelZoom();
  }

  #wireWheelZoom() {
    this.stage.on('wheel', (event) => {
      event.evt.preventDefault();

      const oldScale = this.stage.scaleX();
      const pointer = this.stage.getPointerPosition();
      if (!pointer) return;

      const mousePointTo = {
        x: (pointer.x - this.stage.x()) / oldScale,
        y: (pointer.y - this.stage.y()) / oldScale,
      };

      const direction = event.evt.deltaY > 0 ? -1 : 1;
      const rawScale = direction > 0 ? oldScale * ZOOM_STEP : oldScale / ZOOM_STEP;
      const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, rawScale));

      this.stage.scale({ x: newScale, y: newScale });
      this.stage.position({
        x: pointer.x - mousePointTo.x * newScale,
        y: pointer.y - mousePointTo.y * newScale,
      });
    });
  }

  resetView() {
    this.stage.scale({ x: 1, y: 1 });
    this.stage.position({ x: 0, y: 0 });
  }

  resize(width, height) {
    this.stage.width(width);
    this.stage.height(height);
  }

  destroy() {
    this.stage.destroy();
  }
}
