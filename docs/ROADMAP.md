# Roadmap por hitos

Construimos en este orden. Cada hito debe quedar **funcionando y revisado** antes
de empezar el siguiente. No adelantes trabajo de hitos posteriores.

---

## M0 — Andamiaje

- Inicializar Astro + TypeScript (plantilla mínima, salida estática, modo
  `strict` de TypeScript).
- Crear la estructura de carpetas de `CLAUDE.md` (`pages/`, `layouts/`,
  `components/`, `lib/`, `styles/`).
- Definir `src/lib/algorithms/types.ts` con la interfaz `Clusterer` y el tipo
  `Point`.
- Cargar los tokens de diseño de `docs/DISENO.md` como variables CSS en la hoja
  global, y montar `layouts/Base.astro`.
- Página en blanco que arranca y despliega.

**Hecho cuando:** `npm run dev` levanta una página vacía con los estilos base y
el proyecto compila sin errores de tipos.

## M1 — Motor + base común (sección 1)

- `src/lib/algorithms/kmeans-base.ts`: init k-means++, cálculo de distancias,
  cálculo de SSE.
- `src/lib/algorithms/lloyd.ts`: primera variante completa (sirve de referencia).
- `src/lib/sim/engine.ts` y `src/lib/sim/renderer.ts`: bucle paso-a-paso y
  reproducir, render de puntos y centroides con transición suave.
- `src/lib/data/`: generador de blobs.
- Montar el **sandbox del fundamento común** (sección 1): colocar puntos, elegir
  `k`, paso a paso / reproducir.

**Hecho cuando:** se puede jugar con K-Means base de forma fluida y correcta.

## M2 — Las cinco variantes (sección 2)

Implementa cada una en `src/lib/algorithms/` **según `docs/ALGORITMOS.md`** y
monta su sala como componente en `src/components/sections/`. Sugerido en este
orden:

1. MacQueen (+ demo "barajar orden").
2. Hartigan-Wong (+ visual de ganancia/coste al mover un punto).
3. Elkan (+ contador Lloyd vs. Elkan e ilustración de la desigualdad triangular).
4. Fuzzy (+ color por mezcla y deslizador `m`).

Pasa las **comprobaciones de fidelidad** de `ALGORITMOS.md` para cada una antes
de darla por buena (especialmente Elkan == Lloyd y sensibilidad al orden de
MacQueen).

**Hecho cuando:** las cinco salas funcionan y cada una demuestra su diferencia
característica de forma fiel.

## M3 — Arena comparativa (sección 3)

- Ejecutar las cinco variantes en paralelo sobre el mismo dataset y semilla.
- Panel de métricas vivo (iteraciones, cálculos de distancia, calidad).
- Selector de forma de datos: blobs, anisotrópico, densidades desiguales, lunas.
- Botones "misma semilla" y "rebarajar".

**Hecho cuando:** se aprecia de un vistazo dónde cada algoritmo brilla o falla al
cambiar la forma de los datos.

## M4 — Guía de decisión + apertura + pulido (secciones 0, 4, 5)

- Sección de apertura con la animación en bucle y el titular.
- Guía de decisión interactiva ("si tus datos son X → usa Y, porque Z").
- Textos editoriales finales de cada sección, revisados y concisos.
- Pulido de motion, responsive y accesibilidad (`prefers-reduced-motion`, foco,
  contraste, teclado).

**Hecho cuando:** el recorrido completo se lee y se toca de principio a fin con
una experiencia coherente.

## M5 — Despliegue

- Build de producción y despliegue estático (GitHub Pages / Netlify / Vercel).
- `README.md` público con captura/gif y enlace a la demo.
- Repaso final de rendimiento (60 fps con ~500 puntos) y en móvil.

**Hecho cuando:** hay una URL pública compartible que funciona sin fricción.

---

## Extras opcionales (solo si sobra tiempo)

- Sección de **compresión de imagen** como caso real (muy vistoso).
- Tema oscuro.
- Poder exportar el estado de la arena como imagen para compartir.
