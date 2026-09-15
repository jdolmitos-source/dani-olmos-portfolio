# Shoe Last Digitization & Flattening Platform

Professional platform for remote shoe last digitization and flattening
development. Long-term product — every decision here favors
maintainability and scalability over speed of delivery.

## Stack

- **Frontend:** Vanilla JS (ES Modules, no bundler), HTML5, CSS
- **Backend:** Firebase Authentication, Firestore, Storage, (minimal) Cloud Functions
- **Hosting:** Firebase Hosting
- **Image processing:** OpenCV.js (WASM), running client-side
- **Drawing / workspace:** Konva.js over Canvas/SVG

## Why no framework / no bundler

The frontend is intentionally built with native ES Modules served directly
by Firebase Hosting from `/public/src`. This keeps the deploy step trivial
(`firebase deploy`, no build pipeline) while still enforcing modularity via:

- `core/router.js` — minimal hash router with guard support
- `core/store.js` — tiny reactive state container
- `core/event-bus.js` — pub-sub for cross-module signals
- Web Components under `src/components` for reusable UI pieces

## Project structure

```
/public
  index.html              # entry point, loads tokens/base/components CSS + main.js
  /src
    /core                 # router, store, event-bus, firebase-config, main.js
    /modules
      /auth                # Firebase Auth, route guards, login view
      /projects             # project CRUD + dashboard views
      /upload               # photo upload + compression + trigger pipeline
      /processing           # OpenCV.js pipeline (background removal, contour, calibration)
      /workspace            # Konva-based designer workspace
    /components            # reusable Web Components (project-card, status-badge, modal)
    /styles                 # tokens.css (design tokens) / base.css / components.css
    /utils                  # shared helpers (validators, image compression)
/functions                  # Cloud Functions (kept minimal — see Architecture Decisions)
firestore.rules
storage.rules
firebase.json
```

## Architecture decisions

- **Processing runs client-side.** OpenCV.js executes in the browser at
  upload time. Cloud Functions are kept minimal (light triggers only),
  not a heavy processing backend. See `modules/processing/*`.
- **Roles via custom claims.** `client` / `designer` roles are Firebase
  Auth custom claims, set server-side — never a client-writable field.
  Firestore/Storage rules enforce this (`firestore.rules`, `storage.rules`).
- **Contour data is stored inline in Firestore, not as a Storage file.**
  A single simplified outline (a few hundred points) comfortably fits
  Firestore's document size limit, and avoids an extra upload/fetch round
  trip for data the workspace (Phase 5) needs immediately on load. See
  `modules/processing/contour-extraction.js`.
- **Scale calibration is a best-effort heuristic**, not a robust object
  detector: it looks for a roughly rectangular contour besides the last
  itself. It always reports `referenceObjectDetected` so the designer can
  calibrate manually if it fails — a known, accepted risk from architecture
  review.
- **Konva.js is loaded from a CDN ESM build** (`jsdelivr.net/npm/konva@.../+esm`),
  same no-bundler pattern as the Firebase SDK. See `modules/workspace/canvas-engine.js`.
- **Security note on Storage download URLs:** `getDownloadURL()` embeds a
  persistent access token in the URL itself, which grants access to
  anyone holding that URL — bypassing `storage.rules` for that specific
  file. This is standard Firebase behavior, not a bug in this codebase,
  but worth knowing: photos are not access-controlled per request once a
  URL has been generated and shared. Acceptable for the MVP; revisit if
  stricter access control is ever required (e.g. Cloud Function-issued
  short-lived signed URLs instead).
- **Design tokens are the single source of truth for styling.** See
  `src/styles/tokens.css` — never hardcode a color or spacing value
  elsewhere.

## MVP scope (v1.0)

1. Authentication (client / designer)
2. Project management (create, list, status)
3. Photo upload (top/side/rear + reference object + Last Length)
4. Background removal (OpenCV.js)
5. Contour extraction (OpenCV.js)
6. Scale calibration (OpenCV.js)
7. Workspace generation (Konva viewer)

Explicitly **out of scope** for v1.0: perspective correction, center-axis
detection, feature extraction, flattening tools, export (SVG/AI/PDF), any
AI prediction, 3D reconstruction. These belong to later versions.

## Development phases

| Phase | Scope | Status |
|---|---|---|
| 0 | Repo setup, Firebase config, design tokens, router/store skeleton | ✅ Done |
| 1 | Auth + roles + route guards | ✅ Done |
| 2 | Project management (dashboard, create, list, status) | ✅ Done |
| 3 | Photo upload (3 views + reference object + Last Length) | ✅ Done |
| 4 | Client-side OpenCV.js pipeline (background removal → contour → calibration) | ✅ Done |
| 5 | Designer workspace (Konva viewer) | ✅ Done |
| 6 | QA, security rules hardening, deploy | ✅ Done |

## Phase 6 hardening notes

- **Retry flow:** a project stuck in `status: 'error'` can now be
  re-submitted from `/projects/:id/upload` — the upload view accepts
  both `draft` and `error`, and shows the previous failure message in a
  banner.
- **Firestore rules now validate status transitions explicitly**
  (`isValidStatusTransition` in `firestore.rules`): a client can no
  longer set an arbitrary `status` value directly — only the exact
  transitions the app's own logic performs are accepted. `clientId` is
  also enforced immutable on update, and project `name` length is
  validated server-side (≤100 chars), matching the client-side check.
- **Router-level error fallback:** an uncaught exception in any view now
  shows a "Something went wrong" recovery screen instead of a blank page
  (`router.setErrorFallback`, wired in `core/main.js`).
- **Reactive session guard:** if the user signs out in another tab (or
  their session otherwise becomes invalid) while on a protected route,
  they're redirected to `/login` immediately instead of being left on a
  stale, now-unauthorized screen.

## Remaining known limitations (acceptable for MVP, flagged for later)

- Retry re-uploads and re-processes all 3 views again, even if only one
  failed — simpler and safer than partial retry logic, at the cost of
  some redundant work on failure.
- `views/{viewType}` status transitions are not rule-validated as
  strictly as the project document's — this data is closer to
  operational telemetry than an authorization boundary, so the
  owner/designer read-write rule was left as-is.
- No automated test suite yet (unit or end-to-end). Recommended before a
  real multi-user rollout, not before now — see Getting Started for
  manual QA in the meantime.

## Getting started

```bash
npm install -g firebase-tools
firebase login

# Replace the placeholder Firebase project id
# in .firebaserc and public/src/core/firebase-config.js

firebase emulators:start
```

## Design system

Dark, industrial, minimal. See `public/src/styles/tokens.css` for the full
token list (colors, typography, spacing). Font: Inter. Icons: Lucide.
