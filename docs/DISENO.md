# Sistema de diseño

Dirección estética: **minimalismo cuidado**. La sensación buscada es la de una
pieza de museo interactiva, no la de un dashboard cargado de botones. Menos
elementos, pero cada uno perfecto. La visualización de datos *es* el diseño.

Los valores concretos de abajo son un punto de partida sólido, no un dogma:
ajústalos con criterio, pero mantén la filosofía.

---

## Principios

1. **El espacio en blanco es un material, no un hueco.** Sé generoso con los
   márgenes y el aire entre secciones. Que respire.
2. **Una sola idea por pantalla.** Cada sección se centra en una cosa.
3. **El color se gana su sitio.** Fondo neutro; el color se reserva para los
   datos (un tono por clúster) y para un único acento de interacción.
4. **El movimiento tiene intención.** Los centroides no "aparecen": se deslizan.
   Las transiciones comunican causa y efecto, no decoran.
5. **La tipografía hace el trabajo pesado.** Buena jerarquía y medida de línea
   cómoda; casi todo lo demás es contenido y lienzo.

## Paleta

Tema claro por defecto (considera un tema oscuro como extra, no imprescindible).

```
--bg:        #FAFAF8   /* fondo, casi blanco cálido */
--surface:   #FFFFFF   /* tarjetas / paneles */
--ink:       #1A1A1A   /* texto principal */
--ink-soft:  #6B6B6B   /* texto secundario, leyendas */
--line:      #E6E6E1   /* separadores, ejes sutiles */
--accent:    #2D5BFF   /* interacción: foco, botones, resaltados */
```

Colores de clúster (secuencia perceptualmente distinguible; usa solo tantos como
`k`). No dependas únicamente del color: refuerza con forma o etiqueta cuando la
distinción sea importante para la comprensión.

```
--c1:#2D5BFF  --c2:#FF7A3D  --c3:#12B886  --c4:#E64980  --c5:#F2B705  --c6:#7048E8
```

Para Fuzzy, el color de un punto es la **mezcla** de los colores de clúster
ponderada por sus pertenencias.

## Tipografía

- **Texto y UI:** una grotesca limpia y neutra (p. ej. Inter, o la fuente de
  sistema `ui-sans-serif`). Legibilidad ante todo.
- **Titulares:** puede ser la misma familia en peso alto, o una serif editorial
  de contraste (p. ej. una serif para los grandes títulos de sección) si se
  quiere ese aire "artículo".
- **Números y métricas:** cifras tabulares (`font-variant-numeric: tabular-nums`)
  para que los contadores no "bailen" al actualizarse.
- Medida de línea cómoda (~60–70 caracteres) en los bloques de texto.

Escala tipográfica orientativa (usa `clamp` para que respire en móvil):

```
display  clamp(2.5rem, 6vw, 4rem)
h2       clamp(1.6rem, 3vw, 2.2rem)
body     1.05rem / línea 1.6
caption  0.85rem
```

## Espaciado y layout

- Escala de espaciado en múltiplos de 4px: `4, 8, 12, 16, 24, 32, 48, 64, 96`.
- Columna de lectura centrada y estrecha para el texto; el lienzo puede ser más
  ancho o a sangre según la sección.
- Cada sección con padding vertical amplio (p. ej. 96px) para separar ideas.
- Layout con CSS grid; nada de posicionamientos frágiles.

## Motion

- Transiciones de posición de centroides: 300–500 ms, con una curva suave tipo
  `cubic-bezier(0.22, 1, 0.36, 1)` (easing de salida).
- Entradas de sección al hacer scroll: fundido + leve desplazamiento, sutiles.
- **Respeta `prefers-reduced-motion`:** si está activo, desactiva las
  animaciones no esenciales y muestra estados finales sin transición.
- Nada parpadea ni rebota. La calma es parte del mensaje.

## Controles (UI)

- Botones y sliders discretos, con estados de hover/focus claros usando
  `--accent`.
- Foco de teclado siempre visible.
- Etiquetas breves y en minúscula editorial ("paso a paso", "reproducir",
  "barajar orden").
- Los contadores de métricas: etiqueta pequeña en `--ink-soft` y cifra grande
  tabular.

## Lienzo (canvas)

- Puntos: círculos pequeños, con un punto de opacidad < 1 para que los solapes se
  lean bien.
- Centroides: marcador claramente distinto (p. ej. un aspa o un círculo con
  borde) y de mayor tamaño.
- Ejes/rejilla: si aparecen, muy tenues (`--line`); casi siempre innecesarios.
- Alta densidad de píxeles: escala el canvas por `devicePixelRatio` para que se
  vea nítido en pantallas retina.

## Responsive

- Móvil primero en el texto; el lienzo se adapta al ancho disponible.
- En la arena comparativa, en móvil la rejilla de 5 pasa a scroll vertical o a
  2 columnas; no intentes meter 5 lienzos diminutos en una fila estrecha.

## Anti-objetivos (qué evitar)

- Nada de sombras fuertes, degradados llamativos, ni bordes redondeados
  exagerados.
- Ni una sola librería de componentes con estética genérica.
- Sin iconos de relleno ni emojis decorativos.
- Sin más de un color de acento de interacción.
