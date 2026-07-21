import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useGame } from '../context/GameContext'
import { Trophy, Home, Repeat2, X, Eye, Shield } from 'lucide-react'

export default function WinnerModal({ roomCode, onClose }) {
  const { playerName, playerId, winner, opponentName } = useGame()
  const isWinner = winner?.winner_id === playerId
  const [visible, setVisible] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [revealSecrets, setRevealSecrets] = useState(false)

  // Get secrets from the winner data (from WS broadcast or polling fetch)
  const secrets = winner?.secrets || []

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
    if (isWinner) setTimeout(() => setShowConfetti(true), 300)
    // Auto-reveal secrets after a short delay
    setTimeout(() => setRevealSecrets(true), 1200)
  }, [isWinner])

  // Find my secret and opponent's secret
  const mySecret = secrets.find(s => s.player_id === playerId)
  const opponentSecret = secrets.find(s => s.player_id !== playerId)

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-500 ${visible ? 'opacity-100' : 'opacity-0'}`}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {showConfetti && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div key={i} className="absolute w-2 h-2 rounded-full animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                backgroundColor: ['#f59e0b','#ef4444','#3b82f6','#10b981','#8b5cf6','#ec4899'][i % 6],
                animationDelay: `${i * 0.15}s`, animationDuration: `${2 + Math.random() * 2}s`,
              }} />
          ))}
        </div>
      )}

      <div className={`relative bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 max-w-sm w-full text-center transform transition-all duration-500 border border-gray-100 dark:border-gray-700 ${visible ? 'scale-100 translate-y-0' : 'scale-75 translate-y-8'}`}>
        <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-gray-400">
          <X size={16} />
        </button>

        <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 ${
          isWinner ? 'bg-gradient-to-br from-yellow-400 to-amber-500 shadow-lg shadow-yellow-500/30' : 'bg-gradient-to-br from-gray-400 to-gray-500 shadow-lg'
        }`}>
          <Trophy size={32} className="text-white" />
        </div>

        <h2 className={`text-2xl font-bold mb-2 ${isWinner ? 'text-yellow-500' : 'text-gray-700 dark:text-gray-200'}`}>
          {isWinner ? 'You Won!' : 'Good Game!'}
        </h2>

        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          {isWinner
            ? `Amazing! You cracked ${opponentName || 'your opponent'}'s code!`
            : `${winner?.winner_name || opponentName || 'Your opponent'} cracked your code!`}
        </p>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3">
            <div className="text-base font-bold text-green-600 dark:text-green-400">{playerName}</div>
            <div className="text-[10px] text-gray-400">{isWinner ? 'Winner' : 'Player'}</div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3">
            <div className="text-base font-bold text-gray-700 dark:text-gray-300">{opponentName || 'Unknown'}</div>
            <div className="text-[10px] text-gray-400">{!isWinner ? 'Winner' : 'Player'}</div>
          </div>
        </div>

        {/* Secret Numbers Reveal */}
        {revealSecrets && secrets.length > 0 && (
          <div className="animate-slide-up space-y-3 mb-4">
            <div className="flex items-center justify-center gap-1.5">
              <Eye size={14} className="text-gray-400" />
              <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Secret Codes Revealed</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {secrets.map((s, i) => (
                <div key={i} className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-3 space-y-1.5">
                  <div className="text-[10px] font-medium text-gray-400 truncate">{s.player_name}</div>
                  <div className="flex justify-center gap-1">
                    {s.secret_number?.split('').map((d, j) => (
                      <span key={j} className="w-7 h-8 flex items-center justify-center bg-white dark:bg-gray-700 rounded-lg text-sm font-bold shadow-sm text-primary-600 dark:text-primary-400">
                        {d}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-[10px] text-gray-400 dark:text-gray-500 mb-4 font-mono tracking-wider">
          Room: {roomCode}
        </div>

        <div className="space-y-3">
          <Link to="/" onClick={onClose} className="btn-primary w-full"><Home size={16} /> Home</Link>
          <Link to="/create-room" onClick={onClose} className="btn-secondary w-full"><Repeat2 size={16} /> Play Again</Link>
        </div>
      </div>
    </div>
  )
}
