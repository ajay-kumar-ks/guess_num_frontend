class WebSocketService {
  constructor() {
    this.ws = null
    this.listeners = new Map()
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5
    this.reconnectDelay = 2000
    this.heartbeatInterval = null
    this.isConnecting = false
  }

  connect(roomCode, playerId) {
    if (this.isConnecting) return
    this.isConnecting = true

    const wsUrl = `${import.meta.env.VITE_WS_BASE_URL}/ws/${roomCode}/${playerId}`
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
        console.log(
          `[WS] Reconnecting in ${this.reconnectDelay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`
        )
        setTimeout(() => this.connect(roomCode, playerId), this.reconnectDelay)
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
    this.heartbeatInterval = setInterval(() => {
      this.sendHeartbeat()
    }, 30000)
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
