'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Brain, Home, Users, Trophy, TrendingUp, Menu, X, FileText, Settings } from 'lucide-react'

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false)

  const menuItems = [
    { icon: Home, label: 'Home', href: '/', description: 'Create solo quizzes' },
    { icon: Users, label: 'Public Rooms', href: '/rooms', description: 'Browse active rooms' },
    { icon: Trophy, label: 'Dashboard', href: '/dashboard', description: 'View your stats' },
    { icon: TrendingUp, label: 'Trending', href: '/#trending', description: 'Popular topics' },
    { icon: FileText, label: 'Upload Quiz', href: '/#upload', description: 'Custom content' },
  ]

  return (
    <>
      {/* Toggle Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 bg-blue-600 hover:bg-blue-700"
        size="icon"
      >
        {isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </Button>

      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed top-0 left-0 h-full w-80 bg-white dark:bg-gray-900 shadow-xl z-40 transform transition-transform duration-300 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center gap-3 mb-8 mt-12">
            <Brain className="h-8 w-8 text-blue-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Threevia</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">AI-Powered Trivia</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="space-y-2">
            {menuItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 focus:bg-gray-100 dark:focus:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors group"
              >
                <item.icon className="h-5 w-5 text-gray-600 dark:text-gray-400 group-hover:text-blue-600 mt-0.5" />
                <div>
                  <div className="font-medium text-gray-900 dark:text-white group-hover:text-blue-600">
                    {item.label}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {item.description}
                  </div>
                </div>
              </a>
            ))}
          </nav>

          {/* Multiplayer Options */}
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Multiplayer</h3>
            <div className="space-y-2 mb-6">
              <a
                href="/rooms"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 focus:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded transition-colors"
              >
                <Users className="h-4 w-4" />
                Browse Public Rooms
              </a>
              <button
                onClick={() => {
                  setIsOpen(false)
                  // Trigger multiplayer modal on homepage
                  window.location.href = '/#multiplayer'
                }}
                className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 focus:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded transition-colors w-full text-left p-2"
              >
                <span className="text-purple-500">🎮</span>
                Create/Join Room
              </button>
            </div>
          </div>

          {/* Features */}
          <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Features</h3>
            <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                AI Quiz Generation
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Real-time Multiplayer
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Progress Tracking
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Custom Content Upload
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Trending Topics
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Dark Mode Support
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Made with ❤️ by <a href="https://gigme.space" className="text-blue-600 hover:underline">gigme</a>
            </p>
          </div>
        </div>
      </div>
    </>
  )
}