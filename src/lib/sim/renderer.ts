import type { Point } from '../algorithms/types.ts';

export interface RenderState {
  points: readonly Point[];
  /** -1 = sin asignar (se dibuja neutro). */
  labels: readonly number[];
  centroids: readonly Point[];
  /** Si existe (Fuzzy), el color de cada punto es la mezcla de pertenencias. */
  memberships?: readonly number[][];
}

const FALLBACK_COLORS = ['#2D5BFF', '#FF7A3D', '#12B886', '#E64980', '#F2B705', '#7048E8'];

/** Dibujo extra sobre el lienzo (líneas de ayuda de las salas). */
export type OverlayFn = (
  ctx: CanvasRenderingContext2D,
  map: { x: (v: number) => number; y: (v: number) => number },
) => void;
const TWEEN_MS = 350;
/** easing de salida, aproximación de cubic-bezier(0.22, 1, 0.36, 1) */
const ease = (t: number) => 1 - Math.pow(1 - t, 3);

interface Rgb {
  r: number;
  g: number;
  b: number;
}

function hexToRgb(hex: string): Rgb {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

/**
 * Dibuja puntos y centroides sobre un canvas 2D, nítido en pantallas retina
 * (escala por devicePixelRatio) y con transición suave de centroides. Solo
 * repinta cuando cambia el estado; no hay bucle continuo.
 */
export class CanvasRenderer {
  private readonly ctx: CanvasRenderingContext2D;
  private readonly ro: ResizeObserver;
  private w = 0;
  private h = 0;
  private readonly pad = 20;
  private state: RenderState | null = null;
  /** posiciones de centroide actualmente dibujadas (animadas hacia el estado) */
  private shown: Point[] = [];
  private from: Point[] = [];
  private animStart = 0;
  private animId = 0;
  private colors: string[] = FALLBACK_COLORS;
  private colorsRgb: Rgb[] = FALLBACK_COLORS.map(hexToRgb);
  private neutral = '#6B6B6B';
  private overlay: OverlayFn | null = null;
  private readonly reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  constructor(private readonly canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d')!;
    this.readColors();
    this.resize();
    this.ro = new ResizeObserver(() => {
      this.resize();
      this.paint();
    });
    this.ro.observe(canvas);
  }

  private readColors(): void {
    const cs = getComputedStyle(this.canvas);
    this.colors = FALLBACK_COLORS.map(
      (fb, i) => cs.getPropertyValue(`--c${i + 1}`).trim() || fb,
    );
    this.colorsRgb = this.colors.map(hexToRgb);
    this.neutral = cs.getPropertyValue('--ink-soft').trim() || this.neutral;
  }

  private resize(): void {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.w = rect.width;
    this.h = rect.height;
    this.canvas.width = Math.round(rect.width * dpr);
    this.canvas.height = Math.round(rect.height * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  private toX(v: number): number {
    return this.pad + v * (this.w - 2 * this.pad);
  }

  private toY(v: number): number {
    return this.pad + v * (this.h - 2 * this.pad);
  }

  /** Coordenadas de datos [0,1]² del evento de puntero. */
  eventToData(ev: PointerEvent): Point {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: (ev.clientX - rect.left - this.pad) / (this.w - 2 * this.pad),
      y: (ev.clientY - rect.top - this.pad) / (this.h - 2 * this.pad),
    };
  }

  /** Convierte una tolerancia en píxeles a unidades de datos. */
  pxToData(px: number): number {
    return px / Math.max(1, this.w - 2 * this.pad);
  }

  /** Nuevo estado; los centroides se deslizan hacia su nueva posición. */
  setState(state: RenderState, animate = true): void {
    const prev = this.shown;
    this.state = state;
    if (
      !animate ||
      this.reducedMotion ||
      prev.length !== state.centroids.length
    ) {
      cancelAnimationFrame(this.animId);
      this.shown = state.centroids.map((c) => ({ ...c }));
      this.paint();
      return;
    }
    this.from = prev.map((c) => ({ ...c }));
    this.animStart = performance.now();
    cancelAnimationFrame(this.animId);
    this.tick();
  }

  private readonly tick = (): void => {
    if (!this.state) return;
    const t = Math.min(1, (performance.now() - this.animStart) / TWEEN_MS);
    const e = ease(t);
    this.shown = this.state.centroids.map((c, j) => {
      const f = this.from[j] ?? c;
      return { x: f.x + (c.x - f.x) * e, y: f.y + (c.y - f.y) * e };
    });
    this.paint();
    if (t < 1) this.animId = requestAnimationFrame(this.tick);
  };

  private pointColor(i: number): string {
    const s = this.state!;
    // Fuzzy: mezcla de los colores de clúster ponderada por pertenencias
    const row = s.memberships?.[i];
    if (row) {
      let r = 0;
      let g = 0;
      let b = 0;
      for (let j = 0; j < row.length; j++) {
        const c = this.colorsRgb[j % this.colorsRgb.length]!;
        r += row[j]! * c.r;
        g += row[j]! * c.g;
        b += row[j]! * c.b;
      }
      return `rgb(${Math.round(r)} ${Math.round(g)} ${Math.round(b)})`;
    }
    const l = s.labels[i] ?? -1;
    return l < 0 ? this.neutral : this.colors[l % this.colors.length]!;
  }

  private paint(): void {
    const { ctx } = this;
    ctx.clearRect(0, 0, this.w, this.h);
    if (!this.state) return;

    ctx.globalAlpha = 0.85;
    for (let i = 0; i < this.state.points.length; i++) {
      const p = this.state.points[i]!;
      ctx.beginPath();
      ctx.arc(this.toX(p.x), this.toY(p.y), 3.5, 0, Math.PI * 2);
      ctx.fillStyle = this.pointColor(i);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // centroides: círculo con borde de color y punto central
    for (let j = 0; j < this.shown.length; j++) {
      const c = this.shown[j]!;
      const x = this.toX(c.x);
      const y = this.toY(c.y);
      const color = this.colors[j % this.colors.length]!;
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = color;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x, y, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    }

    if (this.overlay) this.overlay(ctx, { x: (v) => this.toX(v), y: (v) => this.toY(v) });
  }

  setOverlay(fn: OverlayFn | null): void {
    this.overlay = fn;
    this.paint();
  }

  destroy(): void {
    this.ro.disconnect();
    cancelAnimationFrame(this.animId);
  }
}
