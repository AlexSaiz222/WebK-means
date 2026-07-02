# K-Means Explorable

Una *explicación explorable* en una sola página que enseña, jugando, por qué
existen cinco variantes del algoritmo K-Means y en qué se diferencian:
**Lloyd, MacQueen, Hartigan-Wong, Elkan y Fuzzy/Soft K-Means**.

En lugar de *contar* las diferencias, la página deja que las descubras tocando:
cada idea que se explica lleva al lado un pequeño laboratorio interactivo donde la
compruebas con tus propias manos.

> Un algoritmo, cinco personalidades.

## Estado

Recorrido completo funcionando en local (hitos M0–M4: apertura, sandbox base,
las cinco salas, arena comparativa y guía de decisión). Pendiente el despliegue
público (M5). Ver el plan en [`docs/ROADMAP.md`](docs/ROADMAP.md).

Los cinco algoritmos pasan las comprobaciones de fidelidad de
[`docs/ALGORITMOS.md`](docs/ALGORITMOS.md) con `npm test` (Node ≥ 22.6, usa
type stripping nativo).

## Estructura del proyecto

- [`CLAUDE.md`](CLAUDE.md) — contexto y convenciones del proyecto (empieza aquí).
- [`docs/PROYECTO.md`](docs/PROYECTO.md) — el recorrido sección por sección.
- [`docs/ALGORITMOS.md`](docs/ALGORITMOS.md) — la teoría exacta de cada variante.
- [`docs/DISENO.md`](docs/DISENO.md) — el sistema de diseño.
- [`docs/ROADMAP.md`](docs/ROADMAP.md) — el plan por hitos.
- `docs/Tema3.pdf` — el temario original en el que se basa la teoría.

## Desarrollo

Hecho con [Astro](https://astro.build) + TypeScript, sin framework de UI.
Salida 100 % estática.

```bash
npm install
npm run dev
```

## Contexto

Proyecto de portfolio para la asignatura *Aprendizaje Automático No Supervisado*
(Tema 3: diferentes implementaciones de K-Means).

## Créditos

Hecho por [tu nombre]. Diseño e implementación propios.
