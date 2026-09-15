/**
 * Upload Service
 * -----------------------------------------------------------------------
 * The ONLY module allowed to write to the `raw/`+`processed/` Storage
 * paths and the `projects/{id}/views/{viewType}` Firestore subcollection.
 *
 * As of Phase 4, this is where upload and processing meet: for each view,
 * it (1) uploads the compressed raw photo, (2) runs the OpenCV.js
 * pipeline on that same in-memory File — no need to re-download from
 * Storage — and (3) uploads the processed result, writing the full view
 * document in one go. All of this happens synchronously in the client's
 * browser during the upload flow (see architecture decision: "OpenCV.js
 * runs client-side").
 * -----------------------------------------------------------------------
 */

import {
  ref,
  uploadBytes,
  getDownloadURL,
} from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-storage.js';

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js';

import { db, storage } from '../../core/firebase-config.js';
import { compressImage } from '../../utils/image-compression.js';
import { runPipelineInWorker } from '../processing/pipeline-client.js';

export const VIEW_TYPES = ['top', 'side', 'rear'];

/**
 * @param {string} projectId
 * @returns {Promise<Record<string, any>|null>}
 */
export async function getProject(projectId) {
  const snap = await getDoc(doc(db, 'projects', projectId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

/**
 * Uploads the raw photo, runs the OpenCV.js pipeline on it, uploads the
 * processed result, and writes the resulting Firestore view document.
 * Marks the view "processing" immediately so a designer glancing at the
 * project mid-upload sees an accurate state rather than a missing doc,
 * and "error" (with a message) if any step fails.
 * @param {string} projectId
 * @param {'top'|'side'|'rear'} viewType
 * @param {File} file
 * @param {number} knownSizeMm
 */
async function processAndUploadView(projectId, viewType, file, knownSizeMm) {
  console.log(`[upload] [${viewType}] starting. file:`, file?.name, file?.size, 'bytes');

  const viewRef = doc(db, 'projects', projectId, 'views', viewType);
  await setDoc(viewRef, { status: 'processing', uploadedAt: serverTimestamp() });
  console.log(`[upload] [${viewType}] view doc marked processing.`);

  try {
    console.log(`[upload] [${viewType}] compressing...`);
    const compressedBlob = await compressImage(file);
    console.log(`[upload] [${viewType}] compressed. size:`, compressedBlob.size, 'bytes');

    const rawStorageRef = ref(storage, `projects/${projectId}/raw/${viewType}.jpg`);
    console.log(`[upload] [${viewType}] uploading raw to Storage...`);
    await uploadBytes(rawStorageRef, compressedBlob, { contentType: 'image/jpeg' });
    console.log(`[upload] [${viewType}] raw upload done. fetching download URL...`);
    const originalImageUrl = await getDownloadURL(rawStorageRef);
    console.log(`[upload] [${viewType}] raw URL ready:`, originalImageUrl);

    // IMPORTANT: run the pipeline on the already-compressed blob, not the
    // original `file`. A raw phone photo can be several megapixels —
    // running Otsu/morphology/findContours on that was slow enough to
    // freeze the tab even on a dedicated Worker thread. The compressed
    // blob (≤1600px) is what's actually displayed later, so there's no
    // accuracy loss from reusing it here. The pipeline itself runs on a
    // Web Worker (see modules/processing/pipeline-client.js), so even a
    // slow run can never block the UI or trigger a "page unresponsive"
    // prompt.
    console.log(`[upload] [${viewType}] handing off to pipeline worker...`);
    const { processedImageBlob, contourPoints, calibration } = await runPipelineInWorker(compressedBlob, knownSizeMm);
    console.log(`[upload] [${viewType}] pipeline done. contour points:`, contourPoints.length, 'calibration:', calibration);

    const processedStorageRef = ref(storage, `projects/${projectId}/processed/${viewType}_nobg.png`);
    console.log(`[upload] [${viewType}] uploading processed image...`);
    await uploadBytes(processedStorageRef, processedImageBlob, { contentType: 'image/png' });
    const processedImageUrl = await getDownloadURL(processedStorageRef);
    console.log(`[upload] [${viewType}] processed URL ready:`, processedImageUrl);

    await setDoc(viewRef, {
      originalImageUrl,
      processedImageUrl,
      contourPoints,
      calibration,
      status: 'done',
      uploadedAt: serverTimestamp(),
    });
    console.log(`[upload] [${viewType}] view doc marked done.`);
  } catch (error) {
    console.error(`[upload] [${viewType}] failed:`, error);
    await setDoc(viewRef, {
      status: 'error',
      errorMessage: error.message ?? 'Error desconocido durante el procesamiento.',
      uploadedAt: serverTimestamp(),
    });
    throw error;
  }
}

/**
 * Full submit flow for the upload form: uploads + processes the 3 views
 * in order, persists lastLength + referenceObject, and marks the project
 * "ready_for_workspace" once all views succeed (or "error" if any fail).
 * @param {string} projectId
 * @param {{ files: Record<'top'|'side'|'rear', File>, lastLength: number, referenceObject: { type: string, knownSizeMm: number } }} data
 * @param {(stepLabel: string) => void} [onProgress]
 */
export async function submitUpload(projectId, { files, lastLength, referenceObject }, onProgress) {
  const projectRef = doc(db, 'projects', projectId);

  try {
    await updateDoc(projectRef, {
      lastLength,
      referenceObject,
      status: 'processing',
      updatedAt: serverTimestamp(),
    });

    for (const viewType of VIEW_TYPES) {
      onProgress?.(`Procesando vista: ${viewType}…`);
      await processAndUploadView(projectId, viewType, files[viewType], referenceObject.knownSizeMm);
    }

    onProgress?.('Finalizando…');
    await updateDoc(projectRef, { status: 'ready_for_workspace', updatedAt: serverTimestamp() });
  } catch (error) {
    await updateDoc(projectRef, {
      status: 'error',
      errorMessage: error.message ?? 'Error desconocido durante el procesamiento.',
      updatedAt: serverTimestamp(),
    });
    throw error;
  }
}
