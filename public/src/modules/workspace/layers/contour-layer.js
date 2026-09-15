/**
 * Contour Layer
 * -----------------------------------------------------------------------
 * Renders the extracted contour (see modules/processing/contour-extraction.js)
 * as a Konva.Line overlay on top of the image layer.
 * -----------------------------------------------------------------------
 */

import Konva from 'https://cdn.jsdelivr.net/npm/konva@9.3.14/+esm';

/**
 * @param {any} layer - a Konva.Layer
 * @param {Array<{x: number, y: number}>|undefined} contourPoints
 * @param {{ stroke?: string, strokeWidth?: number, fill?: string }} [options]
 * @returns {any|null} the created Konva.Line, or null if there were no points
 */
export function renderContourLayer(layer, contourPoints, options = {}) {
  layer.destroyChildren();

  if (!contourPoints || contourPoints.length === 0) return null;

  const flatPoints = contourPoints.flatMap((point) => [point.x, point.y]);

  const line = new Konva.Line({
    points: flatPoints,
    closed: true,
    stroke: options.stroke ?? '#3B82F6',
    strokeWidth: options.strokeWidth ?? 2,
    fill: options.fill ?? 'rgba(59, 130, 246, 0.10)',
  });

  layer.add(line);
  layer.batchDraw();

  return line;
}
