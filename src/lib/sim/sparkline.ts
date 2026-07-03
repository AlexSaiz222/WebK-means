/**
 * Sparkline de la evolución de una métrica (la inercia) a lo largo del
 * historial de fotogramas de una sala, con un marcador en el fotograma actual.
 * Se repinta solo cuando la sala llama a display(); no hay bucle propio.
 */
export interface SparkTheme {
  accent: string;
  soft: string;
}

export function drawSparkline(
  canvas: HTMLCanvasElement,
  values: readonly number[],
  currentIndex: number,
  theme: SparkTheme,
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const rect = canvas.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return; // oculto: nada que pintar
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(rect.width * dpr);
  canvas.height = Math.round(rect.height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const w = rect.width;
  const h = rect.height;
  const pad = 5;
  ctx.clearRect(0, 0, w, h);

  // solo los valores finitos (el fotograma inicial suele ser NaN)
  const pts: Array<{ i: number; v: number }> = [];
  for (let i = 0; i < values.length; i++) {
    const v = values[i]!;
    if (Number.isFinite(v)) pts.push({ i, v });
  }
  if (pts.length === 0) return;

  let min = Infinity;
  let max = -Infinity;
  for (const p of pts) {
    if (p.v < min) min = p.v;
    if (p.v > max) max = p.v;
  }
  const span = max - min || 1;
  const n = values.length;
  const x = (i: number) => (n > 1 ? pad + (i / (n - 1)) * (w - 2 * pad) : w / 2);
  const y = (v: number) => h - pad - ((v - min) / span) * (h - 2 * pad);

  // línea base del mínimo alcanzado
  ctx.strokeStyle = theme.soft;
  ctx.globalAlpha = 0.35;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(pad, y(min) + 0.5);
  ctx.lineTo(w - pad, y(min) + 0.5);
  ctx.stroke();
  ctx.globalAlpha = 1;

  ctx.strokeStyle = theme.accent;
  ctx.lineWidth = 1.6;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  pts.forEach((p, idx) => {
    if (idx === 0) ctx.moveTo(x(p.i), y(p.v));
    else ctx.lineTo(x(p.i), y(p.v));
  });
  ctx.stroke();

  // marcador: último valor finito hasta el fotograma actual
  let m: { i: number; v: number } | null = null;
  for (const p of pts) {
    if (p.i > currentIndex) break;
    m = p;
  }
  if (m) {
    ctx.beginPath();
    ctx.arc(x(m.i), y(m.v), 3.5, 0, Math.PI * 2);
    ctx.fillStyle = theme.accent;
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#FFFFFF';
    ctx.stroke();
  }
}
