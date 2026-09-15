# Portafolio — Industrial Footwear Designer

Sitio estático (HTML/CSS/JS puro, sin frameworks) para Firebase Hosting, con
**panel de administración propio** (login + formulario) para publicar
proyectos sin tocar código.

## Estructura

```
index.html              → página principal
project.html            → plantilla de proyecto individual (?slug=nombre-proyecto)
admin.html              → panel de administración (login + formulario)
css/styles.css          → todo el sistema visual
js/main.js              → navegación, idioma, animaciones, comparador antes/después
js/workflow-data.js     → los 9 pasos del proceso (editar aquí si algún día cambian)
js/projects-data.js     → 5 proyectos DE DEMOSTRACIÓN (se ocultan solos en cuanto publiques los tuyos)
js/firebase-config.js   → PEGA AQUÍ los datos de tu proyecto Firebase
js/firebase-init.js     → conecta Firebase (no tocar)
js/projects-loader.js   → decide si mostrar tus proyectos o los de demo (no tocar)
js/project-page.js      → arma la página de un proyecto (no tocar)
js/admin.js             → lógica del panel de administración (no tocar)
firebase.json / .firebaserc / firestore.rules / firestore.indexes.json / storage.rules
robots.txt / sitemap.xml
```

**Nunca necesitas editar código para agregar un proyecto.** Todo se hace desde
`admin.html` una vez esté configurado Firebase (pasos abajo).

---

## Cómo funciona el plan completo

1. Mientras no configures Firebase, el sitio público muestra 5 proyectos de
   **demostración** (para que puedas ver el diseño terminado).
2. En cuanto configures Firebase y publiques tu primer proyecto real desde
   `admin.html`, el sitio público automáticamente empieza a mostrar TUS
   proyectos en vez de los de demostración.
3. Para agregar, editar o borrar un proyecto: entras a `tu-sitio.web.app/admin.html`,
   inicias sesión con tu correo/contraseña, llenas el formulario, subes tus
   imágenes con el botón de archivo, y das clic en "Guardar y publicar".
   Nada de código, nada de redeploy — se actualiza al instante.

---

## Configuración inicial de Firebase (una sola vez)

### 1. Crea el proyecto de Firebase (si no lo tienes ya)
Ve a https://console.firebase.google.com → "Agregar proyecto".

### 2. Activa Authentication
Consola → **Authentication** → pestaña "Sign-in method" → activa **Correo
electrónico/contraseña**.

### 3. Crea tu único usuario administrador
Consola → **Authentication** → pestaña "Users" → **Add user** → pon tu correo
y una contraseña. Ese es tu login de `admin.html`. No hay registro público:
solo tú puedes entrar.

### 4. Activa Firestore
Consola → **Firestore Database** → "Crear base de datos" → modo producción →
elige la región más cercana (ej. `eur3` si apuntas a Europa).

### 5. Activa Storage
Consola → **Storage** → "Comenzar" → acepta las reglas por defecto (las vamos
a reemplazar con las de este proyecto).

### 6. Consigue el config de tu app web
Consola → ícono de engranaje ⚙ → **Configuración del proyecto** → baja hasta
"Tus apps" → si no tienes una app web, créala (ícono `</>`) → copia el objeto
`firebaseConfig`.

Pégalo en **`js/firebase-config.js`**, reemplazando los valores `"REPLACE_ME"`.

### 7. Configura el project ID para el CLI
Abre **`.firebaserc`** y reemplaza `"REPLACE-WITH-YOUR-FIREBASE-PROJECT-ID"`
por el ID real de tu proyecto (lo ves en la Consola, junto al nombre).

### 8. Publica las reglas de seguridad y el sitio

Usando tu instalación portátil de Node:

```bash
set PATH=C:\Users\Dolmos\Downloads\node\node-v20.11.0-win-x64;%PATH%
firebase login
firebase deploy --only hosting,firestore:rules,storage:rules
```

### 9. Entra al panel
Ve a `https://tu-sitio.web.app/admin.html`, inicia sesión con el usuario que
creaste en el paso 3, y empieza a cargar tus proyectos.

---

## Qué carga cada campo del formulario

- **Slug**: identificador único para la URL del proyecto (ej. `velocity-runner`).
  Solo minúsculas, números y guiones — el panel lo limpia automáticamente.
- **Orden**: número que decide en qué posición aparece en la grilla (1 = primero).
- **Modelo 3D (.glb)**: opcional. Si lo subes, la página del proyecto muestra
  un visor 3D interactivo en vez de la imagen de portada. Expórtalo desde
  Blender como `.glb`. **Tamaño recomendado: menos de 15-20MB.** Un archivo
  de 100MB+ suele fallar al cargar en el navegador (se queda pegado o no
  aparece nada), aunque se vea perfecto al abrirlo en tu computadora. Al
  exportar desde Blender (`Archivo → Exportar → glTF 2.0`):
  - Formato: **glTF Binary (.glb)**
  - Activa **compresión Draco** (reduce el tamaño de la malla drásticamente)
  - Reduce la resolución de texturas a 1024–2048px si usaste 4K+
  - Aplica los modificadores y transformaciones antes de exportar
- **Vista 360°**: opcional, y tiene prioridad sobre el modelo 3D y la portada
  si la subes. Agrega tus fotos del turntable y reordénalas con las flechas
  en el panel — no depende del nombre del archivo. 24–36 fotos da un giro
  fluido; con menos fotos se ve más brusco (es normal, no es un error). Ver
  la sección "Cómo tomar las fotos del turntable" abajo.
- **Imágenes**: cada bloque de imagen se etiqueta con la sección donde va a
  aparecer (Moodboard, Boceto, Vizcom, Blender, ShoeMaster, Patrón, Suela,
  Producto final). Si no subes imagen para alguna sección, esa sección
  simplemente muestra un marcador de "ficha técnica" hasta que la completes.
  Cualquier visitante puede hacer clic en estas imágenes para verlas en
  tamaño completo (lightbox).
- **Lecciones aprendidas**: escribe una por línea; cada línea se convierte en
  un punto de la lista en la página del proyecto.
- **Tamaño de archivo**: el límite actual es 200MB por archivo (`storage.rules`),
  para dar espacio a videos. Si cambias este archivo alguna vez, redeploya con
  `firebase deploy --only storage:rules`.
- **Videos del proceso**: opcional, formato MP4 recomendado. Cada video sube
  con su propia descripción EN/ES y aparece con reproductor nativo en una
  sección "Videos del Proceso" antes de "Lecciones Aprendidas". El plan
  gratuito de Firebase (Spark) da 5GB de almacenamiento y 1GB de descarga
  por día — vigila esto si subes muchos videos pesados.

## Cómo tomar las fotos del turntable para la vista 360°

1. Coloca la zapatilla sobre una base giratoria (turntable) o gírala tú mismo
   en incrementos parejos, con la cámara fija en un trípode.
2. Toma una foto cada 10–15° de giro (24–36 fotos en total para una vuelta
   completa). Mantén el mismo encuadre, luz y fondo en todas — a más fotos,
   más fluido se ve el giro.
3. En `admin.html`, en "Vista 360°", agrega las fotos (el orden en que las
   selecciones no importa).
4. Debajo aparece una fila de miniaturas numeradas — usa las flechas ◀ ▶ en
   cada una para acomodarlas en el orden correcto de giro, y ✕ para quitar
   alguna que no sirva.
5. Puedes seguir agregando fotos después con el mismo campo, y volver a
   reordenar todo antes de guardar. Al editar un proyecto que ya tenía fotos
   360°, aparecen precargadas para que sigas ajustando.

## Otros pendientes de personalización

- Coloca tu CV en `assets/cv.pdf`.
- **Comparador Sketch/Vizcom de la portada**: pon tus dos imágenes en
  `assets/img/sketch-compare.jpg` y `assets/img/vizcom-compare.jpg`
  (esos nombres exactos) — el comparador ya está conectado a esas rutas.
- **Video del hero**: coloca tu video en `assets/video/hero.mp4` (formato MP4,
  sin sonido o con audio — se reproduce muteado automáticamente porque los
  navegadores no permiten autoplay con sonido). Mientras no lo subas, ese
  espacio se ve como un panel vacío con degradado — no es un error.
- Reemplaza `example-domain.web.app` en meta tags, `robots.txt` y
  `sitemap.xml` por tu dominio real una vez lo tengas.

## Sobre el rediseño (fondo blanco / tipografía negra)

- Los colores viven todos como variables en la parte de arriba de
  `css/styles.css` (`:root{...}`) — si quieres ajustar el tono del acento
  (rojizo/cuero) o cualquier otro color, se cambia en un solo lugar.
- Los títulos grandes (`h1`, `h2`) se animan palabra por palabra al entrar en
  pantalla — esto es automático, no hay que hacer nada por proyecto ni
  editar texto especial para que funcione.

## Probar en local sin Firebase configurado

Simplemente abre `index.html` en el navegador — verás los 5 proyectos de
demostración con el diseño completo, sin necesidad de configurar nada todavía.

## Notas de seguridad

- `firestore.rules` y `storage.rules` permiten lectura pública (necesario para
  que cualquiera vea tu portafolio) pero **solo tu cuenta autenticada puede
  escribir, editar o borrar**.
- `admin.html` tiene `noindex` y está bloqueado en `robots.txt`, pero la
  seguridad real la dan las reglas de Firebase, no que la página esté "oculta".
