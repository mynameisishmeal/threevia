'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface GambleModalProps {
  open: boolean
  onClose: () => void
  topic: string
  difficulty: string
  questionCount: number
}

interface GambleState {
  mode: 'menu' | 'create' | 'join'
  playerName: string
  matchCode: string
  betAmount: number
  timePerQuestion: number
  gameRules: string
  isPrivate: boolean
  loading: boolean
  error: string | null
}

const INITIAL_STATE: GambleState = {
  mode: 'menu',
  playerName: '',
  matchCode: '',
  betAmount: 10,
  timePerQuestion: 30,
  gameRules: 'standard',
  isPrivate: false,
  loading: false,
  error: null
}

const TIME_OPTIONS = [
  { value: 5, label: '5 seconds (Lightning)' },
  { value: 10, label: '10 seconds (Fast)' },
  { value: 15, label: '15 seconds (Speed)' },
  { value: 30, label: '30 seconds (Standard)' }
]

const GAME_RULES = [
  { value: 'standard', label: 'Standard (1 point per correct)' },
  { value: 'speed', label: 'Speed Bonus (faster = more points)' },
  { value: 'elimination', label: 'Sudden Death (first wrong loses)' },
  { value: 'streak', label: 'Streak Mode (consecutive bonus)' }
]

export default function GambleModal({ open, onClose, topic, difficulty, questionCount }: GambleModalProps) {
  const [state, setState] = useState<GambleState>(INITIAL_STATE)

  const resetState = useCallback(() => {
    setState(INITIAL_STATE)
  }, [])

  const handleClose = useCallback(() => {
    resetState()
    onClose()
  }, [resetState, onClose])

  const setError = useCallback((error: string) => {
    setState(prev => ({ ...prev, error, loading: false }))
  }, [])

  const handleCreateMatch = useCallback(async () => {
    if (!state.playerName.trim()) {
      setError('Please enter your name')
      return
    }

    if (state.playerName.length > 20) {
      setError('Name must be 20 characters or less')
      return
    }

    setState(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      const response = await fetch('/api/gamble/create-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerName: state.playerName.trim(),
          betAmount: state.betAmount,
          topic,
          difficulty,
          questionCount,
          timePerQuestion: state.timePerQuestion,
          gameRules: state.gameRules,
          isPrivate: state.isPrivate
        })
      })
      
      if (!response.ok) {
        throw new Error(`Failed to create match: ${response.statusText}`)
      }
      
      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error)
      }
      
      if (data.matchCode) {
        window.location.href = `/gamble?match=${data.matchCode}&player=${encodeURIComponent(state.playerName.trim())}`
      } else {
        throw new Error('No match code received')
      }
    } catch (error) {
      console.error('Create match error:', error)
      setError(error instanceof Error ? error.message : 'Failed to create match')
    }
  }, [state, topic, difficulty, questionCount, setError])

  const handleJoinMatch = useCallback(async () => {
    if (!state.matchCode.trim()) {
      setError('Please enter a match code')
      return
    }

    if (state.matchCode.length !== 6) {
      setError('Match code must be 6 characters')
      return
    }

    setState(prev => ({ ...prev, loading: true, error: null }))
    
    const randomName = `Player${Math.floor(Math.random() * 1000)}`
    
    try {
      const response = await fetch('/api/gamble/join-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchCode: state.matchCode.toUpperCase(),
          playerName: randomName
        })
      })
      
      if (!response.ok) {
        throw new Error(`Failed to join match: ${response.statusText}`)
      }
      
      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error)
      }
      
      if (data.success) {
        window.location.href = `/gamble?match=${state.matchCode.toUpperCase()}&player=${encodeURIComponent(randomName)}`
      } else {
        throw new Error('Failed to join match')
      }
    } catch (error) {
      console.error('Join match error:', error)
      setError(error instanceof Error ? error.message : 'Failed to join match')
    }
  }, [state.matchCode, setError])

  const updateState = useCallback((updates: Partial<GambleState>) => {
    setState(prev => ({ ...prev, ...updates }))
  }, [])

  const handleBetAmountChange = useCallback((value: string) => {
    const amount = Math.max(1, Math.min(1000, parseInt(value) || 1))
    updateState({ betAmount: amount })
  }, [updateState])

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>💰 Gamble Mode</DialogTitle>
        </DialogHeader>
        
        {state.error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-800 dark:text-red-200">❌ {state.error}</p>
          </div>
        )}
        
        {state.mode === 'menu' && (
          <div className="space-y-4">
            <div className="text-sm text-gray-600 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              ⚠️ <strong>Warning:</strong> This is for entertainment only. No real money involved.
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Quiz: <strong>{topic}</strong> • {difficulty} • {questionCount} questions
            </div>
            <div className="space-y-2">
              <Button 
                onClick={() => updateState({ mode: 'create', error: null })} 
                className="w-full"
                disabled={state.loading}
              >
                Create Gamble Match
              </Button>
              <Button 
                onClick={() => updateState({ mode: 'join', error: null })} 
                variant="outline" 
                className="w-full"
                disabled={state.loading}
              >
                Join with Code
              </Button>
              <Button 
                onClick={() => window.location.href = '/gamble-rooms'} 
                variant="outline" 
                className="w-full"
                disabled={state.loading}
              >
                Browse Public Matches
              </Button>
            </div>
          </div>
        )}
        
        {state.mode === 'create' && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="player-name">Your Name</Label>
              <Input
                id="player-name"
                value={state.playerName}
                onChange={(e) => updateState({ playerName: e.target.value, error: null })}
                placeholder="Enter your name"
                maxLength={20}
                disabled={state.loading}
              />
            </div>
            
            <div>
              <Label htmlFor="bet-amount">Bet Amount (Virtual $)</Label>
              <Input
                id="bet-amount"
                type="number"
                value={state.betAmount}
                onChange={(e) => handleBetAmountChange(e.target.value)}
                min="1"
                max="1000"
                disabled={state.loading}
              />
            </div>
            
            <div>
              <Label htmlFor="time-per-question">Time per Question</Label>
              <select 
                id="time-per-question"
                value={state.timePerQuestion} 
                onChange={(e) => updateState({ timePerQuestion: parseInt(e.target.value) })}
                className="w-full p-2 border rounded-md bg-background text-foreground"
                disabled={state.loading}
              >
                {TIME_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <Label htmlFor="game-rules">Game Rules</Label>
              <select 
                id="game-rules"
                value={state.gameRules} 
                onChange={(e) => updateState({ gameRules: e.target.value })}
                className="w-full p-2 border rounded-md bg-background text-foreground"
                disabled={state.loading}
              >
                {GAME_RULES.map(rule => (
                  <option key={rule.value} value={rule.value}>
                    {rule.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="private-gamble"
                checked={state.isPrivate}
                onChange={(e) => updateState({ isPrivate: e.target.checked })}
                className="rounded"
                disabled={state.loading}
              />
              <Label htmlFor="private-gamble" className="text-sm">
                🔒 Private Match (requires code to join)
              </Label>
            </div>
            
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Winner takes all: ${state.betAmount * 2} • {state.timePerQuestion}s per question
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={() => updateState({ mode: 'menu', error: null })} 
                variant="outline" 
                className="flex-1"
                disabled={state.loading}
              >
                Back
              </Button>
              <Button 
                onClick={handleCreateMatch} 
                disabled={state.loading || !state.playerName.trim()} 
                className="flex-1"
              >
                {state.loading ? 'Creating...' : 'Create Match'}
              </Button>
            </div>
          </div>
        )}
        
        {state.mode === 'join' && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="match-code">Match Code</Label>
              <Input
                id="match-code"
                value={state.matchCode}
                onChange={(e) => updateState({ 
                  matchCode: e.target.value.toUpperCase().slice(0, 6),
                  error: null 
                })}
                placeholder="Enter 6-digit match code"
                maxLength={6}
                autoFocus
                disabled={state.loading}
              />
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={() => updateState({ mode: 'menu', error: null })} 
                variant="outline" 
                className="flex-1"
                disabled={state.loading}
              >
                Back
              </Button>
              <Button 
                onClick={handleJoinMatch} 
                disabled={state.loading || !state.matchCode.trim()} 
                className="flex-1"
              >
                {state.loading ? 'Joining...' : 'Join Match'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}