class WebSocketService {
  constructor() {
    this.ws = null
    this.listeners = new Map()
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 20  // Increased for Vercel's frequent restarts
    this.reconnectDelay = 1000
    this.heartbeatInterval = null
    this.isConnecting = false
    this._roomCode = null
    this._playerId = null
  }

  connect(roomCode, playerId) {
    if (this.isConnecting) return
    this.isConnecting = true
    this._roomCode = roomCode
    this._playerId = playerId

    let baseUrl = import.meta.env.VITE_WS_BASE_URL
    // Auto-detect protocol: use wss:// when page is served over HTTPS
    if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
      baseUrl = baseUrl.replace(/^ws:/, 'wss:')
    }
    const wsUrl = `${baseUrl}/ws/${roomCode}/${playerId}`
    console.log(`[WS] Connecting to ${wsUrl}`)

    try {
      this.ws = new WebSocket(wsUrl)
    } catch (error) {
      console.error('[WS] Connection error:', error)
      this.isConnecting = false
      return
    }

    this.ws.onopen = () => {
      console.log('[WS] Connected')
      this.isConnecting = false
      // Emit 'reconnected' if this is a reconnection (not first connect)
      if (this.reconnectAttempts > 0) {
        this._emit('connection_status', 'reconnected')
      }
      this.reconnectAttempts = 0
      this._emit('connection_status', 'connected')
      this._startHeartbeat()
    }

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        console.log('[WS] Received:', data)

        switch (data.type) {
          case 'room_joined':
            this._emit('room_joined', data)
            break
          case 'opponent_joined':
            this._emit('opponent_joined', data)
            break
          case 'game_started':
            this._emit('game_started', data)
            break
          case 'guess_result':
            this._emit('guess_result', data)
            break
          case 'turn_changed':
            this._emit('turn_changed', data)
            break
          case 'winner':
            this._emit('winner', data)
            break
          case 'opponent_disconnected':
            this._emit('opponent_disconnected', data)
            break
          case 'error':
            this._emit('error', data)
            break
          case 'heartbeat_ack':
            // Server acknowledged heartbeat - silently handled
            break
          default:
            console.log('[WS] Unknown event type:', data.type)
        }
      } catch (error) {
        console.error('[WS] Parse error:', error)
      }
    }

    this.ws.onclose = (event) => {
      console.log('[WS] Disconnected:', event.code, event.reason)
      this.isConnecting = false
      this._stopHeartbeat()
      this._emit('connection_status', 'disconnected')

      if (!event.wasClean && this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++
        // Exponential backoff with jitter: 1s, 2s, 4s, 8s, ... max 30s
        const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts - 1), 30000)
        const jitter = Math.random() * 1000
        const totalDelay = delay + jitter
        console.log(
          `[WS] Reconnecting in ${Math.round(totalDelay)}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`
        )
        setTimeout(() => this.connect(roomCode, playerId), totalDelay)
      }
    }

    this.ws.onerror = (error) => {
      console.error('[WS] Error:', error)
      this.isConnecting = false
    }
  }

  disconnect() {
    this._stopHeartbeat()
    this.reconnectAttempts = this.maxReconnectAttempts
    if (this.ws) {
      this.ws.close(1000, 'User disconnected')
      this.ws = null
    }
    this._emit('connection_status', 'disconnected')
  }

  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data))
    } else {
      console.warn('[WS] Cannot send, not connected')
    }
  }

  sendGuess(guess) {
    this.send({ type: 'guess', guess })
  }

  connectSpectate(roomCode) {
    // Connect as a spectator (read-only, no player_id needed)
    if (this.isConnecting) return
    this.isConnecting = true
    this._roomCode = roomCode
    this._playerId = null

    let baseUrl = import.meta.env.VITE_WS_BASE_URL
    if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
      baseUrl = baseUrl.replace(/^ws:/, 'wss:')
    }
    const wsUrl = `${baseUrl}/ws/spectate/${roomCode}`
    console.log(`[WS] Spectating ${wsUrl}`)

    try {
      this.ws = new WebSocket(wsUrl)
    } catch (error) {
      console.error('[WS] Connection error:', error)
      this.isConnecting = false
      return
    }

    this.ws.onopen = () => {
      console.log('[WS] Spectator connected')
      this.isConnecting = false
      if (this.reconnectAttempts > 0) {
        this._emit('connection_status', 'reconnected')
      }
      this.reconnectAttempts = 0
      this._emit('connection_status', 'connected')
      this._startHeartbeat()
    }

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        console.log('[WS] Spectator received:', data)

        switch (data.type) {
          case 'spectate_joined':
            this._emit('spectate_joined', data)
            break
          case 'guess_result':
            this._emit('guess_result', data)
            break
          case 'turn_changed':
            this._emit('turn_changed', data)
            break
          case 'winner':
            this._emit('winner', data)
            break
          case 'game_started':
            this._emit('game_started', data)
            break
          case 'opponent_joined':
            this._emit('opponent_joined', data)
            break
          case 'error':
            this._emit('error', data)
            break
          case 'heartbeat_ack':
            break
          default:
            console.log('[WS] Unknown spectator event type:', data.type)
        }
      } catch (error) {
        console.error('[WS] Parse error:', error)
      }
    }

    this.ws.onclose = (event) => {
      console.log('[WS] Spectator disconnected:', event.code, event.reason)
      this.isConnecting = false
      this._stopHeartbeat()
      this._emit('connection_status', 'disconnected')

      if (!event.wasClean && this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++
        const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts - 1), 30000)
        const jitter = Math.random() * 1000
        const totalDelay = delay + jitter
        console.log(`[WS] Reconnecting spectator in ${Math.round(totalDelay)}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`)
        setTimeout(() => this.connectSpectate(roomCode), totalDelay)
      }
    }

    this.ws.onerror = (error) => {
      console.error('[WS] Spectator error:', error)
      this.isConnecting = false
    }
  }

  sendReady() {
    this.send({ type: 'player_ready' })
  }

  sendHeartbeat() {
    this.send({ type: 'heartbeat' })
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event).add(callback)
    return () => this.off(event, callback)
  }

  off(event, callback) {
    this.listeners.get(event)?.delete(callback)
  }

  _emit(event, data) {
    this.listeners.get(event)?.forEach((callback) => callback(data))
  }

  _startHeartbeat() {
    this._stopHeartbeat()
    // Aggressive heartbeat (5s) to keep Vercel serverless WebSocket alive
    // Vercel Hobby plan has ~10s idle timeout, so we heartbeat every 5s to stay active
    this.heartbeatInterval = setInterval(() => {
      this.sendHeartbeat()
    }, 5000)
  }

  _stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }
}

// Singleton instance
const wsService = new WebSocketService()
export default wsService
