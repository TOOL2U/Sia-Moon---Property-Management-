'use client'

import React, { useState, useEffect, createContext, useContext } from 'react'
import { createPortal } from 'react-dom'
import { X, CheckCircle, AlertCircle, Info, Loader2 } from 'lucide-react'

interface Toast {
  id: string
  type: 'success' | 'error' | 'info' | 'loading'
  message: string
  duration?: number
}

interface ToastContextType {
  addToast: (toast: Omit<Toast, 'id'>) => string
  removeToast: (id: string) => void
  success: (message: string, duration?: number) => string
  error: (message: string, duration?: number) => string
  info: (message: string, duration?: number) => string
  loading: (message: string) => string
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  useEffect(() => {
    if (toast.type !== 'loading' && toast.duration !== 0) {
      const timer = setTimeout(() => {
        onRemove(toast.id)
      }, toast.duration || 4000)

      return () => clearTimeout(timer)
    }
  }, [toast.id, toast.duration, toast.type, onRemove])

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-400" />
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-400" />
      case 'loading':
        return <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
      default:
        return <Info className="w-5 h-5 text-blue-400" />
    }
  }

  const getBgColor = () => {
    switch (toast.type) {
      case 'success':
        return 'bg-green-900/20 border-green-500/30'
      case 'error':
        return 'bg-red-900/20 border-red-500/30'
      case 'loading':
        return 'bg-blue-900/20 border-blue-500/30'
      default:
        return 'bg-gray-900/20 border-gray-500/30'
    }
  }

  return (
    <div
      className={`
        flex items-center gap-3 p-4 rounded-lg border backdrop-blur-sm
        ${getBgColor()}
        animate-in slide-in-from-right-full duration-300
        shadow-lg max-w-md
      `}
    >
      {getIcon()}
      <span className="text-white text-sm flex-1">{toast.message}</span>
      {toast.type !== 'loading' && (
        <button
          onClick={() => onRemove(toast.id)}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}

function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: string) => void }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || typeof window === 'undefined') {
    return null
  }

  return createPortal(
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>,
    document.body
  )
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = (toast: Omit<Toast, 'id'>): string => {
    const id = Math.random().toString(36).substr(2, 9)
    const newToast = { ...toast, id }
    
    setToasts((prev) => [...prev, newToast])
    return id
  }

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }

  const success = (message: string, duration?: number): string => {
    return addToast({ type: 'success', message, duration })
  }

  const error = (message: string, duration?: number): string => {
    return addToast({ type: 'error', message, duration })
  }

  const info = (message: string, duration?: number): string => {
    return addToast({ type: 'info', message, duration })
  }

  const loading = (message: string): string => {
    return addToast({ type: 'loading', message, duration: 0 })
  }

  const contextValue: ToastContextType = {
    addToast,
    removeToast,
    success,
    error,
    info,
    loading
  }

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  )
}

// Simple toast utility for direct usage (similar to react-hot-toast API)
export const simpleToast = {
  success: (message: string) => {
    if (typeof window !== 'undefined') {
      // Create a temporary toast element
      const toastEl = document.createElement('div')
      toastEl.className = `
        fixed top-4 right-4 z-50 flex items-center gap-3 p-4 rounded-lg border
        bg-green-900/20 border-green-500/30 backdrop-blur-sm shadow-lg max-w-md
        animate-in slide-in-from-right-full duration-300
      `
      toastEl.innerHTML = `
        <svg class="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <span class="text-white text-sm flex-1">${message}</span>
      `
      
      document.body.appendChild(toastEl)
      
      setTimeout(() => {
        if (toastEl.parentNode) {
          toastEl.parentNode.removeChild(toastEl)
        }
      }, 4000)
    } else {
      console.log('✅ Toast (SSR):', message)
    }
  },

  error: (message: string) => {
    if (typeof window !== 'undefined') {
      const toastEl = document.createElement('div')
      toastEl.className = `
        fixed top-4 right-4 z-50 flex items-center gap-3 p-4 rounded-lg border
        bg-red-900/20 border-red-500/30 backdrop-blur-sm shadow-lg max-w-md
        animate-in slide-in-from-right-full duration-300
      `
      toastEl.innerHTML = `
        <svg class="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <span class="text-white text-sm flex-1">${message}</span>
      `
      
      document.body.appendChild(toastEl)
      
      setTimeout(() => {
        if (toastEl.parentNode) {
          toastEl.parentNode.removeChild(toastEl)
        }
      }, 4000)
    } else {
      console.error('❌ Toast (SSR):', message)
    }
  },

  loading: (message: string) => {
    if (typeof window !== 'undefined') {
      const toastEl = document.createElement('div')
      toastEl.className = `
        fixed top-4 right-4 z-50 flex items-center gap-3 p-4 rounded-lg border
        bg-blue-900/20 border-blue-500/30 backdrop-blur-sm shadow-lg max-w-md
        animate-in slide-in-from-right-full duration-300
      `
      toastEl.innerHTML = `
        <svg class="w-5 h-5 text-blue-400 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span class="text-white text-sm flex-1">${message}</span>
      `
      
      document.body.appendChild(toastEl)
      return toastEl
    } else {
      console.log('⏳ Toast (SSR):', message)
      return null
    }
  },

  dismiss: (toastEl?: Element | null) => {
    if (toastEl && toastEl.parentNode) {
      toastEl.parentNode.removeChild(toastEl)
    }
  }
}
