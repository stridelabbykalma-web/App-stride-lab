import type { Shoe } from '../types';
import { SPEEDS } from '../data/protocol';
import { newShoe } from '../storage';

// Lectura del JSON de un informe compartido de MotionMetrix G2 (shared.mmruns.com).
// Los campos TT* son los que muestra el informe web (medias del tramo analizado).

type Metric = { ComboVal: number; LeftVal: number; RightVal: number; Rating: number };
type RawRun = Record<string, unknown> & { Shoe?: string };
export interface RawReport {
  report_id: string;
  name?: string;
  created_at?: string;
  runs: RawRun[];
}

export interface G2RunData {
  n: number;
  shoe: string;
  speedKmh: number;
  cadence: number;
  contactMs: number;
  contactL: number;
  contactR: number;
  /** % del tiempo de contacto del pie izquierdo sobre el total (50 = simétrico). */
  balanceL: number;
  overstrideCm: number;
  verticalDispCm: number;
  verticalForceBW: number;
  loadingRateBWps: number;
  /** Puntuaciones 0-10 de la sección «Shoes' performance». */
  energyReturn: number;
  shockAbsorption: number;
  strideConsistency: number;
  kneeAlignL: number;
  kneeAlignR: number;
  rearfootL: number;
  rearfootR: number;
  hipExtensionL: number;
  hipExtensionR: number;
  kneeFlexTouchdownL: number;
  kneeFlexTouchdownR: number;
  stepSeparationCm: number;
  runnerProfile: { type: string; pct: number }[];
}

export interface G2Report {
  code: string;
  name: string;
  date: string;
  runs: G2RunData[];
}

/** Extrae el código del enlace compartido (…index.php?r=CÓDIGO) o acepta el código tal cual. */
export function reportCode(input: string): string | null {
  const s = input.trim();
  const fromUrl = s.match(/[?&]r=([A-Za-z0-9]+)/)?.[1];
  const code = (fromUrl ?? s).toUpperCase();
  return /^[A-Z0-9]{8,40}$/.test(code) ? code : null;
}

const m = (run: RawRun, key: string): Metric => {
  const v = run[key] as Metric | undefined;
  return v && typeof v === 'object' ? v : { ComboVal: 0, LeftVal: 0, RightVal: 0, Rating: 0 };
};

/** "ADIDAS_ ADIOS PRO 4" → "Adidas Adios Pro 4" */
export function shoeName(raw = ''): string {
  return raw
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
    .replace(/(^|\s)\S/g, (c) => c.toUpperCase());
}

const round = (x: number, d = 1) => Math.round(x * 10 ** d) / 10 ** d;

export function parseReport(raw: RawReport): G2Report {
  const runs = raw.runs.map((run, i): G2RunData => {
    const tc = m(run, 'TTContactTime_ms');
    const types = (run.RunnerTypes as string[] | undefined) ?? [];
    const fractions = (run.RunnerTypeFractions as number[] | undefined) ?? [];
    return {
      n: i + 1,
      shoe: shoeName(run.Shoe),
      speedKmh: m(run, 'SetSpeed_kph').ComboVal || m(run, 'RunSpeed_kph').ComboVal,
      // TTStepRate_spm va en zancadas/min: el informe muestra el doble (pasos/min)
      cadence: round(m(run, 'TTStepRate_spm').ComboVal * 2),
      contactMs: Math.round(tc.ComboVal),
      contactL: Math.round(tc.LeftVal),
      contactR: Math.round(tc.RightVal),
      balanceL: tc.LeftVal + tc.RightVal ? round((tc.LeftVal / (tc.LeftVal + tc.RightVal)) * 100) : 50,
      overstrideCm: round(m(run, 'TTOverStride_cm').ComboVal),
      verticalDispCm: round(m(run, 'TTVerticalDisp_cm').ComboVal),
      verticalForceBW: round(m(run, 'TTVerticalForce_BW').ComboVal, 2),
      loadingRateBWps: round(m(run, 'TTLoadingRate_BWps').ComboVal),
      energyReturn: round(m(run, 'EnergyReturn').Rating, 2),
      shockAbsorption: round(m(run, 'ShockAbsorption').Rating, 2),
      strideConsistency: round(m(run, 'StrideRepeatability').Rating, 2),
      kneeAlignL: round(m(run, 'KneeAlignment_deg').LeftVal),
      kneeAlignR: round(m(run, 'KneeAlignment_deg').RightVal),
      rearfootL: round(m(run, 'RearfootRotation_deg').LeftVal),
      rearfootR: round(m(run, 'RearfootRotation_deg').RightVal),
      hipExtensionL: round(m(run, 'HipExtention_deg').LeftVal),
      hipExtensionR: round(m(run, 'HipExtention_deg').RightVal),
      kneeFlexTouchdownL: round(m(run, 'KneeFlexion_TD_deg').LeftVal),
      kneeFlexTouchdownR: round(m(run, 'KneeFlexion_TD_deg').RightVal),
      stepSeparationCm: round(m(run, 'StepSeparation_m').ComboVal * 100),
      runnerProfile: types
        .map((type, j) => ({ type, pct: Math.round((fractions[j] ?? 0) * 100) }))
        .sort((a, b) => b.pct - a.pct)
        .slice(0, 2),
    };
  });
  return { code: raw.report_id, name: raw.name ?? '', date: (raw.created_at ?? '').slice(0, 10), runs };
}

export async function loadReport(input: string): Promise<G2Report> {
  const code = reportCode(input);
  if (!code) throw new Error('Pega el enlace compartido del informe (shared.mmruns.com/…?r=CÓDIGO).');
  const res = await fetch(`./api/mmruns?r=${code}`);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error ?? `No se ha podido cargar el informe (${res.status}).`);
  return parseReport(body as RawReport);
}

/** Agrupa las pasadas por zapatilla y las coloca en V1/V2/V3 por orden de velocidad. */
export function reportToShoes(report: G2Report): Shoe[] {
  const byShoe = new Map<string, G2RunData[]>();
  for (const r of report.runs) byShoe.set(r.shoe, [...(byShoe.get(r.shoe) ?? []), r]);
  const allSpeeds = [...new Set(report.runs.map((r) => r.speedKmh))].sort((a, b) => a - b).slice(0, SPEEDS.length);

  return [...byShoe].map(([name, runs]) => {
    const shoe = newShoe(name);
    for (const r of runs) {
      const idx = allSpeeds.indexOf(r.speedKmh);
      if (idx < 0) continue;
      shoe.runs[SPEEDS[idx].id] = {
        kmh: String(r.speedKmh),
        tc: String(r.contactMs),
        cadencia: String(r.cadence),
        simetria: String(r.balanceL),
        oscilacion: String(r.verticalDispCm),
        apuntes: `Overstride ${r.overstrideCm} cm · ER ${r.energyReturn} · SA ${r.shockAbsorption} · SC ${r.strideConsistency}`,
      };
    }
    return shoe;
  });
}

/** Resumen en texto del informe para que Claude prepare el guion. */
export function reportToText(report: G2Report): string {
  const lines = [
    `Informe MotionMetrix G2 (datos exactos de la API del informe compartido). Fecha: ${report.date}. ${report.runs.length} pasadas.`,
    'Unidades: cadencia en pasos/min; tiempo de contacto en ms (L/R = izquierda/derecha); balance = % del contacto en el pie izquierdo (50 = simétrico); overstride en cm; desplazamiento vertical en cm; fuerza vertical en pesos corporales; loading rate en pesos corporales/s; Energy return, Shock absorption y Stride consistency son puntuaciones 0-10 de la zapatilla (más alto = mejor); alineación de rodilla en grados (negativo = valgo); rotación de retropié en grados (positivo = pronación); separación de pasos en cm.',
  ];
  for (const r of report.runs) {
    lines.push(
      `Pasada ${r.n} · ${r.shoe} · ${r.speedKmh} km/h: cadencia ${r.cadence}; contacto ${r.contactMs} ms (L ${r.contactL} / R ${r.contactR}, balance ${r.balanceL}% izq.); overstride ${r.overstrideCm} cm; desplazamiento vertical ${r.verticalDispCm} cm; fuerza vertical ${r.verticalForceBW} BW; loading rate ${r.loadingRateBWps} BW/s; energy return ${r.energyReturn}/10, shock absorption ${r.shockAbsorption}/10, stride consistency ${r.strideConsistency}/10; rodilla L ${r.kneeAlignL}° R ${r.kneeAlignR}°; retropié L ${r.rearfootL}° R ${r.rearfootR}°; extensión cadera L ${r.hipExtensionL}° R ${r.hipExtensionR}°; flexión rodilla al contacto L ${r.kneeFlexTouchdownL}° R ${r.kneeFlexTouchdownR}°; separación de pasos ${r.stepSeparationCm} cm; perfil: ${r.runnerProfile.map((p) => `${p.type} ${p.pct}%`).join(', ')}.`,
    );
  }
  lines.push('Para comparar zapatillas, compara solo pasadas a la misma velocidad.');
  return lines.join('\n');
}
