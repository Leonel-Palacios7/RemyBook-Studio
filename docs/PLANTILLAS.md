# Plantillas de turismo

La galería se abre con el botón **Plantillas** del editor o con **Elegir una plantilla** en el lector
cuando la publicación está en blanco. Al aplicar una plantilla se reemplaza la publicación actual
(se puede deshacer con `Ctrl+Z` en el editor).

| # | Plantilla | Estilo | Silueta de fotos |
| --- | --- | --- | --- |
| 1 | Caribe en arcos | Turquesa y coral, serif cursiva | Arco |
| 2 | Andes vertical | Montañas en capas, tipografía monumental | Rombo |
| 3 | Aroma de café | Tonos tierra, círculos, serif | Círculo |
| 4 | Calles coloniales | Baldosas, terracota y cobalto | Píldora |
| 5 | Selva viva | Formas orgánicas y hojas | Orgánica |
| 6 | Desierto dorado | Atardecer en degradado, dunas | Arco |
| 7 | Islas y arrecifes | Olas en capas, burbujas | Círculo |
| 8 | Ruta de sabores | Rojo tomate, píldoras, estrellas | Píldora |
| 9 | Ecoturismo verde | Verdes institucionales, hojas | Hoja |
| 10 | Noches de festival | Nocturno, neón, rombos | Hexágono |

Cada plantilla tiene 6 páginas: portada única, bienvenida, destinos, galería, itinerario y
contacto/reservas. Las páginas interiores combinan variantes de diseño (tarjetas, cuadrícula,
zigzag, polaroids, franja con cita, columna de color) para que ninguna se vea igual a otra.

## Cómo personalizar

- **Fotos**: doble clic sobre un marco vacío o arrastra una imagen encima. La silueta se mantiene;
  se puede cambiar en *Forma del marco*.
- **Textos**: doble clic para escribir sobre la página o usa el panel *Contenido*.
- **Colores**: cada forma admite color sólido o degradado.
- Todos los textos son marcadores (“Destino uno”, “Desde $000”): reemplázalos por información real
  verificada.

## Agregar una plantilla nueva (desarrolladores)

1. Agrega un objeto a `TEMPLATES` en `src/content/templates/catalog.ts` con su `theme`
   (paleta, silueta, motivo, variantes de `layout`) y su función `cover`.
2. Usa las utilidades de `kit.ts` (`t`, `s`, `img`, `pill`, `sq`) y, si hace falta, nuevas
   variantes en `layouts.ts`.
3. `src/content/templates/catalog.test.ts` valida automáticamente la nueva plantilla.
