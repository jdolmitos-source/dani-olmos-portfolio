/**
 * Image Layer
 * -----------------------------------------------------------------------
 * Renders the processed (background-removed) photo as a Konva image on
 * the given layer. Loads the HTMLImageElement manually (instead of
 * relying on Konva.Image.fromURL's built-in loader) so we get a single
 * network request and a real error handler if the URL fails to load.
 * -----------------------------------------------------------------------
 */

import Konva from 'https://cdn.jsdelivr.net/npm/konva@9.3.14/+esm';

/**
 * @param {any} layer - a Konva.Layer
 * @param {string} imageUrl
 * @returns {Promise<any>} resolves with the created Konva.Image
 */
export function renderImageLayer(layer, imageUrl) {
  return new Promise((resolve, reject) => {
    layer.destroyChildren();

    const htmlImage = new Image();
    // NOTE: no `crossOrigin = 'anonymous'` here on purpose. Setting it
    // REQUIRES the Storage bucket to have CORS configured for this
    // origin, which it isn't (Firebase Storage doesn't set this up by
    // default) — with it set, the image silently fails to load (only
    // visible as a console error, never surfaced to the UI). We don't
    // need cross-origin pixel access yet (no canvas export/inspection
    // in this phase), so plain image loading is enough and avoids
    // needing any bucket CORS configuration for now.

    htmlImage.onload = () => {
      const konvaImage = new Konva.Image({
        image: htmlImage,
        width: htmlImage.width,
        height: htmlImage.height,
      });

      layer.add(konvaImage);
      layer.batchDraw();
      resolve(konvaImage);
    };

    htmlImage.onerror = () => reject(new Error('No se pudo cargar la imagen procesada.'));
    htmlImage.src = imageUrl;
  });
}
