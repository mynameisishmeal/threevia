'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

export default function WelcomeDialog() {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem('hasSeenWelcome')
    if (!hasSeenWelcome) {
      setIsOpen(true)
    }
  }, [])

  const closeDialog = () => {
    setIsOpen(false)
    localStorage.setItem('hasSeenWelcome', 'true')
  }

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={closeDialog}
    >
      <div 
        className="bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-8 max-w-md w-full mx-4 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={closeDialog}
          className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
        
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">
            Generate AI Quizzes Instantly
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Choose a topic below and test your knowledge with AI-generated questions. Create solo quizzes, multiplayer battles, or gamble matches.
          </p>
          <button
            onClick={closeDialog}
            className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-xl transition-colors"
          >
            Get Started
          </button>
        </div>
      </div>
    </div>
  )
}