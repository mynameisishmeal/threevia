'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Brain, DollarSign, ArrowLeft, Trophy } from 'lucide-react'

export default function GamblePage() {
  const searchParams = useSearchParams()
  const matchCode = searchParams.get('match')
  const playerName = searchParams.get('player')
  
  const [match, setMatch] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [payingBet, setPayingBet] = useState(false)

  useEffect(() => {
    if (matchCode) {
      fetchMatchStatus()
      const interval = setInterval(fetchMatchStatus, 2000)
      return () => clearInterval(interval)
    }
  }, [matchCode])

  const fetchMatchStatus = async () => {
    try {
      const response = await fetch('/api/multiplayer/room-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomCode: matchCode })
      })
      
      // For now, using room-status API, should create match-status API
      setLoading(false)
    } catch (error) {
      console.error('Failed to fetch match status:', error)
      setLoading(false)
    }
  }

  const payBet = async () => {
    setPayingBet(true)
    try {
      const response = await fetch('/api/gamble/submit-bet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchCode, playerName })
      })
      
      const data = await response.json()
      if (data.success && data.allPaid) {
        // Start quiz
        window.location.href = `/quiz?topic=Literature&difficulty=medium&count=10&gamble=${matchCode}`
      }
    } catch (error) {
      alert('Failed to pay bet')
    }
    setPayingBet(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Brain className="h-12 w-12 animate-pulse text-cyan-500 mx-auto mb-4" />
          <div className="text-xl font-semibold">Loading match...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <Button variant="outline" onClick={() => window.location.href = '/'}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Leave Match
            </Button>
            <div className="text-center">
              <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">Match: {matchCode}</div>
              <div className="text-sm text-slate-600 dark:text-slate-400">💰 Gamble Mode</div>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Betting Lobby
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-lg border-2 border-cyan-200 dark:border-cyan-800">
                  <Trophy className="h-12 w-12 text-cyan-500 mx-auto mb-2 animate-pulse" />
                  <div className="text-2xl font-bold text-blue-800 dark:text-blue-200">$20</div>
                  <div className="text-sm text-blue-600 dark:text-blue-400">Total Prize Pool</div>
                  <div className="text-xs text-gray-500 mt-2">
                    30s per question • Standard rules
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">Player 1</span>
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                      ✓ Bet Paid ($10)
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">{playerName} (You)</span>
                    <Button onClick={payBet} disabled={payingBet} size="sm">
                      {payingBet ? 'Paying...' : 'Pay $10 Bet'}
                    </Button>
                  </div>
                </div>

                <div className="text-center text-gray-600">
                  <div className="text-sm">Quiz starts when both players pay their bets</div>
                  <div className="text-xs mt-1">Winner takes the entire $20 prize pool!</div>
                  <div className="text-xs mt-2 p-2 bg-blue-50 rounded">
                    🏆 <strong>Rules:</strong> Standard scoring (1 point per correct answer)
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}