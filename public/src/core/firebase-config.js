/**
 * Firebase bootstrap
 * -----------------------------------------------------------------------
 * Single place where the Firebase app is initialized and every SDK
 * instance (Auth, Firestore, Storage) is created. Every other module
 * MUST import its Firebase instances from here — never call
 * initializeApp() anywhere else in the codebase.
 *
 * We load the SDK straight from Google's CDN as ES Modules since this
 * project intentionally has no bundler. Pin the version explicitly so
 * an unannounced SDK upgrade can never silently break the app.
 * -----------------------------------------------------------------------
 */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js';
import { getStorage } from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-storage.js';

// Keep this the ONLY hardcoded object in the whole codebase — everything
// downstream must be parameterized from it.
// measurementId is intentionally omitted: this project does not use
// Firebase Analytics (out of scope for the MVP).
const firebaseConfig = {
  apiKey: 'AIzaSyBLwdHkBWB4W0JNlUP11WkZTjx4PtpNml4',
  authDomain: 'lastlabbydolmos.firebaseapp.com',
  projectId: 'lastlabbydolmos',
  storageBucket: 'lastlabbydolmos.firebasestorage.app',
  messagingSenderId: '389673203747',
  appId: '1:389673203747:web:a3d73e79f9dde40dd31996',
};

export const firebaseApp = initializeApp(firebaseConfig);

export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);
export const storage = getStorage(firebaseApp);
