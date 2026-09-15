/**
 * Background Removal (pure JavaScript)
 * -----------------------------------------------------------------------
 * Classical (non-ML) segmentation assuming a plain, controlled
 * background — as instructed to the client during photo capture, and
 * now reinforced with reference thumbnails right on the upload form
 * (see modules/upload/upload.view.js). Otsu thresholding + morphological
 * cleanup + connected-component labeling, no external libraries.
 * -----------------------------------------------------------------------
 */

import {
  toGrayscale,
  computeOtsuThreshold,
  binarize,
  morphologicalClose,
  morphologicalOpen,
  findConnectedComponents,
} from './segmentation-utils.js';

const MORPHOLOGY_RADIUS = 2; // ~5x5 kernel, matches the previous OpenCV version

/**
 * @param {ImageData} imageData
 * @returns {{
 *   labels: Int32Array,
 *   components: Array<{label:number, pixelCount:number, minX:number, maxX:number, minY:number, maxY:number}>,
 *   width: number,
 *   height: number,
 * }}
 */
export function segmentForeground(imageData) {
  const { width, height } = imageData;

  const gray = toGrayscale(imageData);
  const threshold = computeOtsuThreshold(gray);
  let mask = binarize(gray, threshold);

  mask = morphologicalClose(mask, width, height, MORPHOLOGY_RADIUS);
  mask = morphologicalOpen(mask, width, height, MORPHOLOGY_RADIUS);

  const { labels, components } = findConnectedComponents(mask, width, height);

  return { labels, components, width, height };
}

/**
 * Produces a new ImageData with every pixel NOT belonging to
 * `targetLabel` made fully transparent — the "background removed"
 * result.
 * @param {ImageData} imageData
 * @param {Int32Array} labels
 * @param {number} targetLabel
 * @returns {ImageData}
 */
export function applyMaskToImageData(imageData, labels, targetLabel) {
  const { width, height, data } = imageData;
  const output = new ImageData(width, height);
  const outData = output.data;

  for (let p = 0; p < labels.length; p++) {
    const i = p * 4;
    outData[i] = data[i];
    outData[i + 1] = data[i + 1];
    outData[i + 2] = data[i + 2];
    outData[i + 3] = labels[p] === targetLabel ? 255 : 0;
  }

  return output;
}
