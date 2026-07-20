import { useState, useEffect } from 'react'
import { Link, Outlet } from 'react-router-dom'
import { Sun, Moon, Plus, LogIn, Diamond } from 'lucide-react'

export default function Layout() {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode')
    if (saved !== null) return saved === 'true'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
    localStorage.setItem('darkMode', darkMode)
  }, [darkMode])

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      {/* Navbar */}
      <header className="sticky top-0 z-50 bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50">
        <nav className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-2 text-lg sm:text-xl font-bold bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent"
          >
            <Diamond size={16} className="text-primary-500" />
            Guess
          </Link>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <Link
              to="/create-room"
              className="inline-flex items-center justify-center min-h-[40px] min-w-[40px] sm:min-h-[44px] sm:min-w-[44px] px-3 sm:px-4 gap-1.5
                         bg-gradient-to-r from-primary-600 to-primary-500 text-white text-sm font-medium rounded-xl
                         hover:from-primary-700 hover:to-primary-600 active:from-primary-800
                         transition-all duration-200 shadow-lg shadow-primary-500/25"
            >
              <Plus size={16} />
              <span className="hidden sm:inline">Create</span>
            </Link>
            <Link
              to="/join-room"
              className="inline-flex items-center justify-center min-h-[40px] min-w-[40px] sm:min-h-[44px] sm:min-w-[44px] px-3 sm:px-4 gap-1.5
                         bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 text-sm font-medium rounded-xl
                         border-2 border-gray-200 dark:border-gray-700
                         hover:bg-gray-50 dark:hover:bg-gray-700
                         transition-all duration-200 shadow-sm"
            >
              <LogIn size={16} />
              <span className="hidden sm:inline">Join</span>
            </Link>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="min-h-[40px] min-w-[40px] sm:min-h-[44px] sm:min-w-[44px] flex items-center justify-center rounded-xl
                         bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700
                         border border-gray-200 dark:border-gray-700
                         transition-all duration-200 text-gray-600 dark:text-gray-300"
              aria-label="Toggle dark mode"
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-start justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-sm sm:max-w-md">
          <div className="animate-fade-in">
            <Outlet />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-4 text-xs text-gray-400 dark:text-gray-500 border-t border-gray-100 dark:border-gray-800/50">
        Guess The Number &middot; Real-Time Multiplayer
      </footer>
    </div>
  )
}
