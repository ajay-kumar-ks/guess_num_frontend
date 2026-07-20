import { useState, useRef, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'
import { useGame } from '../context/GameContext'
import wsService from '../services/websocket'
import { getGameState } from '../services/api'
import { Lock, Unlock, Eye, EyeOff, Users, Loader2, AlertCircle, Shield } from 'lucide-react'

export default function SecretNumber() {
  const { roomCode } = useParams()
  const navigate = useNavigate()
  const { playerId, playerName, opponentName, secretSubmitted, opponentJoined } = useGame()
  const [digits, setDigits] = useState(['', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [waitingForOpponent, setWaitingForOpponent] = useState(false)
  const [submittedSecret, setSubmittedSecret] = useState(null)
  const [showSecret, setShowSecret] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const inputRefs = [useRef(null), useRef(null), useRef(null)]

  useEffect(() => {
    const unsub = wsService.on('opponent_joined', (data) => {
      opponentJoined(data.name)
    })
    return () => unsub()
  }, [])

  useEffect(() => {
    if (!waitingForOpponent || !roomCode) return
    const interval = setInterval(async () => {
      try {
        const state = await getGameState(roomCode)
        if (state.status === 'playing') {
          clearInterval(interval)
          secretSubmitted(submittedSecret)
          navigate(`/game/${roomCode}`, { state: { secretNumber: submittedSecret } })
        }
      } catch (err) {}
    }, 2000)
    return () => clearInterval(interval)
  }, [waitingForOpponent, roomCode, submittedSecret])

  const handleDigitChange = (index, value) => {
    const digit = value.slice(-1)
    if (digit && !/^[1-9]$/.test(digit)) return
    const newDigits = [...digits]
    newDigits[index] = digit
    setDigits(newDigits)
    setError('')
    if (digit && index < 2) inputRefs[index + 1].current?.focus()
  }

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) inputRefs[index - 1].current?.focus()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const secretNumber = digits.join('')
    if (secretNumber.length !== 3) { setError('Please enter all 3 digits'); return }
    const digitSet = new Set(secretNumber.split(''))
    if (digitSet.size !== 3) { setError('Digits must be unique (no repeats)'); return }

    setLoading(true)
    setError('')
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/submit-secret`, {
        room_code: roomCode, player_id: playerId, secret_number: secretNumber,
      })
      if (response.data.both_submitted) {
        secretSubmitted(secretNumber)
        navigate(`/game/${roomCode}`, { state: { secretNumber } })
      } else {
        setSubmittedSecret(secretNumber)
        setWaitingForOpponent(true)
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit secret number')
    } finally { setLoading(false) }
  }

  const isFormValid = digits.join('').length === 3 && new Set(digits).size === 3

  if (waitingForOpponent) {
    return (
      <div className="space-y-6 text-center">
        <div className="space-y-2 pt-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 shadow-lg shadow-green-500/30 mb-1">
            <Lock size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Secret Submitted!</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Waiting for {opponentName || 'opponent'} to submit theirs...
          </p>
        </div>

        <div className="card !p-5 space-y-3">
          <label className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-widest">
            Your Secret Code
          </label>
          <button onClick={() => setShowSecret(!showSecret)} className="mx-auto">
            <div className="flex justify-center gap-2">
              {submittedSecret.split('').map((d, i) => (
                <span key={i} className={`w-12 h-14 flex items-center justify-center rounded-xl text-2xl font-bold transition-all duration-300
                  ${showSecret
                    ? 'bg-primary-50 dark:bg-primary-900/30 border-2 border-primary-300 dark:border-primary-600 text-primary-700 dark:text-primary-300'
                    : 'bg-gray-100 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 text-transparent'}`}>
                  {showSecret ? d : '?'}
                </span>
              ))}
            </div>
          </button>
          <button onClick={() => setShowSecret(!showSecret)}
            className="inline-flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 transition-colors mx-auto">
            {showSecret ? <EyeOff size={14} /> : <Eye size={14} />}
            {showSecret ? 'Hide' : 'Reveal'}
          </button>
        </div>

        <div className="card !p-5 space-y-3">
          <Loader2 size={28} className="animate-spin text-primary-500 mx-auto" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Waiting for <strong className="text-gray-700 dark:text-gray-300">{opponentName || 'opponent'}</strong> to choose their secret...
          </p>
        </div>

        <div className="flex items-center justify-center gap-3 text-sm">
          <span className="px-3 py-1.5 rounded-lg bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 font-medium">{playerName}</span>
          <span className="text-gray-300 dark:text-gray-600 font-medium">vs</span>
          <span className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-medium">{opponentName || 'Opponent'}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2 pt-2">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-500 shadow-lg shadow-purple-500/30 mb-1">
          <Shield size={28} className="text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Your Secret Code</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Choose a 3-digit code. Your opponent won't see this!
        </p>
      </div>

      <div className="card !p-5 space-y-5">
        <div className="flex items-center justify-center gap-3 text-sm">
          <span className="px-3 py-1.5 rounded-lg bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 font-medium">{playerName}</span>
          <span className="text-gray-300 dark:text-gray-600">vs</span>
          <span className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-medium">{opponentName || 'Waiting...'}</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="flex justify-center gap-2 sm:gap-3">
            {digits.map((digit, index) => (
              <input key={index} ref={inputRefs[index]} type="text" inputMode="numeric" pattern="[1-9]" maxLength={1}
                value={digit}
                onChange={(e) => handleDigitChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="digit-input text-center"
                disabled={loading} autoFocus={index === 0}
                aria-label={`Digit ${index + 1}`} />
            ))}
          </div>

          <button type="button" onClick={() => setShowHint(!showHint)}
            className="inline-flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 transition-colors mx-auto">
            {showHint ? <EyeOff size={14} /> : <Eye size={14} />}
            {showHint ? 'Hide' : 'Show'} rules
          </button>

          {showHint && (
            <div className="text-xs text-gray-400 dark:text-gray-500 space-y-1 text-center bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3">
              <p>Digits 1-9 only &middot; No repeated digits</p>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2.5 p-3.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-600 dark:text-red-400">
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <button type="submit" className="btn-primary w-full" disabled={loading || !isFormValid}>
            {loading ? (
              <><Loader2 size={18} className="animate-spin" /> Submitting...</>
            ) : (
              <><Lock size={18} /> Lock It In</>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
