import type { Shoe } from '../types';
import { SPEEDS, type SpeedId } from '../data/protocol';

// Criterio de la guía de timing: gana la zapatilla con TC más bajo, mejor simetría
// y oscilación vertical más estable. Se comparan solo velocidades medidas en todas las zapatillas,
// para que una zapatilla sin V3 no salga beneficiada o penalizada.

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

/** Velocidades con TC registrado en todas las zapatillas que tienen algún dato. */
export function commonSpeeds(shoes: Shoe[]): SpeedId[] {
  const withData = shoes.filter((s) => SPEEDS.some((sp) => num(s.runs[sp.id].tc) !== null));
  if (!withData.length) return [];
  return SPEEDS.map((s) => s.id).filter((id) => withData.every((s) => num(s.runs[id].tc) !== null));
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

/**
 * Puntúa cada zapatilla de 0 a 100 (más es mejor) normalizando cada métrica entre zapatillas.
 * Devuelve la lista ordenada de mejor a peor. Si una métrica falta en alguna zapatilla se ignora para todas.
 */
export function rankShoes(shoes: Shoe[]): ShoeScore[] {
  const speeds = commonSpeeds(shoes);
  if (!speeds.length) return [];
  const avgs = shoes.map((s) => averages(s, speeds)).filter((a) => a.tc !== null);
  if (!avgs.length) return [];

  type Metric = keyof typeof WEIGHTS;
  const get = (x: ShoeAverages, m: Metric) => (m === 'simetria' ? x.asimetria : x[m]);
  const metrics = (Object.keys(WEIGHTS) as Metric[]).filter((m) => avgs.every((a) => get(a, m) !== null));
  const totalWeight = metrics.reduce((acc, m) => acc + WEIGHTS[m], 0);

  const scored = avgs.map((a) => {
    let score = 0;
    for (const m of metrics) {
      const values = avgs.map((x) => get(x, m) as number);
      const min = Math.min(...values);
      const max = Math.max(...values);
      // menor es mejor en las tres métricas
      const norm = max === min ? 1 : (max - (get(a, m) as number)) / (max - min);
      score += norm * WEIGHTS[m];
    }
    return { ...a, score: Math.round((score / totalWeight) * 100) };
  });

  return scored.sort((x, y) => y.score - x.score || (x.tc ?? 0) - (y.tc ?? 0));
}
