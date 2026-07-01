import { json } from '../utils.mjs';
import { handleStatic } from './static/index.mjs';

const sensorhubRoutes = {
  static: handleStatic,
};

export async function handleSensorhub(req, res, path, url) {
  const [api, first, ...rest] = path;
  const handler = sensorhubRoutes[first];

  if (!handler || api !== 'api') {
    return json(res, 404, { error: 'Not found' });
  }

  return await handler(req, res, rest, url);
}
