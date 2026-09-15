// DEMO / FALLBACK CONTENT ONLY.
// This is what shows up before you connect Firebase, or if Firestore has no
// projects yet. Once you log into admin.html and publish your own projects,
// those take over automatically — you never need to edit this file.
const PROJECTS_FALLBACK = [
  {
    slug: "velocity-runner",
    category: { en: "Sports Footwear", es: "Calzado Deportivo" },
    year: "2023",
    role: { en: "Lead Footwear Designer", es: "Diseñador Líder de Calzado" },
    title: { en: "Velocity Runner", es: "Velocity Runner" },
    summary: {
      en: "A lightweight performance trainer built around a new midsole geometry and a one-piece knit upper.",
      es: "Un entrenador de rendimiento ligero construido sobre una nueva geometría de mediasuela y un upper de punto de una sola pieza."
    },
    hero3d: true,
    problem: {
      en: "The brief asked for a 12% weight reduction versus the prior model without sacrificing torsional support — a combination the existing outsole tooling couldn't deliver.",
      es: "El brief pedía una reducción de peso del 12% respecto al modelo anterior sin sacrificar el soporte torsional — una combinación que el molde de suela existente no podía lograr."
    },
    research: {
      en: "Benchmarked competitor midsole densities and gait-lab data from three athlete profiles; identified the torsion shank as the main mass penalty.",
      es: "Se compararon densidades de mediasuela de la competencia y datos de laboratorio de tres perfiles de atleta; se identificó el shank de torsión como la mayor penalización de peso."
    },
    manufacturing: {
      en: "Redesigned the shank as a co-molded TPU insert instead of a separate component, cutting one assembly step and 8g per shoe. Validated with the factory's compression-molding line before tooling was cut.",
      es: "Se rediseñó el shank como un inserto de TPU co-moldeado en lugar de un componente separado, eliminando un paso de ensamble y 8g por zapato. Validado con la línea de moldeo por compresión de la fábrica antes de cortar el molde."
    },
    materials: {
      en: "Engineered single-jacquard knit upper (recycled polyester blend), co-molded EVA/TPU midsole, and a segmented rubber outsole for independent forefoot flex.",
      es: "Upper de punto jacquard de una sola pieza (mezcla de poliéster reciclado), mediasuela co-moldeada EVA/TPU y suela de goma segmentada para flexión independiente del antepié."
    },
    outsole: {
      en: "Segmented lug pattern mapped to pressure data from the gait lab, with a decoupled forefoot groove to preserve flex without adding weight.",
      es: "Patrón de tacos segmentado mapeado según datos de presión del laboratorio de marcha, con una ranura de antepié desacoplada para preservar la flexión sin añadir peso."
    },
    lessons: {
      en: [
        "Co-molding the shank saved more weight than upper material changes alone.",
        "Vizcom variations converged the color team two weeks faster than the prior season.",
        "Factory trial runs at week 3, not week 8, caught a stitch-tension issue early."
      ],
      es: [
        "Co-moldear el shank ahorró más peso que solo cambiar el material del upper.",
        "Las variaciones en Vizcom alinearon al equipo de color dos semanas más rápido que la temporada anterior.",
        "Las pruebas de fábrica en la semana 3, no en la 8, detectaron a tiempo un problema de tensión de costura."
      ]
    }
  },
  {
    slug: "harbor-lifestyle-slip",
    category: { en: "Lifestyle Footwear", es: "Calzado Lifestyle" },
    year: "2022",
    role: { en: "Technical & Pattern Designer", es: "Diseñador Técnico y de Patrones" },
    title: { en: "Harbor Slip-On", es: "Harbor Slip-On" },
    summary: {
      en: "A minimal slip-on built from a single hide-efficient upper pattern, designed for a 40% leather-yield improvement.",
      es: "Un slip-on minimalista construido con un patrón de upper eficiente en cuero, diseñado para mejorar el aprovechamiento de piel en un 40%."
    },
    problem: {
      en: "Leather waste on the outgoing model was running near 34% per pair — well above the factory's cost target for the line.",
      es: "El desperdicio de cuero en el modelo saliente rondaba el 34% por par — muy por encima de la meta de costo de la fábrica para la línea."
    },
    research: {
      en: "Studied hide grain direction and stretch tables from the tannery, then reverse-engineered nesting patterns from the technician's CorelDraw workflow.",
      es: "Se estudió la dirección de la fibra y las tablas de estiramiento del curtido, y se reconstruyó el anidado a partir del flujo de trabajo en CorelDraw del técnico de costeo."
    },
    manufacturing: {
      en: "Rebuilt the piece layout to follow hide silhouette rather than a rectangular grid, improving material yield (aprovechamiento) from 66% to 84% without changing the last.",
      es: "Se reconstruyó la distribución de piezas siguiendo la silueta de la piel en vez de una cuadrícula rectangular, mejorando el aprovechamiento de 66% a 84% sin cambiar la horma."
    },
    materials: {
      en: "Full-grain vegetable-tanned leather upper, cork-latex insole board, natural rubber outsole.",
      es: "Upper de cuero de grano completo curtido vegetal, plantilla de corcho-látex, suela de goma natural."
    },
    outsole: {
      en: "Low-profile natural rubber unit with a hand-finished edge to match the leather's organic texture.",
      es: "Unidad de goma natural de perfil bajo con borde acabado a mano para combinar con la textura orgánica del cuero."
    },
    lessons: {
      en: [
        "Nesting for hide shape, not a grid, was the single biggest cost lever on the project.",
        "Bringing the costing technician in during pattern development — not after — avoided two rounds of rework."
      ],
      es: [
        "Anidar según la forma de la piel, no una cuadrícula, fue la palanca de costo más importante del proyecto.",
        "Incluir al técnico de costeo durante el desarrollo del patrón — no después — evitó dos rondas de retrabajo."
      ]
    }
  },
  {
    slug: "aero-court",
    category: { en: "Sports Footwear", es: "Calzado Deportivo" },
    year: "2024",
    role: { en: "Lead Footwear Designer", es: "Diseñador Líder de Calzado" },
    title: { en: "Aero Court", es: "Aero Court" },
    summary: {
      en: "A court shoe exploring lateral containment through pattern geometry instead of added overlays.",
      es: "Un tenis de cancha que explora la contención lateral mediante geometría de patrón en lugar de refuerzos añadidos."
    },
    problem: {
      en: "Lateral support overlays were adding 14g and a full production step the brand wanted removed for the next generation.",
      es: "Los refuerzos laterales añadían 14g y un paso de producción completo que la marca quería eliminar en la siguiente generación."
    },
    research: {
      en: "Explored 40+ overlay-free upper geometries in a single afternoon using Vizcom, narrowing to three families before any physical sampling.",
      es: "Se exploraron más de 40 geometrías de upper sin refuerzos en una sola tarde usando Vizcom, reduciendo a tres familias antes de cualquier muestra física."
    },
    manufacturing: {
      en: "Selected geometry was validated in Blender for seam placement, then built in ShoeMaster to confirm the pattern held containment under a simulated lateral load.",
      es: "La geometría seleccionada se validó en Blender para la ubicación de costuras, luego se construyó en ShoeMaster para confirmar que el patrón mantenía la contención bajo carga lateral simulada."
    },
    materials: {
      en: "Engineered mesh with directional stretch zones, TPU heel counter, and a wide-based compression-molded outsole.",
      es: "Malla técnica con zonas de estiramiento direccional, contrafuerte de TPU y suela de base ancha moldeada por compresión."
    },
    outsole: {
      en: "Widened base with a herringbone-to-pivot transition zone for quick direction changes.",
      es: "Base ensanchada con zona de transición de espiga a pivote para cambios rápidos de dirección."
    },
    lessons: {
      en: [
        "AI-generated variations are only useful when every option is manufacturable — filtering early saved sampling budget.",
        "Removing the overlay step also removed a recurring quality defect, not just weight."
      ],
      es: [
        "Las variaciones generadas por IA solo sirven si cada opción es manufacturable — filtrar temprano ahorró presupuesto de muestras.",
        "Eliminar el paso de refuerzo también eliminó un defecto de calidad recurrente, no solo peso."
      ]
    }
  },
  {
    slug: "terra-trail",
    category: { en: "Sports Footwear", es: "Calzado Deportivo" },
    year: "2021",
    role: { en: "Footwear & Pattern Designer", es: "Diseñador de Calzado y Patrones" },
    title: { en: "Terra Trail", es: "Terra Trail" },
    summary: {
      en: "An off-road trail shoe developed around a rock-plate insert and a self-cleaning lug pattern.",
      es: "Un tenis de trail desarrollado alrededor de un inserto de placa de roca y un patrón de tacos autolimpiante."
    },
    problem: {
      en: "Prior trail model retained mud in wet conditions, reducing traction after the first kilometer of testing.",
      es: "El modelo de trail anterior retenía barro en condiciones húmedas, reduciendo la tracción tras el primer kilómetro de prueba."
    },
    research: {
      en: "Field-tested competitor outsoles in local trail conditions and mapped lug spacing against mud-release performance.",
      es: "Se probaron en campo suelas de la competencia en senderos locales y se mapeó el espaciado de tacos contra el rendimiento de liberación de barro."
    },
    manufacturing: {
      en: "Increased lug channel depth and angled the leading edge for self-cleaning release; confirmed moldability with the outsole supplier before finalizing tooling.",
      es: "Se aumentó la profundidad del canal de tacos y se anguló el borde de ataque para liberación autolimpiante; se confirmó la moldeabilidad con el proveedor de suelas antes de finalizar el molde."
    },
    materials: {
      en: "Abrasion-resistant ripstop upper, TPU rock plate, dual-density EVA midsole.",
      es: "Upper de ripstop resistente a la abrasión, placa de roca de TPU, mediasuela EVA de doble densidad."
    },
    outsole: {
      en: "Deep multi-directional lug pattern with angled release channels, sticky-rubber compound at the toe.",
      es: "Patrón de tacos multidireccional profundo con canales de liberación angulados, compuesto de goma adherente en la puntera."
    },
    lessons: {
      en: ["Field testing surfaced a failure mode no lab test had flagged.", "Small angle changes on the lug leading edge had an outsized effect on mud release."],
      es: ["Las pruebas de campo revelaron un modo de falla que ninguna prueba de laboratorio había detectado.", "Pequeños cambios de ángulo en el borde del taco tuvieron un efecto desproporcionado en la liberación de barro."]
    }
  },
  {
    slug: "form-knit-slide",
    category: { en: "Lifestyle Footwear", es: "Calzado Lifestyle" },
    year: "2023",
    role: { en: "Footwear Designer", es: "Diseñador de Calzado" },
    title: { en: "Form Knit Slide", es: "Form Knit Slide" },
    summary: {
      en: "A recovery slide with a fully knit strap system exploring color-blend transitions generated with AI-assisted concepting.",
      es: "Una sandalia de recuperación con sistema de correa de punto completo, explorando transiciones de mezcla de color generadas con conceptualización asistida por IA."
    },
    problem: {
      en: "Marketing wanted a distinctive gradient colorway family that was still cost-neutral to produce on existing knitting machines.",
      es: "Marketing quería una familia de colores degradados distintiva que siguiera siendo neutra en costo con las máquinas de tejido existentes."
    },
    research: {
      en: "Mapped existing yarn-feed capabilities against target gradients to avoid specifying a transition the machines couldn't knit.",
      es: "Se mapearon las capacidades existentes de alimentación de hilo contra los degradados objetivo para evitar especificar una transición que las máquinas no pudieran tejer."
    },
    manufacturing: {
      en: "Used Vizcom to generate a wide colorway range in a single review, then confirmed the two strongest options were achievable with the factory's current yarn inventory — no new tooling required.",
      es: "Se usó Vizcom para generar una amplia gama de colores en una sola revisión, luego se confirmó que las dos opciones más fuertes eran alcanzables con el inventario de hilo actual de la fábrica — sin molde nuevo."
    },
    materials: {
      en: "Recycled-yarn knit strap, EVA footbed with contoured arch support, injected outsole base.",
      es: "Correa de punto de hilo reciclado, plantilla EVA con soporte de arco contorneado, base de suela inyectada."
    },
    outsole: {
      en: "Injected EVA base with a shallow traction pattern tuned for wet bathroom and pool-deck surfaces.",
      es: "Base de EVA inyectada con patrón de tracción bajo, ajustado para superficies húmedas de baño y borde de piscina."
    },
    lessons: {
      en: ["Designing inside real machine constraints made every AI-generated option production-ready.", "A cost-neutral colorway story sold internally faster than a premium one."],
      es: ["Diseñar dentro de las restricciones reales de máquina hizo que cada opción generada por IA estuviera lista para producción.", "Una historia de colores neutra en costo se vendió internamente más rápido que una premium."]
    }
  }
];
