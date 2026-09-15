/**
 * Auth Guards
 * -----------------------------------------------------------------------
 * Small predicate functions plugged into router routes as `guard`.
 * Each returns `true` to allow navigation, or a redirect path (string)
 * otherwise. See core/router.js for how guards are consumed.
 * -----------------------------------------------------------------------
 */

import { getCurrentUser } from './auth.service.js';

/** Allows navigation only if the user is signed in. */
export function requireAuth() {
  return getCurrentUser() ? true : '/login';
}

/** Allows navigation only for the "designer" role. */
export function requireDesigner() {
  const user = getCurrentUser();
  if (!user) return '/login';
  return user.role === 'designer' ? true : '/projects';
}

/** Allows navigation only for the "client" role. */
export function requireClient() {
  const user = getCurrentUser();
  if (!user) return '/login';
  return user.role === 'client' ? true : '/projects';
}

/** Blocks access to auth screens (e.g. /login) if already signed in. */
export function requireGuest() {
  return getCurrentUser() ? '/projects' : true;
}
