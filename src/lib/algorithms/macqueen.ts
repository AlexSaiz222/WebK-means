import type { Clusterer, ClustererMetrics, Point } from './types.ts';
import { MAX_ITER, kmeansPlusPlus, mulberry32, nearest, inertia } from './kmeans-base.ts';

/**
 * MacQueen — K-Means online/secuencial: itera los puntos uno a uno y, en cuanto
 * un punto cambia de clúster, los centroides implicados se recalculan al
 * instante (media incremental). Sensible al orden de los datos.
 */
export class MacQueen implements Clusterer {
  readonly name: string = 'MacQueen';
  private points: Point[] = [];
  private counts: number[] = [];
  /** Orden de visita de los puntos; barajarlo evidencia la sensibilidad al orden. */
  order: number[] = [];
  centroids: Point[] = [];
  labels: number[] = [];
  converged = false;
  metrics: ClustererMetrics = { iteration: 0, distanceComputations: 0, inertia: NaN };

  init(points: Point[], k: number, seed: number): void {
    this.points = points;
    const { centroids, distanceComputations } = kmeansPlusPlus(points, k, mulberry32(seed));
    this.centroids = centroids;
    // cada centroide inicial cuenta como su propia primera observación
    // (formulación clásica de MacQueen; evita teleportarse al primer punto)
    this.counts = new Array<number>(centroids.length).fill(1);
    this.labels = new Array<number>(points.length).fill(-1);
    this.order = points.map((_, i) => i);
    this.converged = centroids.length === 0;
    this.metrics = { iteration: 0, distanceComputations, inertia: NaN };
  }

  /** Baraja el orden de visita (Fisher-Yates con semilla). No reinicia el estado. */
  shuffleOrder(seed: number): void {
    const rand = mulberry32(seed);
    for (let i = this.order.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      const t = this.order[i]!;
      this.order[i] = this.order[j]!;
      this.order[j] = t;
    }
  }

  /**
   * Ingesta online (flujo continuo): añade un punto nuevo, lo asigna al
   * centroide más cercano y ese centroide se recalcula al instante.
   */
  addPoint(p: Point): number {
    this.points.push(p);
    const j = nearest(p, this.centroids).index;
    this.metrics.distanceComputations += this.centroids.length;
    this.add(j, p);
    this.labels.push(j);
    this.order.push(this.points.length - 1);
    this.converged = false;
    this.metrics.inertia = inertia(this.points, this.centroids, this.labels);
    return j;
  }

  /** Una pasada completa sobre los puntos, en el orden actual. */
  step(): boolean {
    if (this.converged) return false;
    const k = this.centroids.length;
    let changes = 0;

    for (const i of this.order) {
      const p = this.points[i]!;
      const j = nearest(p, this.centroids).index;
      this.metrics.distanceComputations += k;
      const prev = this.labels[i]!;
      if (j === prev) continue;
      // nunca vaciar un clúster
      if (prev >= 0 && this.counts[prev]! <= 1) continue;
      if (prev >= 0) this.remove(prev, p);
      this.add(j, p);
      this.labels[i] = j;
      changes++;
    }

    this.metrics.iteration++;
    this.metrics.inertia = inertia(this.points, this.centroids, this.labels);
    this.converged = changes === 0 || this.metrics.iteration >= MAX_ITER;
    return !this.converged;
  }

  /** c ← c + (x − c) / n  al añadir un punto al clúster j. */
  private add(j: number, p: Point): void {
    const n = this.counts[j]! + 1;
    this.counts[j] = n;
    const c = this.centroids[j]!;
    c.x += (p.x - c.x) / n;
    c.y += (p.y - c.y) / n;
  }

  /** Operación espejo al retirar el punto de su clúster anterior. */
  private remove(j: number, p: Point): void {
    const n = this.counts[j]! - 1;
    this.counts[j] = n;
    const c = this.centroids[j]!;
    c.x += (c.x - p.x) / n;
    c.y += (c.y - p.y) / n;
  }
}
