import { useState, useRef, useEffect } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { useGame } from '../context/GameContext'
import { useToast } from '../context/ToastContext'
import { getGameState, makeGuess, fetchGameResult } from '../services/api'
import wsService from '../services/websocket'
import NotesPanel from '../components/NotesPanel'
import WinnerModal from '../components/WinnerModal'
import { Target, Send, Clock, Wifi, WifiOff, Loader2, Eye, EyeOff, LogOut } from 'lucide-react'

function GuessRow({ guess, position, number, isCurrentPlayer, isNew }) {
  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-500 ${
      isCurrentPlayer
        ? 'bg-primary-50 dark:bg-primary-900/20 border border-primary-200/50 dark:border-primary-800'
        : 'bg-gray-50 dark:bg-gray-800/30'
    } ${isNew ? 'animate-slide-in' : ''}`}>
      <div className="flex gap-1.5">
        {guess.split('').map((digit, i) => (
          <span key={i} className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center bg-white dark:bg-gray-800 rounded-lg font-bold text-base sm:text-lg shadow-sm">
            {digit}
          </span>
        ))}
      </div>
      <div className="flex items-center gap-3 ml-auto">
        <div className="text-center min-w-[36px]">
          <div className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">Pos</div>
          <div className={`font-bold text-base sm:text-lg ${position === 3 ? 'text-green-500' : 'text-green-600 dark:text-green-400'}`}>
            {position}
          </div>
        </div>
        <div className="text-center min-w-[36px]">
          <div className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">Num</div>
          <div className="font-bold text-base sm:text-lg text-yellow-600 dark:text-yellow-400">{number}</div>
        </div>
      </div>
    </div>
  )
}

export default function Game() {
  const { roomCode } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const toast = useToast()
  const { playerId, playerName, opponentName, currentTurn, guesses, connectionStatus, winner,
    setWinner, addGuessResult, turnChanged, secretSubmitted, secretNumber: ctxSecretNumber } = useGame()

  const [digits, setDigits] = useState(['', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showWinnerModal, setShowWinnerModal] = useState(false)
  const [lastGuessIndex, setLastGuessIndex] = useState(-1)
  const [gameReady, setGameReady] = useState(false)
  const [showSecret, setShowSecret] = useState(false)
  const inputRefs = [useRef(null), useRef(null), useRef(null)]
  const historyEndRef = useRef(null)

  // Use location state first, fall back to context (survives back-navigation)
  const [secretNumber, setSecretNumber] = useState(location.state?.secretNumber || ctxSecretNumber || '')
  const isMyTurn = currentTurn === playerId

  useEffect(() => {
    if (!secretNumber) navigate(`/secret-number/${roomCode}`, { replace: true })
  }, [])

  // Sync secret number into context on mount (handles both location state and back-nav)
  useEffect(() => {
    if (location.state?.secretNumber) {
      secretSubmitted(location.state.secretNumber)
      setSecretNumber(location.state.secretNumber)
    }
  }, [])

  // Continuous polling to sync game state (critical for Vercel where WebSocket drops frequently)
  const pollIntervalRef = useRef(null)
  useEffect(() => {
    let cancelled = false
    const doPoll = async () => {
      if (cancelled) return
      try {
        const state = await getGameState(roomCode)
        if (state.current_turn) turnChanged(state.current_turn)
        if (state.status === 'playing') setGameReady(true)
        // Detect finished status (opponent won while WS was down)
        if (state.status === 'finished' && !winner) {
          const result = await fetchGameResult(roomCode)
          if (result.game_over) {
            setWinner({
              winner_id: result.winner_id,
              winner_name: result.winner_name,
              secrets: result.secrets || [],
            })
            setTimeout(() => setShowWinnerModal(true), 200)
          }
        }
      } catch (err) {}
    }
    // Immediate poll on mount
    doPoll()
    // Then poll every 5 seconds as fallback for WebSocket disconnections
    pollIntervalRef.current = setInterval(doPoll, 5000)
    return () => {
      cancelled = true
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
    }
  }, [roomCode, turnChanged, winner, setWinner])

  // Handle WebSocket reconnection - re-sync state immediately
  useEffect(() => {
    const handler = (status) => {
      if (status === 'reconnected') {
        getGameState(roomCode).then(state => {
          if (state.current_turn) turnChanged(state.current_turn)
          if (state.status === 'playing') setGameReady(true)
          // Re-sync winner on reconnect
          if (state.status === 'finished' && !winner) {
            fetchGameResult(roomCode).then(result => {
              if (result.game_over) {
                setWinner({
                  winner_id: result.winner_id,
                  winner_name: result.winner_name,
                  secrets: result.secrets || [],
                })
                setTimeout(() => setShowWinnerModal(true), 200)
              }
            }).catch(() => {})
          }
        }).catch(() => {})
      }
    }
    const unsub = wsService.on('connection_status', handler)
    return () => { unsub() }
  }, [roomCode, turnChanged, winner, setWinner])

  const guessesRef = useRef(guesses)
  guessesRef.current = guesses

  // Track the last guess_id received via WebSocket (for dedup against REST response)
  const lastWsGuessIdRef = useRef(null)

  useEffect(() => {
    const unsubGuessResult = wsService.on('guess_result', (data) => {
      addGuessResult(data)
      lastWsGuessIdRef.current = data.guess_id
      setLastGuessIndex(guessesRef.current.length)
      setLoading(false)
    })
    const unsubTurnChanged = wsService.on('turn_changed', (data) => turnChanged(data.player_id))
    const unsubWinner = wsService.on('winner', (data) => {
      setWinner(data); setLoading(false)
      setTimeout(() => setShowWinnerModal(true), 600)
    })
    const unsubError = wsService.on('error', (data) => {
      toast.error(data.message || 'An error occurred'); setLoading(false)
    })
    return () => { unsubGuessResult(); unsubTurnChanged(); unsubWinner(); unsubError() }
  }, [])

  useEffect(() => {
    historyEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [guesses])

  const handleDigitChange = (index, value) => {
    const digit = value.slice(-1)
    if (digit && !/^[1-9]$/.test(digit)) return
    const newDigits = [...digits]; newDigits[index] = digit
    setDigits(newDigits); setError('')
    if (digit && index < 2) inputRefs[index + 1].current?.focus()
  }

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) inputRefs[index - 1].current?.focus()
  }

  const handleGuess = async (e) => {
    e.preventDefault()
    const guess = digits.join('')
    if (guess.length !== 3) { setError('Please enter all 3 digits'); return }
    const digitSet = new Set(guess.split(''))
    if (digitSet.size !== 3) { setError('Digits must be unique'); return }
    setLoading(true); setError('')

    try {
      // Send guess via REST API (reliable even when WebSocket is down on Vercel)
      const result = await makeGuess(roomCode, playerId, guess)

      // Always add guess locally from REST response (handles zombie WebSocket scenario
      // where connectionStatus says 'connected' but WS broadcast never arrives
      // because Vercel silently killed the server instance).
      // The WS listener also adds the guess, but we dedup by checking lastWsGuessIdRef.
      // Server broadcasts WS BEFORE returning HTTP, so WS arrives first on a healthy connection.
      if (result.guess_id !== lastWsGuessIdRef.current) {
        // WS broadcast didn't arrive (zombie WS or disconnected) — add locally
        addGuessResult({
          guess_id: result.guess_id,
          guess: result.guess,
          position_count: result.position_count,
          number_count: result.number_count,
          player_id: result.player_id,
        })
        setLastGuessIndex(guesses.length)
      }
      setLoading(false)

      if (result.game_over) {
        setWinner({ winner_id: result.winner_id, winner_name: playerName })
        setTimeout(() => setShowWinnerModal(true), 600)
      }
    } catch (err) {
      const errorMsg = err.response?.data?.detail || 'Failed to submit guess'
      setError(errorMsg)
      toast.error(errorMsg)
      setLoading(false)
    }
    setDigits(['', '', '']);
    inputRefs[0].current?.focus()
  }

  const isFormValid = digits.join('').length === 3 && new Set(digits).size === 3

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="card !p-4 space-y-3">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-all duration-200 text-xs"
            title="Back to home"
          >
            <LogOut size={12} />
            <span className="hidden sm:inline">Exit</span>
          </button>
          <span className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-xs font-medium truncate max-w-[120px]">
            <Target size={12} />
            {playerName}
          </span>
          <span className="text-xs text-gray-300 dark:text-gray-600 font-medium">VS</span>
          <span className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs font-medium truncate max-w-[120px]">
            {opponentName || 'Opponent'}
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

      {/* Secret Number Card */}
      {secretNumber && (
        <div className="card !p-3 !py-2.5 space-y-1.5">
          <div className="flex items-center justify-center gap-2">
            <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">
              Your Secret
            </span>
            <button onClick={() => setShowSecret(!showSecret)}
              className="text-gray-400 hover:text-gray-600 transition-colors">
              {showSecret ? <EyeOff size={12} /> : <Eye size={12} />}
            </button>
          </div>
          <div className="flex justify-center gap-1.5">
            {secretNumber.split('').map((d, i) => (
              <span key={i} className={`w-8 h-9 sm:w-9 sm:h-10 flex items-center justify-center rounded-lg text-base sm:text-lg font-bold transition-all duration-300 ${
                showSecret
                  ? 'bg-primary-50 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-700 text-primary-600 dark:text-primary-400'
                  : 'bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-transparent'
              }`}>
                {showSecret ? d : '?'}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Status Bar */}
      <div className={`flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-300 ${
        isMyTurn
          ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 ring-1 ring-green-400/30'
          : 'bg-gray-50 dark:bg-gray-800/30 text-gray-500 dark:text-gray-400'
      }`}>
        {isMyTurn ? <Target size={14} /> : <Clock size={14} />}
        <span>{isMyTurn ? 'Your Turn' : `${opponentName || 'Opponent'}'s Turn`}</span>
      </div>

      {/* Guess History */}
      <div className="card !p-4 space-y-3 max-h-60 overflow-y-auto">
        <h3 className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest flex items-center gap-2">
          <Target size={12} />
          Guesses ({guesses.length})
        </h3>
        {guesses.length === 0 ? (
          <div className="text-center py-6 space-y-2">
            <Target size={32} className="opacity-20 text-gray-400 mx-auto" />
            <p className="text-xs text-gray-400 dark:text-gray-500">
              {isMyTurn ? 'Your turn! Make a guess.' : 'Waiting for first guess...'}
            </p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {guesses.map((g, i) => (
              <GuessRow key={g.guess_id || i} guess={g.guess} position={g.position_count}
                number={g.number_count} isCurrentPlayer={g.player_id === playerId} isNew={i === lastGuessIndex} />
            ))}
            <div ref={historyEndRef} />
          </div>
        )}
      </div>

      {!gameReady ? (
        <div className="card text-center py-8 space-y-3">
          <Loader2 size={24} className="animate-spin text-primary-500 mx-auto" />
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Waiting for opponent to submit their secret...
          </p>
        </div>
      ) : (
        <>
          <NotesPanel roomCode={roomCode} />

          {isMyTurn && (
            <form onSubmit={handleGuess} className="card !p-4 space-y-4">
              <h3 className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest flex items-center gap-2">
                <Send size={12} />
                Make Your Guess
              </h3>
              <div className="flex justify-center gap-2">
                {digits.map((digit, index) => (
                  <input key={index} ref={inputRefs[index]} type="text" inputMode="numeric" pattern="[1-9]" maxLength={1}
                    value={digit} onChange={(e) => handleDigitChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="digit-input !w-12 !h-14 sm:!w-14 sm:!h-16"
                    disabled={loading} autoFocus={index === 0 && isMyTurn}
                    aria-label={`Guess digit ${index + 1}`} />
                ))}
              </div>

              {error && (
                <div className="p-2.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-xs text-red-600 dark:text-red-400 animate-shake flex items-start gap-2">
                  <span>{error}</span>
                </div>
              )}

              <button type="submit" className="btn-primary w-full" disabled={loading || !isFormValid}>
                {loading ? <><Loader2 size={16} className="animate-spin" /> Thinking...</>
                  : <><Send size={16} /> Guess</>}
              </button>
            </form>
          )}

          {!isMyTurn && (
            <div className="card text-center py-6 space-y-2">
              <Clock size={24} className="text-gray-300 dark:text-gray-600 mx-auto animate-pulse" />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {opponentName || 'Opponent'} is thinking...
              </p>
            </div>
          )}
        </>
      )}

      {showWinnerModal && winner && (
        <WinnerModal roomCode={roomCode} onClose={() => { setShowWinnerModal(false); navigate(`/winner/${roomCode}`) }} />
      )}
    </div>
  )
}
