/**
 * Reference Objects Catalog
 * -----------------------------------------------------------------------
 * Single source of truth for the physical reference objects a client can
 * photograph alongside the shoe last for scale calibration (Phase 4
 * cross-checks this against the manually entered Last Length).
 *
 * `knownSizeMm: null` means the size is user-entered (the "custom" case),
 * not a fixed catalog value.
 * -----------------------------------------------------------------------
 */

export const REFERENCE_OBJECTS = {
  credit_card: {
    label: 'Tarjeta estándar (85.6 × 54 mm)',
    knownSizeMm: 85.6,
  },
  a4_paper: {
    label: 'Hoja A4 — lado largo (297 mm)',
    knownSizeMm: 297,
  },
  custom: {
    label: 'Otro objeto (ingresar medida manualmente)',
    knownSizeMm: null,
  },
};
