'use client'

import { useState, useEffect } from 'react'
import { Brain, DollarSign, Trophy } from 'lucide-react'
import Navbar from '@/components/Navbar'

export default function GambleRoomsPage() {
  const [matches, setMatches] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMatches()
    const interval = setInterval(fetchMatches, 5000)
    return () => clearInterval(interval)
  }, [])

  const fetchMatches = async () => {
    try {
      const response = await fetch('/api/gamble/public-matches')
      const data = await response.json()
      setMatches(data.matches || [])
    } catch (error) {
      console.error('Failed to fetch matches:', error)
    }
    setLoading(false)
  }

  const joinMatch = async (matchCode: string) => {
    const randomName = `Player${Math.floor(Math.random() * 1000)}`
    
    try {
      const response = await fetch('/api/gamble/join-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchCode,
          playerName: randomName
        })
      })
      
      const data = await response.json()
      if (data.success) {
        window.location.href = `/gamble?match=${matchCode}&player=${randomName}`
      } else {
        alert(data.error || 'Failed to join match')
      }
    } catch (error) {
      alert('Failed to join match')
    }
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">💰 Public Gamble Matches</h1>
          <p className="text-slate-600 dark:text-slate-400">Join high-stakes quiz battles</p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <Brain className="h-12 w-12 animate-pulse text-blue-500 mx-auto mb-4" />
            <div className="text-xl font-semibold text-slate-900 dark:text-slate-100">Loading matches...</div>
          </div>
        ) : matches.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-8 text-center">
            <div className="text-6xl mb-4">💰</div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">No Public Matches</h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6">Be the first to create a public gambling match!</p>
            <button 
              onClick={() => window.location.href = '/'}
              className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-xl transition-colors"
            >
              Create Match
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {matches.map((match) => (
              <div key={match.matchCode} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-blue-500" />
                    {match.topic}
                  </h3>
                  <div className="text-sm text-slate-500">
                    Match: {match.matchCode}
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-2 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-sm text-slate-600 dark:text-slate-400">
                      <span className="whitespace-nowrap">💰 ${match.betAmount * 2} pot</span>
                      <span className="whitespace-nowrap">⏱️ {match.timePerQuestion}s</span>
                      <span className="whitespace-nowrap">📊 {match.difficulty}</span>
                      <span className="whitespace-nowrap">❓ {match.questionCount}q</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                      <Trophy className="h-4 w-4 text-blue-500" />
                      <span className="whitespace-nowrap">{match.players.length}/2 players</span>
                      <span>• {match.gameRules} rules</span>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button 
                      onClick={() => joinMatch(match.matchCode)} 
                      disabled={match.players.length >= 2}
                      className={`px-4 py-2 font-medium rounded-lg transition-colors whitespace-nowrap ${
                        match.players.length >= 2 
                          ? 'bg-slate-300 dark:bg-slate-600 text-slate-500 cursor-not-allowed'
                          : 'bg-blue-500 hover:bg-blue-600 text-white'
                      }`}
                    >
                      {match.players.length >= 2 ? 'Full' : `Join ($${match.betAmount})`}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}