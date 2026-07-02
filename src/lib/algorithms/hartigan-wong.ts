import type { Clusterer, ClustererMetrics, Point } from './types.ts';
import { MAX_ITER, mulberry32, inertia, sqDist } from './kmeans-base.ts';

/**
 * Hartigan-Wong — reasigna un punto a otro clúster solo si eso REDUCE la
 * Inercia, teniendo en cuenta que mover el punto desplaza ambos
 * centroides. Un punto puede acabar en un centroide que no es el más cercano.
 *
 * Inicialización según el temario: asignación aleatoria de puntos a clústeres
 * y centroides como media de los asignados (quedan inicialmente parecidos).
 */
export class HartiganWong implements Clusterer {
  readonly name: string = 'Hartigan-Wong';
  private points: Point[] = [];
  private counts: number[] = [];
  centroids: Point[] = [];
  labels: number[] = [];
  converged = false;
  metrics: ClustererMetrics = { iteration: 0, distanceComputations: 0, inertia: NaN };

  init(points: Point[], k: number, seed: number): void {
    this.points = points;
    const kk = Math.min(k, points.length);
    const rand = mulberry32(seed);

    // asignación aleatoria inicial
    this.labels = points.map(() => Math.floor(rand() * kk));
    this.counts = new Array<number>(kk).fill(0);
    for (const l of this.labels) this.counts[l]!++;

    // ningún clúster puede quedar vacío: roba un punto de uno con >1
    for (let j = 0; j < kk; j++) {
      while (this.counts[j]! === 0) {
        const i = Math.floor(rand() * points.length);
        const from = this.labels[i]!;
        if (this.counts[from]! > 1) {
          this.labels[i] = j;
          this.counts[from]!--;
          this.counts[j]!++;
        }
      }
    }

    // centroides = media de sus puntos asignados
    this.centroids = Array.from({ length: kk }, () => ({ x: 0, y: 0 }));
    for (let i = 0; i < points.length; i++) {
      const c = this.centroids[this.labels[i]!]!;
      c.x += points[i]!.x;
      c.y += points[i]!.y;
    }
    for (let j = 0; j < kk; j++) {
      this.centroids[j]!.x /= this.counts[j]!;
      this.centroids[j]!.y /= this.counts[j]!;
    }

    this.converged = kk === 0;
    this.metrics = {
      iteration: 0,
      distanceComputations: 0,
      inertia: inertia(points, this.centroids, this.labels),
    };
  }

  /**
   * Ganancia por salir del clúster actual y coste por entrar en cada otro
   * (fórmulas exactas de ALGORITMOS.md). Para la UI de la sala; no cuenta
   * cálculos porque es introspección, no ejecución del algoritmo.
   */
  evaluateMove(i: number): { gain: number; costs: number[] } {
    const p = this.points[i]!;
    const ci = this.labels[i]!;
    const ni = this.counts[ci]!;
    const gain = ni <= 1 ? 0 : (ni / (ni - 1)) * sqDist(p, this.centroids[ci]!);
    const costs = this.centroids.map((c, j) => {
      if (j === ci) return Infinity;
      const nj = this.counts[j]!;
      return (nj / (nj + 1)) * sqDist(p, c);
    });
    return { gain, costs };
  }

  step(): boolean {
    if (this.converged) return false;
    const k = this.centroids.length;
    let changes = 0;

    for (let i = 0; i < this.points.length; i++) {
      const ci = this.labels[i]!;
      const ni = this.counts[ci]!;
      if (ni <= 1) continue; // el origen quedaría vacío
      const p = this.points[i]!;

      const gain = (ni / (ni - 1)) * sqDist(p, this.centroids[ci]!);
      let bestJ = -1;
      let bestCost = Infinity;
      for (let j = 0; j < k; j++) {
        if (j === ci) continue;
        const nj = this.counts[j]!;
        const cost = (nj / (nj + 1)) * sqDist(p, this.centroids[j]!);
        if (cost < bestCost) {
          bestCost = cost;
          bestJ = j;
        }
      }
      this.metrics.distanceComputations += k;

      // mover solo si hay mejora estricta de la función objetivo
      if (bestJ >= 0 && bestCost < gain - 1e-12) {
        this.moveOut(ci, p);
        this.moveIn(bestJ, p);
        this.labels[i] = bestJ;
        changes++;
      }
    }

    this.metrics.iteration++;
    this.metrics.inertia = inertia(this.points, this.centroids, this.labels);
    this.converged = changes === 0 || this.metrics.iteration >= MAX_ITER;
    return !this.converged;
  }

  private moveOut(j: number, p: Point): void {
    const n = this.counts[j]! - 1;
    this.counts[j] = n;
    const c = this.centroids[j]!;
    c.x += (c.x - p.x) / n;
    c.y += (c.y - p.y) / n;
  }

  private moveIn(j: number, p: Point): void {
    const n = this.counts[j]! + 1;
    this.counts[j] = n;
    const c = this.centroids[j]!;
    c.x += (p.x - c.x) / n;
    c.y += (p.y - c.y) / n;
  }
}
