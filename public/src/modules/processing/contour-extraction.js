/**
 * Contour Extraction (pure JavaScript)
 * -----------------------------------------------------------------------
 * Extracts a closed silhouette polygon for a single labeled component
 * using a row-scan technique: for each row, record the leftmost and
 * rightmost pixel belonging to that component, then walk down the left
 * edge and back up the right edge to form a closed polygon.
 *
 * KNOWN LIMITATION (deliberate, documented trade-off): this correctly
 * handles simple, mostly-convex, single-blob silhouettes without holes —
 * which matches a shoe last photographed as instructed (see reference
 * thumbnails in the upload form). It does NOT correctly trace deep
 * concavities/C-shapes or shapes with holes, unlike a full
 * Moore-neighbor boundary trace. That algorithm is meaningfully more
 * complex and error-prone to get right without a live browser to test
 * against — if real-world lasts ever need it, this is the file to
 * revisit; nothing else in the pipeline would need to change.
 * -----------------------------------------------------------------------
 */

const ROW_STEP = 3; // sample every 3rd row — keeps point count reasonable
const MIN_SEGMENT_LENGTH = 2; // px — collapse near-duplicate consecutive points

/**
 * @param {Int32Array} labels - from background-removal.js's segmentForeground()
 * @param {number} width
 * @param {{ label: number, minX: number, maxX: number, minY: number, maxY: number }} component
 * @returns {Array<{x: number, y: number}>} closed polygon
 */
export function extractContourPoints(labels, width, component) {
  const { label, minY, maxY } = component;
  const leftPoints = [];
  const rightPoints = [];

  for (let y = minY; y <= maxY; y += ROW_STEP) {
    let leftX = -1;
    let rightX = -1;
    const rowStart = y * width;

    for (let x = component.minX; x <= component.maxX; x++) {
      if (labels[rowStart + x] === label) {
        if (leftX === -1) leftX = x;
        rightX = x;
      }
    }

    if (leftX !== -1) {
      leftPoints.push({ x: leftX, y });
      rightPoints.push({ x: rightX, y });
    }
  }

  const rawContour = [...leftPoints, ...rightPoints.reverse()];
  return simplifyPolyline(rawContour);
}

/**
 * Drops consecutive points that are closer than MIN_SEGMENT_LENGTH apart
 * — a cheap simplification so the resulting polygon isn't needlessly
 * dense (ROW_STEP already limits vertical density; this also collapses
 * near-flat horizontal runs).
 * @param {Array<{x: number, y: number}>} points
 * @returns {Array<{x: number, y: number}>}
 */
function simplifyPolyline(points) {
  if (points.length <= 2) return points;

  const simplified = [points[0]];

  for (let i = 1; i < points.length; i++) {
    const prev = simplified[simplified.length - 1];
    const curr = points[i];
    const dx = curr.x - prev.x;
    const dy = curr.y - prev.y;

    if (dx * dx + dy * dy >= MIN_SEGMENT_LENGTH * MIN_SEGMENT_LENGTH) {
      simplified.push(curr);
    }
  }

  return simplified;
}
