/**
 * Validators
 * -----------------------------------------------------------------------
 * Small, pure, dependency-free validation helpers shared across forms.
 * Keep these framework-agnostic (no DOM access here) so they stay
 * trivially unit-testable.
 * -----------------------------------------------------------------------
 */

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * @param {string} value
 * @returns {boolean}
 */
export function isValidEmail(value) {
  return typeof value === 'string' && EMAIL_PATTERN.test(value.trim());
}

/**
 * @param {string} value
 * @returns {boolean}
 */
export function isRequired(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {boolean}
 */
export function isNumberInRange(value, min, max) {
  return typeof value === 'number' && !Number.isNaN(value) && value >= min && value <= max;
}

/**
 * @param {string} value
 * @param {number} maxLength
 * @returns {boolean}
 */
export function isWithinMaxLength(value, maxLength) {
  return typeof value === 'string' && value.trim().length <= maxLength;
}

const ALLOWED_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/**
 * @param {File|null|undefined} file
 * @param {number} [maxSizeBytes]
 * @returns {boolean}
 */
export function isValidImageFile(file, maxSizeBytes = 15 * 1024 * 1024) {
  if (!file) return false;
  return ALLOWED_IMAGE_MIME_TYPES.includes(file.type) && file.size <= maxSizeBytes;
}
