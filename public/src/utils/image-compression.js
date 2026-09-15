/**
 * Image Compression Utils
 * -----------------------------------------------------------------------
 * Resizes and re-encodes an image file client-side, before it ever
 * touches Storage. This keeps Storage usage under control AND keeps the
 * in-browser OpenCV.js pipeline (Phase 4) from choking on a 12MP photo
 * straight off a phone camera.
 *
 * Uses a plain <canvas> — no third-party library needed for this.
 * -----------------------------------------------------------------------
 */

/**
 * @param {File} file
 * @param {{ maxDimension?: number, quality?: number, mimeType?: string }} [options]
 * @returns {Promise<Blob>}
 */
export function compressImage(file, options = {}) {
  const { maxDimension = 1600, quality = 0.85, mimeType = 'image/jpeg' } = options;

  console.log('[compressImage] starting. file:', file?.name, 'size:', file?.size, 'bytes');

  return new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);

    image.onload = () => {
      console.log('[compressImage] image decoded. original dimensions:', image.width, 'x', image.height);

      const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
      const width = Math.round(image.width * scale);
      const height = Math.round(image.height * scale);

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      console.log('[compressImage] drawing to canvas at', width, 'x', height, '...');
      ctx.drawImage(image, 0, 0, width, height);
      console.log('[compressImage] drawImage done. Converting to blob...');

      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(objectUrl);
          if (!blob) {
            reject(new Error('No se pudo comprimir la imagen.'));
            return;
          }
          console.log('[compressImage] done. compressed size:', blob.size, 'bytes');
          resolve(blob);
        },
        mimeType,
        quality,
      );
    };

    image.onerror = () => {
      console.error('[compressImage] failed to decode image.');
      URL.revokeObjectURL(objectUrl);
      reject(new Error('No se pudo cargar la imagen seleccionada.'));
    };

    console.log('[compressImage] loading image from object URL...');
    image.src = objectUrl;
  });
}
