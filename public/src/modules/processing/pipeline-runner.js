/**
 * Pipeline Runner (pure JavaScript)
 * -----------------------------------------------------------------------
 * Orchestrates the full processing pipeline for a single view:
 * background removal -> contour extraction -> scale calibration.
 * No external image-processing library — see segmentation-utils.js and
 * README "Patch notes" for why OpenCV.js/WASM was dropped entirely.
 *
 * DOM-free: uses `createImageBitmap` + `OffscreenCanvas`, so this exact
 * code runs unmodified both on the main thread and inside the
 * processing Web Worker (see processing.worker.js).
 * -----------------------------------------------------------------------
 */

import { segmentForeground, applyMaskToImageData } from './background-removal.js';
import { extractContourPoints } from './contour-extraction.js';
import { calibrateScale } from './scale-calibration.js';

/**
 * @param {Blob} blob
 * @returns {Promise<ImageData>}
 */
async function loadImageData(blob) {
  const imageBitmap = await createImageBitmap(blob);
  const canvas = new OffscreenCanvas(imageBitmap.width, imageBitmap.height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(imageBitmap, 0, 0);
  const imageData = ctx.getImageData(0, 0, imageBitmap.width, imageBitmap.height);
  imageBitmap.close();
  return imageData;
}

/**
 * @param {ImageData} imageData
 * @returns {Promise<Blob>}
 */
async function imageDataToBlob(imageData) {
  const canvas = new OffscreenCanvas(imageData.width, imageData.height);
  const ctx = canvas.getContext('2d');
  ctx.putImageData(imageData, 0, 0);
  return canvas.convertToBlob({ type: 'image/png' });
}

/**
 * @param {Blob} blob - the view photo (already compressed by upload.service.js)
 * @param {number} knownSizeMm - the reference object's known real-world size
 * @returns {Promise<{
 *   processedImageBlob: Blob,
 *   contourPoints: Array<{x: number, y: number}>,
 *   calibration: { pxPerMm: number|null, referenceObjectDetected: boolean }
 * }>}
 */
export async function runPipelineForView(blob, knownSizeMm) {
  const imageData = await loadImageData(blob);

  const { labels, components } = segmentForeground(imageData);

  if (components.length === 0) {
    throw new Error('No se detectó ningún objeto en la imagen. Verifica el fondo y la iluminación.');
  }

  const lastComponent = components[0]; // largest blob = the shoe last

  const maskedImageData = applyMaskToImageData(imageData, labels, lastComponent.label);
  const contourPoints = extractContourPoints(labels, imageData.width, lastComponent);
  const calibration = calibrateScale(components.slice(1), knownSizeMm);
  const processedImageBlob = await imageDataToBlob(maskedImageData);

  return { processedImageBlob, contourPoints, calibration };
}
