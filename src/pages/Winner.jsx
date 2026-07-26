import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useGame } from '../context/GameContext'
import { fetchGameResult, getHistory } from '../services/api'
import wsService from '../services/websocket'
import { Trophy, Home, Repeat2, User, Eye, Target, BarChart3, Loader2 } from 'lucide-react'

export default function Winner() {
  const { roomCode } = useParams()
  const navigate = useNavigate()
  const { playerName, playerId, winner, opponentName, resetGame } = useGame()
  const isWinner = winner?.winner_id === playerId
  const [secrets, setSecrets] = useState([])
  const [guesses, setGuesses] = useState([])
  const [revealed, setRevealed] = useState(false)
  const [loading, setLoading] = useState(true)

  // Fetch game result with secrets and guess history on mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const [result, history] = await Promise.all([
          fetchGameResult(roomCode),
          getHistory(roomCode, null)
        ])
        if (result.secrets) setSecrets(result.secrets)
        if (history.guesses) setGuesses(history.guesses)
      } catch (err) {
        // Fallback to winner data
        if (winner?.secrets) setSecrets(winner.secrets)
      }
      setLoading(false)
    }
    fetchData()
    // Auto-reveal
    setTimeout(() => setRevealed(true), 500)
  }, [roomCode, winner])

  // Also use secrets from winner data (if available from WS broadcast)
  const secretsFromWinner = winner?.secrets || []
  const displaySecrets = secrets.length > 0 ? secrets : secretsFromWinner

  const handlePlayAgain = useCallback(() => {
    resetGame()
    wsService.forceDisconnect()
    navigate('/create-room')
  }, [resetGame, navigate])

  const handleHome = useCallback(() => {
    resetGame()
    wsService.forceDisconnect()
    navigate('/')
  }, [resetGame, navigate])

  // Compute stats
  const myGuesses = guesses.filter(g => g.player_id === playerId)
  const opponentGuesses = guesses.filter(g => g.player_id !== playerId)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={32} className="animate-spin text-primary-500" />
      </div>
    )
  }

  return (
    <div className="space-y-5 text-center pt-4 pb-8">
      {/* Trophy Section */}
      <div className="space-y-3">
        <div className={`inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-2 ${
          isWinner ? 'bg-gradient-to-br from-yellow-400 to-amber-500 shadow-lg shadow-yellow-500/30 animate-bounce' : 'bg-gradient-to-br from-gray-400 to-gray-500 shadow-lg shadow-gray-500/20'
        }`}>
          <Trophy size={40} className="text-white" />
        </div>
        <h1 className={`text-3xl font-extrabold ${
          isWinner ? 'text-yellow-500' : 'text-gray-700 dark:text-gray-200'
        }`}>
          {isWinner ? 'You Won!' : 'Good Game!'}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
          {isWinner
            ? `Amazing! You cracked ${opponentName || 'your opponent'}'s secret code!`
            : `${winner?.winner_name || opponentName || 'Your opponent'} cracked your secret code!`}
        </p>
      </div>

      {/* Stats Card */}
      {guesses.length > 0 && (
        <div className="card !p-4 animate-slide-up">
          <div className="flex items-center justify-center gap-1.5 mb-3">
            <BarChart3 size={14} className="text-primary-500" />
            <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Game Statistics</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-primary-50 dark:bg-primary-900/20 rounded-xl p-3">
              <div className="text-2xl font-black text-primary-600 dark:text-primary-400">{myGuesses.length}</div>
              <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">{playerName}'s guesses</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-3">
              <div className="text-2xl font-black text-gray-700 dark:text-gray-300">{opponentGuesses.length}</div>
              <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">{opponentName || 'Opponent'}'s guesses</div>
            </div>
          </div>
        </div>
      )}

      {/* Guess History Analysis */}
      {guesses.length > 0 && (
        <div className="card !p-4 animate-slide-up">
          <div className="flex items-center justify-center gap-1.5 mb-3">
            <Target size={14} className="text-primary-500" />
            <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
              Guess History ({guesses.length})
            </span>
          </div>
          <div className="space-y-1.5 max-h-64 overflow-y-auto">
            {guesses.map((g, i) => {
              const isMyGuess = g.player_id === playerId
              return (
                <div key={g.guess_id || i} className={`flex items-center gap-2.5 p-2.5 rounded-xl transition-all ${
                  isMyGuess
                    ? 'bg-primary-50 dark:bg-primary-900/20 border border-primary-200/50 dark:border-primary-800/30'
                    : 'bg-gray-50 dark:bg-gray-800/20'
                }`}>
                  <div className="text-[10px] font-mono text-gray-400 w-5 text-right flex-shrink-0">{i + 1}</div>
                  <div className="flex gap-1 flex-shrink-0">
                    {g.guess?.split('').map((d, j) => (
                      <span key={j} className="w-7 h-8 flex items-center justify-center bg-white dark:bg-gray-800 rounded-lg text-xs font-bold shadow-sm text-primary-600 dark:text-primary-400 border border-primary-100 dark:border-primary-800/50">
                        {d}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 ml-auto flex-shrink-0">
                    <div className="text-center">
                      <div className="text-[8px] text-gray-400 font-medium">Pos</div>
                      <div className={`text-xs font-bold ${g.position_count === 3 ? 'text-green-500' : 'text-green-600 dark:text-green-400'}`}>{g.position_count}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-[8px] text-gray-400 font-medium">Num</div>
                      <div className="text-xs font-bold text-yellow-600 dark:text-yellow-400">{g.number_count}</div>
                    </div>
                  </div>
                  <div className="text-[9px] font-medium text-gray-400 w-16 text-right truncate flex-shrink-0">
                    {isMyGuess ? playerName : (opponentName || 'Opponent')}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Secret Numbers Reveal */}
      {revealed && displaySecrets.length > 0 && (
        <div className="card !p-5 animate-slide-up space-y-4">
          <div className="flex items-center justify-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center">
              <Eye size={16} className="text-purple-600 dark:text-purple-400" />
            </div>
            <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
              Secret Codes Revealed
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {displaySecrets.map((s, i) => (
              <div key={i} className="space-y-2">
                <div className="flex items-center justify-center gap-1.5">
                  <User size={12} className="text-gray-400" />
                  <span className="text-xs font-bold text-gray-700 dark:text-gray-300 truncate">{s.player_name}</span>
                </div>
                <div className="flex justify-center gap-1.5">
                  {s.secret_number?.split('').map((d, j) => (
                    <span key={j} className="w-10 h-11 flex items-center justify-center bg-white dark:bg-gray-700 rounded-xl text-lg font-bold shadow-sm border border-primary-200 dark:border-primary-800 text-primary-600 dark:text-primary-400">
                      {d}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Room */}
      <div className="card !p-4 space-y-2">
        <div className="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-widest">Game Room</div>
        <div className="text-xl font-bold tracking-widest bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent">
          {roomCode}
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-3">
        <button onClick={handleHome} className="btn-primary w-full">
          <Home size={16} />
          Home
        </button>
        <button onClick={handlePlayAgain} className="btn-secondary w-full">
          <Repeat2 size={16} />
          Play Again
        </button>
      </div>
    </div>
  )
}
