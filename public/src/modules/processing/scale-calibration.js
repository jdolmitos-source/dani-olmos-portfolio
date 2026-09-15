/**
 * Scale Calibration (pure JavaScript)
 * -----------------------------------------------------------------------
 * Attempts to find the photographed reference object among the
 * non-largest connected components (see background-removal.js) and
 * compute a px-per-mm ratio from its known real-world size.
 *
 * Best-effort classical heuristic (rectangularity test), NOT a robust
 * object detector — flagged as an open, accepted risk during
 * architecture review (Risk #2). Always reports whether it actually
 * found something (`referenceObjectDetected`) rather than guessing; the
 * designer can calibrate manually in the workspace if this fails.
 * -----------------------------------------------------------------------
 */

const MIN_RECTANGULARITY = 0.75; // pixelCount / boundingBoxArea — cards/paper are near-rectangular
const MIN_COMPONENT_PIXELS = 200; // ignore tiny noise specks

/**
 * @param {Array<{label:number, pixelCount:number, minX:number, maxX:number, minY:number, maxY:number}>} candidateComponents - every component EXCEPT the largest (the last itself)
 * @param {number} knownSizeMm - real-world size of the reference object's longer side
 * @returns {{ pxPerMm: number|null, referenceObjectDetected: boolean }}
 */
export function calibrateScale(candidateComponents, knownSizeMm) {
  for (const component of candidateComponents) {
    if (component.pixelCount < MIN_COMPONENT_PIXELS) continue;

    const boxWidth = component.maxX - component.minX + 1;
    const boxHeight = component.maxY - component.minY + 1;
    const boxArea = boxWidth * boxHeight;
    if (boxArea === 0) continue;

    const rectangularity = component.pixelCount / boxArea;
    if (rectangularity < MIN_RECTANGULARITY) continue;

    const longerSidePx = Math.max(boxWidth, boxHeight);
    return { pxPerMm: longerSidePx / knownSizeMm, referenceObjectDetected: true };
  }

  return { pxPerMm: null, referenceObjectDetected: false };
}
