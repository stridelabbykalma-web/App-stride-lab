import type { SpeedId } from './data/protocol';

/** Ficha de cliente — Análisis biomecánico. Todos los campos son texto libre o enumerados. */
export interface Client {
  id: string;
  createdAt: string;
  // 1. Datos personales
  nombre: string;
  telefono: string;
  email: string;
  edad: string;
  peso: string;
  talla: string;
  ocupacion: string;
  jornada: '' | 'sentado' | 'de-pie' | 'mixto';
  // 2. Perfil como corredor
  anosCorriendo: string;
  kmSemana: string;
  ritmo: string;
  terreno: '' | 'asfalto' | 'montana' | 'mixto';
  competicion: '' | 'si' | 'no';
  objetivoCarrera: string;
  // 3. Zapatillas
  zapEntreno: string;
  zapEntrenoKm: string;
  zapCompeticion: string;
  zapExtra: string;
  // 4. Historial de lesiones
  lesionesPasadas: string;
  molestiasActuales: string;
  plantillas: '' | 'si' | 'no' | 'actualmente';
  estudioPrevio: '' | 'si' | 'no';
  estudioPrevioDonde: string;
  // 5. Objetivo y motivación
  porQueAhora: string;
  expectativas: string;
  objetivo: '' | 'rendimiento' | 'prevencion' | 'lesion';
  // 6. Estilo de vida
  fuerza: '' | 'regular' | 'ocasional' | 'no';
  otrosDeportes: string;
  horasSueno: string;
  patologia: string;
  // 7. Cómo ha conocido Stride Lab
  origen: '' | 'boca-a-boca' | 'instagram' | 'google' | 'medico-fisio' | 'otro';
  recomendadoPor: string;
}

/** Datos de una pasada en el G2 (MotionMetrix). */
export interface G2Run {
  kmh: string;
  /** Tiempo de contacto medio (ms). */
  tc: string;
  /** Cadencia (pasos por minuto). */
  cadencia: string;
  /** Balance de tiempo de contacto izquierda/derecha, % del pie izquierdo (50 = simétrico). */
  simetria: string;
  /** Oscilación vertical (cm). */
  oscilacion: string;
  apuntes: string;
}

export interface Shoe {
  id: string;
  modelo: string;
  runs: Record<SpeedId, G2Run>;
}

export type TestResult = '' | 'normal' | 'alterado' | 'no-realizado';

export interface TestRecord {
  result: TestResult;
  lado: '' | 'izq' | 'der' | 'bilateral';
  notas: string;
}

export interface Correction {
  id: string;
  problemId: string;
  exerciseId: string;
  observa: string;
  tcAntes: string;
  tcDespues: string;
  cadAntes: string;
  cadDespues: string;
  porque: string;
  cue: string;
  resultado: string;
}

export interface Session {
  id: string;
  clientId: string;
  fecha: string; // YYYY-MM-DD
  hora: string;
  prep: Record<string, boolean>;
  tests: Record<string, TestRecord>;
  /** Problemas detectados en la observación libre (ids de la guía). */
  observados: string[];
  observacionNotas: string;
  shoes: Shoe[];
  winnerShoeId: string;
  fase1Notas: string;
  corrections: Correction[];
  cierre: {
    tcMedioFinal: string;
    cadenciaObjetivo: string;
    hallazgos: [string, string, string];
    recomendaciones: string;
    proximoPaso: string;
    enlaceInforme: string;
  };
}
