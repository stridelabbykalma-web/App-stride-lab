import Anthropic from '@anthropic-ai/sdk';
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';
import { z } from 'zod';
import { PROBLEMS } from '../data/problems';
import { FINDING_TO_G2 } from '../data/tests';
import { ShoeSpecSchema, type ShoeSpec } from './shoeSpecs';

// Lee capturas del informe MotionMetrix G2 con Claude y devuelve el guion de qué decirle al cliente.
// La llamada sale directamente del navegador con la clave de API guardada en este dispositivo.

const KEY_STORAGE = 'stridelab.anthropicKey';

export const getApiKey = () => {
  try {
    return localStorage.getItem(KEY_STORAGE) ?? '';
  } catch {
    return '';
  }
};

export const setApiKey = (k: string) => {
  try {
    if (k) localStorage.setItem(KEY_STORAGE, k);
    else localStorage.removeItem(KEY_STORAGE);
  } catch {
    // sin almacenamiento: la clave solo dura esta sesión
  }
};

// Ejercicio en directo: algo simple que el cliente hace en la cinta y nota en el momento.
const LiveExercise = z.object({
  nombre: z.string(),
  como: z.string().describe('Qué hace el cliente en la cinta, en 1-2 frases: duración (20-30"), si se para la cinta o no.'),
  cue: z.string().describe('La frase-imagen corta que se le dice mientras corre.'),
  que_notara: z.string().describe('La sensación que debe notar para tomar consciencia del cambio.'),
  dato_a_vigilar: z.string().describe('Qué valor del G2 debería moverse y hacia dónde (p. ej. "cadencia de 156 a ~165 ppm").'),
});

export const AnalysisSchema = z.object({
  resumen: z.string().describe('2-3 frases para el profesional: qué muestra el informe en conjunto.'),
  metricas: z.array(
    z.object({
      nombre: z.string(),
      valor: z.string().describe('Valor con unidad, tal cual del informe.'),
      contexto: z.string().describe('Zapatilla, velocidad o lado al que corresponde, si aplica. Vacío si no.'),
      valoracion: z.enum(['bien', 'mejorable', 'a_trabajar', 'sin_referencia']),
    }),
  ),
  problemas: z.array(
    z.object({
      problema: z.string().describe('Nombre corto del patrón a mejorar.'),
      problema_id: z.string().describe('Id de la guía de ejemplo (01-15) si coincide, o vacío.'),
      evidencia: z.string().describe('Qué dato del informe lo indica.'),
    }),
  ),
  perfil_zapatilla: z.object({
    conclusion: z.string().describe('Qué tipo de zapatilla le funciona mejor, en una frase para el profesional.'),
    caracteristicas: z.array(z.string()).describe('Rasgos concretos, p. ej. "Drop 6-8 mm", "Amortiguación media-firme", "Con placa solo para ritmos rápidos".'),
    evidencia: z.string().describe('Qué comparación de datos (a la misma velocidad) y de fichas lo apoya, y cuánta confianza da.'),
  }),
  guion: z.object({
    apertura: z.string().describe('Primera frase para el cliente, positiva y concreta.'),
    zapatilla: z.string().describe('Qué decirle sobre la zapatilla y el tipo de zapatilla que le va. Vacío si no aplica.'),
    puntos: z.array(
      z.object({
        titulo: z.string(),
        dato: z.string().describe('El número del informe en el que se apoya.'),
        que_significa: z.string().describe('Explicación sencilla para el corredor, sin jerga.'),
        que_le_dices: z.string().describe('Frase literal para decirle en voz alta, tuteando.'),
        problema_id: z.string().describe('Id de la guía de ejemplo (01-15) si coincide, o vacío.'),
        ejercicio: LiveExercise,
      }),
    ),
    cierre: z.string().describe('Frase de cierre: "Lo más importante que te llevas hoy es: zapatilla X, trabajar Y, y Z."'),
  }),
  hallazgos_mensaje: z.array(z.string()).describe('Exactamente 3 líneas cortas para el WhatsApp post-sesión.'),
  avisos: z.array(z.string()).describe('Datos dudosos o señales para derivar a fisioterapia. Vacío si nada.'),
});

export type Analysis = z.infer<typeof AnalysisSchema>;
export type LiveExerciseT = z.infer<typeof LiveExercise>;

const guideText = PROBLEMS.map(
  (p) =>
    `${p.id} ${p.name}\n` +
    p.exercises.map((e) => `  ${e.id} ${e.name}: ${e.how} — cue: "${e.cue}" — por qué: ${e.why}`).join('\n'),
).join('\n');

const findingsText = FINDING_TO_G2.map((f) => `- ${f.finding} → ${f.g2}`).join('\n');

// Prompt estable (se cachea): no meter aquí nada que cambie entre sesiones.
const SYSTEM = `Trabajas con el equipo de Stride Lab by Kalma (Cassà de la Selva, Girona), un centro de análisis biomecánico de carrera que usa el sistema MotionMetrix G2 en cinta (informes en mmruns.com).

Te pasan los datos del informe del G2 de un cliente (valores exactos del informe y/o capturas), a menudo las fichas técnicas de las zapatillas probadas y, a veces, contexto de la sesión (ficha, tests clínicos, notas). Preparas lo que el profesional va a trabajar y decir en la sesión.

Cómo leer el informe:
- Usa solo los valores que te pasan o se ven en las capturas. Si algo es dudoso (p. ej. peso y talla intercambiados), dilo en "avisos" en vez de inventar.
- Si hay rangos de referencia o colores, básate en ellos. Si no, marca "sin_referencia" salvo que el dato sea claramente bueno o malo para un corredor popular (p. ej. cadencia habitual 165-180 ppm).
- En Stride Lab cada zapatilla se prueba a velocidades distintas: compara zapatillas solo a la misma velocidad.

Qué tipo de zapatilla le funciona ("perfil_zapatilla"):
- Cruza el rendimiento a la misma velocidad (tiempo de contacto, balance izquierda/derecha, oscilación vertical, overstride, loading rate y las puntuaciones energy return / shock absorption / stride consistency) con las fichas técnicas (drop, stack, firmeza, reactividad, placa, peso, rocker).
- Concluye qué rasgos le sientan mejor (p. ej. "con drop bajo acorta el overstride", "con espuma firme baja el tiempo de contacto") y cuáles no. Con pocas pasadas es una tendencia: dilo en "evidencia".
- Si falta ficha de alguna zapatilla, razona con lo que haya y menciónalo.

Ejercicios en directo (lo más importante):
- Para cada punto propón UN ejercicio sencillo que el cliente pueda hacer en la cinta en ese momento (20-30", o un drill de 10-20" fuera de la cinta y subir directo) y NOTE enseguida: una imagen mental, un foco de atención, un apoyo externo (metrónomo, inclinación 1-2%, mirada) o un contraste exagerar/corregir.
- Debe generar una sensación clara para que tome consciencia de lo que hace ("que_notara") y un cambio visible en el G2 ("dato_a_vigilar"), para enseñárselo en pantalla.
- Nada de ejercicios de fuerza, de casa ni de varias semanas: eso va al informe de valoración posterior.
- La guía de abajo es un EJEMPLO del estilo y del nivel de sencillez. Si el problema está en la guía, puedes usar su ejercicio y su cue tal cual; si no, crea uno nuevo con el mismo estilo.

Cómo preparar el guion:
- Máximo 3 puntos clave. Elige los de más impacto que se puedan notar hoy.
- Habla al cliente de tú, en castellano cercano, frases cortas, sin jerga (o explicada en una frase). Primero lo que hace bien.
- Si te pasan tests clínicos alterados, relaciónalos con el dato del G2.
- No diagnostiques lesiones ni prometas resultados. Lo que sugiera dolor o patología va a "avisos" para el fisio.
- "hallazgos_mensaje": 3 líneas muy cortas, estilo "TC alto — cue brasas calientes", "Ligera asimetría pierna izquierda", "Cadencia — objetivo 165 ppm".

Guía de ejemplo de Stride Lab — problemas y ejercicios en cinta:
${guideText}

Relación hallazgo clínico → reflejo en el G2:
${findingsText}`;

// ---- Sin API: se copia el encargo para pegarlo en claude.ai y se pega aquí la respuesta ----

export const ManualResponseSchema = AnalysisSchema.extend({
  fichas: z.array(ShoeSpecSchema).describe('Ficha técnica de cada zapatilla probada.'),
});

const jsonSchemaText = (() => {
  const { $schema: _ignored, ...schema } = z.toJSONSchema(ManualResponseSchema);
  return JSON.stringify(schema);
})();

/** Texto completo para pegar en claude.ai: instrucciones de Stride Lab, datos y formato de respuesta. */
export function buildManualPrompt(sessionContext: string, reportData: string, models: string[]): string {
  return [
    SYSTEM,
    `Fichas de zapatillas: busca en internet (RunRepeat, web de la marca, Running Warehouse, Believe in the Run, Doctors of Running) la ficha técnica de cada zapatilla probada${
      models.length ? ` (${models.join('; ')})` : ''
    }: drop, stack de talón y antepié, peso, amortiguación (firme <20 HA blanda, 20-28 media, >28 firme), reactividad, placa, estabilidad, rocker y espuma. Si no encuentras un dato, déjalo a null. En "modelo" escribe el nombre exactamente como aparece en los datos. Úsalas para "perfil_zapatilla".`,
    reportData && `Datos del informe:\n${reportData}`,
    sessionContext.trim() && `Contexto de la sesión:\n${sessionContext}`,
    'Si te adjunto capturas del informe, léelas también.',
    `Responde SOLO con un bloque de código JSON que cumpla este esquema (sin texto antes ni después):\n${jsonSchemaText}`,
  ]
    .filter(Boolean)
    .join('\n\n');
}

/** Saca el JSON de una respuesta pegada de claude.ai (bloque ```json o JSON suelto con texto alrededor). */
export function extractJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/)?.[1];
  const raw = fenced ?? text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1);
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error('No encuentro el JSON en la respuesta. Copia la respuesta completa de Claude.');
  }
}

/** Lee la respuesta pegada de claude.ai (admite el bloque ```json o el JSON suelto). */
export function parseManualResponse(text: string): { analysis: Analysis; fichas: ShoeSpec[] } {
  const data = extractJson(text);
  const full = ManualResponseSchema.safeParse(data);
  if (full.success) {
    const { fichas, ...analysis } = full.data;
    return { analysis, fichas };
  }
  const onlyAnalysis = AnalysisSchema.safeParse(data);
  if (onlyAnalysis.success) return { analysis: onlyAnalysis.data, fichas: [] };
  const where = full.error.issues[0];
  throw new Error(`La respuesta no tiene el formato esperado${where ? ` (${where.path.join('.')}: ${where.message})` : ''}. Pide a Claude que responda solo con el JSON.`);
}

export interface ImageInput {
  mediaType: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif';
  base64: string;
}

export async function analyzeReport(apiKey: string, images: ImageInput[], sessionContext: string, reportData = ''): Promise<Analysis> {
  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });

  const response = await client.beta.messages.parse({
    model: 'claude-opus-5-5',
    max_tokens: 16000,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    output_config: { effort: 'high', format: betaZodOutputFormat(AnalysisSchema) },
    system: [{ type: 'text', text: SYSTEM, cache_control: { type: 'ephemeral' } }],
    messages: [
      {
        role: 'user',
        content: [
          ...images.map((img) => ({
            type: 'image' as const,
            source: { type: 'base64' as const, media_type: img.mediaType, data: img.base64 },
          })),
          {
            type: 'text',
            text: [
              reportData && `Datos del informe:\n${reportData}`,
              sessionContext.trim() && `Contexto de la sesión:\n${sessionContext}`,
              images.length ? 'Lee las capturas del informe G2 y prepara el guion.' : 'Prepara el guion a partir de los datos del informe.',
            ]
              .filter(Boolean)
              .join('\n\n'),
          },
        ],
      },
    ],
  });

  if (response.stop_reason === 'refusal') throw new Error('El modelo no ha podido procesar estas capturas.');
  if (response.stop_reason === 'max_tokens') throw new Error('La respuesta se ha cortado. Prueba con menos capturas.');
  if (!response.parsed_output) throw new Error('No se ha podido interpretar la respuesta.');
  return response.parsed_output;
}

/** Reduce la imagen a un tamaño que el modelo lee bien (lado largo ≤ 1568 px) y la pasa a JPEG base64. */
export async function prepareImage(file: Blob): Promise<ImageInput & { preview: string }> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1568 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
  return { mediaType: 'image/jpeg', base64: dataUrl.split(',')[1], preview: dataUrl };
}

export function describeError(e: unknown): string {
  if (e instanceof Anthropic.AuthenticationError) return 'La clave de API no es válida.';
  if (e instanceof Anthropic.PermissionDeniedError) return 'La clave de API no tiene permiso para este modelo.';
  if (e instanceof Anthropic.RateLimitError) return 'Demasiadas peticiones seguidas. Espera un minuto y vuelve a probar.';
  if (e instanceof Anthropic.BadRequestError) return `Petición rechazada: ${e.message}`;
  if (e instanceof Anthropic.APIConnectionError) return 'Sin conexión con el servicio. Revisa internet.';
  if (e instanceof Anthropic.APIError) return `Error del servicio (${e.status}).`;
  return e instanceof Error ? e.message : 'Error desconocido.';
}
