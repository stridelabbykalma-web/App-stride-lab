import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { fetchMmrunsReport } from './server/mmruns';

// En local (npm run dev / preview) sirve /api/mmruns igual que la función de Vercel en api/mmruns.ts
const mmrunsApi = (): Plugin => {
  const middleware = async (req: { url?: string }, res: import('node:http').ServerResponse, next: () => void) => {
    if (!req.url?.startsWith('/api/mmruns')) return next();
    const code = new URL(req.url, 'http://localhost').searchParams.get('r') ?? '';
    res.setHeader('content-type', 'application/json');
    try {
      res.end(JSON.stringify(await fetchMmrunsReport(code)));
    } catch (e) {
      res.statusCode = 502;
      res.end(JSON.stringify({ error: e instanceof Error ? e.message : 'Error' }));
    }
  };
  return {
    name: 'mmruns-api',
    configureServer: (server) => void server.middlewares.use(middleware),
    configurePreviewServer: (server) => void server.middlewares.use(middleware),
  };
};

// base relativa para poder servirla desde GitHub Pages o cualquier subcarpeta
export default defineConfig({
  base: './',
  plugins: [react(), mmrunsApi()],
});
