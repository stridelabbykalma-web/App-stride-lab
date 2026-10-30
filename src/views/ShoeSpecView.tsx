import { useState } from 'react';
import { getApiKey, describeError } from '../lib/analyze';
import { lookupShoeSpec, specKey, useShoeSpecs, type ShoeSpec } from '../lib/shoeSpecs';
import { Choice, Text } from '../ui';

const mm = (v: number | null, unit: string) => (v === null ? '—' : `${v} ${unit}`);

/** Resumen de la ficha técnica de un modelo, con botón para buscarla o editarla. */
export function ShoeSpecView({ modelo, compact }: { modelo: string; compact?: boolean }) {
  const { specs, saveSpec } = useShoeSpecs();
  const key = specKey(modelo);
  const spec = specs[key];
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);

  if (!modelo.trim()) return null;

  const search = async () => {
    const apiKey = getApiKey();
    if (!apiKey) {
      setError('Añade la clave de API en «Informe G2» para buscar fichas.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      saveSpec(key, await lookupShoeSpec(apiKey, modelo));
    } catch (e) {
      setError(describeError(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={compact ? 'spec compact' : 'spec'}>
      {spec ? (
        <div className="chips">
          <span className="chip static">{spec.categoria}</span>
          <span className="chip static">drop {mm(spec.drop_mm, 'mm')}</span>
          <span className="chip static">
            stack {mm(spec.stack_talon_mm, '')}/{mm(spec.stack_antepie_mm, 'mm')}
          </span>
          <span className="chip static">{spec.amortiguacion}</span>
          {!compact && <span className="chip static">reactividad {spec.reactividad}</span>}
          {spec.placa !== 'ninguna' && <span className="chip static">placa {spec.placa}</span>}
          {!compact && spec.peso_g !== null && <span className="chip static">{spec.peso_g} g</span>}
          {!compact && spec.rocker && <span className="chip static">rocker</span>}
        </div>
      ) : (
        !busy && <span className="hint small">Sin ficha técnica</span>
      )}
      <div className="row">
        <button className="btn small ghost" disabled={busy} onClick={search}>
          {busy ? 'Buscando…' : spec ? 'Actualizar' : 'Buscar ficha'}
        </button>
        {!compact && (
          <button className="btn small ghost" onClick={() => setEditing((e) => !e)}>
            {editing ? 'Cerrar' : spec ? 'Editar' : 'A mano'}
          </button>
        )}
      </div>
      {!compact && spec?.resumen && <p className="hint small">{spec.resumen}</p>}
      {error && <p className="warn small">{error}</p>}
      {editing && <SpecForm spec={spec ?? emptySpec(modelo)} onChange={(s) => saveSpec(key, { ...s, editada: true })} />}
    </div>
  );
}

const emptySpec = (modelo: string): ShoeSpec => ({
  modelo,
  categoria: 'entrenamiento',
  drop_mm: null,
  stack_talon_mm: null,
  stack_antepie_mm: null,
  peso_g: null,
  amortiguacion: 'media',
  reactividad: 'media',
  placa: 'ninguna',
  estabilidad: 'neutra',
  rocker: false,
  espuma: '',
  resumen: '',
  fuentes: [],
});

function SpecForm({ spec, onChange }: { spec: ShoeSpec; onChange: (s: ShoeSpec) => void }) {
  const numField = (label: string, k: 'drop_mm' | 'stack_talon_mm' | 'stack_antepie_mm' | 'peso_g', unit: string) => (
    <Text
      label={label}
      unit={unit}
      inputMode="decimal"
      value={spec[k] === null ? '' : String(spec[k])}
      onChange={(v) => {
        const n = parseFloat(v.replace(',', '.'));
        onChange({ ...spec, [k]: Number.isFinite(n) ? n : null });
      }}
    />
  );
  return (
    <div className="stack spec-form">
      <div className="grid four">
        {numField('Drop', 'drop_mm', 'mm')}
        {numField('Stack talón', 'stack_talon_mm', 'mm')}
        {numField('Stack antepié', 'stack_antepie_mm', 'mm')}
        {numField('Peso', 'peso_g', 'g')}
      </div>
      <Choice
        label="Tipo"
        value={spec.categoria}
        onChange={(v) => v && onChange({ ...spec, categoria: v })}
        options={[['entrenamiento', 'Entrenamiento'], ['tempo', 'Tempo'], ['competicion', 'Competición'], ['trail', 'Trail'], ['estabilidad', 'Estabilidad'], ['minimalista', 'Minimalista']]}
      />
      <Choice
        label="Amortiguación"
        value={spec.amortiguacion}
        onChange={(v) => v && onChange({ ...spec, amortiguacion: v })}
        options={[['firme', 'Firme'], ['media', 'Media'], ['blanda', 'Blanda']]}
      />
      <Choice
        label="Reactividad"
        value={spec.reactividad}
        onChange={(v) => v && onChange({ ...spec, reactividad: v })}
        options={[['baja', 'Baja'], ['media', 'Media'], ['alta', 'Alta']]}
      />
      <Choice
        label="Placa"
        value={spec.placa}
        onChange={(v) => v && onChange({ ...spec, placa: v })}
        options={[['carbono', 'Carbono'], ['otra', 'Otra'], ['ninguna', 'Ninguna']]}
      />
      <Choice
        label="Estabilidad"
        value={spec.estabilidad}
        onChange={(v) => v && onChange({ ...spec, estabilidad: v })}
        options={[['neutra', 'Neutra'], ['estable', 'Estable']]}
      />
      <Text label="Notas" value={spec.resumen} onChange={(v) => onChange({ ...spec, resumen: v })} />
    </div>
  );
}
