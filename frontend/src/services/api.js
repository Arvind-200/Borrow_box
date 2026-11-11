const API_BASE = '/api'

function isFormData(value) {
  return typeof FormData !== 'undefined' && value instanceof FormData
}

async function request(path, { method = 'GET', body } = {}) {
  const headers = {}
  const isMultipart = isFormData(body)
  if (body !== undefined && !isMultipart) {
    headers['Content-Type'] = 'application/json'
  }

  let response
  try {
    response = await fetch(API_BASE + path, {
      method,
      headers,
      credentials: 'include',
      body:
        body === undefined
          ? undefined
          : isMultipart
            ? body
            : JSON.stringify(body),
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
  getProductLocations: (params = {}) =>
    request(`/products/locations${toQueryString(params)}`),
  getProduct: (id) => request(`/products/${encodeURIComponent(id)}`),
  getProductReviews: (id, params = {}) =>
    request(`/products/${encodeURIComponent(id)}/reviews${toQueryString(params)}`),
  getMyProducts: () => request('/products/mine'),
  getMyProduct: (id) => request(`/products/mine/${encodeURIComponent(id)}`),
  uploadProductImage: (file) => {
    const form = new FormData()
    form.append('image', file)
    return request('/products/images', { method: 'POST', body: form })
  },
  createProduct: (payload) => request('/products', { method: 'POST', body: payload }),
  updateProduct: (id, payload) =>
    request(`/products/${encodeURIComponent(id)}`, { method: 'PUT', body: payload }),
  setProductPublication: (id, isPublished) =>
    request(`/products/${encodeURIComponent(id)}/publication`, {
      method: 'PATCH',
      body: { isPublished },
    }),
  deleteProduct: (id) =>
    request(`/products/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  createBorrowRequest: (payload) =>
    request('/borrow-requests', { method: 'POST', body: payload }),
  getMyBorrowRequests: (params = {}) =>
    request(`/borrow-requests/my${toQueryString(params)}`),
  getIncomingBorrowRequests: (params = {}) =>
    request(`/borrow-requests/incoming${toQueryString(params)}`),
  acceptBorrowRequest: (id) =>
    request(`/borrow-requests/${encodeURIComponent(id)}/accept`, {
      method: 'PATCH',
    }),
  rejectBorrowRequest: (id) =>
    request(`/borrow-requests/${encodeURIComponent(id)}/reject`, {
      method: 'PATCH',
    }),
  cancelBorrowRequest: (id) =>
    request(`/borrow-requests/${encodeURIComponent(id)}/cancel`, {
      method: 'PATCH',
    }),
  completeBorrowRequest: (id) =>
    request(`/borrow-requests/${encodeURIComponent(id)}/complete`, {
      method: 'PATCH',
    }),
  createReview: (payload) =>
    request('/reviews', { method: 'POST', body: payload }),
  getMyReviews: (params = {}) =>
    request(`/reviews/mine${toQueryString(params)}`),
  createReport: (payload) =>
    request('/reports', { method: 'POST', body: payload }),
  getAdminDashboard: () => request('/admin/dashboard'),
  getAdminUsers: (params = {}) =>
    request(`/admin/users${toQueryString(params)}`),
  getAdminUser: (id) => request(`/admin/users/${encodeURIComponent(id)}`),
  warnAdminUser: (id, payload) =>
    request(`/admin/users/${encodeURIComponent(id)}/warn`, {
      method: 'PATCH',
      body: payload,
    }),
  blockAdminUser: (id, payload) =>
    request(`/admin/users/${encodeURIComponent(id)}/block`, {
      method: 'PATCH',
      body: payload,
    }),
  unblockAdminUser: (id, payload = {}) =>
    request(`/admin/users/${encodeURIComponent(id)}/unblock`, {
      method: 'PATCH',
      body: payload,
    }),
  getAdminProducts: (params = {}) =>
    request(`/admin/products${toQueryString(params)}`),
  getAdminProduct: (id) =>
    request(`/admin/products/${encodeURIComponent(id)}`),
  hideAdminProduct: (id, payload) =>
    request(`/admin/products/${encodeURIComponent(id)}/hide`, {
      method: 'PATCH',
      body: payload,
    }),
  removeAdminProduct: (id, payload) =>
    request(`/admin/products/${encodeURIComponent(id)}/remove`, {
      method: 'PATCH',
      body: payload,
    }),
  restoreAdminProduct: (id, payload = {}) =>
    request(`/admin/products/${encodeURIComponent(id)}/restore`, {
      method: 'PATCH',
      body: payload,
    }),
  getAdminBorrowRequests: (params = {}) =>
    request(`/admin/borrow-requests${toQueryString(params)}`),
  getAdminReports: (params = {}) =>
    request(`/admin/reports${toQueryString(params)}`),
  getAdminReport: (id) =>
    request(`/admin/reports/${encodeURIComponent(id)}`),
  resolveAdminReport: (id, payload) =>
    request(`/admin/reports/${encodeURIComponent(id)}/resolve`, {
      method: 'PATCH',
      body: payload,
    }),
  dismissAdminReport: (id, payload = {}) =>
    request(`/admin/reports/${encodeURIComponent(id)}/dismiss`, {
      method: 'PATCH',
      body: payload,
    }),
  getAdminReviews: (params = {}) =>
    request(`/admin/reviews${toQueryString(params)}`),
  hideAdminReview: (id, payload) =>
    request(`/admin/reviews/${encodeURIComponent(id)}/hide`, {
      method: 'PATCH',
      body: payload,
    }),
  removeAdminReview: (id, payload) =>
    request(`/admin/reviews/${encodeURIComponent(id)}/remove`, {
      method: 'PATCH',
      body: payload,
    }),
  restoreAdminReview: (id, payload = {}) =>
    request(`/admin/reviews/${encodeURIComponent(id)}/restore`, {
      method: 'PATCH',
      body: payload,
    }),
  getAdminCategories: () => request('/admin/categories'),
  createAdminCategory: (payload) =>
    request('/admin/categories', { method: 'POST', body: payload }),
  updateAdminCategory: (id, payload) =>
    request(`/admin/categories/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: payload,
    }),
  setAdminCategoryActive: (id, isActive) =>
    request(`/admin/categories/${encodeURIComponent(id)}/active`, {
      method: 'PATCH',
      body: { isActive },
    }),
  getAdminActivityLogs: (params = {}) =>
    request(`/admin/activity-logs${toQueryString(params)}`),
  getAdminSettings: () => request('/admin/settings'),
  updateAdminSettings: (payload) =>
    request('/admin/settings', { method: 'PUT', body: payload }),
}
