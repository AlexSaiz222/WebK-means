# CLAUDE.md

Contexto principal del proyecto. Léelo entero antes de escribir código, y
consulta los documentos de `docs/` según la fase en la que estés.

---

## Qué estamos construyendo

**K-Means Explorable** — una *explicación explorable* (explorable explanation) en
una sola página web que enseña, jugando, por qué existen cinco variantes del
algoritmo K-Means y en qué se diferencian: **Lloyd, MacQueen, Hartigan-Wong,
Elkan y Fuzzy/Soft K-Means**.

No es un artículo con un applet al final. Es un recorrido donde cada idea que se
explica lleva al lado un pequeño laboratorio interactivo donde el visitante la
comprueba con sus propias manos. La referencia mental es el estilo de Distill.pub
y Explorable Explanations (Bret Victor / Setosa.io).

El proyecto es una pieza de portfolio. Se comparte con un enlace, se entiende sin
nadie delante, y debe transmitir dos cosas a la vez: dominio del algoritmo y
sensibilidad de diseño.

## Pregunta que vertebra toda la página

> ¿Por qué existen cinco versiones de un algoritmo que aparentemente hace lo mismo?

La página entera es la respuesta, respondida interactuando.

---

## Documentos de apoyo (léelos cuando toque)

- `docs/PROYECTO.md` — el recorrido sección por sección: qué muestra y qué se
  puede tocar en cada parte. **Léelo antes de estructurar la app.**
- `docs/ALGORITMOS.md` — la teoría exacta de cada variante, fiel al temario.
  **Es OBLIGATORIO leerlo antes de implementar cualquier simulación**: la
  credibilidad del proyecto depende de que cada algoritmo se comporte de verdad
  como debe, no de una aproximación "que parece".
- `docs/DISENO.md` — el sistema visual: paleta, tipografía, espaciado, motion.
  **Léelo antes de tocar estilos.**
- `docs/ROADMAP.md` — el plan por hitos. Construimos en este orden, un hito
  cerrado y funcionando antes de pasar al siguiente.
- `docs/Tema*.pdf` — los apuntes originales de la asignatura (solo en local:
  están en `.gitignore` y **no se distribuyen** por derechos de autor).
  `ALGORITMOS.md` es su destilado y la referencia de trabajo; los PDF quedan
  como fuente última si surge una duda que el `.md` no resuelve. En el
  contenido público de la página no se menciona "Tema N": el visitante no
  tiene acceso a ese material.

---

## Stack (decidido)

Prioriza simplicidad, cero fricción para desplegar y control total de la
animación.

- **Astro + TypeScript**, con salida 100 % estática. Astro encaja de forma
  natural con el proyecto: la página es contenido editorial + lienzos
  interactivos, exactamente el modelo "HTML estático + islas de interactividad"
  de Astro.
- **Sin framework de UI** (React/Vue/Svelte): las secciones son componentes
  `.astro` y la interactividad vive en los `<script>` de cada componente,
  escritos en TypeScript plano. Astro los empaqueta como módulos; no
  necesitamos hidratación de framework para manejar canvas y controles.
- **Canvas 2D** para las nubes de puntos y la animación de los centroides
  (rinde bien con cientos de puntos a 60 fps).
- **SVG** solo para elementos pequeños: diagramas geométricos (p. ej. la
  ilustración de la desigualdad triangular de Elkan). Sin D3 salvo necesidad
  justificada.
- **CSS moderno** (custom properties, grid, clamp). Tokens de diseño en una
  hoja global; estilos de cada sección scoped en su componente `.astro`.
  Sin librería de componentes.
- Sin backend. Todo corre en el cliente. Se despliega como estático
  (GitHub Pages, Netlify o Vercel).

## Estructura de carpetas

```
src/
  pages/
    index.astro          # la única página; orquesta las secciones en orden
  layouts/
    Base.astro           # <head>, fuentes, estilos globales
  components/
    Nav.astro            # menú lateral fijo con scroll-spy
    sections/            # una .astro por sección: Apertura, Fundamento (diagrama),
                         # SalaLloyd, SalaMacQueen, SalaHartigan, SalaElkan,
                         # SalaFuzzy y Guia (tabla comparativa)
  lib/                   # TypeScript puro, sin nada de Astro ni de DOM (salvo sim/)
    algorithms/          # UNA implementación por variante, sin dependencias de UI
      types.ts           # interfaz común (ver abajo)
      kmeans-base.ts     # utilidades compartidas: init k-means++, distancias
      lloyd.ts
      macqueen.ts
      hartigan-wong.ts
      elkan.ts
      fuzzy.ts
    sim/
      renderer.ts        # dibuja puntos, centroides y transiciones sobre canvas
    data/                # generadores de datasets (redondos, solapados, alargados,
                         # desiguales, lunas, anillos)
  styles/                # tokens de diseño y hoja global
astro.config.mjs
```

## Principio de arquitectura clave: separar algoritmo de dibujo

Cada variante vive en `src/lib/algorithms/` **sin saber nada del canvas ni del
DOM**. Expone su estado paso a paso (centroides, asignaciones, métricas)
mediante una interfaz común, y `src/lib/sim/renderer.ts` se encarga de
dibujarlo. Cada sala precalcula la ejecución completa como un **historial de
fotogramas** (snapshots de etiquetas, centroides y métricas) y una línea de
tiempo lo recorre: reproducir, avanzar/retroceder con flechas, o arrastrar la
barra. Arrastrar un centroide o un punto ramifica: se recalcula la ejecución
desde esa configuración. Esto permite:

- repasar cualquier momento de la ejecución hacia atrás y hacia delante,
- narrar cada fase con datos reales del fotograma (recuadro de narración),
- y probar la lógica de forma aislada (`npm test` ejecuta las comprobaciones
  de fidelidad de `docs/ALGORITMOS.md` con Node).

Interfaz común orientativa (defínela bien en `src/lib/algorithms/types.ts`):

```ts
interface Clusterer {
  name: string;
  init(points: Point[], k: number, seed: number): void;
  step(): boolean;          // avanza una iteración; devuelve false si ya convergió
  readonly centroids: Point[];
  readonly labels: number[];        // asignación dura (argmax en Fuzzy)
  readonly memberships?: number[][];// solo Fuzzy: pertenencias suaves
  readonly metrics: {
    iteration: number;
    distanceComputations: number;   // clave para la historia de Elkan
    inertia: number;                // SSE con etiquetas duras (comparable entre todas)
  };
}
```

---

## Principios innegociables

1. **Nunca teoría sin poder tocarla.** Ningún concepto se explica solo con texto:
   cada afirmación del temario ("MacQueen converge en menos iteraciones",
   "Elkan ahorra cálculos") tiene al lado el control que permite verificarla.
2. **Fidelidad al algoritmo.** Ver `docs/ALGORITMOS.md`. Elkan debe dar el mismo
   resultado que Lloyd pero con menos cálculos; MacQueen debe ser sensible al
   orden; Fuzzy debe dar pertenencias graduales reales. No falsees el
   comportamiento para que "quede bonito".
3. **El texto es breve y editorial; la protagonista es la visualización.**
4. **Rendimiento.** La animación va fluida (apunta a 60 fps con ~500 puntos).
   No recalcules lo que puedas cachear; no repintes el DOM en cada frame.
5. **Accesibilidad.** Contraste suficiente, foco visible, controles usables por
   teclado, y no depender solo del color para distinguir clústeres (usa también
   forma o etiqueta donde importe).
6. **Sin dependencias innecesarias.** Cada librería que añadas hay que
   justificarla. El objetivo es una página ligera y limpia.

## Definición de "terminado" para cada sección

- La interacción funciona y es fluida.
- El comportamiento es fiel a `docs/ALGORITMOS.md`.
- El texto explicativo es correcto y conciso.
- El diseño respeta `docs/DISENO.md`.
- Funciona en móvil (o degrada con elegancia).

## Cómo trabajar

Avanza por `docs/ROADMAP.md` en orden. Cierra un hito —funcionando y revisado—
antes de empezar el siguiente. Ante cualquier duda sobre cómo se comporta un
algoritmo, la fuente de verdad es `docs/ALGORITMOS.md`, no la intuición.
