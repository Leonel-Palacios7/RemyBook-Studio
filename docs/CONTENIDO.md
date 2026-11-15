# Contenido administrable

## Dónde vive cada cosa

| Qué | Archivo |
| --- | --- |
| Publicación inicial (8 páginas en blanco) | `src/content/book.default.json` |
| Esquema de validación | `src/content/schema.ts` |
| Nombre de la app, zoom, historial, punto de cambio a móvil | `src/config/app.config.ts` |
| Paleta, muestras de color y fuentes del editor | `src/config/app.config.ts` |
| Tokens visuales de la interfaz | `src/styles/tokens.css` |

## Formato de una publicación

```json
{
  "schemaVersion": 1,
  "id": "mi-publicacion",
  "title": "Título",
  "description": "",
  "author": "",
  "updatedAt": "2026-01-01T00:00:00.000Z",
  "settings": { "format": "a4-portrait", "showPageNumbers": true, "flipDuration": 800 },
  "pages": [
    {
      "id": "p-01",
      "title": "Portada",
      "background": "#FFFFFF",
      "elements": [
        {
          "id": "t-1", "kind": "text", "x": 10, "y": 10, "w": 80, "h": 12,
          "rotation": 0, "opacity": 1, "text": "Hola",
          "fontSize": 6, "fontFamily": "'Work Sans Variable', sans-serif", "fontWeight": 700,
          "italic": false, "underline": false, "color": "#39A900", "background": "transparent",
          "align": "left", "lineHeight": 1.2, "padding": 0, "radius": 0
        }
      ]
    }
  ]
}
```

- `x`, `y`, `w`, `h`: porcentajes de la página.
- `fontSize`, `padding`, `radius`, `strokeWidth`: porcentajes del ancho de la página.
- `kind`: `text`, `image` (`src`, `alt`, `fit`, `radius`) o `shape`
  (`shape`: `rect`, `ellipse`, `triangle`, `star`, `arrow`, `line`; `fill`, `stroke`, `strokeWidth`, `radius`).
- El título de cada página alimenta el índice y la búsqueda.

## Flujo recomendado

1. Diseñar la publicación en el editor (se guarda sola en el navegador).
2. **Exportar JSON** desde la pestaña *Publicación* para respaldo o para versionarlo.
3. Para publicar un contenido fijo, reemplazar `src/content/book.default.json` por el JSON exportado
   y volver a compilar. Las imágenes subidas quedan embebidas en el JSON; para publicaciones grandes
   conviene moverlas a `public/` y referenciarlas con rutas relativas (`./img/foto.webp`).

> La aplicación no incluye datos institucionales, estadísticas ni resultados de aprendizaje.
> Todo el contenido lo define quien edita.
