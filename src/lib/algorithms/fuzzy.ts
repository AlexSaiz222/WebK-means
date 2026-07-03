import type { Clusterer, ClustererMetrics, Point } from './types.ts';
import { MAX_ITER, mulberry32, dist, inertia } from './kmeans-base.ts';

/**
 * Fuzzy / Soft K-Means (Fuzzy K-Means) — cada punto tiene un grado de
 * pertenencia a cada clúster (cada fila suma 1). El parámetro de borrosidad
 * `m` controla cuán difusas son las fronteras: m → 1⁺ endurece hacia el
 * K-Means clásico; m alto reparte las pertenencias.
 */
export class Fuzzy implements Clusterer {
  readonly name: string = 'Fuzzy K-Means';
  /** Borrosidad; ajustable en caliente desde el deslizador de la sala. */
  m = 2;
  private points: Point[] = [];
  /** Convergencia: cambio máximo de pertenencia por debajo de esta tolerancia. */
  private readonly tolU = 1e-4;
  memberships: number[][] = [];
  centroids: Point[] = [];
  labels: number[] = [];
  converged = false;
  metrics: ClustererMetrics = { iteration: 0, distanceComputations: 0, inertia: NaN };

  init(points: Point[], k: number, seed: number): void {
    this.points = points;
    const kk = Math.min(k, points.length);
    const rand = mulberry32(seed);

    // pertenencias iniciales al azar, cada fila normalizada a suma 1
    this.memberships = points.map(() => {
      const row = Array.from({ length: kk }, () => rand() + 1e-9);
      const total = row.reduce((a, b) => a + b, 0);
      return row.map((v) => v / total);
    });

    this.centroids = Array.from({ length: kk }, () => ({ x: 0, y: 0 }));
    this.updateCentroids();
    this.labels = this.memberships.map((row) => argmax(row));
    this.converged = kk === 0;
    this.metrics = {
      iteration: 0,
      distanceComputations: 0,
      inertia: inertia(points, this.centroids, this.labels),
    };
  }

  /** Cambia la borrosidad en caliente; hay que volver a iterar hasta reconverger. */
  setM(m: number): void {
    this.m = m;
    if (this.centroids.length > 0) this.converged = false;
  }

  /** c_j = Σ u_ij^m · x_i / Σ u_ij^m (media ponderada por pertenencia^m). */
  private updateCentroids(): void {
    const k = this.centroids.length;
    for (let j = 0; j < k; j++) {
      let sx = 0;
      let sy = 0;
      let sw = 0;
      for (let i = 0; i < this.points.length; i++) {
        const w = Math.pow(this.memberships[i]![j]!, this.m);
        sx += w * this.points[i]!.x;
        sy += w * this.points[i]!.y;
        sw += w;
      }
      if (sw > 0) this.centroids[j] = { x: sx / sw, y: sy / sw };
    }
  }

  step(): boolean {
    if (this.converged) return false;
    const k = this.centroids.length;
    const exp = 2 / (this.m - 1);

    this.updateCentroids();

    let maxDelta = 0;
    const d = new Array<number>(k).fill(0);
    for (let i = 0; i < this.points.length; i++) {
      // distancia del punto a cada centroide
      let zero = -1;
      for (let j = 0; j < k; j++) {
        d[j] = dist(this.points[i]!, this.centroids[j]!);
        if (d[j]! < 1e-12) zero = j;
      }
      this.metrics.distanceComputations += k;

      const row = this.memberships[i]!;
      for (let j = 0; j < k; j++) {
        let u: number;
        if (zero >= 0) {
          u = j === zero ? 1 : 0; // el punto coincide con un centroide
        } else {
          let denom = 0;
          for (let l = 0; l < k; l++) denom += Math.pow(d[j]! / d[l]!, exp);
          u = 1 / denom;
        }
        maxDelta = Math.max(maxDelta, Math.abs(u - row[j]!));
        row[j] = u;
      }
      this.labels[i] = argmax(row);
    }

    this.metrics.iteration++;
    this.metrics.inertia = inertia(this.points, this.centroids, this.labels);
    this.converged = maxDelta < this.tolU || this.metrics.iteration >= MAX_ITER;
    return !this.converged;
  }
}

function argmax(row: readonly number[]): number {
  let best = 0;
  for (let j = 1; j < row.length; j++) {
    if (row[j]! > row[best]!) best = j;
  }
  return best;
}
