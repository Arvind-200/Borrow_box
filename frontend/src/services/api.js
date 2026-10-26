const API_BASE = '/api'

async function request(path, { method = 'GET', body } = {}) {
  const headers = {}
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
  }

  let response
  try {
    response = await fetch(API_BASE + path, {
      method,
      headers,
      credentials: 'include',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new Error('Unable to reach the server. Check your connection and try again.')
  }

  let data = null
  const text = await response.text()
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = null
    }
  }

  if (!response.ok) {
    const message = data?.message || `Something went wrong (error ${response.status})`
    const error = new Error(message)
    error.status = response.status
    throw error
  }

  return data
}

function toQueryString(params) {
  const search = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) return
    const text = String(value).trim()
    if (text !== '') search.set(key, text)
  })
  const query = search.toString()
  return query ? `?${query}` : ''
}

export const api = {
  me: () => request('/auth/me'),
  signup: (payload) => request('/auth/signup', { method: 'POST', body: payload }),
  login: (payload) => request('/auth/login', { method: 'POST', body: payload }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  getCategories: () => request('/categories'),
  getProducts: (params = {}) => request(`/products${toQueryString(params)}`),
  getProduct: (id) => request(`/products/${encodeURIComponent(id)}`),
}
