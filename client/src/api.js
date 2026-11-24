// Talks to our own Express server

// Sends a request. Returns the reply, or throws an Error with a clear message.
async function request(path, options) {
  let response
  try {
    response = await fetch(`/api${path}`, options)
  } catch {
    throw new Error('Could not reach the server. Is it running?')
  }

  // If the reply is not JSON (for example, the server is off), use null
  const data = await response.json().catch(() => null)

  if (!response.ok || data === null) {
    throw new Error(data?.error || 'The server did not reply properly. Is it running?')
  }
  return data
}

export function getPortfolio() {
  return request('/portfolio')
}

export function getPrices(symbol) {
  return request(`/prices/${encodeURIComponent(symbol)}`)
}

export function getAlerts() {
  return request('/alerts')
}

// Sends data to the server as JSON
function post(path, data) {
  return request(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
}

export function addHolding(holding) {
  return post('/holdings', holding)
}

export function addAlert(alert) {
  return post('/alerts', alert)
}
