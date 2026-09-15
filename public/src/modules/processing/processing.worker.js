/**
 * Processing Worker
 * -----------------------------------------------------------------------
 * Runs the (pure JavaScript) image processing pipeline on a dedicated
 * Web Worker thread, so it can never block the UI even if a particular
 * photo takes longer than usual to process.
 *
 * This is now a proper MODULE worker (`type: 'module'`, see
 * pipeline-client.js) that directly imports pipeline-runner.js — no
 * code duplication, unlike the previous OpenCV.js-based version, which
 * had to duplicate its algorithm functions here because OpenCV.js
 * shipped as a classic (non-ES-module) script incompatible with module
 * workers. Dropping OpenCV.js entirely (see README "Patch notes" for
 * why) removed that whole problem along with it.
 * -----------------------------------------------------------------------
 */

import { runPipelineForView } from './pipeline-runner.js';

self.onmessage = async (event) => {
  const { requestId, blob, knownSizeMm } = event.data;

  try {
    const result = await runPipelineForView(blob, knownSizeMm);
    self.postMessage({ requestId, result });
  } catch (error) {
    self.postMessage({
      requestId,
      error: error?.message ?? 'Error desconocido en el worker de procesamiento.',
    });
  }
};
