/**
 * Auth Service
 * -----------------------------------------------------------------------
 * The ONLY module allowed to talk to Firebase Auth directly. Every other
 * part of the app must go through these functions and read the resolved
 * user from the Store — never call `auth.currentUser` elsewhere.
 *
 * Role handling:
 *   The user's role ("client" | "designer") is read from the ID token's
 *   custom claims, which are set server-side. This guarantees the role
 *   cannot be tampered with from the client.
 * -----------------------------------------------------------------------
 */

import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js';

import { auth } from '../../core/firebase-config.js';
import { store } from '../../core/store.js';
import { eventBus } from '../../core/event-bus.js';

/**
 * @param {string} email
 * @param {string} password
 * @returns {Promise<import('firebase/auth').UserCredential>}
 */
export async function signIn(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

export async function signOutUser() {
  await firebaseSignOut(auth);
}

/**
 * Resolves the current Firebase user into the shape the rest of the app
 * uses: { uid, email, role }.
 * @param {import('firebase/auth').User} firebaseUser
 */
async function toAppUser(firebaseUser) {
  const tokenResult = await firebaseUser.getIdTokenResult();
  return {
    uid: firebaseUser.uid,
    email: firebaseUser.email,
    role: tokenResult.claims.role ?? null, // "client" | "designer" | null
  };
}

/**
 * Wires Firebase's auth state to the global Store. Must be called once,
 * during app bootstrap (see core/main.js).
 */
export function initAuthListener() {
  onAuthStateChanged(auth, async (firebaseUser) => {
    if (!firebaseUser) {
      store.setState({ currentUser: null, isBooting: false });
      eventBus.emit('auth:userChanged', null);
      return;
    }

    const appUser = await toAppUser(firebaseUser);
    store.setState({ currentUser: appUser, isBooting: false });
    eventBus.emit('auth:userChanged', appUser);
  });
}

export function getCurrentUser() {
  return store.getState().currentUser;
}

/**
 * Resolves once after the NEXT auth state resolution (i.e. once
 * `initAuthListener`'s callback has finished running for the most recent
 * sign-in/sign-out). Callers must start listening BEFORE calling
 * `signIn()` — Firebase can fire its internal auth state change before
 * `signIn()`'s own promise resolves, so subscribing afterward can miss
 * the event entirely and hang forever. Call `.cancel()` on the returned
 * promise if the caller's operation fails before the event ever fires,
 * to avoid leaving a dangling listener.
 * @returns {Promise<{uid: string, email: string, role: string|null}|null> & { cancel: () => void }}
 */
export function waitForNextAuthResolution() {
  let unsubscribe;

  const promise = new Promise((resolve) => {
    unsubscribe = eventBus.on('auth:userChanged', (user) => {
      unsubscribe();
      resolve(user);
    });
  });

  promise.cancel = () => unsubscribe();
  return promise;
}

/**
 * Maps a Firebase Auth error code to a user-facing Spanish message.
 * Keep this the single place that knows about Firebase's error codes —
 * views should never inspect `error.code` directly.
 * @param {string} code
 * @returns {string}
 */
export function mapAuthErrorCode(code) {
  switch (code) {
    case 'auth/invalid-email':
      return 'El correo electrónico no tiene un formato válido.';
    case 'auth/user-disabled':
      return 'Esta cuenta ha sido deshabilitada. Contacta al administrador.';
    case 'auth/user-not-found':
    case 'auth/invalid-credential':
      return 'Correo o contraseña incorrectos.';
    case 'auth/wrong-password':
      return 'Correo o contraseña incorrectos.';
    case 'auth/too-many-requests':
      return 'Demasiados intentos fallidos. Espera unos minutos e inténtalo de nuevo.';
    case 'auth/network-request-failed':
      return 'No se pudo conectar con el servidor. Revisa tu conexión a internet.';
    default:
      return 'No se pudo iniciar sesión. Inténtalo de nuevo.';
  }
}
