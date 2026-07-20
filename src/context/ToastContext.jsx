import { createContext, useContext, useState, useCallback, useRef } from 'react'
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react'

const ToastContext = createContext(null)
let toastId = 0

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const timersRef = useRef({})

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
    clearTimeout(timersRef.current[id])
    delete timersRef.current[id]
  }, [])

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = ++toastId
    setToasts((prev) => [...prev, { id, message, type }])
    timersRef.current[id] = setTimeout(() => removeToast(id), duration)
    return id
  }, [removeToast])

  const success = useCallback((msg, d) => addToast(msg, 'success', d), [addToast])
  const error = useCallback((msg, d) => addToast(msg, 'error', d), [addToast])
  const info = useCallback((msg, d) => addToast(msg, 'info', d), [addToast])

  const icons = { success: CheckCircle, error: AlertCircle, info: Info }

  return (
    <ToastContext.Provider value={{ toasts, addToast, success, error, info, removeToast }}>
      {children}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 w-full max-w-sm px-4 pointer-events-none">
        {toasts.map((toast) => {
          const Icon = icons[toast.type] || Info
          return (
            <div key={toast.id}
              className={`pointer-events-auto animate-slide-up px-4 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2.5 transition-all duration-300 ${
                toast.type === 'success' ? 'bg-green-600 text-white' :
                toast.type === 'error' ? 'bg-red-600 text-white' :
                'bg-gray-800 text-white dark:bg-gray-700'}`}>
              <Icon size={16} className="flex-shrink-0" />
              <span className="flex-1">{toast.message}</span>
              <button onClick={() => removeToast(toast.id)}
                className="opacity-70 hover:opacity-100 min-h-[28px] min-w-[28px] flex items-center justify-center rounded-full hover:bg-white/10 transition-colors">
                <X size={14} />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
