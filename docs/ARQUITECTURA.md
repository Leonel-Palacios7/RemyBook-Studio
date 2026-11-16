# Arquitectura

## Capas

```
UI (features/reader, features/editor, app)
   │  usa
   ▼
Componentes compartidos (components/PageRenderer)      Motor (engine/)
   │                                                     │ funciones puras + FlipBook
   ▼                                                     ▼
Estado (store/: reductor puro + historial + persistencia)
   │
   ▼
Dominio y contenido (domain/types, content/*.json + schema Zod, config/)
```

- **El contenido está separado de los componentes**: la publicación es un objeto JSON (`Book`) con
  páginas y elementos. Los componentes solo lo leen y despachan acciones.
- **Unidades relativas**: las posiciones se guardan en % de la página y los tamaños de fuente en % del
  ancho (unidades `cqw` con *container queries*). La misma página se ve idéntica en el lector, el
  editor, las miniaturas y al imprimir, a cualquier tamaño o nivel de zoom.

## Motor de giro (`src/engine`)

### Modelo de hojas (`layout.ts`, puro y probado)

- **Doble**: hoja *k* → anverso = página 2k, reverso = página 2k+1. Vista *v* muestra
  izquierda = 2v−1 y derecha = 2v. La portada (vista 0) aparece sola y la última vista puede
  mostrar solo la contraportada; en ambos casos el libro se centra.
- **Sencillo (móvil)**: una hoja por página, reverso de papel.
- Una hoja con índice menor a la vista está girada (−180°). Pasar de *v* a *v+1* gira la hoja *v*;
  volver gira la hoja *v−1*. Los saltos largos (índice, miniaturas) animan una sola hoja.
- `leafZIndex` apila como un libro real: sin girar, la primera arriba; giradas, la última arriba;
  la hoja en movimiento siempre encima.
- Solo se renderizan las hojas cercanas a la vista (`isLeafNear`), así que el costo no crece con el
  número de páginas.

### Render (`FlipBook.tsx` + `flipbook.css`)

- Contenedor con `perspective`, libro con `transform-style: preserve-3d` y cada hoja girando con
  `rotateY` alrededor del lomo (`transform-origin: left`).
- Caras con `backface-visibility: hidden`; el reverso está pre-rotado 180°.
- Efectos: sombra dinámica sobre la cara (opacidad ∝ sen θ), sombra proyectada sobre la página de
  abajo, brillo cerca del lomo, elevación `translateZ` y esquina doblada.
- La sombra exterior va en `.fb-stage`: un `filter` en el libro aplanaría el 3D.

### Animación e interacción

- `animator.ts` interpola con `requestAnimationFrame` y curva *ease-in-out cúbica*; duración 0 si el
  usuario prefiere movimiento reducido.
- Componente controlado: el padre cambia `view` y el motor anima la diferencia.
- Arrastre: se activa tras 6 px; progreso = desplazamiento / ancho; al soltar completa si supera
  30 % o si el gesto es rápido (> 0,5 px/ms), si no vuelve. Un clic sin arrastre pasa de página.

### Sonido (`sound.ts`)

- Grabaciones (`hojas`, por defecto, y `libro`): MP3 en `src/assets/sounds/`, aportados por el autor
  del proyecto (recortados y normalizados). Se descargan una vez con `fetch` (permitido por la CSP
  `connect-src 'self'`), se decodifican y se reproducen con paneo; el lector las precarga. Si fallan,
  suena el estilo sintetizado «suave».
- Estilos sintetizados con Web Audio API: ruido rosado filtrado (roce del papel), un golpe grave suave al
  asentarse la hoja y, en el estilo «brisa», dos tonos senoidales tipo campanita. Paneo estéreo que
  sigue la hoja según el sentido del giro y compresor final para evitar picos. Estilos en
  `SOUND_STYLES` (`hojas`, `libro`, `suave`, `brisa`, `clasico`), elegidos en `settings.pageSoundStyle`. No descarga
  archivos, por lo que respeta la CSP y no requiere licencias de audio.
- `FlipBook` expone `onTurnStart(direction)`: suena al empezar un giro por botón, teclado, clic o
  arrastre. El lector aplica la preferencia de la publicación (`settings.pageSound`) y el silencio
  del lector (guardado en el navegador).

### Manito del cursor (`ReaderHands.tsx`)

- Dibujo SVG original al estilo del puntero clásico, decorativo (`aria-hidden`, sin eventos). En
  reposo señala, con un toquecito periódico, la esquina de la hoja que se puede pasar (derecha, o
  izquierda en la última página). Al girar cambia a puño y sigue el borde libre de la hoja
  (`spine + ancho·cos θ`); al terminar vuelve a la esquina con una transición.
- Se mueve solo con `transform` (`translate3d`). Con mouse sobre el libro se oculta, porque el
  cursor real ya cumple esa función.
- La publicación decide si se muestra (`settings.hands.enabled`); quien lee puede ocultarla con el
  botón de la barra o la tecla `H` (guardado en el navegador).

## Estado (`src/store`)

- `bookReducer` es una función pura con acciones tipadas (`page/*`, `element/*`, `book/*`,
  `history/*`). Garantiza invariantes: siempre hay al menos una página, el `id` y el `kind` de un
  elemento no cambian.
- Historial de deshacer/rehacer (200 pasos, solo para limitar memoria). Las operaciones continuas
  (arrastrar, escribir) usan `history/checkpoint` + actualizaciones `transient`, así un arrastre
  completo se deshace con un solo `Ctrl+Z`.
- `BookProvider` carga desde el almacenamiento, valida con Zod y guarda automáticamente con retardo.
  El adaptador de almacenamiento es inyectable (las pruebas usan memoria).

## Editor (`src/features/editor`)

- `Canvas` maneja selección, mover, redimensionar (8 asas) y rotar con *pointer capture*.
- `geometry.ts` (puro y probado) convierte píxeles a porcentajes y aplica guías de centrado,
  proporción con Mayús, mínimos y pasos de 15° en rotación.
- `Inspector` con pestañas Elemento / Página / Publicación.
- El editor se carga bajo demanda (`React.lazy`), así el lector público pesa menos.

## Pruebas

| Archivo | Alcance |
| --- | --- |
| `engine/layout.test.ts` | Modelo de hojas, vistas, ángulos, apilamiento, tamaños |
| `engine/animator.test.ts` | Animación y cancelación |
| `engine/FlipBook.test.tsx` | Giro controlado, clic, arrastre completo y cancelado |
| `store/bookReducer.test.ts` | Todas las acciones, historial y agrupación de cambios |
| `store/persistence.test.ts` | Adaptadores y validación al cargar |
| `content/schema.test.ts` | Validación de contenido e importación |
| `features/editor/geometry.test.ts` | Mover, guías, redimensionar, rotar |
| `features/reader/search.test.ts` | Búsqueda sin tildes e índice |
| `lib/*.test.ts` | Seguridad de URLs/colores y rutas |
| `test/App.test.tsx` | Integración: navegación, zoom, búsqueda, índice, miniaturas, compartir, editor, páginas, importación |

## Cómo extender

- **Nuevo tipo de elemento**: tipo en `domain/types.ts`, esquema en `content/schema.ts`, fábrica en
  `content/factories.ts`, render en `components/PageRenderer.tsx` y panel en `Inspector.tsx`.
- **Nuevo formato de página**: agregar una entrada en `PAGE_FORMATS` (`config/app.config.ts`).
- **Backend o varias publicaciones**: implementar `StorageAdapter` (por ejemplo contra una API) y
  pasarlo a `<BookProvider storage={…}>`.
