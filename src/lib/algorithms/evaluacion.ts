import type { Point } from './types.ts';
import { dist } from './kmeans-base.ts';
import { Lloyd } from './lloyd.ts';

/**
 * Evaluación para elegir k (ver docs/ALGORITMOS.md): método del codo (inercia
 * frente a k) y coeficiente de la silueta en su versión simplificada por
 * centros: para cada punto, `a` es la distancia al centro de su grupo y `b`
 * la distancia al segundo mejor centro (el centro más cercano que no es el
 * suyo); s = (b − a) / max(a, b).
 */

/** Silueta media simplificada. NaN con k < 2 (no está definida). */
export function meanSilhouette(
  points: readonly Point[],
  centroids: readonly Point[],
  labels: readonly number[],
): number {
  if (centroids.length < 2) return NaN;
  let sum = 0;
  let count = 0;
  for (let i = 0; i < points.length; i++) {
    const l = labels[i]!;
    if (l < 0 || l >= centroids.length) continue;
    const a = dist(points[i]!, centroids[l]!);
    let b = Infinity;
    for (let j = 0; j < centroids.length; j++) {
      if (j === l) continue;
      const d = dist(points[i]!, centroids[j]!);
      if (d < b) b = d;
    }
    const denom = Math.max(a, b);
    sum += denom > 0 ? (b - a) / denom : 0;
    count++;
  }
  return count > 0 ? sum / count : NaN;
}

export interface KSweepEntry {
  k: number;
  /** Inercia (SSE) de la mejor ejecución. */
  inertia: number;
  /** Silueta media simplificada de la mejor ejecución; NaN con k = 1. */
  silhouette: number;
  labels: number[];
  centroids: Point[];
}

/**
 * Ejecuta Lloyd hasta convergencia con cada k en [kMin, kMax], probando varias
 * semillas y quedándose con la de menor inercia (el `n_init` de la práctica:
 * mitiga que un mal mínimo local deforme las curvas del codo y la silueta).
 */
export function kSweep(
  points: Point[],
  kMin: number,
  kMax: number,
  seeds: readonly number[],
): KSweepEntry[] {
  const entries: KSweepEntry[] = [];
  for (let k = kMin; k <= kMax; k++) {
    let best: KSweepEntry | null = null;
    for (const seed of seeds) {
      const run = runLloyd(points, k, seed);
      if (!best || run.inertia < best.inertia) {
        best = {
          k,
          inertia: run.inertia,
          silhouette: meanSilhouette(points, run.centroids, run.labels),
          labels: run.labels,
          centroids: run.centroids,
        };
      }
    }
    if (best) entries.push(best);
  }
  return entries;
}

export interface LloydRun {
  centroids: Point[];
  labels: number[];
  inertia: number;
  iterations: number;
}

/**
 * Una ejecución completa de Lloyd. Si se pasan `initial`, sustituyen a la
 * inicialización k-means++ (para comparar arranques aleatorios en el
 * mini-laboratorio de sensibilidad a la inicialización).
 */
export function runLloyd(
  points: Point[],
  k: number,
  seed: number,
  initial?: readonly Point[],
): LloydRun {
  const lloyd = new Lloyd();
  lloyd.init(points, k, seed);
  if (initial) lloyd.centroids = initial.map((c) => ({ ...c }));
  let guard = 0;
  while (lloyd.step() && guard++ < 500);
  return {
    centroids: lloyd.centroids.map((c) => ({ ...c })),
    labels: [...lloyd.labels],
    inertia: lloyd.metrics.inertia,
    iterations: lloyd.metrics.iteration,
  };
}
