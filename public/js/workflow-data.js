// Nine-stage production workflow. Order carries real meaning — do not shuffle.
const WORKFLOW_STEPS = [
  {
    en: { name: "Research", desc: "Market, athlete/user needs, trend and material scouting." },
    es: { name: "Investigación", desc: "Mercado, necesidades del usuario/atleta, tendencias y materiales." },
    icon: `<circle cx="12" cy="10" r="6"/><path d="M17 15l4 4"/>`
  },
  {
    en: { name: "Sketch", desc: "Hand concepting — silhouette, proportion, construction intent." },
    es: { name: "Boceto", desc: "Conceptualización a mano — silueta, proporción, intención constructiva." },
    icon: `<path d="M4 20l3-1 11-11-2-2L5 17l-1 3z"/>`
  },
  {
    en: { name: "Illustrator", desc: "Vector line-up, tech flats, spec-ready artwork." },
    es: { name: "Illustrator", desc: "Vectorización, tech flats, arte listo para ficha técnica." },
    icon: `<rect x="4" y="4" width="16" height="16" rx="1"/><path d="M8 15l3-5 2 3 2-4 3 6"/>`
  },
  {
    en: { name: "Vizcom AI", desc: "AI-accelerated rendering of viable concept variations." },
    es: { name: "Vizcom AI", desc: "Renderizado acelerado por IA de variaciones de concepto viables." },
    icon: `<path d="M12 3v3M12 18v3M3 12h3M18 12h3"/><circle cx="12" cy="12" r="4"/>`
  },
  {
    en: { name: "Blender", desc: "3D modeling and photoreal render for stakeholder review." },
    es: { name: "Blender", desc: "Modelado 3D y render fotorrealista para revisión interna." },
    icon: `<circle cx="12" cy="12" r="8"/><path d="M8 10c1-2 3-3 4-1s1 4-1 5-4-1-3-4z"/>`
  },
  {
    en: { name: "ShoeMaster", desc: "2D/3D technical construction and grading base." },
    es: { name: "ShoeMaster", desc: "Construcción técnica 2D/3D y base de graduación." },
    icon: `<path d="M4 18c2-6 6-10 10-10M14 8h5v5"/>`
  },
  {
    en: { name: "Pattern Engineering", desc: "Piece breakdown, allowances, yield and stretch direction." },
    es: { name: "Ingeniería de Patrones", desc: "Despiece, márgenes, aprovechamiento y dirección de estiramiento." },
    icon: `<path d="M4 4h7v7H4zM13 13h7v7h-7z"/><path d="M11 8l5 5"/>`
  },
  {
    en: { name: "Prototype", desc: "Physical sample, fit and construction validation." },
    es: { name: "Prototipo", desc: "Muestra física, validación de ajuste y construcción." },
    icon: `<path d="M6 20c-2-6 2-9 6-9s8 3 6 9"/><path d="M9 11V6h6v5"/>`
  },
  {
    en: { name: "Mass Production", desc: "Costing, line setup and factory hand-off." },
    es: { name: "Producción en Masa", desc: "Costeo, montaje de línea y transferencia a fábrica." },
    icon: `<rect x="4" y="9" width="4" height="9"/><rect x="10" y="5" width="4" height="13"/><rect x="16" y="12" width="4" height="6"/>`
  }
];
