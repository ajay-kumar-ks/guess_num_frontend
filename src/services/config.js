const normalizeBaseUrl = (value) => {
  if (!value) return ''
  return value.replace(/\/$/, '')
}

export const getApiBaseUrl = () => {
  const configured = normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL || '')
  if (configured) return configured

  if (typeof window !== 'undefined') {
    const { hostname, protocol } = window.location
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return `${protocol}//localhost:8000`
    }
    return `${window.location.origin}/api`
  }

  return 'http://localhost:8000'
}

export const getWsBaseUrl = () => {
  const configured = normalizeBaseUrl(import.meta.env.VITE_WS_BASE_URL || '')
  if (configured) return configured

  if (typeof window !== 'undefined') {
    const { hostname, protocol } = window.location
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return `${protocol === 'https:' ? 'wss:' : 'ws:'}//localhost:8000`
    }
    return `${protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}`
  }

  return 'ws://localhost:8000'
}
