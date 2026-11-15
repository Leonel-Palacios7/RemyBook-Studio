# Auditoría inicial

Fecha: 15 de noviembre de 2026.

## Estado encontrado

- **No había un repositorio disponible** para esta sesión: no se conectó ningún repositorio de GitHub
  y la carpeta de trabajo estaba vacía. Por eso el proyecto se creó desde cero.
- **No existían** `docs/ANALISIS_VIDEO.md` ni `docs/PROMPT_MAESTRO_GITHUB.md`. El análisis de las
  referencias se documenta en [ANALISIS_VIDEO.md](ANALISIS_VIDEO.md), escrito a partir de los videos
  y la imagen adjuntos. Si `PROMPT_MAESTRO_GITHUB.md` existe en el repositorio de destino, debe
  revisarse contra esta versión antes de fusionar.
- No hubo código previo que conservar.

## Material de referencia recibido

| Archivo | Uso que se le dio |
| --- | --- |
| Video del catálogo (mp4 / webm, 23 s) | Solo comportamiento: doble página, giro con curvatura y sombra, flechas laterales, barra inferior de controles, esquina doblada. No se copió texto, fotografía, marca ni diseño de páginas. |
| Imagen de un panel de facturación | Solo estilo: tarjetas redondeadas, botones tipo píldora, navegación oscura con pestaña activa resaltada, paneles oscuros y claros. Se reemplazaron sus colores por la paleta SENA. |

## Decisiones técnicas

| Necesidad | Decisión | Motivo |
| --- | --- | --- |
| Base | React 18 + TypeScript estricto + Vite 6 | Lo solicitado; ecosistema estable y build rápido |
| Giro de páginas | Motor propio (CSS 3D + rAF) | Requisito explícito; sin dependencias de flipbook |
| Estado | `useReducer` + Context con historial | Reductor puro y fácil de probar; sin dependencias extra |
| Validación | Zod 4 | Todo contenido importado o almacenado se valida |
| Persistencia | IndexedDB con respaldo en localStorage | Sin el límite de ~5 MB de localStorage (imágenes embebidas) |
| Íconos | lucide-react | Licencia ISC, árbol de dependencias mínimo |
| Fuente | Work Sans (autoalojada con Fontsource) | Sin peticiones a terceros; compatible con la CSP |
| Pruebas | Vitest + Testing Library + jsdom | Integración nativa con Vite |
| Rutas | Enrutador por hash propio | Funciona en hosting estático (GitHub Pages) |

## Resultado de la verificación

- `npm run typecheck`: sin errores.
- `npm run lint`: sin errores ni advertencias.
- `npm test`: 60 de 60 pruebas pasan (11 archivos, unitarias e integración). Cobertura de líneas ≈ 86 %.
- `npm run build`: correcto.
- `npm audit --omit=dev`: 0 vulnerabilidades en dependencias de producción. Quedan avisos moderados
  en herramientas de desarrollo (cadena de `typescript-eslint` → `minimatch`) que no llegan al build.
- Prueba en navegador real (Chromium): navegación, arrastre, móvil, editor, tema oscuro e
  impresión a PDF (8 páginas A4) sin errores de consola.
