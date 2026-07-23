import { createContext, useContext, useReducer, useCallback } from 'react'

const GameContext = createContext(null)

const initialState = {
  roomCode: null,
  playerId: null,
  playerName: null,
  opponentName: null,
  secretNumber: null,
  status: 'idle', // idle | waiting | playing | finished
  currentTurn: null,
  winner: null,
  guesses: [],
  connectionStatus: 'disconnected', // disconnected | connecting | connected
}

function gameReducer(state, action) {
  switch (action.type) {
    case 'SET_PLAYER':
      return {
        ...initialState,
        playerName: action.payload.name,
        playerId: action.payload.playerId,
        roomCode: action.payload.roomCode,
        status: 'waiting',
      }

    case 'OPPONENT_JOINED':
      return {
        ...state,
        opponentName: action.payload.name,
        status: 'ready',
      }

    case 'GAME_STARTED':
      return {
        ...state,
        status: 'playing',
        currentTurn: action.payload.currentTurn,
      }

    case 'SECRET_SUBMITTED':
      return {
        ...state,
        secretNumber: action.payload.secretNumber,
      }

    case 'GUESS_RESULT':
      if (!action.payload?.guess_id) {
        return {
          ...state,
          guesses: [...state.guesses, action.payload],
        }
      }
      if (state.guesses.some((g) => g.guess_id === action.payload.guess_id)) {
        return state
      }
      return {
        ...state,
        guesses: [...state.guesses, action.payload],
      }

    case 'TURN_CHANGED':
      return {
        ...state,
        currentTurn: action.payload.playerId,
      }

    case 'WINNER':
      return {
        ...state,
        status: 'finished',
        winner: action.payload,
        currentTurn: null,
      }

    case 'CONNECTION_STATUS':
      return {
        ...state,
        connectionStatus: action.payload,
      }

    case 'OPPONENT_DISCONNECTED':
      return {
        ...state,
        opponentName: null,
        status: 'waiting',
      }

    case 'RESET':
      return initialState

    default:
      return state
  }
}

export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(gameReducer, initialState)

  const setPlayer = useCallback((name, playerId, roomCode) => {
    dispatch({ type: 'SET_PLAYER', payload: { name, playerId, roomCode } })
  }, [])

  const opponentJoined = useCallback((name) => {
    dispatch({ type: 'OPPONENT_JOINED', payload: { name } })
  }, [])

  const gameStarted = useCallback((currentTurn) => {
    dispatch({ type: 'GAME_STARTED', payload: { currentTurn } })
  }, [])

  const secretSubmitted = useCallback((secretNumber) => {
    dispatch({ type: 'SECRET_SUBMITTED', payload: { secretNumber } })
  }, [])

  const addGuessResult = useCallback((guess) => {
    dispatch({ type: 'GUESS_RESULT', payload: guess })
  }, [])

  const turnChanged = useCallback((playerId) => {
    dispatch({ type: 'TURN_CHANGED', payload: { playerId } })
  }, [])

  const setWinner = useCallback((winner) => {
    dispatch({ type: 'WINNER', payload: winner })
  }, [])

  const setConnectionStatus = useCallback((status) => {
    dispatch({ type: 'CONNECTION_STATUS', payload: status })
  }, [])

  const opponentDisconnected = useCallback(() => {
    dispatch({ type: 'OPPONENT_DISCONNECTED' })
  }, [])

  const resetGame = useCallback(() => {
    dispatch({ type: 'RESET' })
  }, [])

  const value = {
    ...state,
    setPlayer,
    opponentJoined,
    gameStarted,
    secretSubmitted,
    addGuessResult,
    turnChanged,
    setWinner,
    setConnectionStatus,
    opponentDisconnected,
    resetGame,
  }

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>
}

export function useGame() {
  const context = useContext(GameContext)
  if (!context) {
    throw new Error('useGame must be used within a GameProvider')
  }
  return context
}
