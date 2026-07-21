import { useState, useRef, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { getGameState } from '../services/api'
import wsService from '../services/websocket'
import { Eye, Target, Clock, Wifi, WifiOff, Loader2, Trophy, User, Hash, AlertCircle } from 'lucide-react'

function SpectateGuessRow({ guess, position, number, playerName, isPlayer1 }) {
  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-500 ${
      isPlayer1
        ? 'bg-primary-50/50 dark:bg-primary-900/10 border border-primary-200/30 dark:border-primary-800/30'
        : 'bg-gray-50/80 dark:bg-gray-800/20 border border-gray-200/30 dark:border-gray-700/30'
    }`}>
      <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500 min-w-[48px] truncate" title={playerName}>
        {playerName || 'Player'}
      </span>
      <div className="flex gap-1">
        {guess.split('').map((digit, i) => (
          <span key={i} className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center bg-white dark:bg-gray-800 rounded-lg font-bold text-sm shadow-sm">
            {digit}
          </span>
        ))}
      </div>
      <div className="flex items-center gap-2 ml-auto">
        <div className="text-center min-w-[28px]">
          <div className="text-[9px] text-gray-400 dark:text-gray-500 font-medium">Pos</div>
          <div className={`font-bold text-sm ${position === 3 ? 'text-green-500' : 'text-green-600 dark:text-green-400'}`}>
            {position}
          </div>
        </div>
        <div className="text-center min-w-[28px]">
          <div className="text-[9px] text-gray-400 dark:text-gray-500 font-medium">Num</div>
          <div className="font-bold text-sm text-yellow-600 dark:text-yellow-400">{number}</div>
        </div>
      </div>
    </div>
  )
}

export default function Spectate() {
  const { roomCode } = useParams()
  const navigate = useNavigate()
  const [gameState, setGameState] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [connectionStatus, setConnectionStatus] = useState('disconnected')
  const [guesses, setGuesses] = useState([])
  const [players, setPlayers] = useState([])
  const historyEndRef = useRef(null)

  // Fetch initial game state
  useEffect(() => {
    let cancelled = false
    const fetchState = async () => {
      try {
        const state = await getGameState(roomCode)
        if (cancelled) return
        setGameState(state)
        setPlayers(state.players || [])
        // Also fetch initial guess history via the API
        try {
          const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/spectate/game-state?room_code=${roomCode}`)
          const data = await res.json()
          if (!cancelled) {
            setGuesses(data.guesses || [])
          }
        } catch (e) {}
        setLoading(false)
      } catch (err) {
        if (!cancelled) {
          setError('Room not found or game has ended')
          setLoading(false)
        }
      }
    }
    fetchState()
    return () => { cancelled = true }
  }, [roomCode])

  // Connect WebSocket for live updates (spectate endpoint - no player_id needed)
  useEffect(() => {
    setConnectionStatus('connecting')
    wsService.connectSpectate(roomCode)

    const unsubConnStatus = wsService.on('connection_status', (status) => {
      setConnectionStatus(status)
    })

    // Listen for live guess results
    const unsubGuess = wsService.on('guess_result', (data) => {
      setGuesses(prev => [...prev, {
        guess: data.guess,
        position_count: data.position_count,
        number_count: data.number_count,
        player_id: data.player_id,
        created_at: new Date().toISOString(),
      }])
    })

    // Listen for turn changes
    const unsubTurn = wsService.on('turn_changed', (data) => {
      setGameState(prev => prev ? { ...prev, current_turn: data.player_id } : prev)
    })

    // Listen for winner
    const unsubWinner = wsService.on('winner', (data) => {
      setGameState(prev => prev ? { ...prev, status: 'finished', winner_id: data.winner_id } : prev)
    })

    return () => {
      unsubConnStatus()
      unsubGuess()
      unsubTurn()
      unsubWinner()
      wsService.disconnect()
    }
  }, [roomCode])

  // Poll for updates as fallback (for Vercel's flaky WebSocket)
  const pollRef = useRef(null)
  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/spectate/game-state?room_code=${roomCode}`)
        const data = await res.json()
        if (data) {
          setGameState(prev => prev ? {
            ...prev,
            status: data.status,
            current_turn: data.current_turn,
            winner_id: data.winner_id,
          } : prev)
          setGuesses(data.guesses || [])
          setPlayers(data.players || [])
        }
      } catch (e) {}
    }
    pollRef.current = setInterval(poll, 5000)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [roomCode])

  // Auto-scroll to latest guess
  useEffect(() => {
    historyEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [guesses])

  // Get player names for display
  const player1 = players[0] || null
  const player2 = players[1] || null
  const currentTurn = gameState?.current_turn
  const isFinished = gameState?.status === 'finished'
  const winnerId = gameState?.winner_id

  if (loading) {
    return (
      <div className="space-y-6 text-center pt-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-500 shadow-lg shadow-purple-500/30">
          <Eye size={32} className="text-white" />
        </div>
        <Loader2 size={28} className="animate-spin text-primary-500 mx-auto" />
        <p className="text-sm text-gray-500 dark:text-gray-400">Loading game...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6 text-center pt-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-900/30 shadow-lg">
          <AlertCircle size={32} className="text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Room Not Found</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">This room doesn't exist or the game has ended.</p>
        <Link to="/" className="btn-primary w-full">
          <Eye size={16} />
          Back Home
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Spectator Header */}
      <div className="card !p-4 space-y-3">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-all duration-200 text-xs">
            <Eye size={12} />
            <span className="hidden sm:inline">Spectate</span>
          </Link>
          <span className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-medium">
            <Eye size={12} />
            Watching
          </span>
          <span className="text-xs text-gray-300 dark:text-gray-600 font-medium">LIVE</span>
          <span className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs font-medium">
            {player2?.name || player1?.name || 'Players'}
          </span>
        </div>
        <div className="flex items-center justify-between text-[10px] text-gray-400 dark:text-gray-500">
          <span className="font-mono">#{roomCode}</span>
          <div className={`flex items-center gap-1 ${connectionStatus === 'connected' ? 'text-green-500' : 'text-yellow-500'}`}>
            {connectionStatus === 'connected' ? <Wifi size={12} /> : <WifiOff size={12} />}
            {connectionStatus === 'connected' ? 'Live' : 'Connecting...'}
          </div>
        </div>
      </div>

      {/* Player Info */}
      <div className="card !p-4 space-y-3">
        <h3 className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest flex items-center gap-2">
          <User size={12} />
          Players
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {player1 && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${currentTurn === player1.id ? 'bg-green-500 animate-pulse' : 'bg-gray-300 dark:bg-gray-600'}`} />
                <span className="text-sm font-bold text-gray-900 dark:text-white truncate">{player1.name}</span>
              </div>
              <div className="flex items-center gap-1.5">
                {player1.has_submitted_secret ? (
                  <span className="text-[10px] text-green-500 font-medium">Secret set</span>
                ) : (
                  <span className="text-[10px] text-yellow-500 font-medium">Choosing...</span>
                )}
              </div>
            </div>
          )}
          {player2 && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${currentTurn === player2.id ? 'bg-green-500 animate-pulse' : 'bg-gray-300 dark:bg-gray-600'}`} />
                <span className="text-sm font-bold text-gray-900 dark:text-white truncate">{player2.name}</span>
              </div>
              <div className="flex items-center gap-1.5">
                {player2.has_submitted_secret ? (
                  <span className="text-[10px] text-green-500 font-medium">Secret set</span>
                ) : (
                  <span className="text-[10px] text-yellow-500 font-medium">Choosing...</span>
                )}
              </div>
            </div>
          )}
          {!player2 && (
            <div className="flex items-center gap-2 text-sm text-gray-400 dark:text-gray-500">
              <Loader2 size={12} className="animate-spin" />
              Waiting for opponent...
            </div>
          )}
        </div>
      </div>

      {/* Status Bar */}
      {gameState && (
        <div className={`flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-300 ${
          isFinished
            ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 ring-1 ring-yellow-400/30'
            : gameState.status === 'playing'
            ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 ring-1 ring-green-400/30'
            : 'bg-gray-50 dark:bg-gray-800/30 text-gray-500 dark:text-gray-400'
        }`}>
          {isFinished ? <Trophy size={14} /> : gameState.status === 'playing' ? <Target size={14} /> : <Clock size={14} />}
          <span>
            {isFinished
              ? `Game Over! ${winnerId ? (winnerId === player1?.id ? player1?.name : player2?.name || 'Someone') + ' won!' : 'No winner'}` 
              : gameState.status === 'playing'
              ? `Playing — ${currentTurn === player1?.id ? player1?.name : player2?.name || 'Opponent'}'s turn`
              : 'Waiting for players...'}
          </span>
        </div>
      )}

      {/* Guess History */}
      <div className="card !p-4 space-y-3 max-h-80 overflow-y-auto">
        <h3 className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest flex items-center gap-2">
          <Target size={12} />
          Guess History ({guesses.length})
        </h3>
        {guesses.length === 0 ? (
          <div className="text-center py-6 space-y-2">
            <Eye size={28} className="opacity-20 text-gray-400 mx-auto" />
            <p className="text-xs text-gray-400 dark:text-gray-500">
              {gameState?.status === 'playing' ? 'Waiting for first guess...' : 'No guesses yet'}
            </p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {guesses.map((g, i) => {
              const guessPlayer = players.find(p => p.id === g.player_id)
              return (
                <SpectateGuessRow
                  key={i}
                  guess={g.guess}
                  position={g.position_count}
                  number={g.number_count}
                  playerName={guessPlayer?.name || 'Unknown'}
                  isPlayer1={g.player_id === player1?.id}
                />
              )
            })}
            <div ref={historyEndRef} />
          </div>
        )}
      </div>

      {/* Footer actions */}
      <div className="flex gap-3">
        <Link to="/" className="btn-secondary flex-1">
          <Eye size={14} />
          Back Home
        </Link>
        <button
          onClick={() => navigate(`/join-room?code=${roomCode}`)}
          className="btn-primary flex-1"
        >
          <User size={14} />
          Join Game
        </button>
      </div>
    </div>
  )
}
