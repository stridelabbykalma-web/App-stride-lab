import { useEffect, useRef, useState } from 'react';
import { loadReport, type G2Report } from '../lib/mmruns';

const REFRESH_MS = 30_000;

interface Props {
  link: string;
  onLinkChange: (link: string) => void;
  /** Informe ya cargado (guardado en la sesión), para mostrar cuántas pasadas hay. */
  report: G2Report | null;
  onLoaded: (report: G2Report, link: string) => void;
  /** Hora de la última carga (ISO). */
  updatedAt?: string;
}

/**
 * Enlace compartido del informe de mmruns. Se guarda con la sesión y, al abrirla, se vuelve a consultar
 * para recoger las pasadas nuevas que se van grabando. Opcionalmente se actualiza solo cada 30 s.
 */
export function InformeLink({ link, onLinkChange, report, onLoaded, updatedAt }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [auto, setAuto] = useState(false);
  const [news, setNews] = useState('');

  // El intervalo y la carga inicial usan siempre los últimos datos y callbacks
  const latest = useRef({ link, report, onLoaded });
  latest.current = { link, report, onLoaded };

  const refresh = async () => {
    const { link: current, report: before } = latest.current;
    if (!current.trim()) return;
    setLoading(true);
    setError('');
    try {
      const r = await loadReport(current);
      const added = r.runs.length - (before?.runs.length ?? 0);
      setNews(before && added > 0 ? `+${added} pasada${added > 1 ? 's' : ''} nueva${added > 1 ? 's' : ''}` : '');
      latest.current.onLoaded(r, current.trim());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se ha podido cargar el informe.');
    } finally {
      setLoading(false);
    }
  };

  // Al abrir: si ya hay enlace guardado, mirar si hay pasadas nuevas
  useEffect(() => {
    if (latest.current.link.trim()) refresh();
  }, []);

  useEffect(() => {
    if (!auto) return;
    const t = setInterval(refresh, REFRESH_MS);
    return () => clearInterval(t);
  }, [auto]);

  const time = updatedAt ? new Date(updatedAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : '';

  return (
    <div className="stack informe-link">
      <div className="row wrap">
        <input
          className="grow"
          value={link}
          placeholder="Enlace del informe: https://shared.mmruns.com/areport2/index.php?r=…"
          onChange={(e) => onLinkChange(e.target.value)}
        />
        <button className="btn" disabled={!link.trim() || loading} onClick={refresh}>
          {loading ? 'Cargando…' : report ? 'Actualizar' : 'Cargar informe'}
        </button>
      </div>
      <div className="row wrap">
        {report && (
          <span className="hint small">
            {report.runs.length} pasada{report.runs.length === 1 ? '' : 's'}
            {time && ` · actualizado a las ${time}`}
          </span>
        )}
        {news && <span className="badge win">{news}</span>}
        {link.trim() && (
          <label className="check inline">
            <input type="checkbox" checked={auto} onChange={(e) => setAuto(e.target.checked)} />
            Actualizar solo cada 30 s
          </label>
        )}
      </div>
      {error && <p className="warn">{error}</p>}
    </div>
  );
}
