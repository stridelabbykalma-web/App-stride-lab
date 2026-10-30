import type { Client, Session } from '../types';
import { SPEEDS } from '../data/protocol';
import { findExercise, findProblem } from '../data/problems';
import { TESTS } from '../data/tests';

/** Hoja de grabaciones y apuntes de la sesión, solo visible al imprimir. */
export function SessionReport({ session, client }: { session: Session; client: Client }) {
  const winner = session.shoes.find((s) => s.id === session.winnerShoeId);
  const tests = TESTS.filter((t) => session.tests[t.id]?.result);
  return (
    <div className="print-only report">
      <h1>Hoja de sesión G2 — Stride Lab by Kalma</h1>
      <p>
        <b>{client.nombre || 'Cliente'}</b> · {session.fecha} {session.hora}
      </p>

      {tests.length > 0 && (
        <>
          <h2>Exploración clínica</h2>
          <table>
            <tbody>
              {tests.map((t) => {
                const r = session.tests[t.id];
                return (
                  <tr key={t.id}>
                    <th>{t.name}</th>
                    <td>{r.result}{r.lado && ` · ${r.lado}`}</td>
                    <td>{r.notas}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </>
      )}

      <h2>Fase 1 — Grabaciones por zapatilla</h2>
      {session.shoes.map((s, i) => (
        <div key={s.id}>
          <h3>
            Zapatilla {i + 1}: {s.modelo || '—'} {s.id === session.winnerShoeId && '★'}
          </h3>
          <table>
            <thead>
              <tr><th /><th>km/h</th><th>TC (ms)</th><th>Cadencia</th><th>Simetría</th><th>Oscilación</th><th>Apuntes</th></tr>
            </thead>
            <tbody>
              {SPEEDS.map((sp) => {
                const r = s.runs[sp.id];
                return (
                  <tr key={sp.id}>
                    <th>{sp.label}</th><td>{r.kmh}</td><td>{r.tc}</td><td>{r.cadencia}</td><td>{r.simetria}</td><td>{r.oscilacion}</td><td>{r.apuntes}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ))}
      <p><b>Zapatilla ganadora:</b> {winner?.modelo || '—'}</p>
      {session.fase1Notas && <p>{session.fase1Notas}</p>}

      <h2>Fase 2 — Corrección técnica</h2>
      {session.corrections.map((c, i) => (
        <div key={c.id}>
          <h3>Problema {i + 1}: {findProblem(c.problemId)?.name ?? '—'}</h3>
          <p><b>Se observa:</b> {c.observa}</p>
          <p>TC {c.tcAntes} → {c.tcDespues} ms · Cadencia {c.cadAntes} → {c.cadDespues}</p>
          <p><b>Ejercicio:</b> {findExercise(c.problemId, c.exerciseId)?.name ?? '—'} · <b>Cue:</b> {c.cue}</p>
          <p><b>Por qué:</b> {c.porque}</p>
          <p><b>Resultado:</b> {c.resultado}</p>
        </div>
      ))}

      {session.analisis && (
        <>
          <h2>Qué decirle al cliente</h2>
          <p>{session.analisis.guion.apertura}</p>
          {session.analisis.guion.zapatilla && <p>{session.analisis.guion.zapatilla}</p>}
          <ol>
            {session.analisis.guion.puntos.map((p, i) => (
              <li key={i}>
                <b>{p.titulo}</b> ({p.dato}): {p.que_le_dices} {p.cue && <i>Cue: "{p.cue}"</i>}
              </li>
            ))}
          </ol>
          <p>{session.analisis.guion.cierre}</p>
        </>
      )}

      <h2>Cierre</h2>
      <p>
        <b>Zapatilla recomendada:</b> {winner?.modelo || '—'} · <b>TC medio final:</b> {session.cierre.tcMedioFinal || '—'} ms ·{' '}
        <b>Cadencia objetivo:</b> {session.cierre.cadenciaObjetivo || '—'} ppm
      </p>
      <ol>
        {session.cierre.hallazgos.filter(Boolean).map((h) => (
          <li key={h}>{h}</li>
        ))}
      </ol>
      <p><b>Recomendaciones:</b> {session.cierre.recomendaciones}</p>
      <p><b>Próximo paso:</b> {session.cierre.proximoPaso}</p>
      <footer>Stride Lab by Kalma · Cassà de la Selva, Girona · Documento confidencial</footer>
    </div>
  );
}
