import type { Clusterer, ClustererMetrics, Point } from './types.ts';
import { TOL, MAX_ITER, kmeansPlusPlus, mulberry32, dist, inertia } from './kmeans-base.ts';

/**
 * Elkan — acelera Lloyd manteniendo un límite superior `u(x)` a la distancia
 * del punto a su centroide asignado y límites inferiores `l(x, c)` al resto.
 * Con la desigualdad triangular descarta centroides sin medir distancias.
 * Produce EXACTAMENTE el mismo resultado que Lloyd (misma semilla y datos);
 * su historia está en el contador de distancias.
 *
 * El contador registra solo distancias punto-centroide realmente computadas
 * (ver ALGORITMOS.md); las distancias centroide-centroide, k² por iteración,
 * son parte de la sobrecarga interna y no entran en la comparación.
 */
export class Elkan implements Clusterer {
  readonly name: string = 'Elkan';
  private points: Point[] = [];
  private upper: number[] = [];
  private lower: number[][] = [];
  centroids: Point[] = [];
  labels: number[] = [];
  converged = false;
  metrics: ClustererMetrics = { iteration: 0, distanceComputations: 0, inertia: NaN };

  init(points: Point[], k: number, seed: number): void {
    this.points = points;
    const { centroids, distanceComputations } = kmeansPlusPlus(points, k, mulberry32(seed));
    this.centroids = centroids;
    const kk = centroids.length;
    this.labels = new Array<number>(points.length).fill(-1);
    this.upper = new Array<number>(points.length).fill(Infinity);
    this.lower = points.map(() => new Array<number>(kk).fill(0));
    this.converged = kk === 0;
    this.metrics = { iteration: 0, distanceComputations, inertia: NaN };
  }

  step(): boolean {
    if (this.converged) return false;
    const n = this.points.length;
    const k = this.centroids.length;
    const firstStep = this.metrics.iteration === 0;

    if (firstStep) {
      // asignación inicial exacta: n·k distancias que dejan todos los límites prietos
      for (let i = 0; i < n; i++) {
        let best = 0;
        let bestD = Infinity;
        for (let j = 0; j < k; j++) {
          const d = dist(this.points[i]!, this.centroids[j]!);
          this.lower[i]![j] = d;
          if (d < bestD) {
            bestD = d;
            best = j;
          }
        }
        this.labels[i] = best;
        this.upper[i] = bestD;
      }
      this.metrics.distanceComputations += n * k;
    } else {
      // distancias entre centroides y s(c) = ½ · min distancia a otro centroide
      const cc: number[][] = Array.from({ length: k }, () => new Array<number>(k).fill(0));
      const s = new Array<number>(k).fill(Infinity);
      for (let a = 0; a < k; a++) {
        for (let b = a + 1; b < k; b++) {
          const d = dist(this.centroids[a]!, this.centroids[b]!);
          cc[a]![b] = d;
          cc[b]![a] = d;
          if (d / 2 < s[a]!) s[a] = d / 2;
          if (d / 2 < s[b]!) s[b] = d / 2;
        }
      }

      for (let i = 0; i < n; i++) {
        let a = this.labels[i]!;
        // si u(x) ≤ s(c_asignado), ningún otro centroide puede estar más cerca
        if (this.upper[i]! <= s[a]!) continue;
        let tight = false;
        for (let j = 0; j < k; j++) {
          if (j === a) continue;
          // descartes por límite inferior y por desigualdad triangular
          if (this.upper[i]! <= this.lower[i]![j]!) continue;
          if (this.upper[i]! <= cc[a]![j]! / 2) continue;
          if (!tight) {
            // aprieta u(x) midiendo de verdad al centroide asignado
            const d = dist(this.points[i]!, this.centroids[a]!);
            this.metrics.distanceComputations++;
            this.upper[i] = d;
            this.lower[i]![a] = d;
            tight = true;
            if (d <= this.lower[i]![j]! || d <= cc[a]![j]! / 2) continue;
          }
          const dj = dist(this.points[i]!, this.centroids[j]!);
          this.metrics.distanceComputations++;
          this.lower[i]![j] = dj;
          if (dj < this.upper[i]!) {
            a = j;
            this.labels[i] = j;
            this.upper[i] = dj; // exacta para el nuevo asignado
          }
        }
      }
    }

    // recalcular centroides (idéntico a Lloyd) y medir cuánto se movió cada uno
    const sx = new Array<number>(k).fill(0);
    const sy = new Array<number>(k).fill(0);
    const cnt = new Array<number>(k).fill(0);
    for (let i = 0; i < n; i++) {
      const l = this.labels[i]!;
      sx[l]! += this.points[i]!.x;
      sy[l]! += this.points[i]!.y;
      cnt[l]!++;
    }
    const delta = new Array<number>(k).fill(0);
    let maxDelta = 0;
    for (let j = 0; j < k; j++) {
      if (cnt[j]! === 0) continue; // clúster vacío: no se mueve (misma política que Lloyd)
      const next = { x: sx[j]! / cnt[j]!, y: sy[j]! / cnt[j]! };
      delta[j] = dist(this.centroids[j]!, next);
      maxDelta = Math.max(maxDelta, delta[j]!);
      this.centroids[j] = next;
    }

    // relajar límites según el desplazamiento de cada centroide
    for (let i = 0; i < n; i++) {
      this.upper[i]! += delta[this.labels[i]!]!;
      for (let j = 0; j < k; j++) {
        this.lower[i]![j] = Math.max(0, this.lower[i]![j]! - delta[j]!);
      }
    }

    this.metrics.iteration++;
    this.metrics.inertia = inertia(this.points, this.centroids, this.labels);
    this.converged = maxDelta < TOL || this.metrics.iteration >= MAX_ITER;
    return !this.converged;
  }
}
