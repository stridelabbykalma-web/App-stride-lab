import type { Shoe } from '../types';
import { SPEEDS, type SpeedId } from '../data/protocol';

// Criterio de la guía de timing: gana la zapatilla con TC más bajo, mejor simetría
// y oscilación vertical más estable. Solo se comparan zapatillas a la misma velocidad: en cada
// velocidad medida por 2 o más zapatillas se puntúan entre sí, y la nota de cada zapatilla es la
// media de sus velocidades comparables. Así sirve aunque no todas se prueben a todas las velocidades.

export const WEIGHTS = { tc: 0.5, simetria: 0.3, oscilacion: 0.2 } as const;

export const num = (v: string): number | null => {
  const n = parseFloat(v.replace(',', '.'));
  return Number.isFinite(n) ? n : null;
};

export interface ShoeAverages {
  shoeId: string;
  tc: number | null;
  cadencia: number | null;
  /** Desviación media respecto al 50/50 (puntos %). 0 = perfecto. */
  asimetria: number | null;
  oscilacion: number | null;
}

export interface ShoeScore extends ShoeAverages {
  score: number;
}

const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

const hasTc = (s: Shoe, id: SpeedId) => num(s.runs[id].tc) !== null;

/** Velocidades medidas (con TC) en al menos dos zapatillas: las únicas en las que se puede comparar. */
export function commonSpeeds(shoes: Shoe[]): SpeedId[] {
  return SPEEDS.map((s) => s.id).filter((id) => shoes.filter((s) => hasTc(s, id)).length >= 2);
}

export function averages(shoe: Shoe, speeds: SpeedId[]): ShoeAverages {
  const pick = (f: (r: Shoe['runs'][SpeedId]) => number | null) =>
    mean(speeds.map((id) => f(shoe.runs[id])).filter((x): x is number => x !== null));
  return {
    shoeId: shoe.id,
    tc: pick((r) => num(r.tc)),
    cadencia: pick((r) => num(r.cadencia)),
    asimetria: pick((r) => {
      const s = num(r.simetria);
      return s === null ? null : Math.abs(s - 50);
    }),
    oscilacion: pick((r) => num(r.oscilacion)),
  };
}

type Metric = keyof typeof WEIGHTS;
const metricOf = (x: ShoeAverages, m: Metric) => (m === 'simetria' ? x.asimetria : x[m]);

/** Puntuación 0-1 de cada zapatilla frente a las demás medidas a una misma velocidad. */
function scoreAtSpeed(shoes: Shoe[], id: SpeedId): Map<string, number> {
  const avgs = shoes.filter((s) => hasTc(s, id)).map((s) => averages(s, [id]));
  const metrics = (Object.keys(WEIGHTS) as Metric[]).filter((m) => avgs.every((a) => metricOf(a, m) !== null));
  const totalWeight = metrics.reduce((acc, m) => acc + WEIGHTS[m], 0);
  const out = new Map<string, number>();
  for (const a of avgs) {
    let score = 0;
    for (const m of metrics) {
      const values = avgs.map((x) => metricOf(x, m) as number);
      const min = Math.min(...values);
      const max = Math.max(...values);
      // menor es mejor en las tres métricas
      score += (max === min ? 1 : (max - (metricOf(a, m) as number)) / (max - min)) * WEIGHTS[m];
    }
    out.set(a.shoeId, score / totalWeight);
  }
  return out;
}

export interface ShoeScoreDetail extends ShoeScore {
  /** Velocidades en las que se ha podido comparar esta zapatilla. */
  speeds: SpeedId[];
}

/**
 * Puntúa cada zapatilla de 0 a 100 (más es mejor) y devuelve la lista de mejor a peor.
 * Las medias de TC, cadencia, etc. son de las velocidades comparables de cada zapatilla.
 */
export function rankShoes(shoes: Shoe[]): ShoeScoreDetail[] {
  const speeds = commonSpeeds(shoes);
  const perSpeed = new Map(speeds.map((id) => [id, scoreAtSpeed(shoes, id)]));
  return shoes
    .map((shoe) => {
      const own = speeds.filter((id) => perSpeed.get(id)!.has(shoe.id));
      if (!own.length) return null;
      const score = own.reduce((acc, id) => acc + perSpeed.get(id)!.get(shoe.id)!, 0) / own.length;
      return { ...averages(shoe, own), score: Math.round(score * 100), speeds: own };
    })
    .filter((x): x is ShoeScoreDetail => x !== null)
    .sort((x, y) => y.score - x.score || (x.tc ?? 0) - (y.tc ?? 0));
}
