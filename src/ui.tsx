import { useEffect, useRef, useState, type ReactNode } from 'react';

export function Text({
  label, value, onChange, placeholder, area, unit, inputMode,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  area?: boolean;
  unit?: string;
  inputMode?: 'decimal' | 'numeric' | 'email' | 'tel' | 'text';
}) {
  return (
    <label className="field">
      <span className="field-label">
        {label}
        {unit && <em> ({unit})</em>}
      </span>
      {area ? (
        <textarea value={value} placeholder={placeholder} rows={3} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input value={value} placeholder={placeholder} inputMode={inputMode} onChange={(e) => onChange(e.target.value)} />
      )}
    </label>
  );
}

export function Choice<T extends string>({
  label, value, options, onChange,
}: {
  label: string;
  value: T;
  options: [T, string][];
  onChange: (v: T) => void;
}) {
  return (
    <div className="field">
      <span className="field-label">{label}</span>
      <div className="chips" role="radiogroup" aria-label={label}>
        {options.map(([v, l]) => (
          <button
            type="button"
            key={v}
            role="radio"
            aria-checked={value === v}
            className={value === v ? 'chip on' : 'chip'}
            onClick={() => onChange((value === v ? '' : v) as T)}
          >
            {l}
          </button>
        ))}
      </div>
    </div>
  );
}

export function Card({ title, children, aside }: { title?: ReactNode; children: ReactNode; aside?: ReactNode }) {
  return (
    <section className="card">
      {(title || aside) && (
        <header className="card-head">
          {title && <h3>{title}</h3>}
          {aside}
        </header>
      )}
      {children}
    </section>
  );
}

export function CopyButton({ text, label = 'Copiar' }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className="btn small"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
        } catch {
          const ta = document.createElement('textarea');
          ta.value = text;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand('copy');
          ta.remove();
        }
        setDone(true);
        setTimeout(() => setDone(false), 1500);
      }}
    >
      {done ? '✓ Copiado' : label}
    </button>
  );
}

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

/** Cronómetro con objetivo en minutos: se pone en rojo al pasarse. */
export function Timer({ minutes, label }: { minutes: number; label?: string }) {
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const started = useRef(0);

  useEffect(() => {
    if (!running) return;
    started.current = Date.now() - elapsed * 1000;
    const t = setInterval(() => setElapsed((Date.now() - started.current) / 1000), 250);
    return () => clearInterval(t);
  }, [running]);

  const over = elapsed > minutes * 60;
  return (
    <div className={over ? 'timer over' : 'timer'}>
      {label && <span className="timer-label">{label}</span>}
      <span className="timer-time">
        {fmt(elapsed)} <small>/ {minutes}′</small>
      </span>
      <button type="button" className="btn small" onClick={() => setRunning((r) => !r)}>
        {running ? 'Pausa' : elapsed ? 'Seguir' : 'Iniciar'}
      </button>
      {elapsed > 0 && !running && (
        <button type="button" className="btn small ghost" onClick={() => setElapsed(0)}>
          Reset
        </button>
      )}
    </div>
  );
}
