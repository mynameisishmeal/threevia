'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Brain, Users, Crown, ArrowLeft, Clock } from 'lucide-react'
import MultiplayerQuiz from '@/components/MultiplayerQuiz'
import KickPlayerDialog from '@/components/KickPlayerDialog'

export default function MultiplayerPage() {
  const searchParams = useSearchParams()
  const roomCode = searchParams.get('room')
  const playerName = searchParams.get('player')
  
  const [room, setRoom] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [myReadyStatus, setMyReadyStatus] = useState(false)
  const [showKickDialog, setShowKickDialog] = useState(false)
  const [playerToKick, setPlayerToKick] = useState('')

  const startQuiz = async () => {
    try {
      await fetch('/api/multiplayer/start-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomCode, playerName })
      })
    } catch (error) {
      alert('Failed to start quiz')
    }
  }

  const toggleReady = async () => {
    const newStatus = !myReadyStatus
    setMyReadyStatus(newStatus)
    
    try {
      await fetch('/api/multiplayer/ready-toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomCode, playerName, ready: newStatus })
      })
    } catch (error) {
      console.error('Failed to toggle ready:', error)
    }
  }

  const kickPlayer = async () => {
    try {
      await fetch('/api/multiplayer/kick-player', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomCode, hostName: playerName, playerToKick })
      })
      setShowKickDialog(false)
      setPlayerToKick('')
    } catch (error) {
      alert('Failed to kick player')
    }
  }

  const openKickDialog = (player: string) => {
    setPlayerToKick(player)
    setShowKickDialog(true)
  }

  useEffect(() => {
    if (roomCode) {
      fetchRoomStatus()
      const interval = setInterval(fetchRoomStatus, 2000) // Poll every 2 seconds
      return () => clearInterval(interval)
    }
  }, [roomCode])

  const fetchRoomStatus = async () => {
    try {
      const response = await fetch('/api/multiplayer/room-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomCode })
      })
      
      const data = await response.json()
      if (data.room) {
        setRoom(data.room)
      }
      setLoading(false)
    } catch (error) {
      console.error('Failed to fetch room status:', error)
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 flex items-center justify-center">
        <div className="text-center">
          <Brain className="h-12 w-12 animate-pulse text-purple-600 mx-auto mb-4" />
          <div className="text-xl font-semibold">Loading room...</div>
        </div>
      </div>
    )
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <div className="text-6xl mb-4">❌</div>
            <h2 className="text-xl font-semibold mb-2">Room Not Found</h2>
            <p className="text-gray-600 mb-4">The room code "{roomCode}" doesn't exist or has expired.</p>
            <Button onClick={() => window.location.href = '/'}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <Button variant="outline" onClick={() => window.location.href = '/'}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Leave Room
            </Button>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">Room: {roomCode}</div>
              <div className="text-sm text-gray-600">{room.topic} • {room.difficulty}</div>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Players ({room.players.length}/8)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {room.players.map((player: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      {player.name === room.hostName && <Crown className="h-4 w-4 text-yellow-500" />}
                      <span className={`font-medium ${player.name === playerName ? 'text-purple-600' : ''}`}>
                        {player.name} {player.name === playerName && '(You)'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        player.ready ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {player.ready ? 'Ready' : 'Not Ready'}
                      </div>
                      {room.hostName === playerName && player.name !== playerName && (
                        <button
                          onClick={() => openKickDialog(player.name)}
                          className="text-red-500 hover:text-red-700 text-xs px-2 py-1 rounded border border-red-300 hover:bg-red-50"
                        >
                          Kick
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {room.status === 'waiting' && (
                <div className="mt-6 text-center">
                  <div className="text-gray-600 mb-4">
                    Waiting for more players... Share the room code: <strong>{roomCode}</strong><br/>
                    <small className="text-gray-500">Need at least 2 players to start</small>
                  </div>
                  <div className="space-y-3">
                    <Button 
                      onClick={toggleReady}
                      className={`w-full ${myReadyStatus ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}
                    >
                      {myReadyStatus ? 'Not Ready' : 'Ready Up'}
                    </Button>
                    
                    {room.hostName === playerName && (
                      <Button 
                        onClick={startQuiz}
                        disabled={room.players.length < 2 || !room.players.every((p: any) => p.ready)}
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600"
                      >
                        {room.players.every((p: any) => p.ready) ? 
                          `Start Quiz (${room.players.length} players)` : 
                          'Waiting for all players to be ready...'
                        }
                      </Button>
                    )}
                    
                    {room.hostName !== playerName && (
                      <div className="text-center text-gray-500">
                        {room.players.every((p: any) => p.ready) ? 
                          'Waiting for host to start...' : 
                          'Waiting for all players to be ready...'
                        }
                      </div>
                    )}
                  </div>
                </div>
              )}

              {room.status === 'playing' && room.questions && (
                <MultiplayerQuiz 
                  room={room}
                  playerName={playerName}
                  roomCode={roomCode}
                />
              )}

              {room.status === 'finished' && (
                <div className="mt-6 text-center">
                  <div className="text-lg font-semibold text-blue-600">🏆 Quiz Completed!</div>
                  <Button className="mt-4" onClick={() => window.location.href = '/'}>
                    New Quiz
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      
      <KickPlayerDialog
        open={showKickDialog}
        onClose={() => setShowKickDialog(false)}
        onConfirm={kickPlayer}
        playerName={playerToKick}
      />
    </div>
  )
}