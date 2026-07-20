import { Link, useParams } from 'react-router-dom'
import { useGame } from '../context/GameContext'
import { Trophy, Home, Repeat2, Target, User } from 'lucide-react'

export default function Winner() {
  const { roomCode } = useParams()
  const { playerName, playerId, winner, opponentName } = useGame()
  const isWinner = winner?.winner_id === playerId

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

      {/* Room */}
      <div className="card !p-4 space-y-2">
        <div className="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-widest">Game Room</div>
        <div className="text-xl font-bold tracking-widest bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent">
          {roomCode}
        </div>
      </div>

      {/* Players */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card !p-4 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <User size={14} className="text-gray-400" />
            <span className="text-xs font-bold text-gray-900 dark:text-white">{playerName}</span>
          </div>
          <span className={`text-[10px] font-medium ${isWinner ? 'text-yellow-500' : 'text-gray-400'}`}>
            {isWinner ? 'Winner' : 'Player'}
          </span>
        </div>
        <div className="card !p-4 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <User size={14} className="text-gray-400" />
            <span className="text-xs font-bold text-gray-900 dark:text-white">{opponentName || 'Unknown'}</span>
          </div>
          <span className={`text-[10px] font-medium ${!isWinner ? 'text-yellow-500' : 'text-gray-400'}`}>
            {!isWinner ? 'Winner' : 'Player'}
          </span>
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
