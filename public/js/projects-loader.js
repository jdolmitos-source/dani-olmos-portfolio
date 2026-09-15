// Produces window.PROJECTS in the same shape main.js / project-page.js expect,
// either from Firestore (your published projects) or from the local demo file.
window.__projectsReady = (async function loadProjects(){
  if (!window.FIREBASE_IS_CONFIGURED || !window.fbDB){
    window.PROJECTS = (typeof PROJECTS_FALLBACK !== "undefined") ? PROJECTS_FALLBACK : [];
    return window.PROJECTS;
  }
  try{
    const snap = await window.fbDB.collection("projects").orderBy("order", "asc").get();
    if (snap.empty){
      window.PROJECTS = (typeof PROJECTS_FALLBACK !== "undefined") ? PROJECTS_FALLBACK : [];
      return window.PROJECTS;
    }
    window.PROJECTS = snap.docs.map(doc => docToProject(doc.id, doc.data()));
    return window.PROJECTS;
  }catch(err){
    console.error("[portfolio] Could not load projects from Firestore, showing demo content:", err);
    window.PROJECTS = (typeof PROJECTS_FALLBACK !== "undefined") ? PROJECTS_FALLBACK : [];
    return window.PROJECTS;
  }
})();

// Converts a flat Firestore document into the nested {en,es} shape used
// throughout the site's rendering code.
function docToProject(id, d){
  return {
    slug: d.slug || id,
    year: d.year || "",
    hero3d: !!d.hero3d,
    model3dUrl: d.model3dUrl || "",
    spin360: Array.isArray(d.spin360) ? d.spin360 : [],
    media: Array.isArray(d.media) ? d.media : [],
    videos: Array.isArray(d.videos) ? d.videos : [],
    category: { en: d.category_en || "", es: d.category_es || "" },
    role: { en: d.role_en || "", es: d.role_es || "" },
    title: { en: d.title_en || "", es: d.title_es || "" },
    summary: { en: d.summary_en || "", es: d.summary_es || "" },
    problem: { en: d.problem_en || "", es: d.problem_es || "" },
    research: { en: d.research_en || "", es: d.research_es || "" },
    materials: { en: d.materials_en || "", es: d.materials_es || "" },
    outsole: { en: d.outsole_en || "", es: d.outsole_es || "" },
    manufacturing: { en: d.manufacturing_en || "", es: d.manufacturing_es || "" },
    lessons: { en: d.lessons_en || [], es: d.lessons_es || [] }
  };
}
