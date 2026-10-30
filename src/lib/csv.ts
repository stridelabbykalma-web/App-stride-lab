import type { G2Run } from '../types';

// Importación de datos del G2 (MotionMetrix / mmruns.com) pegando una tabla o CSV.
// Las columnas se reconocen por el nombre de la cabecera (español o inglés), así que sirve
// tanto para una exportación como para copiar la tabla del informe en una hoja de cálculo.

type Field = keyof Omit<G2Run, 'apuntes'>;

const MATCHERS: [Field, RegExp][] = [
  ['kmh', /(velocidad|speed|km\/?h)/i],
  ['tc', /(contact|contacto|\btc\b|gct)/i],
  ['cadencia', /(cadenc|cadence|spm|ppm)/i],
  ['simetria', /(simetr|symmetr|balance)/i],
  ['oscilacion', /(oscil|vertical)/i],
];

function splitLine(line: string, sep: string): string[] {
  return line.split(sep).map((c) => c.trim().replace(/^"|"$/g, ''));
}

function detectSeparator(header: string): string {
  if (header.includes('\t')) return '\t';
  if (header.includes(';')) return ';';
  return ',';
}

/** Extrae el primer número de una celda (admite coma decimal y unidades: "245 ms", "49,5 %"). */
const firstNumber = (cell: string) => cell.match(/-?\d+(?:[.,]\d+)?/)?.[0]?.replace(',', '.') ?? '';

export interface ParseResult {
  runs: Partial<G2Run>[];
  mapped: Field[];
}

export function parseG2Table(text: string): ParseResult {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return { runs: [], mapped: [] };
  const sep = detectSeparator(lines[0]);
  const header = splitLine(lines[0], sep);

  const colFor = new Map<Field, number>();
  header.forEach((h, i) => {
    const match = MATCHERS.find(([field, re]) => !colFor.has(field) && re.test(h));
    if (match) colFor.set(match[0], i);
  });

  const runs = lines.slice(1).map((line) => {
    const cells = splitLine(line, sep);
    const run: Partial<G2Run> = {};
    for (const [field, idx] of colFor) {
      const v = firstNumber(cells[idx] ?? '');
      if (v) run[field] = v;
    }
    return run;
  });

  return { runs: runs.filter((r) => Object.keys(r).length > 0), mapped: [...colFor.keys()] };
}
