import Anthropic from '@anthropic-ai/sdk';
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';
import { z } from 'zod';
import { PROBLEMS } from '../data/problems';
import { FINDING_TO_G2 } from '../data/tests';

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

const PROBLEM_IDS = PROBLEMS.map((p) => p.id) as [string, ...string[]];

export const AnalysisSchema = z.object({
  resumen: z.string().describe('2-3 frases para el profesional: qué muestra el informe en conjunto.'),
  metricas: z.array(
    z.object({
      nombre: z.string(),
      valor: z.string().describe('Valor tal cual aparece en la captura, con unidad.'),
      contexto: z.string().describe('Zapatilla, velocidad o lado al que corresponde, si se ve. Vacío si no.'),
      valoracion: z.enum(['bien', 'mejorable', 'a_trabajar', 'sin_referencia']),
    }),
  ),
  problemas: z.array(
    z.object({
      problema_id: z.enum(PROBLEM_IDS),
      evidencia: z.string().describe('Qué dato o imagen del informe lo indica.'),
    }),
  ),
  guion: z.object({
    apertura: z.string().describe('Primera frase para el cliente, positiva y concreta.'),
    zapatilla: z.string().describe('Qué decirle sobre la zapatilla, si el informe compara zapatillas. Vacío si no aplica.'),
    puntos: z.array(
      z.object({
        titulo: z.string(),
        dato: z.string().describe('El número del informe en el que se apoya.'),
        que_significa: z.string().describe('Explicación sencilla para el corredor, sin jerga.'),
        que_le_dices: z.string().describe('Frase literal para decirle en voz alta, tuteando.'),
        problema_id: z.string().describe('Id de la guía (01-15) si aplica, o vacío.'),
        ejercicio_id: z.string().describe('E01, E02 o E03 de ese problema, o vacío.'),
        cue: z.string().describe('Cue de la guía para trabajarlo, o vacío.'),
      }),
    ),
    cierre: z.string().describe('Frase de cierre: "Lo más importante que te llevas hoy es: zapatilla X, trabajar Y, y Z."'),
  }),
  hallazgos_mensaje: z.array(z.string()).describe('Exactamente 3 líneas cortas para el WhatsApp post-sesión.'),
  avisos: z.array(z.string()).describe('Datos ilegibles, dudas o señales para derivar a fisioterapia. Vacío si nada.'),
});

export type Analysis = z.infer<typeof AnalysisSchema>;

const guideText = PROBLEMS.map(
  (p) => `${p.id} ${p.name}\n` + p.exercises.map((e) => `  ${e.id} ${e.name} — cue: "${e.cue}" — por qué: ${e.why}`).join('\n'),
).join('\n');

const findingsText = FINDING_TO_G2.map((f) => `- ${f.finding} → ${f.g2}`).join('\n');

// Prompt estable (se cachea): no meter aquí nada que cambie entre sesiones.
const SYSTEM = `Trabajas con el equipo de Stride Lab by Kalma (Cassà de la Selva, Girona), un centro de análisis biomecánico de carrera que usa el sistema MotionMetrix G2 en cinta (informes en mmruns.com).

Te pasan capturas del informe del G2 de un cliente y, a veces, contexto de la sesión (ficha, tests clínicos, datos anotados). Tu trabajo es leer el informe y preparar lo que el profesional le va a decir al cliente al terminar.

Cómo leer el informe:
- Usa solo los valores que se ven en las capturas. Si algo no se lee bien, dilo en "avisos" en vez de inventarlo.
- Si el informe trae rangos de referencia, colores o marcas (verde/amarillo/rojo), básate en ellos para la valoración. Si no hay referencia, marca "sin_referencia" salvo que el dato sea claramente bueno o malo para un corredor popular (p. ej. cadencia objetivo habitual 170-180 ppm).
- Métricas típicas: tiempo de contacto (TC, ms), cadencia (ppm), simetría/balance izquierda-derecha, oscilación vertical (cm), longitud de zancada, tiempo de vuelo, ángulos de rodilla/cadera/tronco, pisada.
- Si hay varias zapatillas, la mejor es la de TC más bajo, mejor simetría y oscilación vertical más estable.

Cómo preparar el guion:
- Máximo 3 puntos clave. Más no los recuerda. Elige los que más impacto tienen y que se pueden trabajar.
- Habla al cliente de tú, en castellano cercano, frases cortas, sin jerga técnica (o explicándola en una frase). Positivo y concreto: primero lo que hace bien.
- Cada punto se apoya en un dato del informe y, si encaja, en un problema de la guía de Stride Lab con su ejercicio y su cue (usa los textos de la guía tal cual).
- Si te pasan tests clínicos alterados, relaciónalos con el dato del G2 (no expliques solo el número).
- No diagnostiques lesiones ni prometas resultados. Si algo sugiere dolor o patología, ponlo en "avisos" para que lo valore el fisio.
- "hallazgos_mensaje": 3 líneas muy cortas, estilo "TC alto — trabajar cue brasas calientes", "Ligera asimetría pierna izquierda", "Cadencia — objetivo 175 ppm".

Guía de Stride Lab — 15 problemas y sus ejercicios en cinta:
${guideText}

Relación hallazgo clínico → reflejo en el G2:
${findingsText}`;

export interface ImageInput {
  mediaType: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif';
  base64: string;
}

export async function analyzeReport(apiKey: string, images: ImageInput[], sessionContext: string): Promise<Analysis> {
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
            text: sessionContext.trim()
              ? `Contexto de la sesión:\n${sessionContext}\n\nLee las capturas del informe G2 y prepara el guion.`
              : 'Lee las capturas del informe G2 y prepara el guion.',
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
