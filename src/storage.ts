import { useCallback, useEffect, useState } from 'react';
import type { Client, Session, Shoe, G2Run } from './types';
import { SPEEDS } from './data/protocol';

// Los datos de clientes son confidenciales: se guardan solo en este navegador (localStorage).
// Usa "Exportar copia" para hacer backup o pasar los datos a otro dispositivo.

const KEY = 'stridelab.g2.v1';

export interface DB {
  clients: Client[];
  sessions: Session[];
}

const empty: DB = { clients: [], sessions: [] };

export const uid = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);

function load(): DB {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return empty;
    const parsed = JSON.parse(raw) as Partial<DB>;
    return { clients: parsed.clients ?? [], sessions: parsed.sessions ?? [] };
  } catch {
    return empty;
  }
}

function save(db: DB) {
  try {
    localStorage.setItem(KEY, JSON.stringify(db));
  } catch {
    // almacenamiento no disponible (modo privado): la app sigue funcionando en memoria
  }
}

export function useDB() {
  const [db, setDb] = useState<DB>(load);

  useEffect(() => save(db), [db]);

  const upsertClient = useCallback((c: Client) => {
    setDb((d) => ({
      ...d,
      clients: d.clients.some((x) => x.id === c.id) ? d.clients.map((x) => (x.id === c.id ? c : x)) : [...d.clients, c],
    }));
  }, []);

  const deleteClient = useCallback((id: string) => {
    setDb((d) => ({ clients: d.clients.filter((c) => c.id !== id), sessions: d.sessions.filter((s) => s.clientId !== id) }));
  }, []);

  const upsertSession = useCallback((s: Session) => {
    setDb((d) => ({
      ...d,
      sessions: d.sessions.some((x) => x.id === s.id) ? d.sessions.map((x) => (x.id === s.id ? s : x)) : [...d.sessions, s],
    }));
  }, []);

  const deleteSession = useCallback((id: string) => {
    setDb((d) => ({ ...d, sessions: d.sessions.filter((s) => s.id !== id) }));
  }, []);

  const replaceAll = useCallback((next: DB) => setDb(next), []);

  return { db, upsertClient, deleteClient, upsertSession, deleteSession, replaceAll };
}

export function newClient(): Client {
  return {
    id: uid(),
    createdAt: new Date().toISOString(),
    nombre: '', telefono: '', email: '', edad: '', peso: '', talla: '', ocupacion: '', jornada: '',
    anosCorriendo: '', kmSemana: '', ritmo: '', terreno: '', competicion: '', objetivoCarrera: '',
    zapEntreno: '', zapEntrenoKm: '', zapCompeticion: '', zapExtra: '',
    lesionesPasadas: '', molestiasActuales: '', plantillas: '', estudioPrevio: '', estudioPrevioDonde: '',
    porQueAhora: '', expectativas: '', objetivo: '',
    fuerza: '', otrosDeportes: '', horasSueno: '', patologia: '',
    origen: '', recomendadoPor: '',
  };
}

export const emptyRun = (): G2Run => ({ kmh: '', tc: '', cadencia: '', simetria: '', oscilacion: '', apuntes: '' });

export function newShoe(modelo = ''): Shoe {
  return {
    id: uid(),
    modelo,
    runs: Object.fromEntries(SPEEDS.map((s) => [s.id, emptyRun()])) as Shoe['runs'],
  };
}

export function newSession(client: Client): Session {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const initialShoes = [client.zapEntreno, client.zapCompeticion].filter((m) => m.trim()).map((m) => newShoe(m));
  return {
    id: uid(),
    clientId: client.id,
    fecha: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`,
    hora: `${pad(now.getHours())}:${pad(now.getMinutes())}`,
    prep: {},
    tests: {},
    observados: [],
    observacionNotas: '',
    shoes: initialShoes.length ? initialShoes : [newShoe()],
    winnerShoeId: '',
    fase1Notas: '',
    corrections: [],
    cierre: {
      tcMedioFinal: '',
      cadenciaObjetivo: '',
      hallazgos: ['', '', ''],
      recomendaciones: '',
      proximoPaso: '',
      enlaceInforme: '',
    },
  };
}
