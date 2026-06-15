import { createContext, useCallback, useContext, useState } from 'react'
import type { ReactNode } from 'react'
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react'

export type ToastType = 'error' | 'success' | 'info'

interface ToastItem {
  id: number
  message: string
  type: ToastType
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

let idCounter = 1

const ICONS = { error: AlertCircle, success: CheckCircle, info: Info }

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const showToast = useCallback(
    (message: string, type: ToastType = 'error') => {
      const id = idCounter++
      setToasts((prev) => [...prev, { id, message, type }])
      setTimeout(() => remove(id), 3500)
    },
    [remove],
  )

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="toast-container">
        {toasts.map(({ id, message, type }) => {
          const Icon = ICONS[type]
          return (
            <div key={id} className={`toast toast-${type}`} role="alert">
              <Icon size={16} aria-hidden="true" />
              <span>{message}</span>
              <button className="toast-close" onClick={() => remove(id)} aria-label="닫기">
                <X size={14} aria-hidden="true" />
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
