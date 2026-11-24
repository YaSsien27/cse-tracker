// Talks to our own Express server

// Sends a request. Returns the reply, or throws an Error with a clear message.
async function request(path, options) {
  let response
  try {
    response = await fetch(`/api${path}`, options)
  } catch {
    throw new Error('Could not reach the server. Is it running?')
  }

  // 204 means "done, nothing to send back" (used after deleting)
  if (response.status === 204) return null

  // If the reply is not JSON (for example, the server is off), use null
  const data = await response.json().catch(() => null)

  if (!response.ok || data === null) {
    throw new Error(data?.error || 'The server did not reply properly. Is it running?')
  }
  return data
}

// Sends data to the server as JSON. method is 'POST' (add) or 'PUT' (edit).
function send(method, path, data) {
  return request(path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
}

export function getPortfolio() {
  return request('/portfolio')
}

export function getPrices(symbol) {
  return request(`/prices/${encodeURIComponent(symbol)}`)
}

// --- Holdings ---

export function addHolding(holding) {
  return send('POST', '/holdings', holding)
}

export function updateHolding(id, holding) {
  return send('PUT', `/holdings/${id}`, holding)
}

export function deleteHolding(id) {
  return request(`/holdings/${id}`, { method: 'DELETE' })
}

// --- Alerts ---

export function getAlerts() {
  return request('/alerts')
}

export function addAlert(alert) {
  return send('POST', '/alerts', alert)
}

export function updateAlert(id, alert) {
  return send('PUT', `/alerts/${id}`, alert)
}

export function deleteAlert(id) {
  return request(`/alerts/${id}`, { method: 'DELETE' })
}
