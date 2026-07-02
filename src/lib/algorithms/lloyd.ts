import type { Clusterer, ClustererMetrics, Point } from './types.ts';
import { TOL, MAX_ITER, kmeansPlusPlus, mulberry32, nearest, inertia, sqDist } from './kmeans-base.ts';

/**
 * Lloyd — el K-Means "de libro", actualización por lotes: en cada iteración se
 * asignan TODOS los puntos y solo después se recalculan TODOS los centroides.
 */
export class Lloyd implements Clusterer {
  readonly name: string = 'Lloyd';
  protected points: Point[] = [];
  centroids: Point[] = [];
  labels: number[] = [];
  converged = false;
  metrics: ClustererMetrics = { iteration: 0, distanceComputations: 0, inertia: NaN };

  init(points: Point[], k: number, seed: number): void {
    this.points = points;
    const { centroids, distanceComputations } = kmeansPlusPlus(points, k, mulberry32(seed));
    this.centroids = centroids;
    this.labels = new Array<number>(points.length).fill(-1);
    this.converged = centroids.length === 0;
    this.metrics = { iteration: 0, distanceComputations, inertia: NaN };
  }

  step(): boolean {
    if (this.converged) return false;
    const k = this.centroids.length;

    // 1) asignar cada punto al centroide más cercano (n·k distancias)
    for (let i = 0; i < this.points.length; i++) {
      this.labels[i] = nearest(this.points[i]!, this.centroids).index;
    }
    this.metrics.distanceComputations += this.points.length * k;

    // 2) recalcular cada centroide como la media de sus puntos
    const sx = new Array<number>(k).fill(0);
    const sy = new Array<number>(k).fill(0);
    const cnt = new Array<number>(k).fill(0);
    for (let i = 0; i < this.points.length; i++) {
      const l = this.labels[i]!;
      sx[l]! += this.points[i]!.x;
      sy[l]! += this.points[i]!.y;
      cnt[l]!++;
    }
    let maxMove2 = 0;
    for (let j = 0; j < k; j++) {
      if (cnt[j]! === 0) continue; // clúster vacío: el centroide no se mueve (misma política que Elkan)
      const next = { x: sx[j]! / cnt[j]!, y: sy[j]! / cnt[j]! };
      maxMove2 = Math.max(maxMove2, sqDist(this.centroids[j]!, next));
      this.centroids[j] = next;
    }

    this.metrics.iteration++;
    this.metrics.inertia = inertia(this.points, this.centroids, this.labels);
    this.converged = maxMove2 < TOL * TOL || this.metrics.iteration >= MAX_ITER;
    return !this.converged;
  }
}
