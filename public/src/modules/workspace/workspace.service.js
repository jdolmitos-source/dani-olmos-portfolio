/**
 * Workspace Service
 * -----------------------------------------------------------------------
 * Loads a project plus its 3 view documents (top/side/rear) — the
 * processed image URL, contour points, and calibration data the
 * workspace needs to render. Read-only in this phase; the designer's
 * drawing/flattening tools are out of MVP scope (see README).
 * -----------------------------------------------------------------------
 */

import {
  doc,
  getDoc,
  collection,
  getDocs,
} from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js';

import { db } from '../../core/firebase-config.js';

/**
 * @param {string} projectId
 * @returns {Promise<{ project: Record<string, any>, views: Record<string, Record<string, any>> } | null>}
 */
export async function getProjectWithViews(projectId) {
  const projectSnap = await getDoc(doc(db, 'projects', projectId));
  if (!projectSnap.exists()) return null;

  const project = { id: projectSnap.id, ...projectSnap.data() };

  const viewsSnap = await getDocs(collection(db, 'projects', projectId, 'views'));
  const views = {};
  viewsSnap.forEach((viewDoc) => {
    views[viewDoc.id] = viewDoc.data();
  });

  return { project, views };
}
