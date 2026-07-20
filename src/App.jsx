import { Routes, Route } from 'react-router-dom'
import { GameProvider } from './context/GameContext'
import { ToastProvider } from './context/ToastContext'
import Layout from './layouts/Layout'
import Home from './pages/Home'
import CreateRoom from './pages/CreateRoom'
import JoinRoom from './pages/JoinRoom'
import WaitingRoom from './pages/WaitingRoom'
import SecretNumber from './pages/SecretNumber'
import Game from './pages/Game'
import Winner from './pages/Winner'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <ToastProvider>
      <GameProvider>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="create-room" element={<CreateRoom />} />
            <Route path="join-room" element={<JoinRoom />} />
            <Route path="waiting-room/:roomCode" element={<WaitingRoom />} />
            <Route path="secret-number/:roomCode" element={<SecretNumber />} />
            <Route path="game/:roomCode" element={<Game />} />
            <Route path="winner/:roomCode" element={<Winner />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </GameProvider>
    </ToastProvider>
  )
}
