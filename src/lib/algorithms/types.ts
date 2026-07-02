/** Un punto en el plano, en coordenadas normalizadas [0, 1]. */
export interface Point {
  x: number;
  y: number;
}

export interface ClustererMetrics {
  /** Iteraciones completadas. */
  iteration: number;
  /** Distancias punto-centroide realmente computadas (clave para Elkan vs. Lloyd). */
  distanceComputations: number;
  /** SSE con etiquetas duras (argmax en Fuzzy). NaN si aún no hay asignación. */
  inertia: number;
}

/**
 * Interfaz común de las cinco variantes. Sin dependencias de UI: exponen su
 * estado paso a paso y la capa `sim/` se encarga de dibujarlo.
 */
export interface Clusterer {
  readonly name: string;
  init(points: Point[], k: number, seed: number): void;
  /** Avanza una iteración; devuelve `false` si ya convergió. */
  step(): boolean;
  readonly converged: boolean;
  readonly centroids: readonly Point[];
  /** Asignación dura por punto; -1 = sin asignar todavía. */
  readonly labels: readonly number[];
  /** Solo Fuzzy: pertenencias suaves (n × k, cada fila suma 1). */
  readonly memberships?: readonly number[][];
  readonly metrics: ClustererMetrics;
}
