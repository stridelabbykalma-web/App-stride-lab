import { useState } from 'react';
import { PROBLEMS } from '../data/problems';
import { TESTS, SYMPTOM_ADDONS, FINDING_TO_G2, CONSULT_ORDER } from '../data/tests';
import { WHATSAPP_SEQUENCE } from '../data/protocol';
import { Card, CopyButton } from '../ui';

const norm = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

export function GuideView() {
  const [q, setQ] = useState('');
  const shown = PROBLEMS.filter((p) => !q || norm(JSON.stringify(p)).includes(norm(q)));
  return (
    <div className="stack">
      <input className="search" placeholder="Buscar problema, ejercicio o cue…" value={q} onChange={(e) => setQ(e.target.value)} />
      {shown.map((p) => (
        <Card key={p.id} title={`${p.id} · ${p.name}`}>
          <div className="exercises static">
            {p.exercises.map((e) => (
              <div key={e.id} className="exercise">
                <b>{e.id} · {e.name}</b>
                <span>{e.how}</span>
                <q>{e.cue}</q>
                <small><b>Por qué funciona:</b> {e.why}</small>
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}

export function ProtocolView() {
  return (
    <div className="stack">
      <Card title="Orden recomendado en consulta">
        <ol className="bullets">
          {CONSULT_ORDER.map((o) => (
            <li key={o}>{o}</li>
          ))}
        </ol>
      </Card>
      {(['sin-camilla', 'con-camilla'] as const).map((block) => (
        <Card key={block} title={block === 'sin-camilla' ? 'Tests sin camilla' : 'Tests con camilla'}>
          {TESTS.filter((t) => t.block === block).map((t) => (
            <details key={t.id} className="test">
              <summary>
                <span>{t.name}</span>
                {t.minimal && <span className="badge">versión 10 min</span>}
              </summary>
              <p><b>Tipo:</b> {t.type}</p>
              <p><b>Objetivo:</b> {t.goal}</p>
              <p><b>Cómo hacerlo:</b> {t.how}</p>
              <p><b>Qué observar:</b> {t.observe}</p>
              <p className="g2"><b>Relación con el G2:</b> {t.g2}</p>
            </details>
          ))}
        </Card>
      ))}
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
      <Card title="Relación rápida hallazgo clínico → G2">
        <table className="table">
          <tbody>
            {FINDING_TO_G2.map((f) => (
              <tr key={f.finding}>
                <th>{f.finding}</th>
                <td>{f.g2}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

export function WhatsAppView() {
  return (
    <div className="stack">
      <p className="hint">Enviar en orden, esperando respuesta entre cada mensaje. Con todas las respuestas, rellena la ficha del cliente.</p>
      {WHATSAPP_SEQUENCE.map((m, i) => (
        <Card key={m.title} title={`${i + 1}. ${m.title}`} aside={<CopyButton text={m.text} />}>
          <pre className="bubble">{m.text}</pre>
          <p className="hint">{m.note}</p>
        </Card>
      ))}
    </div>
  );
}
