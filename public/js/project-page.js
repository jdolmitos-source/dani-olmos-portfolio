(function(){
  "use strict";
  if (!window.__projectsReady) return;
  window.__projectsReady.then(renderProjectPage);

  function renderProjectPage(PROJECTS){
  if (!PROJECTS) return;
  const params = new URLSearchParams(window.location.search);
  const slug = params.get("slug");
  const idx = PROJECTS.findIndex(p => p.slug === slug);
  const root = document.getElementById("projectRoot");
  if (!root) return;

  if (idx === -1){
    root.innerHTML = `
      <div class="wrap state-msg">
        <p class="eyebrow">404</p>
        <h1 class="h1" style="font-size:clamp(2rem,5vw,3.4rem)">
          <span data-lang-block="en">Project not found</span><span data-lang-block="es">Proyecto no encontrado</span>
        </h1>
        <a class="btn primary" href="index.html#projects">
          <span data-lang-block="en">Back to Portfolio</span><span data-lang-block="es">Volver al Portafolio</span>
        </a>
      </div>`;
    return;
  }

  const p = PROJECTS[idx];
  const prev = PROJECTS[(idx - 1 + PROJECTS.length) % PROJECTS.length];
  const next = PROJECTS[(idx + 1) % PROJECTS.length];

  document.title = `${p.title.en} — Footwear Case Study`;
  const descTag = document.getElementById("pageDesc");
  if (descTag) descTag.setAttribute("content", p.summary.en);
  const canon = document.getElementById("canonical");
  if (canon) canon.setAttribute("href", `https://example-domain.web.app/project.html?slug=${p.slug}`);

  const media = Array.isArray(p.media) ? p.media : [];
  function imagesFor(tag){ return media.filter(m => m.tag === tag); }

  function bilingual(field){
    return `<span data-lang-block="en">${field.en}</span><span data-lang-block="es">${field.es}</span>`;
  }
  function mediaSlot(labelEn, labelEs, tag){
    const imgs = imagesFor(tag);
    if (imgs.length){
      return imgs.map(img => `
        <figure class="media-slot reveal" style="min-height:0;background:none;aspect-ratio:4/3;">
          <img class="zoomable" src="${img.url}" alt="${(img.caption_en||labelEn).replace(/"/g,'&quot;')}" style="width:100%;height:100%;object-fit:cover;position:absolute;inset:0;">
        </figure>`).join("");
    }
    return `<div class="media-slot reveal"><div class="slot-label">
      <span data-lang-block="en">${labelEn}</span><span data-lang-block="es">${labelEs}</span><span>${tag.toUpperCase()}</span>
    </div></div>`;
  }
  function section(num, headEn, headEs, bodyHtml, mediaHtml){
    return `
      <section class="proj-section">
        <div class="proj-section-head">
          <span class="idx mono">${num}</span>
          <h3>${bilingual({en:headEn, es:headEs})}</h3>
        </div>
        <div class="proj-body">
          <div></div>
          <div>
            <p class="txt reveal">${bodyHtml}</p>
            ${mediaHtml || ""}
          </div>
        </div>
      </section>`;
  }

  const spin = Array.isArray(p.spin360) ? p.spin360 : [];
  const modelUrl = p.model3dUrl || "";
  const modelViewerBlock = `
    <div class="model-viewer-slot reveal">
      <span class="mv-tag">
        <span data-lang-block="en">Interactive 3D preview</span>
        <span data-lang-block="es">Vista previa 3D interactiva</span>
      </span>
      <model-viewer src="${modelUrl}"
        camera-controls auto-rotate touch-action="pan-y" exposure="0.9" shadow-intensity="0.6"
        alt="Interactive 3D preview of the shoe model">
      </model-viewer>
    </div>`;
  let heroMedia;
  let extraModelSection = "";
  if (spin.length > 1){
    heroMedia = `
      <div class="spin360 reveal" id="spinViewer" data-frames='${JSON.stringify(spin)}'>
        <img src="${spin[0]}" alt="360 view" draggable="false">
        <span class="spin-progress" id="spinProgress">1 / ${spin.length}</span>
        <span class="spin-hint">
          <svg viewBox="0 0 24 24" fill="none"><path d="M4 12a8 8 0 0114-5M20 12a8 8 0 01-14 5" stroke="currentColor" stroke-width="1.6"/><path d="M18 4v4h-4M6 20v-4h4" stroke="currentColor" stroke-width="1.6"/></svg>
          <span data-lang-block="en">Drag to rotate</span><span data-lang-block="es">Arrastra para girar</span>
        </span>
      </div>`;
    // The 360 sequence takes the hero spot — if a 3D model was ALSO uploaded,
    // give it its own guaranteed section right below instead of hiding it.
    if (modelUrl) extraModelSection = `<div class="wrap" style="margin-top:1rem;">${modelViewerBlock}</div>`;
  } else if (modelUrl){
    heroMedia = modelViewerBlock;
  } else {
    heroMedia = mediaSlot("Hero render", "Render principal", "cover");
  }

  root.innerHTML = `
    <section class="proj-hero">
      <div class="wrap">
        <a href="index.html#projects" class="eyebrow reveal" style="margin-bottom:1.6rem;">
          <span data-lang-block="en">← All Projects</span><span data-lang-block="es">← Todos los Proyectos</span>
        </a>
        <p class="eyebrow reveal">${bilingual(p.category)}</p>
        <h1 class="reveal-text" style="margin-top:.8rem;">${bilingual(p.title)}</h1>
        <p class="lede reveal" style="margin-top:1.2rem;">${bilingual(p.summary)}</p>

        <div class="proj-meta-strip reveal">
          <div><span data-lang-block="en">Year</span><span data-lang-block="es">Año</span><b>${p.year}</b></div>
          <div><span data-lang-block="en">Role</span><span data-lang-block="es">Rol</span><b>${bilingual(p.role)}</b></div>
          <div><span data-lang-block="en">Category</span><span data-lang-block="es">Categoría</span><b>${bilingual(p.category)}</b></div>
        </div>
      </div>
    </section>

    <div class="wrap">
      ${heroMedia}
    </div>
    ${extraModelSection}

    <div class="wrap">
      ${section("01", "The Problem", "El Problema", bilingual(p.problem))}
      ${section("02", "Research &amp; Moodboard", "Investigación y Moodboard", bilingual(p.research),
        `<div class="proj-media-grid">${mediaSlot("Moodboard","Moodboard","moodboard")}${mediaSlot("Research references","Referencias de investigación","research")}</div>`)}
      ${section("03", "Sketches &amp; Vizcom Explorations", "Bocetos y Exploraciones en Vizcom",
        bilingual({en:"Concept variations were generated and filtered against manufacturability before moving to 3D.", es:"Se generaron variaciones de concepto y se filtraron según manufacturabilidad antes de pasar a 3D."}),
        `<div class="proj-media-grid">${mediaSlot("Sketch","Boceto","sketch")}${mediaSlot("Vizcom exploration","Exploración Vizcom","vizcom")}</div>`)}
      ${section("04", "Blender Renders", "Renders en Blender",
        bilingual({en:"Photoreal render pass used for internal review and stakeholder sign-off before physical sampling.", es:"Pase de render fotorrealista usado para revisión interna y aprobación antes de la muestra física."}),
        `<div class="proj-media-grid">${mediaSlot("Blender render","Render en Blender","blender")}</div>`)}
      ${section("05", "ShoeMaster Development", "Desarrollo en ShoeMaster",
        bilingual({en:"Technical construction, grading base, and 3D-to-2D pattern flattening built in ShoeMaster.", es:"Construcción técnica, base de graduación y aplanado de patrón 3D a 2D construidos en ShoeMaster."}),
        mediaSlot("ShoeMaster technical build","Construcción técnica en ShoeMaster","shoemaster"))}
      ${section("06", "Pattern Engineering", "Ingeniería de Patrones",
        bilingual({en:"Piece breakdown with seam allowances, yield optimization, and stretch-direction constraints per material.", es:"Despiece con márgenes de costura, optimización de aprovechamiento y restricciones de dirección de estiramiento por material."}),
        mediaSlot("Pattern piece layout","Distribución de piezas del patrón","pattern"))}
      ${section("07", "Material Selection", "Selección de Materiales", bilingual(p.materials))}
      ${section("08", "Outsole Development", "Desarrollo de Suela", bilingual(p.outsole),
        mediaSlot("Outsole tread development","Desarrollo de tacos de suela","outsole"))}
      ${section("09", "Manufacturing Considerations", "Consideraciones de Manufactura", bilingual(p.manufacturing))}
      ${section("10", "Final Product", "Producto Final",
        bilingual({en:"Approved for production and released to the line.", es:"Aprobado para producción y liberado a la línea."}),
        mediaSlot("Final product","Producto final","final"))}

      ${(Array.isArray(p.videos) && p.videos.length) ? `
      <section class="proj-section">
        <div class="proj-section-head">
          <span class="idx mono">11</span>
          <h3>${bilingual({en:"Process Videos", es:"Videos del Proceso"})}</h3>
        </div>
        <div class="proj-body">
          <div></div>
          <div>
            <div class="proj-media-grid">
              ${p.videos.map(v => `
                <figure class="media-slot reveal" style="min-height:0;background:none;padding:0;aspect-ratio:16/9;">
                  <video src="${v.url}" controls preload="metadata" style="width:100%;height:100%;position:absolute;inset:0;object-fit:cover;background:#000;"></video>
                </figure>
              `).join("")}
            </div>
          </div>
        </div>
      </section>` : ""}

      <section class="proj-section" style="border-bottom:none;">
        <div class="proj-section-head">
          <span class="idx mono">12</span>
          <h3>${bilingual({en:"Lessons Learned", es:"Lecciones Aprendidas"})}</h3>
        </div>
        <div class="proj-body">
          <div></div>
          <div class="lessons-box reveal">
            <ul>
              ${p.lessons.en.map((l,i)=>`<li data-lang-block="en">${l}</li><li data-lang-block="es" style="display:none">${(p.lessons.es[i]||"")}</li>`).join("")}
            </ul>
          </div>
        </div>
      </section>

      <div class="proj-nav">
        <a href="project.html?slug=${prev.slug}">← ${bilingual(prev.title)}</a>
        <a href="project.html?slug=${next.slug}">${bilingual(next.title)} →</a>
      </div>
    </div>
  `;

  document.dispatchEvent(new CustomEvent("content-injected"));
  initSpinViewer();

  function initSpinViewer(){
    const el = document.getElementById("spinViewer");
    if (!el) return;
    const frames = JSON.parse(el.dataset.frames || "[]");
    const img = el.querySelector("img");
    const progress = document.getElementById("spinProgress");
    if (!frames.length) return;

    // Preload frames so dragging feels instant.
    frames.forEach(src => { const im = new Image(); im.src = src; });

    let current = 0;
    let dragging = false;
    let startX = 0;
    let startFrame = 0;
    const sensitivity = 6; // px per frame step

    function setFrame(i){
      current = ((i % frames.length) + frames.length) % frames.length;
      img.src = frames[current];
      if (progress) progress.textContent = `${current + 1} / ${frames.length}`;
    }

    function onDown(x){
      dragging = true; startX = x; startFrame = current;
      el.classList.add("interacted");
    }
    function onMove(x){
      if (!dragging) return;
      const delta = Math.round((x - startX) / sensitivity);
      setFrame(startFrame - delta);
    }
    function onUp(){ dragging = false; }

    el.addEventListener("pointerdown", e=>{ onDown(e.clientX); el.setPointerCapture(e.pointerId); });
    el.addEventListener("pointermove", e=> onMove(e.clientX));
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);
    el.addEventListener("pointerleave", onUp);
  }
  }
})();
