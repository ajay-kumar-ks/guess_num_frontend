import { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Smartphone, Users, ArrowRight, Eye, EyeOff, Lock, Send, RefreshCw, Trophy, Sparkles } from 'lucide-react'
import { evaluateGuess, validateSecret } from '../utils/passAndPlay'

function DigitInput({ value, onChange, onKeyDown, disabled, autoFocus, label, inputRef }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <span className="text-[10px] uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500">{label}</span>
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        pattern="[1-9]"
        maxLength={1}
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        disabled={disabled}
        autoFocus={autoFocus}
        className="digit-input !w-12 !h-14 sm:!w-14 sm:!h-16 text-center"
        aria-label={label}
      />
    </div>
  )
}

export default function PassAndPlay() {
  const navigate = useNavigate()
  const [stage, setStage] = useState('setup')
  const [playerOneName, setPlayerOneName] = useState('Player 1')
  const [playerTwoName, setPlayerTwoName] = useState('Player 2')
  const [activePlayer, setActivePlayer] = useState(1)
  const [secretDigits, setSecretDigits] = useState(['', '', ''])
  const [guessDigits, setGuessDigits] = useState(['', '', ''])
  const [secrets, setSecrets] = useState({ 1: '', 2: '' })
  const [history, setHistory] = useState([])
  const [turn, setTurn] = useState(1)
  const [winner, setWinner] = useState(null)
  const [showSecret, setShowSecret] = useState(false)
  const [showWinModal, setShowWinModal] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const secretInputRefs = useRef([])
  const guessInputRefs = useRef([])

  const names = useMemo(() => ({ 1: playerOneName || 'Player 1', 2: playerTwoName || 'Player 2' }), [playerOneName, playerTwoName])
  const currentPlayerName = names[activePlayer]
  const currentTurnName = names[turn]
  const currentSecret = secrets[turn]
  const opponentSecret = secrets[turn === 1 ? 2 : 1]

  const isSecretStage = stage === 'secret'
  const isGameStage = stage === 'play'

  const handleSecretDigitChange = (index, value) => {
    const digit = value.slice(-1)
    if (digit && !/^[1-9]$/.test(digit)) return
    const next = [...secretDigits]
    next[index] = digit
    setSecretDigits(next)
    setError('')
    if (digit && index < 2) {
      secretInputRefs.current[index + 1]?.focus()
    }
  }

  const handleSecretKeyDown = (index, event) => {
    if (event.key === 'Backspace' && !secretDigits[index] && index > 0) {
      const nextDigits = [...secretDigits]
      nextDigits[index - 1] = ''
      setSecretDigits(nextDigits)
      secretInputRefs.current[index - 1]?.focus()
    }
  }

  const handleGuessDigitChange = (index, value) => {
    const digit = value.slice(-1)
    if (digit && !/^[1-9]$/.test(digit)) return
    const next = [...guessDigits]
    next[index] = digit
    setGuessDigits(next)
    setError('')
    if (digit && index < 2) {
      guessInputRefs.current[index + 1]?.focus()
    }
  }

  const handleGuessKeyDown = (index, event) => {
    if (event.key === 'Backspace' && !guessDigits[index] && index > 0) {
      const nextDigits = [...guessDigits]
      nextDigits[index - 1] = ''
      setGuessDigits(nextDigits)
      guessInputRefs.current[index - 1]?.focus()
    }
  }

  const handleStart = () => {
    if (!playerOneName.trim() || !playerTwoName.trim()) {
      setError('Please enter both names to start.')
      return
    }
    setStage('secret')
    setActivePlayer(1)
    setSecretDigits(['', '', ''])
    setShowSecret(false)
    setError('')
  }

  const handleSecretSubmit = (event) => {
    event.preventDefault()
    const secret = secretDigits.join('')
    const validation = validateSecret(secret)
    if (!validation.valid) {
      setError(validation.message)
      return
    }

    setLoading(true)
    setError('')

    const nextSecrets = { ...secrets, [activePlayer]: secret }
    setSecrets(nextSecrets)

    if (activePlayer === 1) {
      setActivePlayer(2)
      setSecretDigits(['', '', ''])
      setShowSecret(false)
      setLoading(false)
      return
    }

    setStage('play')
    setTurn(1)
    setShowSecret(false)
    setLoading(false)
  }

  const handleGuessSubmit = (event) => {
    event.preventDefault()
    const guess = guessDigits.join('')
    const validation = validateSecret(guess)
    if (!validation.valid) {
      setError(validation.message)
      return
    }

    const targetSecret = secrets[turn === 1 ? 2 : 1]
    if (!targetSecret) {
      setError('Both secrets must be locked before play starts.')
      return
    }

    const result = evaluateGuess(guess, targetSecret)
    const nextEntry = {
      id: `${turn}-${Date.now()}`,
      player: names[turn],
      playerKey: turn,
      guess,
      positionCount: result.positionCount,
      numberCount: result.numberCount,
      isMatch: result.isMatch,
    }

    setHistory((prev) => [...prev, nextEntry])
    if (result.isMatch) {
      setWinner(names[turn])
      setShowWinModal(true)
      setError('')
      setGuessDigits(['', '', ''])
      return
    }

    setTurn((prev) => (prev === 1 ? 2 : 1))
    setGuessDigits(['', '', ''])
    setShowSecret(false)
    setError('')
  }

  const closeWinModal = () => {
    setShowWinModal(false)
  }

  const resetGame = () => {
    setStage('setup')
    setActivePlayer(1)
    setSecretDigits(['', '', ''])
    setGuessDigits(['', '', ''])
    setSecrets({ 1: '', 2: '' })
    setHistory([])
    setTurn(1)
    setWinner(null)
    setShowSecret(false)
    setShowWinModal(false)
    setError('')
  }

  return (
    <div className="space-y-5">
      <div className="text-center space-y-2 pt-2">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-indigo-500 shadow-lg shadow-cyan-500/30 mb-1">
          <Smartphone size={28} className="text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Pass & Play</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Two players can share one phone, set secrets privately, and take turns guessing.
        </p>
      </div>

      {stage === 'setup' && (
        <div className="card !p-5 space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-300">
            <Users size={16} className="text-cyan-500" />
            Enter both player names
          </div>
          <div className="space-y-3">
            <label className="block text-sm text-gray-600 dark:text-gray-300">
              Player 1
              <input
                value={playerOneName}
                onChange={(event) => setPlayerOneName(event.target.value)}
                className="input-field mt-2"
                placeholder="Player 1"
                maxLength={20}
              />
            </label>
            <label className="block text-sm text-gray-600 dark:text-gray-300">
              Player 2
              <input
                value={playerTwoName}
                onChange={(event) => setPlayerTwoName(event.target.value)}
                className="input-field mt-2"
                placeholder="Player 2"
                maxLength={20}
              />
            </label>
          </div>
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-400">
              {error}
            </div>
          )}
          <button onClick={handleStart} className="btn-primary w-full">
            <ArrowRight size={16} />
            Start shared-device game
          </button>
        </div>
      )}

      {isSecretStage && (
        <div className="card !p-5 space-y-5">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center rounded-2xl bg-cyan-50 p-2 text-cyan-600 dark:bg-cyan-900/20 dark:text-cyan-400">
              <Lock size={18} />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {activePlayer === 1 ? names[1] : names[2]}, lock your secret
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {activePlayer === 1
                ? 'Enter your secret first, then pass the phone to the other player.'
                : 'Your secret stays hidden until you reveal it yourself.'}
            </p>
          </div>

          <form onSubmit={handleSecretSubmit} className="space-y-4">
            <div className="flex justify-center gap-2 sm:gap-3">
              {secretDigits.map((digit, index) => (
                <DigitInput
                  key={index}
                  label={`Digit ${index + 1}`}
                  value={digit}
                  onChange={(event) => handleSecretDigitChange(index, event.target.value)}
                  onKeyDown={(event) => handleSecretKeyDown(index, event)}
                  disabled={loading}
                  autoFocus={index === 0}
                  inputRef={(node) => { secretInputRefs.current[index] = node }}
                />
              ))}
            </div>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-400">
                {error}
              </div>
            )}

            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? (
                <><RefreshCw size={16} className="animate-spin" /> Saving secret...</>
              ) : (
                <><Lock size={16} /> Lock secret</>
              )}
            </button>
          </form>
        </div>
      )}

      {isGameStage && (
        <div className="space-y-4">
          {showWinModal && winner && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
              <div className="relative w-full max-w-md overflow-hidden rounded-[32px] border border-white/20 bg-gradient-to-br from-amber-300 via-orange-400 to-pink-500 p-1 shadow-[0_20px_80px_rgba(249,115,22,0.45)]">
                <div className="absolute inset-0 overflow-hidden rounded-[32px]">
                  {[...Array(48)].map((_, index) => (
                    <span
                      key={index}
                      className="absolute top-0 h-3 w-3 rounded-full bg-white/90"
                      style={{
                        left: `${(index * 7) % 100}%`,
                        animation: `fall ${1.2 + (index % 6) * 0.15}s cubic-bezier(0.2,0.8,0.2,1) infinite`,
                        animationDelay: `${index * 0.04}s`,
                        opacity: 0.9,
                      }}
                    />
                  ))}
                </div>
                <div className="absolute left-[-20px] top-6 h-24 w-24 animate-[spin_2s_linear_infinite] rounded-full border-4 border-white/60" />
                <div className="absolute right-[-20px] bottom-6 h-24 w-24 animate-[spin_2s_linear_infinite_reverse] rounded-full border-4 border-white/60" />
                <div className="relative rounded-[28px] bg-white/95 p-6 text-center text-gray-900 dark:bg-slate-900/95 dark:text-white">
                  <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-amber-100 text-amber-600 shadow-[0_0_0_12px_rgba(251,191,36,0.2)] dark:bg-amber-900/30 dark:text-amber-300">
                    <div className="animate-[bounce_1s_ease-in-out_infinite]">
                      <Trophy size={36} />
                    </div>
                  </div>
                  <p className="text-sm font-semibold uppercase tracking-[0.35em] text-orange-500">Award</p>
                  <h2 className="mt-2 text-3xl font-black text-gray-800 dark:text-white">{winner}</h2>
                  <p className="mt-3 text-lg font-semibold text-gray-700 dark:text-gray-200">Congratulations! Nice work.</p>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    The secret is cracked. Pass the phone back and play another round.
                  </p>
                  <div className="mt-5 flex flex-col gap-2">
                    <button onClick={closeWinModal} className="btn-primary w-full">
                      <Sparkles size={16} />
                      Celebrate
                    </button>
                    <button onClick={resetGame} className="btn-secondary w-full">
                      <RefreshCw size={16} />
                      Play again
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div className="card !p-4 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-gray-700 dark:text-gray-300">{currentTurnName}'s turn</span>
              <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-medium text-cyan-700 dark:bg-cyan-900/20 dark:text-cyan-400">
                Single phone • pass after each turn
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>{names[1]} vs {names[2]}</span>
              {winner ? <span className="font-semibold text-green-600 dark:text-green-400">{winner} wins!</span> : <span>Guess the other player's secret</span>}
            </div>
          </div>

          <div className="card !p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500">
                Your secret
              </span>
              <button onClick={() => setShowSecret((prev) => !prev)} className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
                {showSecret ? <EyeOff size={14} /> : <Eye size={14} />}
                {showSecret ? 'Hide' : 'Reveal'}
              </button>
            </div>
            <div className="flex justify-center gap-2">
              {currentSecret ? currentSecret.split('').map((digit, index) => (
                <span key={index} className={`flex h-12 w-12 items-center justify-center rounded-xl text-lg font-bold ${showSecret ? 'bg-cyan-50 text-cyan-700 dark:bg-cyan-900/20 dark:text-cyan-300' : 'bg-gray-100 text-transparent dark:bg-gray-800'}`}>
                  {showSecret ? digit : '?'}
                </span>
              )) : (
                <span className="text-sm text-gray-400 dark:text-gray-500">Secret will appear here after you lock it.</span>
              )}
            </div>
          </div>

          <div className="card !p-4 space-y-3">
            <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500">
              <Sparkles size={12} />
              Guess history
            </div>
            {history.length === 0 ? (
              <div className="rounded-xl bg-gray-50 p-4 text-center text-sm text-gray-500 dark:bg-gray-800/50 dark:text-gray-400">
                No guesses yet. {currentTurnName} can start the round.
              </div>
            ) : (
              <div className="space-y-2">
                {history.map((entry) => {
                  const isCurrentPlayerGuess = entry.playerKey === turn
                  return (
                    <div key={entry.id} className={`rounded-2xl border p-3 text-sm shadow-sm ${isCurrentPlayerGuess ? 'border-cyan-300 bg-cyan-50/90 dark:border-cyan-700 dark:bg-cyan-900/20' : 'border-gray-200 bg-white/90 dark:border-gray-700 dark:bg-gray-800/60'}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-800 dark:text-gray-100">{entry.player}</span>
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] ${isCurrentPlayerGuess ? 'bg-cyan-600 text-white' : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}>
                              {isCurrentPlayerGuess ? 'Your guess' : 'Opponent'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 pt-1">
                            {entry.guess.split('').map((digit, index) => (
                              <span key={`${entry.id}-${index}`} className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-900 text-sm font-bold text-white shadow-sm dark:bg-gray-700">
                                {digit}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1.5">
                          <div className="rounded-xl bg-gray-100 px-2.5 py-1.5 text-center text-xs font-semibold text-gray-700 dark:bg-gray-700 dark:text-gray-200">
                            <div className="text-[10px] uppercase tracking-[0.2em] text-gray-400">Pos</div>
                            <div className="text-base text-cyan-600 dark:text-cyan-300">{entry.positionCount}</div>
                          </div>
                          <div className="rounded-xl bg-amber-50 px-2.5 py-1.5 text-center text-xs font-semibold text-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
                            <div className="text-[10px] uppercase tracking-[0.2em] text-amber-500">Num</div>
                            <div className="text-base">{entry.numberCount}</div>
                          </div>
                        </div>
                      </div>
                      {entry.isMatch && (
                        <div className="mt-2 inline-flex items-center rounded-full bg-green-100 px-2.5 py-1 text-[11px] font-semibold text-green-700 dark:bg-green-900/20 dark:text-green-400">
                          Matched!
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {!winner ? (
            <form onSubmit={handleGuessSubmit} className="card !p-4 space-y-4">
              <div className="flex justify-center gap-2 sm:gap-3">
                {guessDigits.map((digit, index) => (
                  <DigitInput
                    key={index}
                    label={`Guess ${index + 1}`}
                    value={digit}
                    onChange={(event) => handleGuessDigitChange(index, event.target.value)}
                    onKeyDown={(event) => handleGuessKeyDown(index, event)}
                    disabled={loading}
                    autoFocus={index === 0}
                    inputRef={(node) => { guessInputRefs.current[index] = node }}
                  />
                ))}
              </div>
              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-400">
                  {error}
                </div>
              )}
              <button type="submit" className="btn-primary w-full">
                <Send size={16} />
                Submit guess
              </button>
            </form>
          ) : (
            <div className="card !p-5 text-center space-y-3">
              <div className="inline-flex items-center justify-center rounded-2xl bg-green-100 p-3 text-green-600 dark:bg-green-900/20 dark:text-green-400">
                <Trophy size={24} />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{winner} cracked it!</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">The phone can be passed back for another round.</p>
              <button onClick={resetGame} className="btn-secondary w-full">
                <RefreshCw size={16} />
                Play again
              </button>
            </div>
          )}

          <button onClick={() => navigate('/')} className="btn-secondary w-full">
            Back to home
          </button>
        </div>
      )}
    </div>
  )
}
