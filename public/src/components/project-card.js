/**
 * <project-card>
 * -----------------------------------------------------------------------
 * Reusable card shown on the projects dashboard. Set its data via the
 * `.project` property (not an attribute — a full object, not a string):
 *
 *   const card = document.createElement('project-card');
 *   card.project = { id, name, status, createdAt };
 *   container.appendChild(card);
 *
 * Dispatches a bubbling "project-selected" CustomEvent with
 * `detail.projectId` when clicked, so a parent view can react (e.g. open
 * the project detail / workspace) without this component knowing about
 * routing.
 * -----------------------------------------------------------------------
 */

import './status-badge.js';

class ProjectCard extends HTMLElement {
  #project = null;

  set project(value) {
    this.#project = value;
    this.#render();
  }

  get project() {
    return this.#project;
  }

  connectedCallback() {
    this.classList.add('card');
    this.style.cursor = 'pointer';
    this.addEventListener('click', this.#handleClick);
    this.#render();
  }

  disconnectedCallback() {
    this.removeEventListener('click', this.#handleClick);
  }

  #handleClick = () => {
    if (!this.#project) return;
    this.dispatchEvent(new CustomEvent('project-selected', {
      bubbles: true,
      detail: { projectId: this.#project.id },
    }));
  };

  #render() {
    if (!this.#project) return;

    const { name, status, createdAt } = this.#project;
    const dateLabel = createdAt?.toDate
      ? createdAt.toDate().toLocaleDateString()
      : '—';

    this.innerHTML = `
      <div class="row" style="justify-content: space-between; align-items:flex-start; gap: var(--space-3);">
        <div>
          <h3 style="font-size: var(--font-size-md); margin-bottom: var(--space-1);">${name}</h3>
          <p class="text-muted" style="font-size: var(--font-size-xs);">Creado: ${dateLabel}</p>
        </div>
        <status-badge status="${status}"></status-badge>
      </div>
    `;
  }
}

customElements.define('project-card', ProjectCard);
