import { Link } from 'react-router-dom'
import { Home, SearchX } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="text-center space-y-6 py-12">
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-700 shadow-lg mb-2">
        <SearchX size={36} className="text-white" />
      </div>
      <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">
        404
      </h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
        This page doesn't exist. Maybe it's time to start a new game?
      </p>
      <Link to="/" className="btn-primary inline-flex">
        <Home size={16} />
        Go Home
      </Link>
    </div>
  )
}
