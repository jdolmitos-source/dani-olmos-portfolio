(function(){
  "use strict";

  /* ---------- Language ---------- */
  const root = document.documentElement;
  const stored = localStorage.getItem("site-lang");
  if (stored) setLang(stored, false);

  document.querySelectorAll("[data-set-lang]").forEach(btn=>{
    btn.addEventListener("click", ()=> setLang(btn.dataset.setLang, true));
  });

  function setLang(lang, persist){
    root.setAttribute("data-lang", lang);
    root.setAttribute("lang", lang);
    document.querySelectorAll("[data-set-lang]").forEach(b=>{
      b.setAttribute("aria-pressed", String(b.dataset.setLang === lang));
    });
    if (persist) localStorage.setItem("site-lang", lang);
  }

  /* ---------- Header scroll state ---------- */
  const header = document.getElementById("siteHeader");
  if (header){
    const onScroll = ()=> header.classList.toggle("scrolled", window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive:true });
  }

  /* ---------- Mobile nav ---------- */
  const navToggle = document.getElementById("navToggle");
  const primaryNav = document.getElementById("primaryNav");
  if (navToggle && primaryNav){
    navToggle.addEventListener("click", ()=>{
      const open = primaryNav.classList.toggle("open");
      navToggle.classList.toggle("open", open);
      navToggle.setAttribute("aria-expanded", String(open));
    });
    primaryNav.querySelectorAll("a").forEach(a=>{
      a.addEventListener("click", ()=>{
        primaryNav.classList.remove("open");
        navToggle.classList.remove("open");
        navToggle.setAttribute("aria-expanded","false");
      });
    });
  }

  /* ---------- Reveal on scroll (also rebinds when content is injected later, e.g. project.html) ---------- */
  function bindReveals(scope){
    const targets = (scope || document).querySelectorAll(".reveal:not([data-reveal-bound])");
    if (!("IntersectionObserver" in window)){
      targets.forEach(t=>{ t.classList.add("in"); t.setAttribute("data-reveal-bound","1"); });
      return;
    }
    const io = new IntersectionObserver((entries)=>{
      entries.forEach(e=>{
        if (e.isIntersecting){ e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { threshold:.15, rootMargin:"0px 0px -60px 0px" });
    targets.forEach(t=>{ t.setAttribute("data-reveal-bound","1"); io.observe(t); });
  }
  bindReveals(document);
  document.addEventListener("content-injected", ()=> bindReveals(document));

  /* ---------- Word-by-word headline reveal (Zaga-style) ---------- */
  function escapeHtml(s){
    return s.replace(/[&<>]/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;" }[c]));
  }
  function initTextReveal(scope){
    const els = (scope || document).querySelectorAll(".reveal-text:not([data-rt-bound])");
    els.forEach(el=>{
      el.setAttribute("data-rt-bound","1");
      const langSpans = el.querySelectorAll("[data-lang-block]");
      const targets = langSpans.length ? Array.from(langSpans) : [el];
      targets.forEach(span=>{
        const words = span.textContent.trim().split(/\s+/).filter(Boolean);
        span.innerHTML = words.map((w,i)=>
          `<span class="rt-word"><span class="rt-word-inner" style="--i:${i}">${escapeHtml(w)}</span></span>`
        ).join(" ");
      });
    });
    if (!els.length) return;
    if (!("IntersectionObserver" in window)){
      els.forEach(el=> el.classList.add("in"));
      return;
    }
    const io = new IntersectionObserver((entries)=>{
      entries.forEach(e=>{ if (e.isIntersecting){ e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { threshold:.3, rootMargin:"0px 0px -40px 0px" });
    els.forEach(el=> io.observe(el));
  }
  initTextReveal(document);
  document.addEventListener("content-injected", ()=> initTextReveal(document));

  /* ---------- Workflow stitch line + steps ---------- */
  const stepsWrap = document.getElementById("workflowSteps");
  if (stepsWrap && typeof WORKFLOW_STEPS !== "undefined"){
    stepsWrap.innerHTML = WORKFLOW_STEPS.map((s,i)=>`
      <div class="wf-step reveal">
        <span class="wf-num mono">0${i+1}</span>
        <div class="wf-icon"><svg viewBox="0 0 24 24" fill="none" stroke-width="1.4">${s.icon}</svg></div>
        <h4><span data-lang-block="en">${s.en.name}</span><span data-lang-block="es">${s.es.name}</span></h4>
        <p><span data-lang-block="en">${s.en.desc}</span><span data-lang-block="es">${s.es.desc}</span></p>
      </div>
    `).join("");
    bindReveals(stepsWrap);
  }

  const wfLine = document.querySelector(".workflow-line-svg path.draw");
  const wfLineBase = document.querySelector(".workflow-line-svg path:not(.draw)");
  const wfLineSvg = document.querySelector(".workflow-line-svg");
  const wfRail = document.querySelector(".workflow-rail");
  function alignWorkflowLine(){
    if (!wfLineSvg || !wfRail) return;
    const icon = wfRail.querySelector(".wf-icon");
    if (!icon) return;
    const iconRect = icon.getBoundingClientRect();
    const railRect = wfRail.getBoundingClientRect();
    const centerY = iconRect.top + iconRect.height / 2 - railRect.top;
    wfLineSvg.style.top = (centerY - 40) + "px"; // 40 = half of the svg's own 80px viewBox height
  }
  alignWorkflowLine();
  window.addEventListener("resize", alignWorkflowLine);
  window.addEventListener("load", alignWorkflowLine);

  if (wfLine && wfRail && "IntersectionObserver" in window){
    const io3 = new IntersectionObserver((entries)=>{
      entries.forEach(e=>{ if (e.isIntersecting){ alignWorkflowLine(); wfLine.classList.add("in"); io3.unobserve(e.target); } });
    }, { threshold:.25 });
    io3.observe(wfRail);
  } else if (wfLine){ wfLine.classList.add("in"); }

  /* ---------- Projects grid (index page) ---------- */
  const grid = document.getElementById("projectsGrid");
  if (grid && window.__projectsReady){
    window.__projectsReady.then(renderProjectsGrid);
  }
  function renderProjectsGrid(PROJECTS){
    if (!grid || !PROJECTS) return;
    grid.innerHTML = PROJECTS.map((p,i)=>{
      const cover = Array.isArray(p.media) ? p.media.find(m => m.tag === "cover") : null;
      const thumb = cover
        ? `<div class="pc-media" style="position:relative;overflow:hidden;">
             <img src="${cover.url}" alt="${(cover.caption_en||"").replace(/"/g,'&quot;')}" style="width:100%;height:100%;object-fit:cover;position:absolute;inset:0;">
           </div>`
        : `<div class="pc-media media-slot">
             <div class="slot-label">
               <span data-lang-block="en">${p.category.en}</span><span data-lang-block="es">${p.category.es}</span>
               <span>0${i+1} / ${p.year}</span>
             </div>
           </div>`;
      return `
      <a class="project-card reveal" href="project.html?slug=${p.slug}">
        ${thumb}
        <h3><span><span data-lang-block="en">${p.title.en}</span><span data-lang-block="es">${p.title.es}</span></span>
          <svg viewBox="0 0 20 20" fill="none"><path d="M5 15L15 5M8 5h7v7" stroke="currentColor" stroke-width="1.4"/></svg>
        </h3>
        <p><span data-lang-block="en">${p.summary.en}</span><span data-lang-block="es">${p.summary.es}</span></p>
        <div class="pc-meta"><span data-lang-block="en">${p.role.en}</span><span data-lang-block="es">${p.role.es}</span><span>${p.year}</span></div>
      </a>`;
    }).join("");
    bindReveals(grid);
  }

  /* ---------- Before/after compare widget ---------- */
  const range = document.getElementById("compareRange");
  const widget = document.getElementById("compareWidget");
  const handle = document.getElementById("compareHandle");
  if (range && widget && handle){
    const afterLayer = widget.querySelector(".layer.after");
    const update = (val)=>{
      afterLayer.style.clipPath = `inset(0 0 0 ${val}%)`;
      handle.style.left = `${val}%`;
    };
    range.addEventListener("input", (e)=> update(e.target.value));
    update(50);
  }

  /* ---------- Hero parallax ---------- */
  const heroVisual = document.getElementById("heroVisual");
  if (heroVisual && !window.matchMedia("(prefers-reduced-motion: reduce)").matches){
    window.addEventListener("scroll", ()=>{
      const y = window.scrollY;
      if (y < window.innerHeight) heroVisual.style.transform = `translateY(${y * 0.15}px)`;
    }, { passive:true });
  }

  /* ---------- Footer year ---------- */
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Image lightbox (click any .zoomable image to view full size) ---------- */
  let lightbox = document.querySelector(".lightbox-overlay");
  if (!lightbox){
    lightbox = document.createElement("div");
    lightbox.className = "lightbox-overlay";
    lightbox.innerHTML = `
      <button class="lightbox-close" aria-label="Close">
        <svg viewBox="0 0 20 20" fill="none"><path d="M5 5l10 10M15 5L5 15" stroke="currentColor" stroke-width="1.6"/></svg>
      </button>
      <img alt="">`;
    document.body.appendChild(lightbox);
    const lbImg = lightbox.querySelector("img");
    function closeLightbox(){ lightbox.classList.remove("open"); lbImg.src = ""; }
    lightbox.querySelector(".lightbox-close").addEventListener("click", closeLightbox);
    lightbox.addEventListener("click", e=>{ if (e.target === lightbox) closeLightbox(); });
    document.addEventListener("keydown", e=>{ if (e.key === "Escape") closeLightbox(); });
    document.addEventListener("click", e=>{
      const img = e.target.closest(".zoomable");
      if (!img) return;
      e.preventDefault();
      lbImg.src = img.src;
      lbImg.alt = img.alt || "";
      lightbox.classList.add("open");
    });
  }

  /* ---------- React to dynamically injected content (project.html) ---------- */
  document.addEventListener("content-injected", ()=>{
    const wfLine2 = document.querySelector(".workflow-line-svg path.draw");
    if (wfLine2) wfLine2.classList.add("in");
  });

})();
