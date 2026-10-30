import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { createContext, useContext } from 'react';

// Ficha técnica de cada modelo de zapatilla (drop, stack, firmeza, placa…), buscada en internet con
// Claude y guardada en este dispositivo para no repetir la búsqueda. Sirve para cruzar las
// características de la zapatilla con lo que mide el G2 y ver qué tipo de zapatilla le funciona al cliente.

export const ShoeSpecSchema = z.object({
  modelo: z.string().describe('Marca y modelo tal como se conoce, p. ej. "Adidas Adizero Adios Pro 4".'),
  categoria: z.enum(['entrenamiento', 'tempo', 'competicion', 'trail', 'estabilidad', 'minimalista']),
  drop_mm: z.number().nullable(),
  stack_talon_mm: z.number().nullable(),
  stack_antepie_mm: z.number().nullable(),
  peso_g: z.number().nullable().describe('Peso de referencia en gramos (talla de hombre US 9 si no se indica otra).'),
  amortiguacion: z.enum(['firme', 'media', 'blanda']),
  reactividad: z.enum(['baja', 'media', 'alta']),
  placa: z.enum(['carbono', 'otra', 'ninguna']),
  estabilidad: z.enum(['neutra', 'estable']),
  rocker: z.boolean().describe('Si tiene balancín (rocker) marcado.'),
  espuma: z.string().describe('Nombre de la espuma de la mediasuela, o vacío.'),
  resumen: z.string().describe('Una frase: para qué tipo de corredor y ritmo está pensada.'),
  fuentes: z.array(z.string()).describe('URLs de donde salen los datos.'),
});

export type ShoeSpec = z.infer<typeof ShoeSpecSchema> & { editada?: boolean };

/** Clave estable para un modelo: sin marca separada por "_", espacios ni mayúsculas. */
export const specKey = (modelo: string) => modelo.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

export interface ShoeSpecsStore {
  specs: Record<string, ShoeSpec>;
  saveSpec: (key: string, spec: ShoeSpec) => void;
}

export const ShoeSpecsContext = createContext<ShoeSpecsStore>({ specs: {}, saveSpec: () => {} });
export const useShoeSpecs = () => useContext(ShoeSpecsContext);

const LOOKUP_SYSTEM = `Buscas la ficha técnica de zapatillas de running para un centro de biomecánica (Stride Lab).
Busca en la web (preferiblemente RunRepeat, la web de la marca, Running Warehouse, Believe in the Run, Doctors of Running) y rellena la ficha con datos de la versión exacta del modelo.
- Si las fuentes dan cifras distintas, usa las medidas en laboratorio (RunRepeat) para stack y drop, y di en "resumen" si el drop declarado por la marca es distinto.
- "amortiguacion": firme / media / blanda según la sensación descrita y, si existe, la dureza medida (HA): <20 HA blanda, 20-28 media, >28 firme.
- Si no encuentras un dato, déjalo a null; no lo inventes.
- Cuando tengas los datos, llama a guardar_ficha una sola vez.`;

// Esquema JSON de la herramienta (sin "$schema", que la API no necesita; strict exige additionalProperties: false)
const { $schema: _ignored, ...jsonSchema } = z.toJSONSchema(ShoeSpecSchema);
const TOOL_SCHEMA = { ...jsonSchema, additionalProperties: false } as Anthropic.Beta.BetaTool.InputSchema;

export async function lookupShoeSpec(apiKey: string, modelo: string): Promise<ShoeSpec> {
  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
  const messages: Anthropic.Beta.BetaMessageParam[] = [
    { role: 'user', content: `Busca la ficha técnica de la zapatilla: ${modelo}` },
  ];

  // La búsqueda web corre en los servidores de Anthropic; si se pausa (pause_turn) se reanuda.
  for (let turn = 0; turn < 4; turn++) {
    const response = await client.beta.messages.create({
      model: 'claude-opus-5-5',
      max_tokens: 16000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { effort: 'medium' },
      system: LOOKUP_SYSTEM,
      tools: [
        { type: 'web_search_20260209', name: 'web_search', max_uses: 5 },
        {
          name: 'guardar_ficha',
          description: 'Guarda la ficha técnica encontrada de la zapatilla.',
          strict: true,
          input_schema: TOOL_SCHEMA,
        },
      ],
      messages,
    });

    if (response.stop_reason === 'refusal') throw new Error('No se ha podido buscar este modelo.');
    const call = response.content.find((b) => b.type === 'tool_use' && b.name === 'guardar_ficha');
    if (call && call.type === 'tool_use') {
      const parsed = ShoeSpecSchema.safeParse(call.input);
      if (!parsed.success) throw new Error('La ficha encontrada no tiene el formato esperado.');
      return parsed.data;
    }
    if (response.stop_reason !== 'pause_turn') break;
    messages.push({ role: 'assistant', content: response.content });
  }
  throw new Error('No se ha encontrado la ficha de este modelo. Puedes rellenarla a mano.');
}

/** Texto de las fichas de las zapatillas probadas, para el análisis del informe. */
export function specsToText(models: string[], specs: Record<string, ShoeSpec>): string {
  const lines = models.map((m) => {
    const s = specs[specKey(m)];
    if (!s) return `- ${m}: sin ficha técnica.`;
    const val = (v: number | null, u: string) => (v === null ? '?' : `${v} ${u}`);
    return `- ${m}: ${s.categoria}; drop ${val(s.drop_mm, 'mm')}; stack talón ${val(s.stack_talon_mm, 'mm')} / antepié ${val(
      s.stack_antepie_mm,
      'mm',
    )}; peso ${val(s.peso_g, 'g')}; amortiguación ${s.amortiguacion}; reactividad ${s.reactividad}; placa ${s.placa}; ${s.estabilidad}${
      s.rocker ? '; con rocker' : ''
    }${s.espuma ? `; espuma ${s.espuma}` : ''}. ${s.resumen}`;
  });
  return lines.length ? `Fichas técnicas de las zapatillas probadas:\n${lines.join('\n')}` : '';
}
