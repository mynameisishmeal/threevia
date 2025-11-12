'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface MultiplayerModalProps {
  open: boolean
  onClose: () => void
  topic: string
  difficulty: string
  questionCount: number
}

export default function MultiplayerModal({ open, onClose, topic, difficulty, questionCount }: MultiplayerModalProps) {
  const [mode, setMode] = useState<'menu' | 'create' | 'join'>('menu')
  const [playerName, setPlayerName] = useState('')
  const [roomCode, setRoomCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [isPrivate, setIsPrivate] = useState(false)

  const handleCreateRoom = async () => {
    if (!playerName.trim()) return
    setLoading(true)
    
    try {
      const response = await fetch('/api/multiplayer/create-room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hostName: playerName,
          topic,
          difficulty,
          questionCount,
          isPrivate
        })
      })
      
      const data = await response.json()
      if (data.roomCode) {
        window.location.href = `/multiplayer?room=${data.roomCode}&player=${playerName}`
      }
    } catch (error) {
      alert('Failed to create room')
    }
    setLoading(false)
  }

  const handleJoinRoom = async (asSpectator = false) => {
    if (!roomCode.trim()) return
    const randomName = `${asSpectator ? 'Spectator' : 'Player'}${Math.floor(Math.random() * 1000)}`
    setLoading(true)
    
    try {
      const response = await fetch('/api/multiplayer/join-room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomCode: roomCode.toUpperCase(),
          playerName: randomName,
          asSpectator
        })
      })
      
      const data = await response.json()
      if (data.success) {
        const spectatorParam = asSpectator ? '&spectator=true' : ''
        window.location.href = `/multiplayer?room=${roomCode.toUpperCase()}&player=${randomName}${spectatorParam}`
      } else {
        alert(data.error || 'Failed to join room')
      }
    } catch (error) {
      alert('Failed to join room')
    }
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>🎮 Multiplayer Quiz</DialogTitle>
        </DialogHeader>
        
        {mode === 'menu' && (
          <div className="space-y-4">
            <div className="text-sm text-gray-600">
              Quiz: <strong>{topic}</strong> • {difficulty} • {questionCount} questions
            </div>
            <div className="space-y-2">
              <Button onClick={() => setMode('create')} className="w-full">
                Create Room
              </Button>
              <Button onClick={() => setMode('join')} variant="outline" className="w-full">
                Join with Code
              </Button>
              <Button onClick={() => window.location.href = '/rooms'} variant="outline" className="w-full">
                Browse Public Rooms
              </Button>
            </div>
          </div>
        )}
        
        {mode === 'create' && (
          <div className="space-y-4">
            <div>
              <Label>Your Name</Label>
              <Input
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Enter your name"
                maxLength={20}
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="private-room"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="private-room" className="text-sm">
                🔒 Private Room (requires code to join)
              </Label>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setMode('menu')} variant="outline" className="flex-1">
                Back
              </Button>
              <Button onClick={handleCreateRoom} disabled={loading || !playerName.trim()} className="flex-1">
                {loading ? 'Creating...' : 'Create Room'}
              </Button>
            </div>
          </div>
        )}
        
        {mode === 'join' && (
          <div className="space-y-4">
            <div>
              <Label>Room Code</Label>
              <Input
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="Enter 6-digit room code"
                maxLength={6}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <div className="flex gap-2">
                <Button onClick={() => handleJoinRoom(false)} disabled={loading || !roomCode.trim()} className="flex-1">
                  {loading ? 'Joining...' : 'Join as Player'}
                </Button>
                <Button onClick={() => handleJoinRoom(true)} disabled={loading || !roomCode.trim()} variant="outline" className="flex-1">
                  {loading ? 'Joining...' : '👁️ Spectate'}
                </Button>
              </div>
              <Button onClick={() => setMode('menu')} variant="outline" className="w-full">
                Back
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}