/**
 * Pipeline Client
 * -----------------------------------------------------------------------
 * Main-thread API for running the processing pipeline. Delegates the
 * actual work to processing.worker.js on a dedicated thread, so it can
 * never block the UI.
 *
 * This is the function `upload.service.js` should call — never import
 * pipeline-runner.js directly from app code; that module is meant to be
 * used only from inside the worker (or for local debugging).
 * -----------------------------------------------------------------------
 */

let worker = null;
let nextRequestId = 1;
const pendingRequests = new Map();

function getWorker() {
  if (worker) return worker;

  // Module worker: pipeline-runner.js and everything it imports are
  // pure ES modules with zero external dependencies (see README "Patch
  // notes" for why OpenCV.js/WASM was dropped, and why that removed the
  // need for a classic worker + importScripts + duplicated code).
  worker = new Worker(new URL('./processing.worker.js', import.meta.url), { type: 'module' });

  worker.onmessage = (event) => {
    const { requestId, result, error } = event.data;
    const pending = pendingRequests.get(requestId);
    if (!pending) return;

    pendingRequests.delete(requestId);
    if (error) {
      pending.reject(new Error(error));
    } else {
      pending.resolve(result);
    }
  };

  worker.onerror = (event) => {
    console.error('[pipeline-client] worker-level error:', event.message, event);
    // A worker-level error (e.g. the script itself failed to parse)
    // isn't tied to any single requestId — reject everything in flight
    // rather than leaving callers hanging forever.
    for (const [, pending] of pendingRequests) {
      pending.reject(new Error(event.message || 'Error inesperado en el worker de procesamiento.'));
    }
    pendingRequests.clear();
  };

  return worker;
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
export function runPipelineInWorker(blob, knownSizeMm) {
  const requestId = nextRequestId++;

  return new Promise((resolve, reject) => {
    pendingRequests.set(requestId, { resolve, reject });
    getWorker().postMessage({ requestId, blob, knownSizeMm });
  });
}
