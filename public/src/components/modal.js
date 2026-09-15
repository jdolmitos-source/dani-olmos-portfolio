/**
 * <app-modal>
 * -----------------------------------------------------------------------
 * Generic modal shell used across the app. On first connect it wraps
 * whatever light-DOM children it has into a styled panel box, so callers
 * can just do:
 *
 *   <app-modal id="my-modal"></app-modal>
 *   ...
 *   const panel = modal.querySelector('.app-modal-panel');
 *   panel.innerHTML = '...'; // or mount a form/view into `panel`
 *   modal.open();
 *
 * Closes on: backdrop click, Escape key, or calling `.close()` directly.
 * Emits a "modal-closed" CustomEvent when it closes.
 * -----------------------------------------------------------------------
 */

class AppModal extends HTMLElement {
  #escHandler = (event) => {
    if (event.key === 'Escape') this.close();
  };

  connectedCallback() {
    Object.assign(this.style, {
      position: 'fixed',
      inset: '0',
      zIndex: 'var(--z-modal)',
      display: this.style.display === 'flex' ? 'flex' : 'none',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(0, 0, 0, 0.6)',
    });

    if (!this.querySelector('.app-modal-panel')) {
      const panel = document.createElement('div');
      panel.className = 'app-modal-panel panel';
      Object.assign(panel.style, {
        padding: 'var(--space-6)',
        minWidth: '320px',
        maxWidth: '480px',
        width: '100%',
      });

      while (this.firstChild) panel.appendChild(this.firstChild);
      this.appendChild(panel);
    }

    this.addEventListener('click', this.#handleBackdropClick);
  }

  disconnectedCallback() {
    this.removeEventListener('click', this.#handleBackdropClick);
    document.removeEventListener('keydown', this.#escHandler);
  }

  #handleBackdropClick = (event) => {
    if (event.target === this) this.close();
  };

  open() {
    this.style.display = 'flex';
    document.addEventListener('keydown', this.#escHandler);
  }

  close() {
    this.style.display = 'none';
    document.removeEventListener('keydown', this.#escHandler);
    this.dispatchEvent(new CustomEvent('modal-closed'));
  }
}

customElements.define('app-modal', AppModal);
