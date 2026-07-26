import { useState, useEffect, useRef } from 'react'
import { Target, Wifi, Loader2, Server, Zap } from 'lucide-react'
import { healthCheck } from '../services/api'

const STATUS_MESSAGES = [
  { text: 'Establishing connection...', icon: Wifi, delay: 3000 },
  { text: 'Waking up the server...', icon: Server, delay: 8000 },
  { text: 'Almost there...', icon: Loader2, delay: 15000 },
  { text: 'Server is warming up...', icon: Zap, delay: 25000 },
]

function getStatusMessage(elapsed) {
  let current = STATUS_MESSAGES[0]
  for (const msg of STATUS_MESSAGES) {
    if (elapsed >= msg.delay) current = msg
  }
  return current
}

export default function BackendLoader({ children }) {
  const [isReady, setIsReady] = useState(() => {
    // Skip check if already verified this session
    return sessionStorage.getItem('backend_ready') === 'true'
  })
  const [elapsed, setElapsed] = useState(0)
  const [attempts, setAttempts] = useState(0)
  const timeoutRef = useRef(null)
  const timerRef = useRef(null)

  useEffect(() => {
    if (isReady) return

    let pollCount = 0
    let mounted = true

    const checkBackend = async () => {
      try {
        await healthCheck()
        if (mounted) {
          sessionStorage.setItem('backend_ready', 'true')
          setIsReady(true)
        }
      } catch {
        if (mounted) {
          pollCount++
          setAttempts(pollCount)
        }
      }
    }

    // Poll immediately, then with exponential backoff
    checkBackend()

    const poll = () => {
      const delay = Math.min(2000 * Math.pow(1.3, pollCount), 10000)
      timeoutRef.current = setTimeout(() => {
        if (mounted) checkBackend()
        if (mounted) poll()
      }, delay)
    }
    poll()

    // Update elapsed time every second
    timerRef.current = setInterval(() => {
      if (mounted) setElapsed((prev) => prev + 1)
    }, 1000)

    return () => {
      mounted = false
      clearTimeout(timeoutRef.current)
      clearInterval(timerRef.current)
    }
  }, [isReady])

  if (isReady) return children

  const status = getStatusMessage(elapsed * 1000)
  const StatusIcon = status.icon
  const dots = '.'.repeat((elapsed % 3) + 1)

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 transition-opacity duration-700">
      {/* Animated background rings */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full rounded-full bg-primary-500/5 dark:bg-primary-400/5 blur-3xl animate-pulse" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full rounded-full bg-blue-500/5 dark:bg-blue-400/5 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Logo */}
      <div className="relative mb-8">
        {/* Pulse ring */}
        <div className="absolute inset-0 rounded-full animate-pulse-ring" />
        <div className="relative w-24 h-24 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 shadow-2xl shadow-primary-500/40 flex items-center justify-center animate-pulse-ring">
          <Target size={48} className="text-white" />
        </div>
      </div>

      {/* Status text */}
      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300 text-base font-medium mb-2">
        <StatusIcon size={18} className="text-primary-500 animate-pulse" />
        <span>{status.text}{dots}</span>
      </div>

      {/* Elapsed time */}
      <p className="text-sm text-gray-400 dark:text-gray-500 mb-6 font-mono tabular-nums">
        {elapsed < 60 ? `${elapsed}s` : `${Math.floor(elapsed / 60)}m ${elapsed % 60}s`}
      </p>

      {/* Progress bar */}
      <div className="w-48 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-primary-500 to-primary-400 rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${Math.min((elapsed / 45) * 100, 85)}%`,
            opacity: 0.6 + (elapsed / 45) * 0.4,
          }}
        />
      </div>

      {/* Retry info */}
      <p className="mt-4 text-xs text-gray-400 dark:text-gray-500">
        Attempt {attempts + 1}
      </p>


    </div>
  )
}
