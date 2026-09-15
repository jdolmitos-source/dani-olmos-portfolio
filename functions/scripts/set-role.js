/**
 * set-role.js
 * -----------------------------------------------------------------------
 * Admin-only script: assigns the "role" custom claim ("client" | "designer")
 * to a Firebase Auth user, identified by email.
 *
 * This is the ONLY supported way to set a user's role. Roles must NEVER
 * be writable from client code or from a Firestore document field, since
 * both Firestore and Storage security rules trust request.auth.token.role
 * as the source of truth (see /firestore.rules and /storage.rules).
 *
 * Requirements:
 *   - Node 20+
 *   - firebase-admin installed (already a dependency of /functions,
 *     see functions/package.json)
 *   - A service account key JSON downloaded from:
 *       Firebase Console > Project Settings > Service accounts
 *       > Generate new private key
 *     Save it OUTSIDE of git (e.g. functions/scripts/service-account.json)
 *     and make sure it's covered by .gitignore. NEVER commit this file.
 *
 * Usage (from /functions):
 *   node scripts/set-role.js --email=jd.olmitos@gmail.com --role=designer
 *   node scripts/set-role.js --email=someone@example.com --role=client
 *   node scripts/set-role.js --email=jd.olmitos@gmail.comm --role=designer --key=./scripts/service-account.json
 *
 * By default it looks for the key at ./scripts/service-account.json
 * relative to where the script is run (i.e. inside /functions).
 * -----------------------------------------------------------------------
 */

import { readFileSync } from 'node:fs';
import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const ALLOWED_ROLES = ['client', 'designer'];

function parseArgs(argv) {
  const args = {};
  for (const raw of argv.slice(2)) {
    const match = raw.match(/^--([^=]+)=(.*)$/);
    if (!match) continue;
    args[match[1]] = match[2];
  }
  return args;
}

function fail(message) {
  console.error(`\n[set-role] Error: ${message}\n`);
  process.exit(1);
}

async function main() {
  const args = parseArgs(process.argv);
  const email = args.email;
  const role = args.role;
  const keyPath = args.key ?? './scripts/service-account.json';

  if (!email) fail('missing --email=<user@example.com>');
  if (!role) fail('missing --role=client|designer');
  if (!ALLOWED_ROLES.includes(role)) {
    fail(`invalid --role="${role}". Allowed values: ${ALLOWED_ROLES.join(', ')}`);
  }

  let serviceAccount;
  try {
    serviceAccount = JSON.parse(readFileSync(keyPath, 'utf-8'));
  } catch (error) {
    fail(
      `could not read service account key at "${keyPath}".\n` +
      `Download it from Firebase Console > Project Settings > Service accounts,\n` +
      `save it there, and re-run (or pass --key=/path/to/file.json).\n` +
      `Underlying error: ${error.message}`
    );
  }

  initializeApp({ credential: cert(serviceAccount) });
  const auth = getAuth();

  let user;
  try {
    user = await auth.getUserByEmail(email);
  } catch (error) {
    fail(`no Firebase Auth user found with email "${email}". Create the user first (Authentication > Users > Add user). Underlying error: ${error.message}`);
  }

  await auth.setCustomUserClaims(user.uid, { role });

  console.log(`\n[set-role] Done. ${email} (uid: ${user.uid}) now has role="${role}".`);
  console.log('[set-role] Note: the user must sign out and sign back in (or force-refresh their ID token) for the new claim to take effect in the app.\n');
}

main().catch((error) => fail(error.message));
