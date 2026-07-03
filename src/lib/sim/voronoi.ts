import type { Point } from '../algorithms/types.ts';

/**
 * Celdas de Voronoi de los centroides dentro del cuadrado [0,1]², calculadas
 * en el espacio de datos (el mismo en el que los algoritmos miden distancias),
 * de modo que cada punto queda dentro de la celda del centroide al que se
 * asignaría. Recorte de semiplanos (Sutherland-Hodgman): con k ≤ 8 sitios es
 * inmediato y no necesita librerías.
 */
export function voronoiCells(sites: readonly Point[]): Point[][] {
  const SQUARE: Point[] = [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 1, y: 1 },
    { x: 0, y: 1 },
  ];
  return sites.map((s, j) => {
    let poly = SQUARE.map((p) => ({ ...p }));
    for (let i = 0; i < sites.length; i++) {
      if (i === j) continue;
      const o = sites[i]!;
      const nx = o.x - s.x;
      const ny = o.y - s.y;
      if (nx * nx + ny * ny < 1e-12) continue; // sitios coincidentes
      poly = clipHalfPlane(poly, (s.x + o.x) / 2, (s.y + o.y) / 2, nx, ny);
      if (poly.length === 0) break;
    }
    return poly;
  });
}

/** Conserva la parte del polígono con (p − m) · n ≤ 0 (el lado de `s`). */
function clipHalfPlane(poly: Point[], mx: number, my: number, nx: number, ny: number): Point[] {
  const out: Point[] = [];
  for (let a = 0; a < poly.length; a++) {
    const p = poly[a]!;
    const q = poly[(a + 1) % poly.length]!;
    const fp = (p.x - mx) * nx + (p.y - my) * ny;
    const fq = (q.x - mx) * nx + (q.y - my) * ny;
    if (fp <= 0) out.push(p);
    if ((fp < 0 && fq > 0) || (fp > 0 && fq < 0)) {
      const t = fp / (fp - fq);
      out.push({ x: p.x + (q.x - p.x) * t, y: p.y + (q.y - p.y) * t });
    }
  }
  return out;
}
