import { useEffect, useState } from 'react';
import {
  AnalysisSchema,
  analyzeReport,
  buildManualPrompt,
  describeError,
  getApiKey,
  parseManualResponse,
  prepareImage,
  setApiKey,
  type Analysis,
  type ImageInput,
  type LiveExerciseT,
} from '../lib/analyze';
import { findProblem } from '../data/problems';
import { specKey, specsToText, useShoeSpecs } from '../lib/shoeSpecs';
import { ShoeSpecView } from './ShoeSpecView';
import { InformeLink } from './InformeLink';
import { reportToText, type G2Report } from '../lib/mmruns';

const LAST_LINK = 'stridelab.ultimoEnlaceInforme';
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
    const e = p.ejercicio;
    parts.push(
      `${i + 1}. ${p.titulo} (${p.dato})\n${p.que_le_dices}` +
        (e ? `\nEn la cinta: ${e.nombre} — ${e.como}\nCue: "${e.cue}"\nNotará: ${e.que_notara}\nEn el G2: ${e.dato_a_vigilar}` : ''),
    );
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
  /** Enlace e informe guardados en la sesión. Sin ellos, el componente guarda los suyos. */
  link?: string;
  onLinkChange?: (link: string) => void;
  report?: G2Report | null;
  reportUpdatedAt?: string;
  /** Modelos de zapatilla anotados en la sesión, para incluir sus fichas técnicas. */
  shoeModels?: string[];
}

export function ReportAnalyzer(props: Props) {
  const { context = '', initial, onResult, onUseFindings, onReportLoaded, shoeModels = [] } = props;
  const { specs, saveSpec } = useShoeSpecs();
  const [key, setKey] = useState(getApiKey);
  const [editingKey, setEditingKey] = useState(!getApiKey());
  const [images, setImages] = useState<Img[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<Analysis | undefined>(initial);
  const [ownLink, setOwnLink] = useState(() => {
    try {
      return localStorage.getItem(LAST_LINK) ?? '';
    } catch {
      return '';
    }
  });
  const [ownReport, setOwnReport] = useState<G2Report | null>(null);
  const [ownUpdated, setOwnUpdated] = useState('');
  const link = props.link ?? ownLink;
  const report = props.report !== undefined ? props.report : ownReport;
  const setLink = (l: string) => {
    if (props.onLinkChange) props.onLinkChange(l);
    else {
      setOwnLink(l);
      try {
        localStorage.setItem(LAST_LINK, l);
      } catch {
        // sin almacenamiento
      }
    }
  };
  const handleLoaded = (r: G2Report, l: string) => {
    setOwnReport(r);
    setOwnUpdated(new Date().toISOString());
    onReportLoaded?.(r, l);
  };
  const [showApi, setShowApi] = useState(!!getApiKey());
  const [pasted, setPasted] = useState('');

  const models = [...new Set([...(report?.runs.map((r) => r.shoe) ?? []), ...shoeModels].filter((m) => m.trim()))];
  const reportData = () => [report ? reportToText(report) : '', specsToText(models, specs)].filter(Boolean).join('\n\n');

  // Sin API: la respuesta de claude.ai trae el análisis y las fichas de las zapatillas
  const usePasted = () => {
    setError('');
    try {
      const { analysis, fichas } = parseManualResponse(pasted);
      fichas.forEach((f) => saveSpec(specKey(f.modelo), f));
      setResult(analysis);
      onResult?.(analysis);
      setPasted('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se ha podido leer la respuesta.');
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
      const a = await analyzeReport(key, images, context, reportData());
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
        <InformeLink
          link={link}
          onLinkChange={setLink}
          report={report}
          onLoaded={handleLoaded}
          updatedAt={props.reportUpdatedAt ?? ownUpdated}
        />
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
        {report && (
          <>
            <h4 className="block-title">Fichas técnicas de las zapatillas</h4>
            {[...new Set(report.runs.map((r) => r.shoe))].map((m) => (
              <div key={m} className="spec-row">
                <b>{m}</b>
                <ShoeSpecView modelo={m} compact />
              </div>
            ))}
            <p className="hint small">Con las fichas, el análisis cruza drop, firmeza, placa, etc. con los datos del G2 para ver qué tipo de zapatilla le funciona.</p>
          </>
        )}
        {report && <p className="hint small">Informe de {report.name || 'cliente'} · {report.date}. ER/SA/SC: energy return, shock absorption y stride consistency (0–10).</p>}
      </Card>

      <Card title="Analizar con Claude (sin API)">
        <ol className="bullets">
          <li>
            Pulsa <b>Copiar para Claude</b>: copia los datos del informe{context ? ', el contexto de la sesión' : ''} y las instrucciones de Stride Lab.
          </li>
          <li>
            Abre una conversación nueva en claude.ai, pega y envía. Activa la búsqueda web para que encuentre las fichas de las
            zapatillas. Si no has cargado el enlace, adjunta ahí las capturas del informe.
          </li>
          <li>Copia la respuesta completa de Claude y pégala abajo.</li>
        </ol>
        <div className="row wrap">
          <CopyButton text={buildManualPrompt(context, reportData(), models)} label="Copiar para Claude" />
          <a className="btn small" href="https://claude.ai/new" target="_blank" rel="noreferrer">
            Abrir claude.ai
          </a>
          {!report && <span className="hint small">Consejo: carga antes el enlace del informe para pasarle los datos exactos.</span>}
        </div>
        <label className="field">
          <span className="field-label">Respuesta de Claude</span>
          <textarea rows={4} value={pasted} placeholder="Pega aquí la respuesta (el bloque JSON)…" onChange={(e) => setPasted(e.target.value)} />
        </label>
        <div className="row wrap">
          <button className="btn primary" disabled={!pasted.trim()} onClick={usePasted}>
            Usar respuesta
          </button>
          <label className="btn ghost">
            Importar análisis (.json)
            <input type="file" accept="application/json,.json" hidden onChange={(e) => e.target.files?.[0] && importJSON(e.target.files[0])} />
          </label>
        </div>
        {error && !showApi && <p className="warn">{error}</p>}
      </Card>

      {!showApi ? (
        <button className="btn small ghost" onClick={() => setShowApi(true)}>
          Usar con clave de API (opcional, análisis automático)
        </button>
      ) : (
      <Card
        title="Con clave de API (opcional): análisis automático y capturas"
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
          {busy && <span className="hint">Suele tardar entre 20 y 60 segundos.</span>}
          {!key && <span className="hint">Añade la clave de API para analizar.</span>}
        </div>
        {context && <p className="hint small">Se incluye el contexto de la sesión: ficha, tests y datos anotados.</p>}
        {error && <p className="warn">{error}</p>}
      </Card>
      )}

      {result && <AnalysisView a={result} onUseFindings={onUseFindings} />}
    </div>
  );
}

function AnalysisView({ a, onUseFindings }: { a: Analysis; onUseFindings?: (a: Analysis) => void }) {
  return (
    <>
      <Card title="Qué decirle y qué hacer en la cinta" aside={<CopyButton text={scriptText(a)} label="Copiar guion" />}>
        <p className="say">{a.guion.apertura}</p>
        {a.guion.zapatilla && (
          <div className="point">
            <h4>Zapatilla</h4>
            <p className="say">{a.guion.zapatilla}</p>
          </div>
        )}
        {a.guion.puntos.map((p, i) => (
          <div key={i} className="point">
            <h4>
              {i + 1}. {p.titulo} <span className="badge">{p.dato}</span>
            </h4>
            <p className="hint">{p.que_significa}</p>
            <p className="say">“{p.que_le_dices}”</p>
            {p.ejercicio && <LiveExerciseView e={p.ejercicio} />}
          </div>
        ))}
        <p className="say closing">{a.guion.cierre}</p>
        {onUseFindings && (
          <button className="btn" onClick={() => onUseFindings(a)}>
            Usar los 3 puntos en el mensaje post-sesión
          </button>
        )}
      </Card>

      {a.perfil_zapatilla && (
        <Card title="Qué tipo de zapatilla le funciona">
          <p className="say">{a.perfil_zapatilla.conclusion}</p>
          <div className="chips">
            {a.perfil_zapatilla.caracteristicas.map((c) => (
              <span key={c} className="chip static on">{c}</span>
            ))}
          </div>
          <p className="hint">{a.perfil_zapatilla.evidencia}</p>
        </Card>
      )}

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
            <h4 className="block-title">Patrones a mejorar</h4>
            <ul className="bullets">
              {a.problemas.map((p, i) => (
                <li key={i}>
                  <b>{p.problema}</b>
                  {findProblem(p.problema_id) && <span className="hint"> (guía {p.problema_id})</span>} — {p.evidencia}
                </li>
              ))}
            </ul>
          </>
        )}
      </Card>
    </>
  );
}

export function LiveExerciseView({ e }: { e: LiveExerciseT }) {
  return (
    <div className="live-ex">
      <b>En la cinta · {e.nombre}</b>
      <span>{e.como}</span>
      <q>{e.cue}</q>
      <span>
        <b>Notará:</b> {e.que_notara}
      </span>
      <span>
        <b>En el G2:</b> {e.dato_a_vigilar}
      </span>
    </div>
  );
}
