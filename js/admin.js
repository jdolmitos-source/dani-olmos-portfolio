(function(){
  "use strict";

  const MEDIA_TAGS = [
    ["cover","Portada / imagen principal"],
    ["moodboard","Moodboard"],
    ["research","Investigación"],
    ["sketch","Boceto"],
    ["vizcom","Exploración Vizcom"],
    ["blender","Render Blender"],
    ["shoemaster","ShoeMaster"],
    ["pattern","Ingeniería de patrones"],
    ["outsole","Suela"],
    ["final","Producto final"]
  ];

  const setupNotice = document.getElementById("setupNotice");
  const loginScreen = document.getElementById("loginScreen");
  const dashboard = document.getElementById("dashboard");

  if (!window.FIREBASE_IS_CONFIGURED){
    setupNotice.classList.remove("hidden");
    return;
  }

  const auth = window.fbAuth;
  const db = window.fbDB;
  const storage = window.fbStorage;

  auth.onAuthStateChanged(user=>{
    if (user){
      loginScreen.classList.add("hidden");
      dashboard.classList.remove("hidden");
      loadProjectList();
    } else {
      dashboard.classList.add("hidden");
      loginScreen.classList.remove("hidden");
    }
  });

  /* ---------------- Login ---------------- */
  const loginBtn = document.getElementById("loginBtn");
  const loginMsg = document.getElementById("loginMsg");
  loginBtn.addEventListener("click", ()=>{
    const email = document.getElementById("loginEmail").value.trim();
    const pass = document.getElementById("loginPass").value;
    loginMsg.innerHTML = "";
    auth.signInWithEmailAndPassword(email, pass).catch(err=>{
      loginMsg.innerHTML = `<div class="msg error">${translateAuthError(err)}</div>`;
    });
  });
  document.getElementById("loginPass").addEventListener("keydown", e=>{
    if (e.key === "Enter") loginBtn.click();
  });

  document.getElementById("logoutBtn").addEventListener("click", ()=> auth.signOut());

  function translateAuthError(err){
    const map = {
      "auth/invalid-email": "Correo inválido.",
      "auth/user-not-found": "Usuario no encontrado.",
      "auth/wrong-password": "Contraseña incorrecta.",
      "auth/invalid-credential": "Credenciales incorrectas.",
      "auth/too-many-requests": "Demasiados intentos. Espera un momento."
    };
    return map[err.code] || ("Error: " + err.message);
  }

  /* ---------------- Project list ---------------- */
  const projectList = document.getElementById("projectList");
  const dashMsg = document.getElementById("dashMsg");

  function loadProjectList(){
    projectList.innerHTML = `<p class="field-note">Cargando…</p>`;
    db.collection("projects").orderBy("order","asc").get().then(snap=>{
      if (snap.empty){
        projectList.innerHTML = `<p class="field-note">Todavía no has publicado proyectos propios. El sitio público está mostrando los 5 proyectos de demostración mientras tanto.</p>`;
        return;
      }
      projectList.innerHTML = "";
      snap.forEach(doc=>{
        const d = doc.data();
        const row = document.createElement("div");
        row.className = "project-row";
        row.innerHTML = `
          <div>
            <strong>${escapeHtml(d.title_en || doc.id)}</strong>
            <div class="field-note">${escapeHtml(d.slug || doc.id)} · ${escapeHtml(d.year || "")}</div>
          </div>
          <div class="actions">
            <button type="button" data-edit="${doc.id}">Editar</button>
            <button type="button" class="danger" data-delete="${doc.id}">Eliminar</button>
          </div>`;
        projectList.appendChild(row);
      });
      projectList.querySelectorAll("[data-edit]").forEach(b=>{
        b.addEventListener("click", ()=> openForm(b.dataset.edit));
      });
      projectList.querySelectorAll("[data-delete]").forEach(b=>{
        b.addEventListener("click", ()=> deleteProject(b.dataset.delete));
      });
    }).catch(err=>{
      projectList.innerHTML = `<div class="msg error">No se pudo cargar la lista: ${err.message}</div>`;
    });
  }

  function deleteProject(id){
    if (!confirm("¿Eliminar este proyecto? Esta acción no se puede deshacer.")) return;
    db.collection("projects").doc(id).delete().then(()=>{
      dashMsg.innerHTML = `<div class="msg ok">Proyecto eliminado.</div>`;
      loadProjectList();
    }).catch(err=>{
      dashMsg.innerHTML = `<div class="msg error">${err.message}</div>`;
    });
  }

  function escapeHtml(s){
    return String(s || "").replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
  }

  /* ---------------- Form ---------------- */
  const form = document.getElementById("projectForm");
  const newProjectBtn = document.getElementById("newProjectBtn");
  const cancelFormBtn = document.getElementById("cancelFormBtn");
  const formTitle = document.getElementById("formTitle");
  const mediaBlocksWrap = document.getElementById("mediaBlocks");
  const addMediaBtn = document.getElementById("addMediaBtn");
  const videoBlocksWrap = document.getElementById("videoBlocks");
  const addVideoBtn = document.getElementById("addVideoBtn");

  let editingId = null;
  let mediaState = []; // { uid, tag, caption_en, caption_es, file, url }
  let videoState = []; // { uid, caption_en, caption_es, file, url }
  let spinState = []; // { uid, file, url } — order in this array IS the spin order
  let uidCounter = 0;

  newProjectBtn.addEventListener("click", ()=> openForm(null));
  cancelFormBtn.addEventListener("click", closeForm);

  function openForm(id){
    editingId = id;
    form.reset();
    mediaState = [];
    videoState = [];
    spinState = [];
    mediaBlocksWrap.innerHTML = "";
    videoBlocksWrap.innerHTML = "";
    document.getElementById("spin360Strip").innerHTML = "";
    document.getElementById("f_order").value = "1";

    if (id){
      formTitle.textContent = "Editar proyecto";
      db.collection("projects").doc(id).get().then(doc=>{
        if (!doc.exists) return;
        const d = doc.data();
        document.getElementById("f_slug").value = d.slug || id;
        document.getElementById("f_slug").disabled = true;
        document.getElementById("f_year").value = d.year || "";
        document.getElementById("f_order").value = d.order != null ? d.order : 1;
        document.getElementById("f_title_en").value = d.title_en || "";
        document.getElementById("f_title_es").value = d.title_es || "";
        document.getElementById("f_category_en").value = d.category_en || "";
        document.getElementById("f_category_es").value = d.category_es || "";
        document.getElementById("f_role_en").value = d.role_en || "";
        document.getElementById("f_role_es").value = d.role_es || "";
        document.getElementById("f_summary_en").value = d.summary_en || "";
        document.getElementById("f_summary_es").value = d.summary_es || "";
        document.getElementById("f_problem_en").value = d.problem_en || "";
        document.getElementById("f_problem_es").value = d.problem_es || "";
        document.getElementById("f_research_en").value = d.research_en || "";
        document.getElementById("f_research_es").value = d.research_es || "";
        document.getElementById("f_materials_en").value = d.materials_en || "";
        document.getElementById("f_materials_es").value = d.materials_es || "";
        document.getElementById("f_outsole_en").value = d.outsole_en || "";
        document.getElementById("f_outsole_es").value = d.outsole_es || "";
        document.getElementById("f_manufacturing_en").value = d.manufacturing_en || "";
        document.getElementById("f_manufacturing_es").value = d.manufacturing_es || "";
        document.getElementById("f_lessons_en").value = (d.lessons_en || []).join("\n");
        document.getElementById("f_lessons_es").value = (d.lessons_es || []).join("\n");
        const spinCount = Array.isArray(d.spin360) ? d.spin360.length : 0;
        document.getElementById("spin360Existing").textContent = spinCount
          ? `Ya tiene ${spinCount} fotos de 360°. Puedes reordenarlas, quitarlas, o agregar más abajo.`
          : "Todavía no tiene vista 360°.";
        (d.spin360 || []).forEach(url => {
          spinState.push({ uid: "s" + (uidCounter++), file: null, url });
        });
        renderSpinStrip();
        (d.media || []).forEach(m => addMediaBlock(m));
        (d.videos || []).forEach(v => addVideoBlock(v));
      });
    } else {
      formTitle.textContent = "Nuevo proyecto";
      document.getElementById("f_slug").disabled = false;
      document.getElementById("spin360Existing").textContent = "";
    }
    form.classList.remove("hidden");
    form.scrollIntoView({ behavior:"smooth" });
  }

  function closeForm(){
    form.classList.add("hidden");
    editingId = null;
  }

  addMediaBtn.addEventListener("click", ()=> addMediaBlock());

  function addMediaBlock(existing){
    const uid = "m" + (uidCounter++);
    const item = {
      uid,
      tag: (existing && existing.tag) || MEDIA_TAGS[0][0],
      caption_en: (existing && existing.caption_en) || "",
      caption_es: (existing && existing.caption_es) || "",
      file: null,
      url: (existing && existing.url) || ""
    };
    mediaState.push(item);

    const block = document.createElement("div");
    block.className = "media-block";
    block.dataset.uid = uid;
    block.innerHTML = `
      <div>
        <img class="preview" src="${item.url || ""}" style="${item.url ? "" : "display:none;"}">
      </div>
      <div>
        <div class="field-pair">
          <div class="field">
            <label>Sección</label>
            <select data-role="tag">
              ${MEDIA_TAGS.map(([v,l])=>`<option value="${v}" ${v===item.tag?"selected":""}>${l}</option>`).join("")}
            </select>
          </div>
          <div class="field"><label>Imagen</label><input type="file" accept="image/*" data-role="file"></div>
        </div>
        <div class="field-pair">
          <div class="field"><label>Caption (EN)</label><input type="text" data-role="caption_en" value="${item.caption_en}"></div>
          <div class="field"><label>Descripción (ES)</label><input type="text" data-role="caption_es" value="${item.caption_es}"></div>
        </div>
        <button type="button" data-role="remove">Quitar imagen</button>
      </div>`;
    mediaBlocksWrap.appendChild(block);

    block.querySelector("[data-role=tag]").addEventListener("change", e=>{ item.tag = e.target.value; });
    block.querySelector("[data-role=caption_en]").addEventListener("input", e=>{ item.caption_en = e.target.value; });
    block.querySelector("[data-role=caption_es]").addEventListener("input", e=>{ item.caption_es = e.target.value; });
    block.querySelector("[data-role=file]").addEventListener("change", e=>{
      const f = e.target.files[0];
      if (!f) return;
      item.file = f;
      const preview = block.querySelector(".preview");
      preview.src = URL.createObjectURL(f);
      preview.style.display = "";
    });
    block.querySelector("[data-role=remove]").addEventListener("click", ()=>{
      mediaState = mediaState.filter(m => m.uid !== uid);
      block.remove();
    });
  }

  addVideoBtn.addEventListener("click", ()=> addVideoBlock());

  function addVideoBlock(existing){
    const uid = "v" + (uidCounter++);
    const item = {
      uid,
      caption_en: (existing && existing.caption_en) || "",
      caption_es: (existing && existing.caption_es) || "",
      file: null,
      url: (existing && existing.url) || ""
    };
    videoState.push(item);

    const block = document.createElement("div");
    block.className = "media-block";
    block.dataset.uid = uid;
    block.innerHTML = `
      <div>
        ${item.url ? `<video class="preview" src="${item.url}" controls muted style="width:140px;height:100px;"></video>` : `<div class="preview" style="display:flex;align-items:center;justify-content:center;font-size:.65rem;color:var(--ink-faint);">Sin video</div>`}
      </div>
      <div>
        <div class="field"><label>Archivo de video (MP4)</label><input type="file" accept="video/*" data-role="file"></div>
        <div class="field-pair">
          <div class="field"><label>Caption (EN)</label><input type="text" data-role="caption_en" value="${item.caption_en}"></div>
          <div class="field"><label>Descripción (ES)</label><input type="text" data-role="caption_es" value="${item.caption_es}"></div>
        </div>
        <button type="button" data-role="remove">Quitar video</button>
      </div>`;
    videoBlocksWrap.appendChild(block);

    block.querySelector("[data-role=caption_en]").addEventListener("input", e=>{ item.caption_en = e.target.value; });
    block.querySelector("[data-role=caption_es]").addEventListener("input", e=>{ item.caption_es = e.target.value; });
    block.querySelector("[data-role=file]").addEventListener("change", e=>{
      const f = e.target.files[0];
      if (!f) return;
      item.file = f;
      const wrap = block.querySelector("div");
      wrap.innerHTML = `<video class="preview" src="${URL.createObjectURL(f)}" controls muted style="width:140px;height:100px;"></video>`;
    });
    block.querySelector("[data-role=remove]").addEventListener("click", ()=>{
      videoState = videoState.filter(v => v.uid !== uid);
      block.remove();
    });
  }

  /* ---------------- 360 spin sequence (order-by-arrows, not filename) ---------------- */
  const spin360Strip = document.getElementById("spin360Strip");
  document.getElementById("f_spin360").addEventListener("change", (e)=>{
    Array.from(e.target.files || []).forEach(file=>{
      spinState.push({ uid: "s" + (uidCounter++), file, url: URL.createObjectURL(file) });
    });
    e.target.value = ""; // allow re-adding the same filename later if needed
    renderSpinStrip();
  });

  function renderSpinStrip(){
    spin360Strip.innerHTML = spinState.map((item, i)=>`
      <div class="spin-frame" data-uid="${item.uid}">
        <img src="${item.url}" alt="Frame ${i+1}">
        <span class="spin-frame-num">#${i+1}</span>
        <div class="spin-frame-btns">
          <button type="button" data-act="left" ${i===0?"disabled":""}>◀</button>
          <button type="button" data-act="right" ${i===spinState.length-1?"disabled":""}>▶</button>
          <button type="button" data-act="remove" class="danger">✕</button>
        </div>
      </div>
    `).join("");
    spin360Strip.querySelectorAll(".spin-frame").forEach(el=>{
      const uid = el.dataset.uid;
      const idx = spinState.findIndex(s => s.uid === uid);
      el.querySelector('[data-act="left"]').addEventListener("click", ()=>{
        if (idx > 0){ [spinState[idx-1], spinState[idx]] = [spinState[idx], spinState[idx-1]]; renderSpinStrip(); }
      });
      el.querySelector('[data-act="right"]').addEventListener("click", ()=>{
        if (idx < spinState.length-1){ [spinState[idx+1], spinState[idx]] = [spinState[idx], spinState[idx+1]]; renderSpinStrip(); }
      });
      el.querySelector('[data-act="remove"]').addEventListener("click", ()=>{
        spinState = spinState.filter(s => s.uid !== uid);
        renderSpinStrip();
      });
    });
  }

  /* ---------------- Save ---------------- */
  form.addEventListener("submit", async (e)=>{
    e.preventDefault();
    const saveBtn = document.getElementById("saveBtn");
    saveBtn.disabled = true;
    saveBtn.textContent = "Guardando…";
    dashMsg.innerHTML = "";

    try{
      let slug = document.getElementById("f_slug").value.trim().toLowerCase()
        .replace(/[^a-z0-9\-]+/g,"-").replace(/^-+|-+$/g,"");
      if (!slug) throw new Error("El slug es obligatorio.");
      const titleEn = document.getElementById("f_title_en").value.trim();
      if (!titleEn) throw new Error("El título en inglés es obligatorio.");

      // Upload any new media files
      for (const m of mediaState){
        if (m.file){
          const path = `projects/${slug}/${Date.now()}-${m.file.name}`;
          const ref = storage.ref().child(path);
          await ref.put(m.file);
          m.url = await ref.getDownloadURL();
        }
      }
      const mediaOut = mediaState.filter(m => m.url).map(m => ({
        tag: m.tag, url: m.url, caption_en: m.caption_en || "", caption_es: m.caption_es || ""
      }));

      // Upload any new videos
      for (const v of videoState){
        if (v.file){
          const path = `projects/${slug}/videos/${Date.now()}-${v.file.name}`;
          const ref = storage.ref().child(path);
          await ref.put(v.file);
          v.url = await ref.getDownloadURL();
        }
      }
      const videosOut = videoState.filter(v => v.url).map(v => ({
        url: v.url, caption_en: v.caption_en || "", caption_es: v.caption_es || ""
      }));

      // Optional 3D model upload
      let model3dUrl = "";
      const modelFile = document.getElementById("f_model3d").files[0];
      if (modelFile){
        const ref = storage.ref().child(`projects/${slug}/model.glb`);
        await ref.put(modelFile);
        model3dUrl = await ref.getDownloadURL();
      } else if (editingId){
        const existingDoc = await db.collection("projects").doc(editingId).get();
        model3dUrl = (existingDoc.data() || {}).model3dUrl || "";
      }

      // 360 spin sequence — upload any new frames, keep existing URLs, in the visual order.
      let spin360 = [];
      for (let i = 0; i < spinState.length; i++){
        const item = spinState[i];
        if (item.file){
          const ref = storage.ref().child(`projects/${slug}/spin360/${String(i).padStart(3,"0")}-${item.file.name}`);
          await ref.put(item.file);
          item.url = await ref.getDownloadURL();
        }
        spin360.push(item.url);
      }

      const data = {
        slug,
        year: document.getElementById("f_year").value.trim(),
        order: Number(document.getElementById("f_order").value) || 1,
        hero3d: !!model3dUrl,
        model3dUrl,
        spin360,
        media: mediaOut,
        videos: videosOut,
        title_en: titleEn,
        title_es: document.getElementById("f_title_es").value.trim(),
        category_en: document.getElementById("f_category_en").value.trim(),
        category_es: document.getElementById("f_category_es").value.trim(),
        role_en: document.getElementById("f_role_en").value.trim(),
        role_es: document.getElementById("f_role_es").value.trim(),
        summary_en: document.getElementById("f_summary_en").value.trim(),
        summary_es: document.getElementById("f_summary_es").value.trim(),
        problem_en: document.getElementById("f_problem_en").value.trim(),
        problem_es: document.getElementById("f_problem_es").value.trim(),
        research_en: document.getElementById("f_research_en").value.trim(),
        research_es: document.getElementById("f_research_es").value.trim(),
        materials_en: document.getElementById("f_materials_en").value.trim(),
        materials_es: document.getElementById("f_materials_es").value.trim(),
        outsole_en: document.getElementById("f_outsole_en").value.trim(),
        outsole_es: document.getElementById("f_outsole_es").value.trim(),
        manufacturing_en: document.getElementById("f_manufacturing_en").value.trim(),
        manufacturing_es: document.getElementById("f_manufacturing_es").value.trim(),
        lessons_en: document.getElementById("f_lessons_en").value.split("\n").map(s=>s.trim()).filter(Boolean),
        lessons_es: document.getElementById("f_lessons_es").value.split("\n").map(s=>s.trim()).filter(Boolean),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      await db.collection("projects").doc(slug).set(data, { merge:true });

      dashMsg.innerHTML = `<div class="msg ok">Proyecto guardado y publicado.</div>`;
      closeForm();
      loadProjectList();
    }catch(err){
      dashMsg.innerHTML = `<div class="msg error">${err.message}</div>`;
    }finally{
      saveBtn.disabled = false;
      saveBtn.textContent = "Guardar y publicar";
    }
  });

})();
