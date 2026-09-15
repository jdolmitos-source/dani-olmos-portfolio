/**
 * Login View
 * -----------------------------------------------------------------------
 * Real authentication form: email/password, client-side validation,
 * Firebase Auth error handling, loading state, and redirect once the
 * role has been resolved from the ID token's custom claims.
 * -----------------------------------------------------------------------
 */

import { signIn, mapAuthErrorCode, waitForNextAuthResolution } from './auth.service.js';
import { isValidEmail, isRequired } from '../../utils/validators.js';
import { router } from '../../core/router.js';

/**
 * @param {Record<string, string>} params
 * @param {HTMLElement} container
 */
export async function renderLogin(params, container) {
  container.innerHTML = `
    <main class="stack" style="align-items:center; justify-content:center; min-height:100vh;">
      <section class="panel" style="padding: var(--space-6); width: 340px;">
        <h1 style="font-size: var(--font-size-lg); margin-bottom: var(--space-1);">Iniciar sesión</h1>
        <p class="text-secondary" style="font-size: var(--font-size-sm); margin-bottom: var(--space-5);">
          Shoe Last Platform
        </p>

        <form id="login-form" class="stack gap-4" novalidate>
          <div class="field">
            <label for="email">Correo electrónico</label>
            <input id="email" name="email" type="email" autocomplete="email" required />
          </div>

          <div class="field">
            <label for="password">Contraseña</label>
            <input id="password" name="password" type="password" autocomplete="current-password" required />
          </div>

          <p id="login-error" role="alert" style="color: var(--color-danger); font-size: var(--font-size-sm); min-height: 1.2em; margin: 0;"></p>

          <button id="login-submit" type="submit" class="btn btn-primary" style="justify-content:center;">
            Iniciar sesión
          </button>
        </form>
      </section>
    </main>
  `;

  const form = container.querySelector('#login-form');
  const emailInput = container.querySelector('#email');
  const passwordInput = container.querySelector('#password');
  const errorEl = container.querySelector('#login-error');
  const submitButton = container.querySelector('#login-submit');

  function showError(message) {
    errorEl.textContent = message;
  }

  function clearError() {
    errorEl.textContent = '';
  }

  function setLoading(isLoading) {
    submitButton.disabled = isLoading;
    submitButton.textContent = isLoading ? 'Iniciando sesión…' : 'Iniciar sesión';
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearError();

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!isValidEmail(email)) {
      showError('Ingresa un correo electrónico válido.');
      return;
    }

    if (!isRequired(password)) {
      showError('Ingresa tu contraseña.');
      return;
    }

    setLoading(true);

    // Subscribe BEFORE calling signIn() — Firebase can fire its internal
    // auth state change before signIn()'s own promise resolves, so
    // subscribing afterward risks missing the event and hanging forever
    // on "Iniciando sesión…" (see auth.service.js for details).
    const authResolution = waitForNextAuthResolution();

    try {
      await signIn(email, password);
      await authResolution;
      router.navigate('/projects');
    } catch (error) {
      authResolution.cancel();
      showError(mapAuthErrorCode(error.code));
      setLoading(false);
    }
  });
}
