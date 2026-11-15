# Análisis de las referencias

## Video del catálogo (solo comportamiento)

Observaciones tomadas cada 3 segundos del video adjunto:

1. **Doble página en escritorio** centrada sobre un fondo de color sólido, con el lomo al centro.
2. **Flechas laterales** grandes a izquierda y derecha para pasar de página.
3. **Giro con curvatura**: la hoja se levanta desde la esquina, muestra el reverso durante el giro
   y proyecta sombra sobre la página de abajo.
4. **Esquina doblada** en la página derecha que invita a pasar la hoja.
5. **Barra inferior** compacta con miniaturas, compartir, imprimir, descargar, zoom y pantalla completa.
6. **Contador de páginas** en la parte superior ("págs. 18–19 de 36").

## Cómo se tradujo a la aplicación

| Comportamiento | Implementación |
| --- | --- |
| Doble página / portada sola | Modelo de hojas: la portada aparece sola a la derecha y el libro se centra |
| Giro con reverso | Cada hoja tiene anverso y reverso con `backface-visibility` |
| Sombras | Sombra dinámica en la cara que gira, sombra proyectada, brillo del lomo |
| Arrastre desde la esquina | Arrastre con puntero, umbral del 30 % o gesto rápido para completar |
| Esquina doblada | Indicador que crece al pasar el cursor |
| Barra de controles | Barra flotante tipo píldora con navegación, paneles, zoom, compartir, imprimir y pantalla completa |
| Contador | Chip superior con las páginas visibles |

## Imagen de estilo

Del panel de referencia se tomó únicamente el lenguaje visual: tarjetas con radios amplios
(16–32 px), sombras suaves, navegación central oscura con la pestaña activa como píldora de color,
botones circulares, botón principal en píldora y combinación de paneles oscuros y claros.
Se reemplazó su color violeta por el verde SENA **#39A900**.

## Lo que no se utilizó

Ningún texto, fotografía, logotipo, ilustración, nombre comercial ni diseño de páginas de las
referencias. La publicación inicial está en blanco.
