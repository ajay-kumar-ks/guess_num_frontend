import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { LogIn, User, Key, Loader2, AlertCircle } from 'lucide-react'

export default function JoinRoom() {
  const navigate = useNavigate()
  const [roomCode, setRoomCode] = useState('')
  const [playerName, setPlayerName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!roomCode.trim()) {
      setError('Please enter a room code')
      return
    }
    if (!playerName.trim()) {
      setError('Please enter your name')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/join-room`,
        { room_code: roomCode.trim().toUpperCase(), name: playerName.trim() }
      )
      navigate(`/waiting-room/${response.data.room_code}`, {
        state: { playerName: playerName.trim(), playerId: response.data.player_id },
      })
    } catch (err) {
      if (err.code === 'ERR_NETWORK') {
        setError('Cannot connect to the server. Is it running?')
      } else {
        setError(err.response?.data?.detail || 'Failed to join room')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2 pt-2">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 shadow-lg shadow-primary-500/30 mb-1">
          <LogIn size={28} className="text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Join a Room
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Enter the room code shared by your friend
        </p>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-5">
        <div className="space-y-2">
          <label htmlFor="roomCode" className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
            <Key size={14} className="text-gray-400" />
            Room Code
          </label>
          <input
            id="roomCode"
            type="text"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
            placeholder="Enter room code"
            className="input-field !text-xl !font-bold tracking-[0.3em]"
            maxLength={6}
            autoFocus
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="playerName" className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
            <User size={14} className="text-gray-400" />
            Your Name
          </label>
          <input
            id="playerName"
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Enter your name"
            className="input-field !text-base !font-normal !tracking-normal"
            maxLength={20}
            disabled={loading}
          />
        </div>

        {error && (
          <div className="flex items-start gap-2.5 p-3.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-600 dark:text-red-400">
            <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Joining room...
            </>
          ) : (
            <>
              <LogIn size={18} />
              Join Room
            </>
          )}
        </button>
      </form>
    </div>
  )
}
