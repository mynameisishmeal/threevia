'use client'

import { useState, useEffect } from 'react'
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
}

let toastId = 0
const toasts: Toast[] = []
const listeners: ((toasts: Toast[]) => void)[] = []

export function toast(message: string, type: 'success' | 'error' | 'info' = 'info') {
  const id = (++toastId).toString()
  const newToast = { id, message, type }
  
  toasts.push(newToast)
  listeners.forEach(listener => listener([...toasts]))
  
  setTimeout(() => {
    const index = toasts.findIndex(t => t.id === id)
    if (index > -1) {
      toasts.splice(index, 1)
      listeners.forEach(listener => listener([...toasts]))
    }
  }, 4000)
}

export function ToastContainer() {
  const [toastList, setToastList] = useState<Toast[]>([])

  useEffect(() => {
    listeners.push(setToastList)
    return () => {
      const index = listeners.indexOf(setToastList)
      if (index > -1) listeners.splice(index, 1)
    }
  }, [])

  const removeToast = (id: string) => {
    const index = toasts.findIndex(t => t.id === id)
    if (index > -1) {
      toasts.splice(index, 1)
      setToastList([...toasts])
    }
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toastList.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            "flex items-center gap-2 p-4 rounded-lg shadow-lg max-w-sm",
            "bg-white dark:bg-gray-800 border",
            toast.type === 'success' && "border-green-200 dark:border-green-800",
            toast.type === 'error' && "border-red-200 dark:border-red-800",
            toast.type === 'info' && "border-blue-200 dark:border-blue-800"
          )}
        >
          {toast.type === 'success' && <CheckCircle className="h-5 w-5 text-green-600" />}
          {toast.type === 'error' && <AlertCircle className="h-5 w-5 text-red-600" />}
          {toast.type === 'info' && <Info className="h-5 w-5 text-blue-600" />}
          
          <span className="flex-1 text-sm">{toast.message}</span>
          
          <button
            onClick={() => removeToast(toast.id)}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  )
}