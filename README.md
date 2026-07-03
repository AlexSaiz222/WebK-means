# K-Means Explorable

> Un algoritmo, cinco personalidades.

Una *explicación explorable* en una sola página que enseña, jugando, por qué
existen cinco variantes del algoritmo K-Means y en qué se diferencian:
**Lloyd, MacQueen, Hartigan-Wong, Elkan y Fuzzy K-Means**.

En lugar de *contar* las diferencias, la página deja que las descubras tocando:
cada idea explicada lleva al lado un pequeño laboratorio interactivo donde la
compruebas con tus propias manos, al estilo de
[Distill.pub](https://distill.pub) y las
[Explorable Explanations](https://explorabl.es).

<!-- TODO: captura o gif de la demo + enlace a la URL pública -->

## Qué hay dentro

- **La esencia de K-Means** — el ciclo asignación/actualización con un diagrama
  de tres fases calculado de verdad (no dibujado a ojo).
- **Cinco salas interactivas**, una por variante. Todas comparten el mismo
  instrumento (selector de muestras, `k` ajustable, línea de tiempo
  reproducible hacia delante y hacia atrás, narración por fase, métricas con
  curva de inercia, y puntos y centroides arrastrables que ramifican la
  ejecución), y cada una aísla la diferencia de su algoritmo:
  - **Lloyd** — actualización por lotes; con fronteras de Voronoi activables
    sobre el lienzo para ver por qué K-Means solo forma grupos convexos.
  - **MacQueen** — secuencial; "barajar orden" demuestra su sensibilidad al
    orden de llegada.
  - **Hartigan-Wong** — señala un punto y ve la ganancia por salir frente al
    coste de entrar: solo se mueve si reduce la inercia.
  - **Elkan** — Lloyd y Elkan en paralelo sobre los mismos datos: mismas
    etiquetas, muchísimos menos cálculos de distancia (desigualdad triangular).
  - **Fuzzy K-Means** — pertenencias graduales pintadas como mezcla de color y
    deslizador de borrosidad `m`.
- **¿Y cómo se elige k?** — método del codo y coeficiente de la silueta sobre
  las mismas muestras; clic en un `k` muestra su agrupamiento y los centroides
  del previo se pueden arrastrar para ver cómo un mal arranque estropea la
  curva.
- **Guía de decisión** — la tabla que convierte lo explorado en criterio.

## Fidelidad

Los cinco algoritmos están implementados fieles a su formulación
(ver [`docs/ALGORITMOS.md`](docs/ALGORITMOS.md), la fuente de verdad del
proyecto) y verificados con comprobaciones ejecutables:

```bash
npm test   # Node ≥ 22.6 (usa type stripping nativo)
```

Entre otras: Elkan produce exactamente las mismas etiquetas que Lloyd con menos
cálculos, barajar el orden cambia el resultado de MacQueen pero no el de Lloyd,
la inercia nunca empeora entre iteraciones, y con tres blobs separados la
silueta elige `k = 3`.

## Desarrollo

Hecho con [Astro](https://astro.build) + TypeScript, sin framework de UI ni
dependencias de ejecución: los algoritmos son TypeScript puro
(`src/lib/algorithms/`), el dibujo es Canvas 2D (`src/lib/sim/`) y cada sección
es un componente `.astro` con su script. Salida 100 % estática.

```bash
npm install
npm run dev      # servidor de desarrollo
npm run build    # build estática en dist/
npm run check    # astro check (TypeScript)
npm test         # comprobaciones de fidelidad
```

### Estructura

```
src/
  pages/index.astro        # la única página; orquesta las secciones
  layouts/Base.astro       # <head>, metadatos, estilos globales
  components/
    Nav.astro              # menú lateral con scroll-spy
    sections/              # una .astro por sección
  lib/
    algorithms/            # una implementación por variante + evaluación de k
    sim/                   # renderer de canvas, Voronoi, sparkline
    data/                  # generadores de las seis muestras
  styles/global.css        # tokens de diseño y hoja global
docs/                      # PROYECTO, ALGORITMOS, DISENO, ROADMAP
tests/fidelity.ts          # comprobaciones de fidelidad (npm test)
```

Los documentos de `docs/` explican el guion de la página, la teoría exacta de
cada variante, el sistema visual y el plan por hitos.

## Contexto

Proyecto de portfolio nacido en la asignatura *Aprendizaje Automático No
Supervisado*. Los apuntes originales de la asignatura no se distribuyen en
este repositorio; [`docs/ALGORITMOS.md`](docs/ALGORITMOS.md) recoge toda la
teoría necesaria.

## Créditos y licencia

Diseño e implementación: **Alejandro Manuel Saiz García** —
[GitHub](https://github.com/AlexSaiz222) ·
[LinkedIn](https://www.linkedin.com/in/alejandrosaizgarc%C3%ADa)

Código bajo licencia [MIT](LICENSE).
