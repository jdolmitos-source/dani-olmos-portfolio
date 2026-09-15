/**
 * Cloud Functions entry point
 * -----------------------------------------------------------------------
 * Kept intentionally minimal: the heavy image-processing pipeline runs
 * client-side via OpenCV.js (see /public/src/modules/processing).
 * This file only re-exports lightweight, trusted server-side triggers
 * (e.g. audit logging, role assignment helpers) as they are added.
 * -----------------------------------------------------------------------
 */

// export { onProjectUpdated } from './src/triggers/onProjectUpdated.js';
