import { createServer } from 'http';
import { handleSensorhub } from './sensorhub/index.mjs';
import { json } from './utils.mjs';

const PORT = process.env.MOCK_SERVER_PORT ?? 3001;

const routes = {
  '/sensorhub': handleSensorhub,
};

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', `http://localhost:${PORT}`);
  const prefix = '/' + url.pathname.split('/')[1];
  const handler = routes[prefix];

  if (url.pathname === '/health') {
    return json(res, 200, { status: 'ok' });
  }

  if (!handler) {
    return json(res, 404, { error: 'Not found' });
  }

  const subpath = url.pathname.split('/').slice(2).filter(Boolean);

  return await handler(req, res, subpath, url);
});

server.listen(PORT, () => {
  console.log(`Mock server running on port ${PORT}`);
});

process.on('SIGTERM', () => server.close(() => process.exit(0)));
process.on('SIGINT', () => server.close(() => process.exit(0)));
