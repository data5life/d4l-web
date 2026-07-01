/**
 * @param {import('http').ServerResponse} res
 * @param {number} status
 * @param {unknown} data
 */
export function json(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(body);
}
