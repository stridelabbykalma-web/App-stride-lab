// Descarga un informe compartido de MotionMetrix (shared.mmruns.com) a partir de su código.
// El enlace que se manda al cliente (areport2/index.php?r=CÓDIGO) deja una cookie report_token
// con la que /api/report/CÓDIGO devuelve el informe en JSON. Se usa desde el servidor porque
// esa API no permite llamadas desde otra web (CORS).

const BASE = 'https://shared.mmruns.com';

export const isReportCode = (code: string) => /^[A-Z0-9]{8,40}$/.test(code);

export async function fetchMmrunsReport(code: string): Promise<unknown> {
  if (!isReportCode(code)) throw new Error('Código de informe no válido');

  const page = await fetch(`${BASE}/areport2/index.php?r=${code}`, { redirect: 'manual' });
  const cookies = (page.headers.getSetCookie?.() ?? [page.headers.get('set-cookie') ?? ''])
    .map((c) => c.split(';')[0])
    .filter(Boolean)
    .join('; ');
  if (!cookies) throw new Error('mmruns no ha devuelto la sesión del informe (¿enlace caducado?)');

  const res = await fetch(`${BASE}/api/report/${code}`, { headers: { cookie: cookies, accept: 'application/json' }, redirect: 'manual' });
  if (res.status !== 200) throw new Error(`mmruns respondió ${res.status} al pedir el informe`);
  return res.json();
}
