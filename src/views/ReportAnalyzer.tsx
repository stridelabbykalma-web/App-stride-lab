import { useEffect, useState } from 'react';
import { AnalysisSchema, analyzeReport, describeError, getApiKey, prepareImage, setApiKey, type Analysis, type ImageInput } from '../lib/analyze';
import { findExercise, findProblem } from '../data/problems';
import { loadReport, reportToText, type G2Report } from '../lib/mmruns';
import { Card, CopyButton } from '../ui';

type Img = ImageInput & { preview: string; id: number };

const VALORACION: Record<Analysis['metricas'][number]['valoracion'], [string, string]> = {
  bien: ['Bien', 'good'],
  mejorable: ['Mejorable', 'meh'],
  a_trabajar: ['A trabajar', 'bad'],
  sin_referencia: ['Sin referencia', ''],
};

export function scriptText(a: Analysis): string {
  const parts = [a.guion.apertura];
  if (a.guion.zapatilla) parts.push(a.guion.zapatilla);
  a.guion.puntos.forEach((p, i) => {
    parts.push(`${i + 1}. ${p.titulo} (${p.dato})\n${p.que_le_dices}${p.cue ? `\nCue: "${p.cue}"` : ''}`);
  });
  parts.push(a.guion.cierre);
  return parts.join('\n\n');
}

interface Props {
  /** Contexto de la sesión (ficha, tests, datos anotados) que se pasa junto a las capturas. */
  context?: string;
  initial?: Analysis;
  onResult?: (a: Analysis) => void;
  onUseFindings?: (a: Analysis) => void;
  /** Se llama al cargar un informe por enlace (para rellenar la Fase 1 y guardar el enlace). */
  onReportLoaded?: (r: G2Report, link: string) => void;
}

export function ReportAnalyzer({ context = '', initial, onResult, onUseFindings, onReportLoaded }: Props) {
  const [key, setKey] = useState(getApiKey);
  const [editingKey, setEditingKey] = useState(!getApiKey());
  const [images, setImages] = useState<Img[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<Analysis | undefined>(initial);
  const [link, setLink] = useState('');
  const [report, setReport] = useState<G2Report | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchReport = async () => {
    setLoading(true);
    setError('');
    try {
      const r = await loadReport(link);
      setReport(r);
      onReportLoaded?.(r, link.trim());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se ha podido cargar el informe.');
    } finally {
      setLoading(false);
    }
  };

  const addFiles = async (files: Iterable<Blob>) => {
    const list = [...files].filter((f) => f.type.startsWith('image/'));
    const prepared = await Promise.all(list.map(prepareImage));
    setImages((imgs) => [...imgs, ...prepared.map((p) => ({ ...p, id: Math.random() }))].slice(0, 10));
  };

  // Pegar capturas directamente con Ctrl/Cmd+V
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const files = [...(e.clipboardData?.files ?? [])];
      if (files.length) {
        e.preventDefault();
        addFiles(files);
      }
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, []);

  const run = async () => {
    setBusy(true);
    setError('');
    try {
      const a = await analyzeReport(key, images, context, report ? reportToText(report) : '');
      setResult(a);
      onResult?.(a);
    } catch (e) {
      setError(describeError(e));
    } finally {
      setBusy(false);
    }
  };

  // analisis.json generado por la skill informe-g2 (agent-browser sobre mmruns.com)
  const importJSON = async (file: File) => {
    setError('');
    try {
      const parsed = AnalysisSchema.safeParse(JSON.parse(await file.text()));
      if (!parsed.success) throw new Error();
      setResult(parsed.data);
      onResult?.(parsed.data);
    } catch {
      setError('El archivo no es un análisis válido (analisis.json de la skill informe-g2).');
    }
  };

  return (
    <div className="stack">
      <Card title="Enlace del informe (el mismo que se comparte con el cliente)">
        <div className="row wrap">
          <input
            className="grow"
            value={link}
            placeholder="https://shared.mmruns.com/areport2/index.php?r=…"
            onChange={(e) => setLink(e.target.value)}
          />
          <button className="btn" disabled={!link.trim() || loading} onClick={fetchReport}>
            {loading ? 'Cargando…' : 'Cargar informe'}
          </button>
        </div>
        {report && (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>#</th><th>Zapatilla</th><th className="num">km/h</th><th className="num">Cadencia</th><th className="num">TC ms</th>
                  <th className="num">Balance izq.</th><th className="num">Osc. cm</th><th className="num">ER / SA / SC</th>
                </tr>
              </thead>
              <tbody>
                {report.runs.map((r) => (
                  <tr key={r.n}>
                    <td>{r.n}</td><td>{r.shoe}</td><td className="num">{r.speedKmh}</td><td className="num">{r.cadence}</td>
                    <td className="num">{r.contactMs}</td><td className="num">{r.balanceL}%</td><td className="num">{r.verticalDispCm}</td>
                    <td className="num">{r.energyReturn} / {r.shockAbsorption} / {r.strideConsistency}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {report && <p className="hint small">Informe de {report.name || 'cliente'} · {report.date}. ER/SA/SC: energy return, shock absorption y stride consistency (0–10).</p>}
      </Card>

      <Card
        title="Capturas del informe (opcional si has cargado el enlace)"
        aside={
          !editingKey && (
            <button className="btn small ghost" onClick={() => setEditingKey(true)}>
              Clave de API
            </button>
          )
        }
      >
        {editingKey && (
          <div className="keybox">
            <label className="field">
              <span className="field-label">Clave de API de Anthropic (se guarda solo en este dispositivo)</span>
              <input type="password" value={key} placeholder="sk-ant-…" onChange={(e) => setKey(e.target.value.trim())} />
            </label>
            <div className="row">
              <button
                className="btn small primary"
                disabled={!key}
                onClick={() => {
                  setApiKey(key);
                  setEditingKey(false);
                }}
              >
                Guardar
              </button>
              {getApiKey() && (
                <button
                  className="btn small ghost danger"
                  onClick={() => {
                    setApiKey('');
                    setKey('');
                  }}
                >
                  Borrar clave
                </button>
              )}
            </div>
            <p className="hint small">
              Se obtiene en console.anthropic.com → API Keys. Las capturas se envían a Anthropic para leerlas; no subas capturas
              con datos que el cliente no haya autorizado.
            </p>
          </div>
        )}

        <label
          className="dropzone"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            addFiles(e.dataTransfer.files);
          }}
        >
          <input type="file" accept="image/*" multiple hidden onChange={(e) => e.target.files && addFiles(e.target.files)} />
          <b>Toca para elegir capturas</b>
          <span>o arrástralas aquí · o pégalas con Ctrl/Cmd+V</span>
        </label>

        {images.length > 0 && (
          <div className="thumbs">
            {images.map((img) => (
              <figure key={img.id}>
                <img src={img.preview} alt="Captura del informe" />
                <button className="thumb-x" aria-label="Quitar captura" onClick={() => setImages((l) => l.filter((x) => x.id !== img.id))}>
                  ×
                </button>
              </figure>
            ))}
          </div>
        )}

        <div className="row wrap">
          <button className="btn primary" disabled={(!images.length && !report) || !key || busy} onClick={run}>
            {busy ? 'Leyendo informe…' : result ? 'Volver a analizar' : 'Analizar y preparar qué decirle'}
          </button>
          <label className="btn ghost">
            Importar análisis (.json)
            <input type="file" accept="application/json,.json" hidden onChange={(e) => e.target.files?.[0] && importJSON(e.target.files[0])} />
          </label>
          {busy && <span className="hint">Suele tardar entre 20 y 60 segundos.</span>}
          {!key && <span className="hint">Añade la clave de API para analizar.</span>}
        </div>
        {context && <p className="hint small">Se incluye el contexto de la sesión: ficha, tests y datos anotados.</p>}
        {error && <p className="warn">{error}</p>}
      </Card>

      {result && <AnalysisView a={result} onUseFindings={onUseFindings} />}
    </div>
  );
}

function AnalysisView({ a, onUseFindings }: { a: Analysis; onUseFindings?: (a: Analysis) => void }) {
  return (
    <>
      <Card title="Qué decirle" aside={<CopyButton text={scriptText(a)} label="Copiar guion" />}>
        <p className="say">{a.guion.apertura}</p>
        {a.guion.zapatilla && (
          <div className="point">
            <h4>Zapatilla</h4>
            <p className="say">{a.guion.zapatilla}</p>
          </div>
        )}
        {a.guion.puntos.map((p, i) => {
          const problem = findProblem(p.problema_id);
          const ex = findExercise(p.problema_id, p.ejercicio_id);
          return (
            <div key={i} className="point">
              <h4>
                {i + 1}. {p.titulo} <span className="badge">{p.dato}</span>
              </h4>
              <p className="hint">{p.que_significa}</p>
              <p className="say">“{p.que_le_dices}”</p>
              {(ex || p.cue) && (
                <p className="exercise-line">
                  {ex && (
                    <>
                      <b>
                        {problem?.name} · {ex.id} {ex.name}
                      </b>{' '}
                      — {ex.how}
                      <br />
                    </>
                  )}
                  {p.cue && <q>{p.cue}</q>}
                </p>
              )}
            </div>
          );
        })}
        <p className="say closing">{a.guion.cierre}</p>
        {onUseFindings && (
          <button className="btn" onClick={() => onUseFindings(a)}>
            Usar los 3 puntos en el mensaje post-sesión
          </button>
        )}
      </Card>

      {a.avisos.length > 0 && (
        <Card title="Avisos">
          <ul className="bullets warn-list">
            {a.avisos.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </Card>
      )}

      <Card title="Lo que se ha leído del informe">
        <p className="hint">{a.resumen}</p>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Métrica</th>
                <th>Valor</th>
                <th>Contexto</th>
                <th>Valoración</th>
              </tr>
            </thead>
            <tbody>
              {a.metricas.map((m, i) => {
                const [label, cls] = VALORACION[m.valoracion];
                return (
                  <tr key={i}>
                    <td>{m.nombre}</td>
                    <td className="num">{m.valor}</td>
                    <td>{m.contexto}</td>
                    <td>
                      <span className={`pill ${cls}`}>{label}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="hint small">Comprueba los valores con el informe original antes de explicarlos.</p>
        {a.problemas.length > 0 && (
          <>
            <h4 className="block-title">Problemas de la guía que encajan</h4>
            <ul className="bullets">
              {a.problemas.map((p) => (
                <li key={p.problema_id}>
                  <b>{p.problema_id} · {findProblem(p.problema_id)?.name}</b> — {p.evidencia}
                </li>
              ))}
            </ul>
          </>
        )}
      </Card>
    </>
  );
}
