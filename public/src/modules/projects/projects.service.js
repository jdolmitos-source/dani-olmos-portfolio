/**
 * Projects Service
 * -----------------------------------------------------------------------
 * The ONLY module allowed to talk to the `projects` Firestore collection
 * directly. Views must go through these functions — never call
 * collection()/doc() on `db` from a view.
 *
 * Data model (see /README.md for the full spec):
 *   projects/{projectId}
 *     - clientId, designerId (nullable)
 *     - name
 *     - lastLength, referenceObject (set during upload — Phase 3)
 *     - status: "draft" | "uploaded" | "processing" | "ready_for_workspace" | "error"
 *     - createdAt, updatedAt
 * -----------------------------------------------------------------------
 */

import {
  collection,
  addDoc,
  doc,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js';

import { db } from '../../core/firebase-config.js';

const PROJECTS_COLLECTION = 'projects';

/**
 * Creates a new project owned by the given client. Only `name` is
 * collected at creation time — lastLength/referenceObject are attached
 * later during the upload step (Phase 3).
 * @param {{ name: string, clientId: string }} input
 * @returns {Promise<string>} the new project's id
 */
export async function createProject({ name, clientId }) {
  const projectsRef = collection(db, PROJECTS_COLLECTION);

  const docRef = await addDoc(projectsRef, {
    clientId,
    designerId: null,
    name,
    lastLength: null,
    referenceObject: null,
    status: 'draft',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return docRef.id;
}

/**
 * Subscribes to real-time project updates scoped to the given user's
 * role: a client only sees their own projects, a designer sees all of
 * them. Requires a composite index (clientId ASC, createdAt DESC) for
 * the client query — already declared in /firestore.indexes.json.
 *
 * @param {{ uid: string, role: 'client' | 'designer' }} user
 * @param {(projects: Array<Record<string, any>>) => void} onChange
 * @returns {() => void} unsubscribe function
 */
export function subscribeToProjects(user, onChange) {
  const projectsRef = collection(db, PROJECTS_COLLECTION);

  const projectsQuery = user.role === 'designer'
    ? query(projectsRef, orderBy('createdAt', 'desc'))
    : query(projectsRef, where('clientId', '==', user.uid), orderBy('createdAt', 'desc'));

  return onSnapshot(
    projectsQuery,
    (snapshot) => {
      const projects = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
      onChange(projects);
    },
    (error) => {
      console.error('[projects.service] real-time subscription failed:', error);
    },
  );
}

/**
 * Updates a project's status. Used by later phases (upload pipeline,
 * designer workflow) — included now so the API surface is stable.
 * @param {string} projectId
 * @param {string} status
 */
export async function updateProjectStatus(projectId, status) {
  const projectRef = doc(db, PROJECTS_COLLECTION, projectId);
  await updateDoc(projectRef, { status, updatedAt: serverTimestamp() });
}
