import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
})

// Create a new room
export const createRoom = async (name) => {
  const response = await api.post('/create-room', { name })
  return response.data
}

// Join an existing room
export const joinRoom = async (roomCode, name) => {
  const response = await api.post('/join-room', {
    room_code: roomCode,
    name,
  })
  return response.data
}

// Submit secret number
export const submitSecret = async (roomCode, playerId, secretNumber) => {
  const response = await api.post('/submit-secret', {
    room_code: roomCode,
    player_id: playerId,
    secret_number: secretNumber,
  })
  return response.data
}

// Make a guess
export const makeGuess = async (roomCode, playerId, guess) => {
  const response = await api.post('/guess', {
    room_code: roomCode,
    player_id: playerId,
    guess,
  })
  return response.data
}

// Get game state
export const getGameState = async (roomCode) => {
  const response = await api.get(`/game-state?room_code=${roomCode}`)
  return response.data
}

// Get guess history
export const getHistory = async (roomCode, playerId) => {
  const response = await api.get(`/history?room_code=${roomCode}&player_id=${playerId}`)
  return response.data
}

// Get winner
export const getWinner = async (roomCode) => {
  const response = await api.get(`/winner?room_code=${roomCode}`)
  return response.data
}

// Health check
export const healthCheck = async () => {
  const response = await api.get('/health')
  return response.data
}

export default api
