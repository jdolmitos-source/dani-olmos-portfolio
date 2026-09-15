/**
 * <status-badge status="processing">
 * -----------------------------------------------------------------------
 * Small colored pill reflecting a project's status. Reads the "status"
 * attribute and re-renders whenever it changes. Uses the semantic color
 * tokens (accent/success/warning/danger) from tokens.css — never a raw
 * hex value.
 * -----------------------------------------------------------------------
 */

const STATUS_CONFIG = {
  draft: { label: 'Borrador', color: 'var(--color-text-muted)' },
  uploaded: { label: 'Subido', color: 'var(--color-accent)' },
  processing: { label: 'Procesando', color: 'var(--color-warning)' },
  ready_for_workspace: { label: 'Listo para workspace', color: 'var(--color-success)' },
  error: { label: 'Error', color: 'var(--color-danger)' },
};

class StatusBadge extends HTMLElement {
  static get observedAttributes() {
    return ['status'];
  }

  connectedCallback() {
    this.#render();
  }

  attributeChangedCallback() {
    this.#render();
  }

  #render() {
    const status = this.getAttribute('status') || 'draft';
    const config = STATUS_CONFIG[status] ?? { label: status, color: 'var(--color-text-muted)' };

    this.innerHTML = `
      <span style="
        display:inline-flex; align-items:center; gap:6px;
        font-size: var(--font-size-xs); font-weight: var(--font-weight-medium);
        padding: 2px 10px; border-radius: 999px;
        background: color-mix(in srgb, ${config.color} 18%, transparent);
        color: ${config.color};
        white-space: nowrap;
      ">
        <span style="width:6px; height:6px; border-radius:50%; background:${config.color};"></span>
        ${config.label}
      </span>
    `;
  }
}

customElements.define('status-badge', StatusBadge);
