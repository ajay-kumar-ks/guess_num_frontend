import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Target, Plus, LogIn, Hash, Repeat, Trophy, Eye, Key } from 'lucide-react'

const steps = [
  { icon: Plus, label: 'Create or join a room' },
  { icon: Hash, label: 'Pick a secret 3-digit code' },
  { icon: Repeat, label: 'Take turns guessing' },
  { icon: Trophy, label: 'First to crack it wins!' },
]

export default function Home() {
  const navigate = useNavigate()
  const [spectateCode, setSpectateCode] = useState('')

  const handleSpectate = (e) => {
    e.preventDefault()
    if (spectateCode.trim()) {
      navigate(`/spectate/${spectateCode.trim().toUpperCase()}`)
    }
  }

  return (
    <div className="text-center space-y-8">
      {/* Hero */}
      <div className="space-y-4 pt-4">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 shadow-xl shadow-primary-500/30 mb-2">
          <Target size={36} className="text-white" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 dark:from-white dark:via-gray-100 dark:to-white bg-clip-text text-transparent">
          Guess The Number
        </h1>
        <p className="text-base text-gray-500 dark:text-gray-400 max-w-xs mx-auto leading-relaxed">
          A real-time multiplayer code-breaking game. Crack your opponent's secret 3-digit code before they crack yours.
        </p>
      </div>

      {/* Steps */}
      <div className="card space-y-4 !p-5">
        <h2 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
          How to Play
        </h2>
        <div className="space-y-3">
          {steps.map((step, i) => (
            <div key={i} className="flex items-center gap-3 text-sm">
              <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center">
                <step.icon size={16} className="text-primary-600 dark:text-primary-400" />
              </span>
              <span className="text-gray-600 dark:text-gray-400">{step.label}</span>
            </div>
          ))}
        </div>
        <div className="pt-2 text-xs text-gray-400 dark:text-gray-500 border-t border-gray-100 dark:border-gray-700/50">
          <strong>Position</strong> = correct digit in correct spot &middot; <strong>Number</strong> = correct digit, wrong spot
        </div>
      </div>

      {/* CTA */}
      <div className="space-y-3">
        <Link to="/create-room" className="btn-primary w-full">
          <Plus size={18} />
          Create a Room
        </Link>
        <Link to="/join-room" className="btn-secondary w-full">
          <LogIn size={18} />
          Join a Room
        </Link>
      </div>

      {/* Spectate Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200 dark:border-gray-700" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-gray-50 dark:bg-gray-900 px-3 text-gray-400 dark:text-gray-500">or</span>
        </div>
      </div>

      {/* Spectate */}
      <form onSubmit={handleSpectate} className="card !p-4 space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
            <Eye size={16} className="text-purple-600 dark:text-purple-400" />
          </div>
          <h2 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
            Spectate a Game
          </h2>
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500 text-left">
          Enter a room code to watch a game live without playing.
        </p>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Key size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={spectateCode}
              onChange={(e) => setSpectateCode(e.target.value.toUpperCase())}
              placeholder="ROOM CODE"
              className="input-field !pl-9 !text-sm !font-bold tracking-[0.2em]"
              maxLength={6}
            />
          </div>
          <button
            type="submit"
            disabled={!spectateCode.trim()}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-purple-500 text-white text-sm font-medium
                       hover:from-purple-700 hover:to-purple-600 disabled:opacity-40 disabled:cursor-not-allowed
                       transition-all duration-200 shadow-lg shadow-purple-500/25 flex items-center gap-1.5"
          >
            <Eye size={16} />
            Watch
          </button>
        </div>
      </form>
    </div>
  )
}
