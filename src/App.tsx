import { useRef, useState, type ReactNode } from 'react';
import { useDB, newClient, newSession, type DB } from './storage';
import { ClientForm } from './views/ClientForm';
import { SessionView } from './views/SessionView';
import { SessionReport } from './views/SessionReport';
import { GuideView, ProtocolView, WhatsAppView } from './views/Reference';
import { Card } from './ui';

type Route =
  | { view: 'clients' }
  | { view: 'client'; id: string }
  | { view: 'session'; id: string }
  | { view: 'guide' }
  | { view: 'protocol' }
  | { view: 'whatsapp' };

const TABS: [Route['view'], string][] = [
  ['clients', 'Clientes'],
  ['whatsapp', 'WhatsApp previo'],
  ['protocol', 'Tests clínicos'],
  ['guide', 'Guía 15 problemas'],
];

export default function App() {
  const { db, upsertClient, deleteClient, upsertSession, deleteSession, replaceAll } = useDB();
  const [route, setRoute] = useState<Route>({ view: 'clients' });
  const [q, setQ] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(db, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `stridelab-g2-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const importJSON = async (file: File) => {
    try {
      const data = JSON.parse(await file.text()) as DB;
      if (!Array.isArray(data.clients) || !Array.isArray(data.sessions)) throw new Error();
      if (confirm(`Importar ${data.clients.length} clientes y ${data.sessions.length} sesiones? Sustituye los datos actuales.`)) replaceAll(data);
    } catch {
      alert('Archivo no válido.');
    }
  };

  let content: ReactNode = null;
  let crumb: ReactNode = null;

  if (route.view === 'clients') {
    const list = db.clients
      .filter((c) => !q || c.nombre.toLowerCase().includes(q.toLowerCase()))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    content = (
      <div className="stack">
        <div className="row wrap">
          <input className="search grow" placeholder="Buscar cliente…" value={q} onChange={(e) => setQ(e.target.value)} />
          <button
            className="btn primary"
            onClick={() => {
              const c = newClient();
              upsertClient(c);
              setRoute({ view: 'client', id: c.id });
            }}
          >
            + Nuevo cliente
          </button>
        </div>
        {list.length === 0 && (
          <Card>
            <p className="hint">
              Sin clientes todavía. Flujo: 1) envía la secuencia de <b>WhatsApp previo</b> · 2) crea el cliente y rellena la ficha · 3) inicia la
              sesión G2 el día de la cita.
            </p>
          </Card>
        )}
        {list.map((c) => {
          const sessions = db.sessions.filter((s) => s.clientId === c.id);
          return (
            <button key={c.id} className="list-item" onClick={() => setRoute({ view: 'client', id: c.id })}>
              <b>{c.nombre || 'Sin nombre'}</b>
              <span>
                {[c.edad && `${c.edad} años`, c.kmSemana && `${c.kmSemana} km/sem`, c.zapEntreno].filter(Boolean).join(' · ')}
              </span>
              <span className="badge">{sessions.length} sesión{sessions.length === 1 ? '' : 'es'}</span>
            </button>
          );
        })}
        <div className="row wrap footer-actions">
          <button className="btn small ghost" onClick={exportJSON}>Exportar copia (JSON)</button>
          <button className="btn small ghost" onClick={() => fileRef.current?.click()}>Importar copia</button>
          <input ref={fileRef} type="file" accept="application/json" hidden onChange={(e) => e.target.files?.[0] && importJSON(e.target.files[0])} />
        </div>
        <p className="hint small">Los datos se guardan solo en este navegador. Exporta una copia con regularidad.</p>
      </div>
    );
  } else if (route.view === 'client') {
    const client = db.clients.find((c) => c.id === route.id);
    if (client) {
      const sessions = db.sessions.filter((s) => s.clientId === client.id).sort((a, b) => b.fecha.localeCompare(a.fecha));
      crumb = client.nombre || 'Nuevo cliente';
      content = (
        <div className="stack">
          <Card
            title="Sesiones G2"
            aside={
              <button
                className="btn primary"
                onClick={() => {
                  const s = newSession(client);
                  upsertSession(s);
                  setRoute({ view: 'session', id: s.id });
                }}
              >
                ▶ Iniciar sesión
              </button>
            }
          >
            {sessions.length === 0 && <p className="hint">Ninguna sesión todavía.</p>}
            {sessions.map((s) => {
              const winner = s.shoes.find((x) => x.id === s.winnerShoeId);
              return (
                <div key={s.id} className="row between session-row">
                  <button className="link" onClick={() => setRoute({ view: 'session', id: s.id })}>
                    {s.fecha} · {winner ? `★ ${winner.modelo}` : `${s.shoes.length} zapatillas`}
                  </button>
                  <button
                    className="btn small ghost danger"
                    onClick={() => confirm('¿Borrar esta sesión?') && deleteSession(s.id)}
                  >
                    Borrar
                  </button>
                </div>
              );
            })}
          </Card>
          <h2>Ficha de cliente</h2>
          <ClientForm client={client} onChange={upsertClient} />
          <button
            className="btn ghost danger"
            onClick={() => {
              if (confirm(`¿Borrar a ${client.nombre || 'este cliente'} y todas sus sesiones?`)) {
                deleteClient(client.id);
                setRoute({ view: 'clients' });
              }
            }}
          >
            Borrar cliente
          </button>
        </div>
      );
    }
  } else if (route.view === 'session') {
    const session = db.sessions.find((s) => s.id === route.id);
    const client = session && db.clients.find((c) => c.id === session.clientId);
    if (session && client) {
      crumb = (
        <>
          <button className="link" onClick={() => setRoute({ view: 'client', id: client.id })}>
            {client.nombre || 'Cliente'}
          </button>{' '}
          › Sesión {session.fecha}
        </>
      );
      content = (
        <>
          <div className="screen-only">
            <SessionView session={session} client={client} onChange={upsertSession} />
          </div>
          <SessionReport session={session} client={client} />
        </>
      );
    }
  } else if (route.view === 'guide') {
    content = <GuideView />;
  } else if (route.view === 'protocol') {
    content = <ProtocolView />;
  } else {
    content = <WhatsAppView />;
  }

  if (!content) content = <p className="hint">No encontrado.</p>;

  const activeTab = route.view === 'client' || route.view === 'session' ? 'clients' : route.view;

  return (
    <div className="app">
      <header className="topbar screen-only">
        <button className="brand" onClick={() => setRoute({ view: 'clients' })}>
          <span className="logo">SL</span>
          <span>
            Stride Lab <small>by Kalma · Análisis G2</small>
          </span>
        </button>
        <nav className="tabs">
          {TABS.map(([v, l]) => (
            <button key={v} className={activeTab === v ? 'tab on' : 'tab'} onClick={() => setRoute({ view: v } as Route)}>
              {l}
            </button>
          ))}
        </nav>
      </header>
      <main className="main">
        {crumb && <div className="crumb screen-only">{crumb}</div>}
        {content}
      </main>
    </div>
  );
}
