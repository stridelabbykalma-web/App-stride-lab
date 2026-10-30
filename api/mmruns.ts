// Función serverless (Vercel): GET /api/mmruns?r=CÓDIGO → JSON del informe de mmruns.com
import { fetchMmrunsReport } from '../server/mmruns.js';

export async function GET(req: Request): Promise<Response> {
  const code = new URL(req.url).searchParams.get('r') ?? '';
  try {
    const report = await fetchMmrunsReport(code);
    return Response.json(report, { headers: { 'cache-control': 'private, no-store' } });
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : 'Error' }, { status: 502 });
  }
}
