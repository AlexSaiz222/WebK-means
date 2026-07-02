import type { Clusterer, Point } from '../algorithms/types.ts';

export interface EngineOptions {
  /** Notificado tras cada cambio de estado (paso, reinicio, play/pausa). */
  onChange: (clusterer: Clusterer, engine: Engine) => void;
  /** Milisegundos entre pasos en modo reproducir. */
  stepMs?: number;
}

/**
 * Bucle paso a paso / reproducir sobre un `Clusterer`. No sabe nada del
 * canvas: notifica cambios y la capa de arriba decide cómo dibujarlos.
 */
export class Engine {
  playing = false;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private readonly stepMs: number;

  constructor(
    readonly clusterer: Clusterer,
    private readonly options: EngineOptions,
  ) {
    this.stepMs = options.stepMs ?? 700;
  }

  private notify(): void {
    this.options.onChange(this.clusterer, this);
  }

  setData(points: Point[], k: number, seed: number): void {
    this.pause();
    this.clusterer.init(points, k, seed);
    this.notify();
  }

  /** Avanza una iteración; devuelve si quedan más. */
  step(): boolean {
    const more = this.clusterer.converged ? false : this.clusterer.step();
    if (!more && this.playing) this.stop();
    this.notify();
    return more;
  }

  play(): void {
    if (this.playing || this.clusterer.converged) return;
    this.playing = true;
    const loop = () => {
      if (!this.playing) return;
      if (this.step()) this.timer = setTimeout(loop, this.stepMs);
    };
    loop();
  }

  pause(): void {
    if (!this.playing) return;
    this.stop();
    this.notify();
  }

  toggle(): void {
    if (this.playing) this.pause();
    else this.play();
  }

  private stop(): void {
    this.playing = false;
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}
