import type { Point } from './types.ts';

/** Movimiento mínimo de centroide para considerar que aún no ha convergido. */
export const TOL = 1e-6;
/** Tope de iteraciones de seguridad, común a todas las variantes. */
export const MAX_ITER = 100;

/** PRNG determinista con semilla (mulberry32): reproducibilidad en la arena. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function sqDist(a: Point, b: Point): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}

export function dist(a: Point, b: Point): number {
  return Math.sqrt(sqDist(a, b));
}

/** Índice y distancia² del centroide más cercano a `p`. */
export function nearest(p: Point, centroids: readonly Point[]): { index: number; d2: number } {
  let index = 0;
  let d2 = Infinity;
  for (let j = 0; j < centroids.length; j++) {
    const d = sqDist(p, centroids[j]!);
    if (d < d2) {
      d2 = d;
      index = j;
    }
  }
  return { index, d2 };
}

/**
 * Inicialización k-means++ compartida por las variantes duras (salvo
 * Hartigan-Wong, ver ALGORITMOS.md). Devuelve también cuántas distancias
 * punto-centroide computó, para que el contador sea honesto desde el inicio.
 */
export function kmeansPlusPlus(
  points: Point[],
  k: number,
  rand: () => number,
): { centroids: Point[]; distanceComputations: number } {
  const n = points.length;
  const kk = Math.min(k, n);
  const centroids: Point[] = [];
  let comps = 0;
  if (kk === 0) return { centroids, distanceComputations: 0 };

  centroids.push({ ...points[Math.floor(rand() * n)]! });
  const d2 = new Array<number>(n).fill(Infinity);

  while (centroids.length < kk) {
    const last = centroids[centroids.length - 1]!;
    let total = 0;
    for (let i = 0; i < n; i++) {
      const d = sqDist(points[i]!, last);
      comps++;
      if (d < d2[i]!) d2[i] = d;
      total += d2[i]!;
    }
    // muestreo proporcional a D(x)²
    let idx = 0;
    if (total > 0) {
      let r = rand() * total;
      for (idx = 0; idx < n - 1; idx++) {
        r -= d2[idx]!;
        if (r <= 0) break;
      }
    } else {
      idx = Math.floor(rand() * n);
    }
    centroids.push({ ...points[idx]! });
  }
  return { centroids, distanceComputations: comps };
}

/** SSE con etiquetas duras. Es métrica de informe: no suma al contador. */
export function inertia(
  points: readonly Point[],
  centroids: readonly Point[],
  labels: readonly number[],
): number {
  let s = 0;
  let any = false;
  for (let i = 0; i < points.length; i++) {
    const l = labels[i]!;
    if (l < 0 || l >= centroids.length) continue;
    any = true;
    s += sqDist(points[i]!, centroids[l]!);
  }
  return any ? s : NaN;
}
