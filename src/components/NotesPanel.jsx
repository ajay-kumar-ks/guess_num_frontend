import { useState, useEffect, useRef } from 'react'
import { ChevronDown, StickyNote } from 'lucide-react'

const STORAGE_KEY = 'game_notes'
function loadNotes() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') }
  catch { return {} }
}

export default function NotesPanel({ roomCode }) {
  const [notes, setNotes] = useState('')
  const [expanded, setExpanded] = useState(false)
  const savedRef = useRef(false)

  useEffect(() => {
    const all = loadNotes()
    setNotes(all[roomCode] || '')
  }, [roomCode])

  useEffect(() => {
    if (!savedRef.current) { savedRef.current = true; return }
    const timer = setTimeout(() => {
      const all = loadNotes()
      all[roomCode] = notes
      localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
    }, 500)
    return () => clearTimeout(timer)
  }, [notes, roomCode])

  return (
    <div className="card !p-0 overflow-hidden transition-all duration-300">
      <button onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 min-h-[44px] hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
        <span className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400">
          <StickyNote size={14} />
          Notes
          {notes && <span className="w-1.5 h-1.5 rounded-full bg-primary-500" />}
        </span>
        <ChevronDown size={14} className={`text-gray-400 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
      </button>
      <div className={`transition-all duration-300 overflow-hidden ${expanded ? 'max-h-80' : 'max-h-0'}`}>
        <div className="px-4 pb-4">
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
            placeholder="Jot down your thoughts or deductions..."
            className="w-full h-28 p-3 bg-gray-50 dark:bg-gray-700/30 rounded-xl text-sm resize-none border border-gray-100 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 placeholder:text-gray-400 dark:placeholder:text-gray-500 transition-all duration-150" />
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-[10px] text-gray-400 dark:text-gray-500">Private &middot; Saved locally</span>
            <span className="text-[10px] text-gray-400 dark:text-gray-500">{notes.length}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
