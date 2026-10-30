import { describe, expect, it } from 'vitest';
import { rankShoes, commonSpeeds } from './winner';
import { buildPostMessage, missingFields, whatsappLink } from './postMessage';
import { parseG2Table } from './csv';
import { newShoe } from '../storage';
import type { Shoe } from '../types';

function shoe(modelo: string, data: Partial<Record<'V1' | 'V2' | 'V3', [number, number, number]>>): Shoe {
  const s = newShoe(modelo);
  for (const [speed, [tc, sim, osc]] of Object.entries(data)) {
    const r = s.runs[speed as 'V1'];
    r.tc = String(tc);
    r.simetria = String(sim);
    r.oscilacion = String(osc);
  }
  return s;
}

describe('rankShoes', () => {
  it('elige la zapatilla con TC más bajo, mejor simetría y menor oscilación', () => {
    const a = shoe('A', { V1: [260, 52, 9], V2: [240, 51, 8.5] });
    const b = shoe('B', { V1: [245, 50, 8], V2: [225, 50.5, 7.9] });
    const ranking = rankShoes([a, b]);
    expect(ranking[0].shoeId).toBe(b.id);
    expect(ranking[0].score).toBe(100);
    expect(ranking[1].score).toBe(0);
  });

  it('compara solo velocidades medidas en todas las zapatillas', () => {
    const a = shoe('A', { V1: [250, 50, 8], V2: [230, 50, 8], V3: [300, 50, 8] });
    const b = shoe('B', { V1: [252, 50, 8], V2: [232, 50, 8] });
    expect(commonSpeeds([a, b])).toEqual(['V1', 'V2']);
    expect(rankShoes([a, b])[0].shoeId).toBe(a.id);
  });

  it('ignora zapatillas sin datos y devuelve vacío si no hay ninguno', () => {
    expect(rankShoes([newShoe('X')])).toEqual([]);
    const a = shoe('A', { V1: [250, 50, 8] });
    expect(rankShoes([a, newShoe('vacía')]).map((r) => r.shoeId)).toEqual([a.id]);
  });
});

describe('mensaje post-sesión', () => {
  it('rellena los campos y marca los que faltan', () => {
    const msg = buildPostMessage({ nombre: 'Laura Pérez', modelo: 'Pegasus 41', hallazgos: ['TC alto', '', ''], enlace: '' });
    expect(msg).toContain('¡Hola Laura!');
    expect(msg).toContain('*Zapatilla recomendada:* Pegasus 41');
    expect(missingFields(msg)).toEqual(['[HALLAZGO 2]', '[HALLAZGO 3]', '[ENLACE O ADJUNTO]']);
  });

  it('genera enlace de WhatsApp con prefijo español', () => {
    expect(whatsappLink('hola', '600 11 22 33')).toBe('https://wa.me/34600112233?text=hola');
  });
});

describe('parseG2Table', () => {
  it('reconoce cabeceras y números con unidades y coma decimal', () => {
    const txt = 'Velocidad;Contact time;Cadence;Balance;Vertical oscillation\n9,5 km/h;262 ms;164 spm;49,2 %;8,9 cm\n11;248;170;50.1;8.4';
    const { runs, mapped } = parseG2Table(txt);
    expect(mapped.sort()).toEqual(['cadencia', 'kmh', 'oscilacion', 'simetria', 'tc']);
    expect(runs[0]).toEqual({ kmh: '9.5', tc: '262', cadencia: '164', simetria: '49.2', oscilacion: '8.9' });
    expect(runs[1].tc).toBe('248');
  });
});
