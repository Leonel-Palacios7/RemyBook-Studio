# Seguridad, accesibilidad y rendimiento

## Seguridad

- **Sin HTML inyectado**: no se usa `dangerouslySetInnerHTML`; el texto se renderiza como texto plano.
- **URLs de imágenes restringidas** (`lib/sanitize.ts`): solo `https:`, `data:image/*;base64`, `blob:`
  y rutas relativas. Se bloquean `javascript:`, `data:text/html`, `http:` y otros esquemas.
- **Colores validados** antes de llegar a estilos (evita inyección CSS por `url(...)`).
- **Importación validada** con Zod: estructura, tipos, rangos y longitudes.
- **Archivos**: solo tipos de imagen permitidos.
- **CSP** inyectada en el build (`vite.config.ts`): `script-src 'self'`, `object-src 'none'`,
  `base-uri 'self'`, `form-action 'none'`. Además `referrer: no-referrer`.
- Sin peticiones a terceros: fuente autoalojada y sin analítica.
- CI con `npm audit --omit=dev --audit-level=high`.

## Accesibilidad

- Navegación completa por teclado en lector y editor; enlace "Saltar al contenido".
- Etiquetas `aria-label` en todos los botones de icono, `aria-pressed`, `aria-current`, roles de
  barra de herramientas, pestañas y paneles.
- Región `aria-live` que anuncia las páginas visibles al pasar de hoja.
- Respeta `prefers-reduced-motion` (giro instantáneo) y `prefers-color-scheme`.
- Foco visible con contraste; texto alternativo editable para cada imagen.
- Objetivos táctiles de 34–52 px.

## Rendimiento

- Solo se montan las hojas cercanas a la vista actual.
- Animación con `transform` (GPU) y `will-change` en hojas.
- `React.memo` en el renderizador de páginas; `content-visibility: auto` en miniaturas.
- Editor cargado bajo demanda; React en un chunk separado para mejor caché.
- Build actual: lector ≈ 30 kB gzip + React ≈ 45 kB gzip; editor ≈ 11 kB gzip adicional.
