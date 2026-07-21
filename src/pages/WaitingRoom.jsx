import { useEffect, useState, useRef } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { useGame } from '../context/GameContext'
import wsService from '../services/websocket'
import { getGameState } from '../services/api'
import { QRCodeSVG } from 'qrcode.react'
import { Copy, Check, Users, Loader2, QrCode, Smartphone } from 'lucide-react'

export default function WaitingRoom() {
  const { roomCode } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { playerName, playerId, setPlayer, opponentJoined, gameStarted, opponentName, setConnectionStatus } = useGame()
  const [copied, setCopied] = useState(false)
  const [showQR, setShowQR] = useState(false)

  const joinUrl = `${window.location.origin}/join-room?code=${roomCode}`

  useEffect(() => {
    if (location.state?.playerName && location.state?.playerId) {
      setPlayer(location.state.playerName, location.state.playerId, roomCode)
    } else {
      navigate('/')
    }
  }, [])

  useEffect(() => {
    if (!playerId || !roomCode) return

    setConnectionStatus('connecting')
    wsService.connect(roomCode, playerId)

    const unsubRoomJoined = wsService.on('room_joined', (data) => {
      if (data.opponent_name) {
        opponentJoined(data.opponent_name)
      }
      // If the game already started (reconnection to playing game), go to the right page
      if (data.game_status === 'playing' || data.game_status === 'finished') {
        if (data.current_turn) gameStarted(data.current_turn)
        // Check if we already submitted a secret - if not, go to secret page
        navigate(`/secret-number/${roomCode}`, { replace: true })
        return
      }
      // If opponent is already in the room, notify the server
      if (data.opponent_name) {
        wsService.sendReady()
      }
    })

    const unsubOpponent = wsService.on('opponent_joined', (data) => {
      opponentJoined(data.name)
      wsService.sendReady()
    })

    const unsubGameStarted = wsService.on('game_started', (data) => {
      gameStarted(data.current_turn)
      navigate(`/secret-number/${roomCode}`)
    })

    const unsubConnStatus = wsService.on('connection_status', (status) => {
      setConnectionStatus(status)
    })

    return () => {
      unsubRoomJoined()
      unsubOpponent()
      unsubGameStarted()
      unsubConnStatus()
    }
  }, [playerId, roomCode, navigate])

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomCode).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="space-y-6 text-center">
      <div className="space-y-2 pt-2">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 shadow-lg shadow-primary-500/30 mb-1">
          <Users size={28} className="text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Waiting Room
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Share the code below with your friend
        </p>
      </div>

      {/* Room Code */}
      <div className="card !p-5 space-y-4">
        <label className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-widest">
          Room Code
        </label>
        <button
          onClick={handleCopyCode}
          className="relative group w-full"
        >
          <div className="text-4xl sm:text-5xl font-bold tracking-[0.3em] bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent
                        py-2 min-h-[48px] flex items-center justify-center">
            {roomCode}
          </div>
          <div className="absolute inset-0 rounded-xl bg-primary-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
        <button
          onClick={handleCopyCode}
          className="inline-flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors mx-auto"
        >
          {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
          {copied ? 'Copied!' : 'Click to copy'}          </button>
        </div>

        {/* QR Code Toggle */}
        <div className="space-y-3">
          <button
            onClick={() => setShowQR(!showQR)}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl
                       bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700
                       hover:bg-gray-50 dark:hover:bg-gray-700
                       text-sm font-medium text-gray-600 dark:text-gray-400
                       transition-all duration-200"
          >
            <QrCode size={16} />
            {showQR ? 'Hide QR Code' : 'Show QR Code'}
          </button>

          {showQR && (
            <div className="animate-slide-up space-y-3">
              <div className="flex justify-center p-4 bg-white dark:bg-gray-900 rounded-xl border-2 border-gray-100 dark:border-gray-800">
                <QRCodeSVG
                  value={joinUrl}
                  size={180}
                  level="M"
                  includeMargin
                  className="rounded-lg"
                />
              </div>
              <div className="flex items-center justify-center gap-1.5 text-[10px] text-gray-400 dark:text-gray-500">
                <Smartphone size={11} />
                <span>Scan to join &mdash; {roomCode}</span>
              </div>
            </div>
          )}
        </div>

        {/* Players */}
      <div className="flex items-center justify-center gap-3 text-sm">
        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 font-medium">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          {playerName}
        </span>
        {opponentName && (
          <>
            <span className="text-gray-300 dark:text-gray-600 font-medium">vs</span>
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-medium">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              {opponentName}
            </span>
          </>
        )}
      </div>

      {/* Status */}
      {!opponentName ? (
        <div className="card space-y-4 !p-5">
          <Loader2 size={32} className="animate-spin text-primary-500 mx-auto" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Waiting for opponent to join...
          </p>
        </div>
      ) : (
        <div className="card !p-5 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800 space-y-2">
          <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
            <Users size={20} className="text-green-600 dark:text-green-400" />
          </div>
          <p className="text-green-700 dark:text-green-400 font-semibold">
            {opponentName} joined!
          </p>
          <p className="text-xs text-green-600 dark:text-green-500">
            Starting game...
          </p>
        </div>
      )}
    </div>
  )
}
