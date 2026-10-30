import { useMemo, useState } from 'react';
import type { Client, Correction, G2Run, Session, Shoe, TestRecord } from '../types';
import { PREP_CHECKLIST, SPEEDS, TIMING } from '../data/protocol';
import { PROBLEMS, findExercise, findProblem } from '../data/problems';
import { TESTS, SYMPTOM_ADDONS } from '../data/tests';
import { newShoe, uid } from '../storage';
import { rankShoes, num } from '../lib/winner';
import { buildPostMessage, missingFields, whatsappLink } from '../lib/postMessage';
import { parseG2Table } from '../lib/csv';
import { Card, Choice, CopyButton, Text, Timer } from '../ui';
import { ReportAnalyzer } from './ReportAnalyzer';
import { reportToShoes } from '../lib/mmruns';

const STEPS = [
  { id: 'prep', label: 'Preparación' },
  { id: 'tests', label: 'Anamnesis y tests' },
  { id: 'obs', label: 'Observación libre' },
  { id: 'fase1', label: 'Fase 1 · Zapatillas' },
  { id: 'fase2', label: 'Fase 2 · Técnica' },
  { id: 'informe', label: 'Informe G2 · Qué decirle' },
  { id: 'cierre', label: 'Cierre e informe' },
] as const;
type StepId = (typeof STEPS)[number]['id'];

const timing = (id: string) => TIMING.find((t) => t.id === id)!;

interface Props {
  session: Session;
  client: Client;
  onChange: (s: Session) => void;
}

export function SessionView({ session, client, onChange }: Props) {
  const [step, setStep] = useState<StepId>('prep');
  const idx = STEPS.findIndex((s) => s.id === step);

  return (
    <div className="stack">
      <nav className="steps" aria-label="Fases de la sesión">
        {STEPS.map((s, i) => (
          <button key={s.id} className={s.id === step ? 'step on' : i < idx ? 'step done' : 'step'} onClick={() => setStep(s.id)}>
            <span className="step-n">{i + 1}</span>
            {s.label}
          </button>
        ))}
      </nav>

      {step === 'prep' && <Prep session={session} onChange={onChange} />}
      {step === 'tests' && <Tests session={session} client={client} onChange={onChange} />}
      {step === 'obs' && <Observation session={session} onChange={onChange} />}
      {step === 'fase1' && <Phase1 session={session} onChange={onChange} />}
      {step === 'fase2' && <Phase2 session={session} onChange={onChange} />}
      {step === 'informe' && <Report session={session} client={client} onChange={onChange} />}
      {step === 'cierre' && <Close session={session} client={client} onChange={onChange} />}

      <div className="row between no-print">
        <button className="btn ghost" disabled={idx === 0} onClick={() => setStep(STEPS[idx - 1].id)}>
          ← Anterior
        </button>
        {idx < STEPS.length - 1 && (
          <button className="btn primary" onClick={() => setStep(STEPS[idx + 1].id)}>
            Siguiente: {STEPS[idx + 1].label} →
          </button>
        )}
      </div>
    </div>
  );
}

type StepProps = { session: Session; onChange: (s: Session) => void };

function PhaseHeader({ id }: { id: string }) {
  const t = timing(id);
  return (
    <Card title={t.label} aside={<Timer minutes={t.minutes} />}>
      <ul className="bullets">
        {t.points.map((p) => (
          <li key={p}>{p}</li>
        ))}
      </ul>
      {t.tip && <p className="tip">{t.tip}</p>}
    </Card>
  );
}

function Prep({ session, onChange }: StepProps) {
  const done = PREP_CHECKLIST.filter((p) => session.prep[p]).length;
  return (
    <div className="stack">
      <Card title="Antes de que llegue el cliente (–5 min)" aside={<span className="badge">{done}/{PREP_CHECKLIST.length}</span>}>
        {PREP_CHECKLIST.map((item) => (
          <label key={item} className="check">
            <input
              type="checkbox"
              checked={!!session.prep[item]}
              onChange={(e) => onChange({ ...session, prep: { ...session.prep, [item]: e.target.checked } })}
            />
            {item}
          </label>
        ))}
      </Card>
      <Card title="Timing de la sesión · 75–85 min">
        <table className="table">
          <tbody>
            {TIMING.map((t, i) => (
              <tr key={t.id}>
                <td>{i + 1}</td>
                <td>{t.label}</td>
                <td className="num">{t.minutes} min</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function Tests({ session, client, onChange }: StepProps & { client: Client }) {
  const [onlyMinimal, setOnlyMinimal] = useState(true);
  const rec = (id: string): TestRecord => session.tests[id] ?? { result: '', lado: '', notas: '' };
  const setRec = (id: string, r: TestRecord) => onChange({ ...session, tests: { ...session.tests, [id]: r } });
  const shown = TESTS.filter((t) => !onlyMinimal || t.minimal);

  return (
    <div className="stack">
      <PhaseHeader id="anamnesis" />
      <Card title="Resumen de la ficha">
        <dl className="facts">
          <dt>Objetivo</dt>
          <dd>{client.objetivo || '—'} {client.objetivoCarrera && `· ${client.objetivoCarrera}`}</dd>
          <dt>Km/semana · ritmo</dt>
          <dd>{client.kmSemana || '—'} km · {client.ritmo || '—'} min/km</dd>
          <dt>Lesiones</dt>
          <dd>{client.lesionesPasadas || '—'}</dd>
          <dt>Molestias actuales</dt>
          <dd>{client.molestiasActuales || '—'}</dd>
          <dt>Patología</dt>
          <dd>{client.patologia || '—'}</dd>
        </dl>
        <p className="hint">Preguntar en consulta: objetivo, lesiones, patología, fuerza, sueño. Recoger TODAS las zapatillas.</p>
      </Card>

      <Card
        title="Exploración clínica"
        aside={
          <label className="check inline">
            <input type="checkbox" checked={onlyMinimal} onChange={(e) => setOnlyMinimal(e.target.checked)} />
            Versión mínima 10 min
          </label>
        }
      >
        {(['sin-camilla', 'con-camilla'] as const).map((block) => (
          <div key={block}>
            <h4 className="block-title">{block === 'sin-camilla' ? 'Sin camilla' : 'Con camilla'}</h4>
            {shown
              .filter((t) => t.block === block)
              .map((t) => {
                const r = rec(t.id);
                return (
                  <details key={t.id} className={`test ${r.result}`}>
                    <summary>
                      <span>{t.name}</span>
                      <span className="badge">{r.result ? r.result.replace('-', ' ') : 'pendiente'}</span>
                    </summary>
                    <p><b>Cómo:</b> {t.how}</p>
                    <p><b>Qué observar:</b> {t.observe}</p>
                    <p className="g2"><b>Relación con el G2:</b> {t.g2}</p>
                    <Choice
                      label="Resultado"
                      value={r.result}
                      onChange={(v) => setRec(t.id, { ...r, result: v })}
                      options={[['normal', 'Normal'], ['alterado', 'Alterado'], ['no-realizado', 'No realizado']]}
                    />
                    <Choice
                      label="Lado"
                      value={r.lado}
                      onChange={(v) => setRec(t.id, { ...r, lado: v })}
                      options={[['izq', 'Izquierdo'], ['der', 'Derecho'], ['bilateral', 'Bilateral']]}
                    />
                    <Text label="Notas" value={r.notas} onChange={(v) => setRec(t.id, { ...r, notas: v })} />
                  </details>
                );
              })}
          </div>
        ))}
      </Card>

      <Card title="Tests añadidos según el síntoma principal">
        <table className="table">
          <tbody>
            {SYMPTOM_ADDONS.map((s) => (
              <tr key={s.symptom}>
                <th>{s.symptom}</th>
                <td>{s.add}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function Observation({ session, onChange }: StepProps) {
  const toggle = (id: string) =>
    onChange({
      ...session,
      observados: session.observados.includes(id) ? session.observados.filter((x) => x !== id) : [...session.observados, id],
    });
  return (
    <div className="stack">
      <PhaseHeader id="observacion" />
      <Card title="Problemas observados" aside={<span className="badge">{session.observados.length} marcados · ideal 2–3</span>}>
        <div className="chips">
          {PROBLEMS.map((p) => (
            <button
              key={p.id}
              type="button"
              className={session.observados.includes(p.id) ? 'chip on' : 'chip'}
              onClick={() => toggle(p.id)}
            >
              {p.id} · {p.name}
            </button>
          ))}
        </div>
        <Text area label="Notas de la observación" value={session.observacionNotas} onChange={(v) => onChange({ ...session, observacionNotas: v })} />
      </Card>
    </div>
  );
}

const METRICS: { key: keyof G2Run; label: string; unit: string }[] = [
  { key: 'kmh', label: 'Velocidad', unit: 'km/h' },
  { key: 'tc', label: 'TC', unit: 'ms' },
  { key: 'cadencia', label: 'Cadencia', unit: 'ppm' },
  { key: 'simetria', label: 'Simetría', unit: '% izq.' },
  { key: 'oscilacion', label: 'Oscilación', unit: 'cm' },
];

function Phase1({ session, onChange }: StepProps) {
  const ranking = useMemo(() => rankShoes(session.shoes), [session.shoes]);
  const setShoe = (shoe: Shoe) => onChange({ ...session, shoes: session.shoes.map((s) => (s.id === shoe.id ? shoe : s)) });
  const suggested = ranking[0]?.shoeId;
  const nameOf = (id: string) => session.shoes.find((s) => s.id === id)?.modelo || 'Sin nombre';

  return (
    <div className="stack">
      <PhaseHeader id="fase1" />
      {session.shoes.map((shoe, i) => (
        <ShoeCard
          key={shoe.id}
          n={i + 1}
          shoe={shoe}
          winner={session.winnerShoeId === shoe.id}
          onChange={setShoe}
          onRemove={
            session.shoes.length > 1
              ? () => onChange({ ...session, shoes: session.shoes.filter((s) => s.id !== shoe.id), winnerShoeId: session.winnerShoeId === shoe.id ? '' : session.winnerShoeId })
              : undefined
          }
        />
      ))}
      {session.shoes.length < 4 && (
        <button className="btn" onClick={() => onChange({ ...session, shoes: [...session.shoes, newShoe()] })}>
          + Añadir zapatilla
        </button>
      )}

      <Card title="Decisión · zapatilla ganadora">
        {ranking.length === 0 ? (
          <p className="hint">Introduce el TC de al menos dos zapatillas a la misma velocidad para ver la comparativa.</p>
        ) : (
          <>
            <table className="table">
              <thead>
                <tr>
                  <th>Zapatilla</th>
                  <th className="num">TC medio</th>
                  <th className="num">Cadencia</th>
                  <th className="num">Asimetría</th>
                  <th className="num">Oscilación</th>
                  <th className="num">Puntuación</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {ranking.map((r) => (
                  <tr key={r.shoeId} className={r.shoeId === session.winnerShoeId ? 'win' : ''}>
                    <td>
                      {nameOf(r.shoeId)} <small className="hint">({r.speeds.join(', ')})</small>
                    </td>
                    <td className="num">{r.tc?.toFixed(0) ?? '—'} ms</td>
                    <td className="num">{r.cadencia?.toFixed(0) ?? '—'}</td>
                    <td className="num">{r.asimetria !== null ? `±${r.asimetria.toFixed(1)}%` : '—'}</td>
                    <td className="num">{r.oscilacion?.toFixed(1) ?? '—'} cm</td>
                    <td className="num"><b>{r.score}</b></td>
                    <td>
                      <button className="btn small" onClick={() => onChange({ ...session, winnerShoeId: r.shoeId })}>
                        {r.shoeId === session.winnerShoeId ? '★ Ganadora' : 'Elegir'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="hint">
              Sugerencia: <b>{nameOf(suggested!)}</b>. Puntuación = TC 50% · simetría 30% · oscilación 20%, comparando solo a la
              misma velocidad (entre paréntesis, las velocidades comparadas). La decisión final es tuya.
            </p>
          </>
        )}
        <Text area label="Apuntes generales fase 1" value={session.fase1Notas} onChange={(v) => onChange({ ...session, fase1Notas: v })} />
      </Card>
    </div>
  );
}

function ShoeCard({
  n, shoe, winner, onChange, onRemove,
}: {
  n: number;
  shoe: Shoe;
  winner: boolean;
  onChange: (s: Shoe) => void;
  onRemove?: () => void;
}) {
  const [paste, setPaste] = useState<string | null>(null);
  const [msg, setMsg] = useState('');

  const setRun = (speed: keyof Shoe['runs'], key: keyof G2Run, v: string) =>
    onChange({ ...shoe, runs: { ...shoe.runs, [speed]: { ...shoe.runs[speed], [key]: v } } });

  const importPaste = () => {
    const { runs, mapped } = parseG2Table(paste ?? '');
    if (!runs.length) {
      setMsg('No se han reconocido datos. La primera fila debe ser la cabecera (Velocidad, TC, Cadencia, Simetría/Balance, Oscilación).');
      return;
    }
    const next = { ...shoe.runs };
    SPEEDS.forEach((s, i) => {
      if (runs[i]) next[s.id] = { ...next[s.id], ...runs[i] };
    });
    onChange({ ...shoe, runs: next });
    setMsg(`Importadas ${Math.min(runs.length, 3)} pasadas · columnas: ${mapped.join(', ')}`);
    setPaste(null);
  };

  return (
    <Card
      title={
        <>
          Zapatilla {n} {winner && <span className="badge win">★ Ganadora</span>}
        </>
      }
      aside={
        <div className="row">
          <button className="btn small ghost" onClick={() => setPaste(paste === null ? '' : null)}>
            Pegar datos G2
          </button>
          {onRemove && (
            <button className="btn small ghost danger" onClick={onRemove}>
              Quitar
            </button>
          )}
        </div>
      }
    >
      <Text label="Modelo / marca" value={shoe.modelo} onChange={(v) => onChange({ ...shoe, modelo: v })} />
      {paste !== null && (
        <div className="paste">
          <textarea
            rows={4}
            placeholder={'Pega aquí la tabla del informe G2 / mmruns.com (con cabecera), una fila por velocidad:\nVelocidad\tTC\tCadencia\tBalance\tOscilación'}
            value={paste}
            onChange={(e) => setPaste(e.target.value)}
          />
          <button className="btn small primary" onClick={importPaste}>
            Importar
          </button>
        </div>
      )}
      {msg && <p className="hint">{msg}</p>}
      <div className="table-wrap">
        <table className="table g2">
          <thead>
            <tr>
              <th />
              {METRICS.map((m) => (
                <th key={m.key}>
                  {m.label} <small>{m.unit}</small>
                </th>
              ))}
              <th>Apuntes</th>
            </tr>
          </thead>
          <tbody>
            {SPEEDS.map((s) => (
              <tr key={s.id}>
                <th>
                  {s.label} <small>{s.minutes}′</small>
                </th>
                {METRICS.map((m) => (
                  <td key={m.key}>
                    <input
                      inputMode="decimal"
                      aria-label={`${s.label} ${m.label}`}
                      value={shoe.runs[s.id][m.key]}
                      onChange={(e) => setRun(s.id, m.key, e.target.value)}
                    />
                  </td>
                ))}
                <td>
                  <input aria-label={`${s.label} apuntes`} value={shoe.runs[s.id].apuntes} onChange={(e) => setRun(s.id, 'apuntes', e.target.value)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

const delta = (before: string, after: string) => {
  const a = num(before);
  const b = num(after);
  if (a === null || b === null) return null;
  return b - a;
};

function Phase2({ session, onChange }: StepProps) {
  const winner = session.shoes.find((s) => s.id === session.winnerShoeId);
  const setCorr = (c: Correction) => onChange({ ...session, corrections: session.corrections.map((x) => (x.id === c.id ? c : x)) });
  const add = (problemId = '') =>
    onChange({
      ...session,
      corrections: [
        ...session.corrections,
        { id: uid(), problemId, exerciseId: '', observa: '', tcAntes: '', tcDespues: '', cadAntes: '', cadDespues: '', porque: '', cue: '', resultado: '' },
      ],
    });

  const pending = session.observados.filter((id) => !session.corrections.some((c) => c.problemId === id));

  return (
    <div className="stack">
      <PhaseHeader id="fase2" />
      <p className="hint">
        Zapatilla ganadora puesta: <b>{winner?.modelo || 'sin elegir (Fase 1)'}</b>. Para cada problema: qué se ve, qué ejercicio se aplica y por qué.
      </p>
      {session.corrections.map((c, i) => {
        const problem = findProblem(c.problemId);
        const ex = findExercise(c.problemId, c.exerciseId);
        const dTc = delta(c.tcAntes, c.tcDespues);
        const dCad = delta(c.cadAntes, c.cadDespues);
        return (
          <Card
            key={c.id}
            title={`Problema ${i + 1}${problem ? ` — ${problem.name}` : ''}`}
            aside={
              <button className="btn small ghost danger" onClick={() => onChange({ ...session, corrections: session.corrections.filter((x) => x.id !== c.id) })}>
                Quitar
              </button>
            }
          >
            <label className="field">
              <span className="field-label">Problema detectado</span>
              <select value={c.problemId} onChange={(e) => setCorr({ ...c, problemId: e.target.value, exerciseId: '' })}>
                <option value="">— Elegir —</option>
                {PROBLEMS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.id} · {p.name}
                  </option>
                ))}
              </select>
            </label>
            <Text area label="¿Qué se observa?" value={c.observa} onChange={(v) => setCorr({ ...c, observa: v })} />
            <div className="grid four">
              <Text label="TC antes" unit="ms" value={c.tcAntes} onChange={(v) => setCorr({ ...c, tcAntes: v })} inputMode="decimal" />
              <Text label="TC después" unit="ms" value={c.tcDespues} onChange={(v) => setCorr({ ...c, tcDespues: v })} inputMode="decimal" />
              <Text label="Cadencia antes" value={c.cadAntes} onChange={(v) => setCorr({ ...c, cadAntes: v })} inputMode="decimal" />
              <Text label="Cadencia después" value={c.cadDespues} onChange={(v) => setCorr({ ...c, cadDespues: v })} inputMode="decimal" />
            </div>
            {(dTc !== null || dCad !== null) && (
              <p className="deltas">
                {dTc !== null && <span className={dTc < 0 ? 'good' : 'bad'}>TC {dTc > 0 ? '+' : ''}{dTc.toFixed(0)} ms</span>}
                {dCad !== null && <span className={dCad > 0 ? 'good' : 'bad'}>Cadencia {dCad > 0 ? '+' : ''}{dCad.toFixed(0)} ppm</span>}
              </p>
            )}
            {problem && (
              <div className="exercises">
                {problem.exercises.map((e) => (
                  <button
                    key={e.id}
                    type="button"
                    className={c.exerciseId === e.id ? 'exercise on' : 'exercise'}
                    onClick={() => setCorr({ ...c, exerciseId: e.id, cue: e.cue, porque: e.why })}
                  >
                    <b>{e.id} · {e.name}</b>
                    <span>{e.how}</span>
                    <q>{e.cue}</q>
                  </button>
                ))}
              </div>
            )}
            {ex && <p className="hint">Ejercicio aplicado: <b>{ex.name}</b></p>}
            <Text area label="¿Por qué este ejercicio?" value={c.porque} onChange={(v) => setCorr({ ...c, porque: v })} />
            <Text label="Cue utilizado" value={c.cue} onChange={(v) => setCorr({ ...c, cue: v })} />
            <Text area label="Resultado observado" value={c.resultado} onChange={(v) => setCorr({ ...c, resultado: v })} />
          </Card>
        );
      })}
      <div className="row wrap">
        {pending.map((id) => (
          <button key={id} className="btn" onClick={() => add(id)}>
            + {findProblem(id)?.name}
          </button>
        ))}
        <button className="btn ghost" onClick={() => add()}>
          + Otro problema
        </button>
      </div>
      {session.corrections.length > 3 && <p className="warn">Máximo 2–3 problemas por sesión — no abrumar.</p>}
    </div>
  );
}

/** Resumen en texto de lo registrado en la sesión, para que el análisis del informe lo tenga en cuenta. */
export function sessionContext(session: Session, client: Client): string {
  const lines: string[] = [];
  const ficha = [
    client.edad && `${client.edad} años`,
    client.kmSemana && `${client.kmSemana} km/semana`,
    client.ritmo && `ritmo ${client.ritmo} min/km`,
    client.objetivo && `objetivo: ${client.objetivo}`,
    client.objetivoCarrera,
  ].filter(Boolean);
  if (ficha.length) lines.push(`Cliente: ${ficha.join(', ')}.`);
  if (client.lesionesPasadas) lines.push(`Lesiones pasadas: ${client.lesionesPasadas}`);
  if (client.molestiasActuales) lines.push(`Molestias actuales: ${client.molestiasActuales}`);
  const altered = TESTS.filter((t) => session.tests[t.id]?.result === 'alterado').map((t) => {
    const r = session.tests[t.id];
    return `${t.name}${r.lado ? ` (${r.lado})` : ''}${r.notas ? `: ${r.notas}` : ''}`;
  });
  if (altered.length) lines.push(`Tests clínicos alterados: ${altered.join('; ')}`);
  if (session.observados.length) lines.push(`Observado en cinta: ${session.observados.map((id) => findProblem(id)?.name).join(', ')}`);
  if (session.observacionNotas) lines.push(`Notas de observación: ${session.observacionNotas}`);
  const winner = session.shoes.find((s) => s.id === session.winnerShoeId);
  if (winner?.modelo) lines.push(`Zapatilla elegida en fase 1: ${winner.modelo}`);
  for (const c of session.corrections) {
    const p = findProblem(c.problemId);
    if (p) lines.push(`Trabajado en fase 2: ${p.name}${c.cue ? ` (cue "${c.cue}")` : ''}${c.resultado ? ` — ${c.resultado}` : ''}`);
  }
  return lines.join('\n');
}

function Report({ session, client, onChange }: StepProps & { client: Client }) {
  return (
    <div className="stack">
      <p className="hint">
        Pega el enlace del informe que compartes con el cliente (o sube capturas). La app carga los datos del G2, rellena la
        Fase 1 y te prepara qué decirle: máximo 3 puntos, con el dato, la explicación sencilla, la frase y el ejercicio de la guía.
      </p>
      <ReportAnalyzer
        context={sessionContext(session, client)}
        initial={session.analisis}
        onResult={(a) => onChange({ ...session, analisis: a })}
        onReportLoaded={(r, link) => {
          const hasData = session.shoes.some((s) => Object.values(s.runs).some((run) => run.tc));
          if (hasData && !confirm('¿Sustituir las zapatillas de la Fase 1 por las del informe?')) {
            onChange({ ...session, cierre: { ...session.cierre, enlaceInforme: link } });
            return;
          }
          onChange({ ...session, shoes: reportToShoes(r), winnerShoeId: '', cierre: { ...session.cierre, enlaceInforme: link } });
        }}
        onUseFindings={(a) =>
          onChange({
            ...session,
            analisis: a,
            cierre: { ...session.cierre, hallazgos: [0, 1, 2].map((i) => a.hallazgos_mensaje[i] ?? '') as Session['cierre']['hallazgos'] },
          })
        }
      />
    </div>
  );
}

function Close({ session, client, onChange }: StepProps & { client: Client }) {
  const winner = session.shoes.find((s) => s.id === session.winnerShoeId);
  const c = session.cierre;
  const setC = (patch: Partial<Session['cierre']>) => onChange({ ...session, cierre: { ...c, ...patch } });

  const suggestedFindings = session.corrections
    .map((x) => {
      const p = findProblem(x.problemId);
      if (!p) return '';
      return x.cue ? `${p.name} — trabajar cue "${x.cue}"` : p.name;
    })
    .filter(Boolean);

  const msg = buildPostMessage({ nombre: client.nombre, modelo: winner?.modelo ?? '', hallazgos: c.hallazgos, enlace: c.enlaceInforme });
  const missing = missingFields(msg);

  return (
    <div className="stack">
      <PhaseHeader id="cierre" />
      <Card title="Resumen final y recomendaciones">
        <div className="grid">
          <div className="field">
            <span className="field-label">Zapatilla recomendada</span>
            <div className="value">{winner?.modelo || '— (elegir en Fase 1)'}</div>
          </div>
          <Text label="TC medio final" unit="ms" value={c.tcMedioFinal} onChange={(v) => setC({ tcMedioFinal: v })} inputMode="decimal" />
          <Text label="Cadencia objetivo" unit="ppm" value={c.cadenciaObjetivo} onChange={(v) => setC({ cadenciaObjetivo: v })} inputMode="numeric" />
        </div>
        <h4 className="block-title">3 puntos clave (máximo — o no recordará nada)</h4>
        {c.hallazgos.map((h, i) => (
          <Text
            key={i}
            label={`Punto clave ${i + 1}`}
            value={h}
            placeholder={suggestedFindings[i] ?? ''}
            onChange={(v) => {
              const next = [...c.hallazgos] as Session['cierre']['hallazgos'];
              next[i] = v;
              setC({ hallazgos: next });
            }}
          />
        ))}
        {suggestedFindings.length > 0 && c.hallazgos.every((h) => !h) && (
          <button
            className="btn small"
            onClick={() => setC({ hallazgos: [0, 1, 2].map((i) => suggestedFindings[i] ?? '') as Session['cierre']['hallazgos'] })}
          >
            Rellenar desde Fase 2
          </button>
        )}
        <Text area label="Recomendaciones entregadas al cliente" value={c.recomendaciones} onChange={(v) => setC({ recomendaciones: v })} />
        <Text label="Próximo paso acordado" value={c.proximoPaso} onChange={(v) => setC({ proximoPaso: v })} />
        <Text label="Enlace al informe técnico G2 (mmruns.com)" value={c.enlaceInforme} onChange={(v) => setC({ enlaceInforme: v })} placeholder="https://…" />
      </Card>

      <Card
        title="Mensaje post-sesión"
        aside={
          <div className="row">
            <CopyButton text={msg} />
            <a className="btn small primary" href={whatsappLink(msg, client.telefono)} target="_blank" rel="noreferrer">
              Abrir WhatsApp
            </a>
          </div>
        }
      >
        {missing.length > 0 && <p className="warn">Falta por rellenar: {missing.join(', ')}</p>}
        <pre className="bubble">{msg}</pre>
        <p className="hint">Enviar este mensaje primero. El informe de valoración completo con las pautas se manda después, en un segundo mensaje.</p>
      </Card>

      <button className="btn no-print" onClick={() => window.print()}>
        Imprimir / guardar PDF de la sesión
      </button>
    </div>
  );
}
