import { z } from 'zod';
import type { Client } from '../types';
import { extractJson } from './analyze';
import { WHATSAPP_SEQUENCE } from '../data/protocol';

// Rellenar la ficha a partir de la conversación previa por WhatsApp (capturas o texto), sin API:
// se copia el encargo para claude.ai y se pega aquí su respuesta.

const opt = <T extends [string, ...string[]]>(values: T) => z.enum(['', ...values] as unknown as [string, ...string[]]);

export const IntakeSchema = z.object({
  nombre: z.string(),
  telefono: z.string(),
  email: z.string(),
  edad: z.string(),
  peso: z.string().describe('kg'),
  talla: z.string().describe('cm'),
  ocupacion: z.string(),
  jornada: opt(['sentado', 'de-pie', 'mixto']),
  anosCorriendo: z.string(),
  kmSemana: z.string(),
  ritmo: z.string().describe('min/km'),
  terreno: opt(['asfalto', 'montana', 'mixto']),
  competicion: opt(['si', 'no']),
  objetivoCarrera: z.string().describe('Próxima carrera u objetivo concreto'),
  zapEntreno: z.string().describe('Zapatilla de entrenamiento (marca y modelo)'),
  zapEntrenoKm: z.string(),
  zapCompeticion: z.string(),
  zapExtra: z.string().describe('Otros pares que traerá a la sesión'),
  lesionesPasadas: z.string(),
  molestiasActuales: z.string(),
  plantillas: opt(['si', 'no', 'actualmente']),
  estudioPrevio: opt(['si', 'no']),
  estudioPrevioDonde: z.string(),
  porQueAhora: z.string(),
  expectativas: z.string(),
  objetivo: opt(['rendimiento', 'prevencion', 'lesion']),
  fuerza: opt(['regular', 'ocasional', 'no']),
  otrosDeportes: z.string(),
  horasSueno: z.string(),
  patologia: z.string(),
  origen: opt(['boca-a-boca', 'instagram', 'google', 'medico-fisio', 'otro']),
  recomendadoPor: z.string(),
});

export type Intake = z.infer<typeof IntakeSchema>;

const schemaText = (() => {
  const { $schema: _ignored, ...schema } = z.toJSONSchema(IntakeSchema);
  return JSON.stringify(schema);
})();

const questions = WHATSAPP_SEQUENCE.map((m) => m.text).join('\n\n');

export function buildIntakePrompt(chatText: string): string {
  return [
    'Soy del equipo de Stride Lab by Kalma (análisis biomecánico de carrera). Antes de la sesión mandamos al cliente estas preguntas por WhatsApp:',
    questions,
    chatText.trim()
      ? `Esta es la conversación con sus respuestas:\n${chatText.trim()}`
      : 'Te adjunto capturas de la conversación con sus respuestas.',
    `Rellena la ficha del cliente con lo que haya respondido. Reglas:
- Solo datos que el cliente haya dicho. Lo que no conste, déjalo como "" (no lo deduzcas).
- Números sin unidades (peso en kg, talla en cm, ritmo en min/km tipo "5:30").
- Respeta los valores permitidos de cada campo; si la respuesta no encaja en ninguno, "".
- Si contesta "a medias" (p. ej. "corro unos 30-40 km"), copia lo que dijo tal cual.`,
    `Responde SOLO con un bloque de código JSON que cumpla este esquema:\n${schemaText}`,
  ].join('\n\n');
}

/** Rellena los campos vacíos de la ficha con los de la respuesta. Devuelve la ficha y cuántos campos se han rellenado. */
export function applyIntake(client: Client, responseText: string): { client: Client; filled: number } {
  const parsed = IntakeSchema.safeParse(extractJson(responseText));
  if (!parsed.success) {
    const where = parsed.error.issues[0];
    throw new Error(`La respuesta no tiene el formato esperado${where ? ` (${where.path.join('.')})` : ''}. Pide a Claude que responda solo con el JSON.`);
  }
  const next = { ...client } as Record<string, string>;
  let filled = 0;
  for (const [k, v] of Object.entries(parsed.data)) {
    if (typeof v === 'string' && v.trim() && !String(next[k] ?? '').trim()) {
      next[k] = v.trim();
      filled++;
    }
  }
  return { client: next as unknown as Client, filled };
}
