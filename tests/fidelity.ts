/**
 * Comprobaciones de fidelidad de docs/ALGORITMOS.md. Se ejecutan con Node
 * (type stripping nativo): `npm test`.
 */
import type { Clusterer, Point } from '../src/lib/algorithms/types.ts';
import { Lloyd } from '../src/lib/algorithms/lloyd.ts';
import { MacQueen } from '../src/lib/algorithms/macqueen.ts';
import { HartiganWong } from '../src/lib/algorithms/hartigan-wong.ts';
import { Elkan } from '../src/lib/algorithms/elkan.ts';
import { Fuzzy } from '../src/lib/algorithms/fuzzy.ts';
import { kSweep, meanSilhouette } from '../src/lib/algorithms/evaluacion.ts';
import { blobs, anisotropic, unevenDensities, moons, overlapping, rings } from '../src/lib/data/datasets.ts';

let failures = 0;

function check(name: string, ok: boolean, detail = ''): void {
  if (ok) {
    console.log(`  ok  ${name}`);
  } else {
    failures++;
    console.error(`FALLO  ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

function run(c: Clusterer, points: Point[], k: number, seed: number): number[] {
  c.init(points, k, seed);
  const sse: number[] = [];
  let guard = 0;
  while (c.step() && guard++ < 500) sse.push(c.metrics.inertia);
  sse.push(c.metrics.inertia);
  return sse;
}

const datasets: Array<[string, Point[]]> = [
  ['blobs', blobs(11, 200)],
  ['anisotrópico', anisotropic(12, 200)],
  ['densidades', unevenDensities(13, 200)],
  ['lunas', moons(14, 200)],
  ['solapados', overlapping(15, 200)],
  ['anillos', rings(16, 200)],
];

// ---- 1. Elkan == Lloyd (mismas etiquetas, muchos menos cálculos) ----
console.log('\nElkan == Lloyd');
for (const [name, points] of datasets) {
  for (const seed of [1, 2, 7]) {
    for (const k of [3, 5]) {
      const lloyd = new Lloyd();
      const elkan = new Elkan();
      run(lloyd, points, k, seed);
      run(elkan, points, k, seed);
      const sameLabels = lloyd.labels.every((l, i) => l === elkan.labels[i]);
      const id = `${name} seed=${seed} k=${k}`;
      check(`mismas etiquetas (${id})`, sameLabels);
      check(
        `Elkan calcula menos distancias (${id})`,
        elkan.metrics.distanceComputations < lloyd.metrics.distanceComputations,
        `elkan=${elkan.metrics.distanceComputations} lloyd=${lloyd.metrics.distanceComputations}`,
      );
    }
  }
}
{
  // el ahorro debe ser sustancial, no anecdótico
  const points = blobs(11, 400);
  const lloyd = new Lloyd();
  const elkan = new Elkan();
  run(lloyd, points, 4, 3);
  run(elkan, points, 4, 3);
  const ratio = elkan.metrics.distanceComputations / lloyd.metrics.distanceComputations;
  check('ahorro sustancial de Elkan (< 70 %)', ratio < 0.7, `ratio=${ratio.toFixed(2)}`);
}

// ---- 2. MacQueen es sensible al orden de los datos ----
console.log('\nMacQueen sensible al orden');
{
  let differs = false;
  for (let seed = 1; seed <= 10 && !differs; seed++) {
    const points = unevenDensities(seed * 5, 180);
    const a = new MacQueen();
    a.init(points, 4, seed);
    let guard = 0;
    while (a.step() && guard++ < 500);

    const b = new MacQueen();
    b.init(points, 4, seed); // misma inicialización...
    b.shuffleOrder(seed * 97 + 13); // ...distinto orden de llegada
    guard = 0;
    while (b.step() && guard++ < 500);

    differs = a.centroids.some((c, j) => {
      const d = b.centroids[j]!;
      return Math.abs(c.x - d.x) > 1e-3 || Math.abs(c.y - d.y) > 1e-3;
    });
  }
  check('barajar el orden puede cambiar el resultado', differs);
}

// ---- 3. La función objetivo nunca empeora iteración a iteración ----
console.log('\nSSE monótona');
for (const [Ctor, name] of [
  [Lloyd, 'Lloyd'],
  [MacQueen, 'MacQueen'],
  [HartiganWong, 'Hartigan-Wong'],
  [Elkan, 'Elkan'],
] as Array<[new () => Clusterer, string]>) {
  let monotone = true;
  for (const [, points] of datasets) {
    const sse = run(new Ctor(), points, 4, 5);
    for (let i = 1; i < sse.length; i++) {
      if (sse[i]! > sse[i - 1]! + 1e-9) monotone = false;
    }
  }
  check(`${name} no empeora la SSE`, monotone);
}

// ---- 4. Fuzzy: m endurece o difumina las fronteras ----
console.log('\nFuzzy');
{
  const points = blobs(11, 200);
  const meanMax = (m: number) => {
    const f = new Fuzzy();
    f.m = m;
    run(f, points, 3, 5);
    const sum = f.memberships.reduce((acc, row) => acc + Math.max(...row), 0);
    return sum / f.memberships.length;
  };
  const hard = meanMax(1.1);
  const soft = meanMax(4);
  check('m → 1⁺ acerca a asignación dura', hard > 0.95, `media máx=${hard.toFixed(3)}`);
  check('m alto reparte las pertenencias', soft < hard - 0.1, `dura=${hard.toFixed(3)} difusa=${soft.toFixed(3)}`);

  const f = new Fuzzy();
  const sse = run(f, points, 3, 5);
  check('la SSE dura final mejora la inicial', sse[sse.length - 1]! <= sse[0]!);
  const sums = f.memberships.map((row) => row.reduce((a, b) => a + b, 0));
  check('cada fila de pertenencias suma 1', sums.every((s) => Math.abs(s - 1) < 1e-9));
}

// ---- 5. Evaluación para elegir k (codo y silueta) ----
console.log('\nElección de k');
{
  const points = blobs(11, 200); // tres grupos claros
  const seeds = [1, 2, 3, 4, 5];
  const sweep = kSweep(points, 1, 8, seeds);

  check('el barrido cubre k = 1..8', sweep.length === 8 && sweep[0]!.k === 1 && sweep[7]!.k === 8);

  let decreasing = true;
  for (let i = 1; i < sweep.length; i++) {
    if (sweep[i]!.inertia > sweep[i - 1]!.inertia + 1e-9) decreasing = false;
  }
  check('la inercia (mejor de varias semillas) no crece con k', decreasing);

  check('la silueta no está definida con k = 1', Number.isNaN(sweep[0]!.silhouette));
  const inRange = sweep
    .slice(1)
    .every((e) => e.silhouette >= -1 - 1e-9 && e.silhouette <= 1 + 1e-9);
  check('la silueta media queda en [-1, 1]', inRange);

  let bestK = 0;
  let bestS = -Infinity;
  for (const e of sweep) {
    if (Number.isFinite(e.silhouette) && e.silhouette > bestS) {
      bestS = e.silhouette;
      bestK = e.k;
    }
  }
  check('con tres blobs, la silueta elige k = 3', bestK === 3, `k óptimo=${bestK} (s=${bestS.toFixed(3)})`);

  // la silueta simplificada por centros: a = distancia al propio centro,
  // b = al segundo mejor; con centros idénticos s = 0
  const twin = meanSilhouette(points, [{ x: 0.5, y: 0.5 }, { x: 0.5, y: 0.5 }], points.map(() => 0));
  check('centros idénticos → silueta 0', Math.abs(twin) < 1e-9);
}

// ---- 6. Todas convergen y quedan con k centroides ----
console.log('\nConvergencia');
for (const Ctor of [Lloyd, MacQueen, HartiganWong, Elkan, Fuzzy]) {
  const c: Clusterer = new (Ctor as new () => Clusterer)();
  run(c, blobs(11, 200), 3, 1);
  check(`${c.name} converge`, c.converged && c.metrics.iteration < 100);
  check(`${c.name} mantiene 3 centroides`, c.centroids.length === 3);
}

console.log(failures === 0 ? '\nTodo correcto.' : `\n${failures} comprobaciones fallidas.`);
process.exit(failures === 0 ? 0 : 1);
