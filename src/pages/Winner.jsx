import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useGame } from '../context/GameContext'
import { fetchGameResult } from '../services/api'
import { Trophy, Home, Repeat2, User, Eye, Shield } from 'lucide-react'

export default function Winner() {
  const { roomCode } = useParams()
  const { playerName, playerId, winner, opponentName } = useGame()
  const isWinner = winner?.winner_id === playerId
  const [secrets, setSecrets] = useState([])
  const [revealed, setRevealed] = useState(false)

  // Fetch game result with secrets on mount (in case WS didn't deliver them)
  useEffect(() => {
    fetchGameResult(roomCode).then(result => {
      if (result.secrets) setSecrets(result.secrets)
    }).catch(() => {})
    // Auto-reveal
    setTimeout(() => setRevealed(true), 500)
  }, [roomCode])

  // Also use secrets from winner data (if available from WS broadcast)
  const secretsFromWinner = winner?.secrets || []
  const displaySecrets = secrets.length > 0 ? secrets : secretsFromWinner

  return (
    <div className="space-y-6 text-center pt-4">
      <div className="space-y-4">
        <div className={`inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-2 ${
          isWinner ? 'bg-gradient-to-br from-yellow-400 to-amber-500 shadow-lg shadow-yellow-500/30' : 'bg-gradient-to-br from-gray-400 to-gray-500 shadow-lg shadow-gray-500/20'
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
        <Link to="/" className="btn-primary w-full">
          <Home size={16} />
          Home
        </Link>
        <Link to="/create-room" className="btn-secondary w-full">
          <Repeat2 size={16} />
          Play Again
        </Link>
      </div>
    </div>
  )
}
