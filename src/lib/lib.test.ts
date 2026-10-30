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

  it('no puntúa si no hay al menos dos zapatillas a la misma velocidad', () => {
    expect(rankShoes([newShoe('X')])).toEqual([]);
    const a = shoe('A', { V1: [250, 50, 8] });
    expect(rankShoes([a, newShoe('vacía')])).toEqual([]);
    expect(rankShoes([a, shoe('B', { V2: [240, 50, 8] })])).toEqual([]);
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

import { parseReport, reportCode, reportToShoes, shoeName, type RawReport } from './mmruns';

describe('informe compartido de mmruns', () => {
  const metric = (c: number, l = 0, r = 0, rating = 0) => ({ ComboVal: c, LeftVal: l, RightVal: r, Rating: rating });
  const run = (shoe: string, kmh: number, tc: [number, number]) => ({
    Shoe: shoe,
    SetSpeed_kph: metric(kmh),
    TTStepRate_spm: metric(80),
    TTContactTime_ms: metric((tc[0] + tc[1]) / 2, tc[0], tc[1]),
    TTVerticalDisp_cm: metric(8.04),
    EnergyReturn: metric(20, 0, 0, 3.456),
  });
  const raw: RawReport = {
    report_id: 'ABCDEFGH12',
    name: 'Prueba',
    created_at: '2026-06-12 15:34:46',
    runs: [run('ADIDAS_ ADIOS PRO 4', 9, [300, 310]), run('SALOMON_AERO BLAZE 2', 9, [290, 290]), run('SALOMON_AERO BLAZE 2', 11, [260, 270])],
  };

  it('extrae el código del enlace', () => {
    expect(reportCode('https://shared.mmruns.com/areport2/index.php?r=B87G4WH8H3SUNGGD')).toBe('B87G4WH8H3SUNGGD');
    expect(reportCode('b87g4wh8h3sunggd')).toBe('B87G4WH8H3SUNGGD');
    expect(reportCode('https://evil.example/?x=1')).toBeNull();
  });

  it('convierte cadencia a pasos/min, calcula el balance y limpia el nombre', () => {
    const r = parseReport(raw);
    expect(shoeName('ADIDAS_ ADIOS PRO 4')).toBe('Adidas Adios Pro 4');
    expect(r.runs[0]).toMatchObject({ shoe: 'Adidas Adios Pro 4', cadence: 160, contactMs: 305, balanceL: 49.2, verticalDispCm: 8, energyReturn: 3.46 });
    expect(r.date).toBe('2026-06-12');
  });

  it('agrupa por zapatilla y coloca las velocidades en V1/V2', () => {
    const shoes = reportToShoes(parseReport(raw));
    expect(shoes.map((s) => s.modelo)).toEqual(['Adidas Adios Pro 4', 'Salomon Aero Blaze 2']);
    expect(shoes[1].runs.V1.tc).toBe('290');
    expect(shoes[1].runs.V2.kmh).toBe('11');
    expect(shoes[0].runs.V2.tc).toBe('');
  });
});

describe('rankShoes con velocidades distintas por zapatilla', () => {
  it('compara cada zapatilla solo a las velocidades que comparte con otras', () => {
    const a = shoe('A', { V1: [320, 49.8, 7.9] });
    const b = shoe('B', { V2: [273, 49.8, 8.7], V3: [261, 49.3, 8.0] });
    const c = shoe('C', { V1: [315, 49.6, 8.8], V2: [281, 48.8, 9.6], V3: [261, 49.3, 8.6] });
    const ranking = rankShoes([a, b, c]);
    expect(ranking.map((r) => r.shoeId)).toEqual([b.id, a.id, c.id]);
    expect(ranking.find((r) => r.shoeId === c.id)!.speeds).toEqual(['V1', 'V2', 'V3']);
  });
});

import { buildManualPrompt, parseManualResponse } from './analyze';

describe('análisis sin API (copiar y pegar en claude.ai)', () => {
  const answer = {
    resumen: 'r',
    metricas: [{ nombre: 'Cadencia', valor: '156 ppm', contexto: '9 km/h', valoracion: 'a_trabajar' }],
    problemas: [{ problema: 'Cadencia baja', problema_id: '10', evidencia: '156 ppm' }],
    perfil_zapatilla: { conclusion: 'c', caracteristicas: ['Drop 6-8 mm'], evidencia: 'e' },
    guion: {
      apertura: 'a',
      zapatilla: '',
      puntos: [
        {
          titulo: 'Cadencia',
          dato: '156 ppm',
          que_significa: 'x',
          que_le_dices: 'y',
          problema_id: '10',
          ejercicio: { nombre: 'Metrónomo', como: '30"', cue: 'Más pasos', que_notara: 'ligereza', dato_a_vigilar: 'cadencia ↑' },
        },
      ],
      cierre: 'z',
    },
    hallazgos_mensaje: ['1', '2', '3'],
    avisos: [],
    fichas: [
      {
        modelo: 'Salomon Aero Blaze 2', categoria: 'tempo', drop_mm: 8, stack_talon_mm: 38, stack_antepie_mm: 30, peso_g: 230,
        amortiguacion: 'firme', reactividad: 'alta', placa: 'otra', estabilidad: 'neutra', rocker: true, espuma: 'Energy Foam', resumen: '', fuentes: [],
      },
    ],
  };

  it('lee la respuesta con texto alrededor y bloque ```json', () => {
    const { analysis, fichas } = parseManualResponse('Aquí tienes:\n```json\n' + JSON.stringify(answer) + '\n```\nSuerte');
    expect(analysis.guion.puntos[0].ejercicio.cue).toBe('Más pasos');
    expect(fichas[0].drop_mm).toBe(8);
    expect('fichas' in analysis).toBe(false);
  });

  it('da un error claro si falta el JSON o el formato no cuadra', () => {
    expect(() => parseManualResponse('no hay nada')).toThrow(/JSON/);
    expect(() => parseManualResponse(JSON.stringify({ resumen: 'x' }))).toThrow(/formato/);
  });

  it('el encargo incluye datos, contexto, zapatillas y esquema', () => {
    const p = buildManualPrompt('Cliente: 35 años', 'Pasada 1 · Adios Pro 4', ['Adios Pro 4']);
    expect(p).toContain('Pasada 1 · Adios Pro 4');
    expect(p).toContain('Cliente: 35 años');
    expect(p).toContain('(Adios Pro 4)');
    expect(p).toContain('"perfil_zapatilla"');
  });
});

import { applyIntake, buildIntakePrompt } from './intake';
import { newClient } from '../storage';

describe('ficha desde WhatsApp', () => {
  const resp = {
    nombre: 'Alex Martí', telefono: '', email: 'alex@mail.com', edad: '35', peso: '78', talla: '182', ocupacion: 'Oficina', jornada: 'sentado',
    anosCorriendo: '4', kmSemana: '30-40', ritmo: '5:30', terreno: 'mixto', competicion: 'si', objetivoCarrera: 'Maratón de Barcelona',
    zapEntreno: 'Nike Pegasus 41', zapEntrenoKm: '600', zapCompeticion: '', zapExtra: '', lesionesPasadas: 'Periostitis', molestiasActuales: '',
    plantillas: 'no', estudioPrevio: 'no', estudioPrevioDonde: '', porQueAhora: '', expectativas: '', objetivo: '', fuerza: '', otrosDeportes: '',
    horasSueno: '', patologia: '', origen: 'instagram', recomendadoPor: '',
  };

  it('rellena solo los campos vacíos', () => {
    const c = { ...newClient(), nombre: 'Alex' };
    const { client, filled } = applyIntake(c, '```json\n' + JSON.stringify(resp) + '\n```');
    expect(client.nombre).toBe('Alex');
    expect(client.zapEntreno).toBe('Nike Pegasus 41');
    expect(client.jornada).toBe('sentado');
    expect(filled).toBe(18);
  });

  it('rechaza valores fuera de los permitidos', () => {
    expect(() => applyIntake(newClient(), JSON.stringify({ ...resp, terreno: 'pista' }))).toThrow(/terreno/);
  });

  it('el encargo incluye las preguntas y la conversación pegada', () => {
    const p = buildIntakePrompt('Alex: corro 4 años');
    expect(p).toContain('¿Cuántos años llevas corriendo?');
    expect(p).toContain('Alex: corro 4 años');
  });
});
