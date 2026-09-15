/**
 * Segmentation Utils (pure JavaScript, no external dependencies)
 * -----------------------------------------------------------------------
 * Replaces the previous OpenCV.js-based pipeline entirely. This was a
 * deliberate architecture change (see README "Patch notes"): after
 * extensive testing, running OpenCV.js's WASM runtime inside a Web
 * Worker caused the JS execution context to freeze completely and
 * irrecoverably right after initialization — reproduced identically
 * across Chrome, Edge, and a phone browser, indicating a build-specific
 * issue rather than a bug in our own code. Rather than keep chasing that,
 * the actual algorithms we need (Otsu thresholding, basic morphology,
 * connected-component labeling) are straightforward enough to implement
 * directly against a canvas's `ImageData`, with zero external
 * dependencies and full control over every line that runs.
 *
 * Every function here operates on a flat `Uint8Array`/`Uint8ClampedArray`
 * mask (1 = foreground, 0 = background) or on raw `ImageData`, indexed
 * row-major: `index = y * width + x`.
 * -----------------------------------------------------------------------
 */

/**
 * @param {ImageData} imageData
 * @returns {Uint8Array} single-channel grayscale, one byte per pixel
 */
export function toGrayscale(imageData) {
  const { data, width, height } = imageData;
  const gray = new Uint8Array(width * height);

  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    // Standard luminance-weighted grayscale conversion.
    gray[p] = (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]) | 0;
  }

  return gray;
}

/**
 * Computes Otsu's threshold: the grayscale value that best separates
 * the image into two classes (foreground/background) by maximizing
 * between-class variance. Standard, well-known algorithm.
 * @param {Uint8Array} gray
 * @returns {number} threshold in [0, 255]
 */
export function computeOtsuThreshold(gray) {
  const histogram = new Uint32Array(256);
  for (let i = 0; i < gray.length; i++) histogram[gray[i]]++;

  const total = gray.length;
  let sumAll = 0;
  for (let t = 0; t < 256; t++) sumAll += t * histogram[t];

  let sumBackground = 0;
  let weightBackground = 0;
  let bestThreshold = 0;
  let bestVariance = 0;

  for (let t = 0; t < 256; t++) {
    weightBackground += histogram[t];
    if (weightBackground === 0) continue;

    const weightForeground = total - weightBackground;
    if (weightForeground === 0) break;

    sumBackground += t * histogram[t];

    const meanBackground = sumBackground / weightBackground;
    const meanForeground = (sumAll - sumBackground) / weightForeground;
    const meanDiff = meanBackground - meanForeground;

    const betweenClassVariance = weightBackground * weightForeground * meanDiff * meanDiff;

    if (betweenClassVariance > bestVariance) {
      bestVariance = betweenClassVariance;
      bestThreshold = t;
    }
  }

  return bestThreshold;
}

/**
 * Binarizes a grayscale image against a threshold, assuming a light
 * (controlled) background and a darker/more saturated foreground object
 * — matching the reference photos shown to clients during upload
 * (plain light background, object + reference card on top).
 * @param {Uint8Array} gray
 * @param {number} threshold
 * @returns {Uint8Array} mask (1 = foreground, 0 = background)
 */
export function binarize(gray, threshold) {
  const mask = new Uint8Array(gray.length);
  for (let i = 0; i < gray.length; i++) {
    mask[i] = gray[i] < threshold ? 1 : 0;
  }
  return mask;
}

/**
 * Binary dilation with a square kernel: a pixel becomes foreground if
 * ANY pixel in its kernel neighborhood is foreground.
 * @param {Uint8Array} mask
 * @param {number} width
 * @param {number} height
 * @param {number} radius - kernel is (2*radius+1) x (2*radius+1)
 * @returns {Uint8Array}
 */
export function dilate(mask, width, height, radius) {
  const output = new Uint8Array(mask.length);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let found = false;

      for (let dy = -radius; dy <= radius && !found; dy++) {
        const ny = y + dy;
        if (ny < 0 || ny >= height) continue;

        for (let dx = -radius; dx <= radius; dx++) {
          const nx = x + dx;
          if (nx < 0 || nx >= width) continue;

          if (mask[ny * width + nx] === 1) {
            found = true;
            break;
          }
        }
      }

      output[y * width + x] = found ? 1 : 0;
    }
  }

  return output;
}

/**
 * Binary erosion with a square kernel: a pixel stays foreground only if
 * EVERY pixel in its kernel neighborhood is foreground.
 * @param {Uint8Array} mask
 * @param {number} width
 * @param {number} height
 * @param {number} radius
 * @returns {Uint8Array}
 */
export function erode(mask, width, height, radius) {
  const output = new Uint8Array(mask.length);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let allForeground = true;

      for (let dy = -radius; dy <= radius && allForeground; dy++) {
        const ny = y + dy;
        if (ny < 0 || ny >= height) {
          allForeground = false;
          break;
        }

        for (let dx = -radius; dx <= radius; dx++) {
          const nx = x + dx;
          if (nx < 0 || nx >= width || mask[ny * width + nx] === 0) {
            allForeground = false;
            break;
          }
        }
      }

      output[y * width + x] = allForeground ? 1 : 0;
    }
  }

  return output;
}

/**
 * Morphological closing (dilate then erode) — fills small holes/gaps
 * inside the foreground blob without changing its overall size.
 * @param {Uint8Array} mask
 * @param {number} width
 * @param {number} height
 * @param {number} [radius]
 * @returns {Uint8Array}
 */
export function morphologicalClose(mask, width, height, radius = 2) {
  return erode(dilate(mask, width, height, radius), width, height, radius);
}

/**
 * Morphological opening (erode then dilate) — removes small noise
 * specks without changing the overall size of larger blobs.
 * @param {Uint8Array} mask
 * @param {number} width
 * @param {number} height
 * @param {number} [radius]
 * @returns {Uint8Array}
 */
export function morphologicalOpen(mask, width, height, radius = 2) {
  return dilate(erode(mask, width, height, radius), width, height, radius);
}

/**
 * Labels every 4-connected foreground blob using an iterative
 * (stack-based, non-recursive — safe for large blobs) flood fill.
 * @param {Uint8Array} mask
 * @param {number} width
 * @param {number} height
 * @returns {{
 *   labels: Int32Array,
 *   components: Array<{ label: number, pixelCount: number, minX: number, maxX: number, minY: number, maxY: number }>
 * }} components sorted by pixelCount, descending
 */
export function findConnectedComponents(mask, width, height) {
  const labels = new Int32Array(mask.length); // 0 = unlabeled/background
  const components = [];
  let nextLabel = 1;

  const stack = [];

  for (let startY = 0; startY < height; startY++) {
    for (let startX = 0; startX < width; startX++) {
      const startIndex = startY * width + startX;
      if (mask[startIndex] !== 1 || labels[startIndex] !== 0) continue;

      const label = nextLabel++;
      labels[startIndex] = label;
      stack.length = 0;
      stack.push(startIndex);

      let pixelCount = 0;
      let minX = startX, maxX = startX, minY = startY, maxY = startY;

      while (stack.length > 0) {
        const index = stack.pop();
        const x = index % width;
        const y = (index / width) | 0;

        pixelCount++;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;

        // 4-connected neighbors.
        if (x > 0) {
          const i = index - 1;
          if (mask[i] === 1 && labels[i] === 0) { labels[i] = label; stack.push(i); }
        }
        if (x < width - 1) {
          const i = index + 1;
          if (mask[i] === 1 && labels[i] === 0) { labels[i] = label; stack.push(i); }
        }
        if (y > 0) {
          const i = index - width;
          if (mask[i] === 1 && labels[i] === 0) { labels[i] = label; stack.push(i); }
        }
        if (y < height - 1) {
          const i = index + width;
          if (mask[i] === 1 && labels[i] === 0) { labels[i] = label; stack.push(i); }
        }
      }

      components.push({ label, pixelCount, minX, maxX, minY, maxY });
    }
  }

  components.sort((a, b) => b.pixelCount - a.pixelCount);
  return { labels, components };
}
