import type { Point } from '../algorithms/types.ts';
import { mulberry32 } from '../algorithms/kmeans-base.ts';

/**
 * Generadores de datasets en coordenadas [0, 1]², elegidos para que las
 * variantes DISCREPEN (ver docs/PROYECTO.md).
 */

/** Normal estándar vía Box-Muller. */
function gauss(rand: () => number): number {
  let u = 0;
  while (u === 0) u = rand();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rand());
}

const clamp01 = (v: number) => Math.min(0.98, Math.max(0.02, v));

function scatter(rand: () => number, cx: number, cy: number, sdx: number, sdy: number): Point {
  return { x: clamp01(cx + gauss(rand) * sdx), y: clamp01(cy + gauss(rand) * sdy) };
}

/** Blobs redondos y separados: el caso fácil, todas las variantes coinciden. */
export function blobs(seed = 1, n = 150): Point[] {
  const rand = mulberry32(seed);
  // los centros varían con la semilla: "otra muestra" cambia la configuración
  const jit = () => (rand() - 0.5) * 0.16;
  const centers = [
    { x: 0.25 + jit(), y: 0.3 + jit() },
    { x: 0.73 + jit(), y: 0.27 + jit() },
    { x: 0.5 + jit(), y: 0.74 + jit() },
  ];
  return Array.from({ length: n }, (_, i) => {
    const c = centers[i % centers.length]!;
    return scatter(rand, c.x, c.y, 0.06, 0.06);
  });
}

/** Blobs estirados y rotados (anisotrópicos). */
export function anisotropic(seed = 2, n = 150): Point[] {
  const rand = mulberry32(seed);
  const jit = () => (rand() - 0.5) * 0.1;
  const centers = [
    { x: 0.3 + jit(), y: 0.28 + jit() },
    { x: 0.62 + jit(), y: 0.52 + jit() },
    { x: 0.35 + jit(), y: 0.78 + jit() },
  ];
  // la orientación también cambia con la semilla
  const angle = ((20 + rand() * 30) * Math.PI) / 180;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return Array.from({ length: n }, (_, i) => {
    const c = centers[i % centers.length]!;
    const gx = gauss(rand) * 0.13;
    const gy = gauss(rand) * 0.028;
    return { x: clamp01(c.x + gx * cos - gy * sin), y: clamp01(c.y + gx * sin + gy * cos) };
  });
}

/**
 * Tres grupos que se solapan: las fronteras son ambiguas y muchos puntos
 * podrían pertenecer a varios clústeres (el terreno natural de Fuzzy).
 */
export function overlapping(seed = 5, n = 160): Point[] {
  const rand = mulberry32(seed);
  const jit = () => (rand() - 0.5) * 0.08;
  const centers = [
    { x: 0.36 + jit(), y: 0.4 + jit() },
    { x: 0.63 + jit(), y: 0.42 + jit() },
    { x: 0.5 + jit(), y: 0.66 + jit() },
  ];
  return Array.from({ length: n }, (_, i) => {
    const c = centers[i % centers.length]!;
    return scatter(rand, c.x, c.y, 0.1, 0.11);
  });
}

/**
 * Dos anillos concéntricos: junto a las lunas, el otro recordatorio clásico de
 * que K-Means solo encuentra grupos convexos alrededor de un centro.
 */
export function rings(seed = 6, n = 160): Point[] {
  const rand = mulberry32(seed);
  const points: Point[] = [];
  const half = Math.floor(n / 2);
  for (let i = 0; i < n; i++) {
    const angle = rand() * Math.PI * 2;
    const radius = (i < half ? 0.13 : 0.36) + gauss(rand) * 0.022;
    // el radio horizontal se comprime para que el lienzo 3:2 los muestre redondos
    points.push({
      x: clamp01(0.5 + Math.cos(angle) * radius * 0.72),
      y: clamp01(0.5 + Math.sin(angle) * radius * 1.08),
    });
  }
  return points;
}

/** Un grupo enorme y disperso y dos pequeños y densos. */
export function unevenDensities(seed = 3, n = 180): Point[] {
  const rand = mulberry32(seed);
  const points: Point[] = [];
  const nBig = Math.floor(n * 0.7);
  const nSmall = Math.floor((n - nBig) / 2);
  for (let i = 0; i < nBig; i++) points.push(scatter(rand, 0.38, 0.55, 0.12, 0.12));
  for (let i = 0; i < nSmall; i++) points.push(scatter(rand, 0.82, 0.2, 0.03, 0.03));
  for (let i = 0; i < n - nBig - nSmall; i++) points.push(scatter(rand, 0.85, 0.82, 0.03, 0.03));
  return points;
}

/** Dos medias lunas entrelazadas: K-Means falla; recordatorio de sus límites. */
export function moons(seed = 4, n = 160, noise = 0.04): Point[] {
  const rand = mulberry32(seed);
  const points: Point[] = [];
  const half = Math.floor(n / 2);
  for (let i = 0; i < n; i++) {
    const t = rand() * Math.PI;
    let x: number;
    let y: number;
    if (i < half) {
      x = 0.5 + 0.3 * Math.cos(t) - 0.12;
      y = 0.42 - 0.3 * Math.sin(t) + 0.15;
    } else {
      x = 0.5 - 0.3 * Math.cos(t) + 0.12;
      y = 0.58 + 0.3 * Math.sin(t) - 0.15;
    }
    points.push({
      x: clamp01(x + gauss(rand) * noise),
      y: clamp01(y + gauss(rand) * noise),
    });
  }
  return points;
}
