'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Brain, Users, ArrowLeft, Eye } from 'lucide-react'

export default function PublicRoomsPage() {
  const [rooms, setRooms] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRooms()
    const interval = setInterval(fetchRooms, 5000)
    return () => clearInterval(interval)
  }, [])

  const fetchRooms = async () => {
    try {
      const response = await fetch('/api/multiplayer/public-rooms')
      const data = await response.json()
      setRooms(data.rooms || [])
    } catch (error) {
      console.error('Failed to fetch rooms:', error)
    }
    setLoading(false)
  }

  const joinRoom = async (roomCode: string, asSpectator = false) => {
    const randomName = `${asSpectator ? 'Spectator' : 'Player'}${Math.floor(Math.random() * 1000)}`
    
    try {
      const response = await fetch('/api/multiplayer/join-room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomCode,
          playerName: randomName,
          asSpectator
        })
      })
      
      const data = await response.json()
      if (data.success) {
        const spectatorParam = asSpectator ? '&spectator=true' : ''
        window.location.href = `/multiplayer?room=${roomCode}&player=${randomName}${spectatorParam}`
      } else {
        alert(data.error || 'Failed to join room')
      }
    } catch (error) {
      alert('Failed to join room')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <Button variant="outline" onClick={() => window.location.href = '/'}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
            <div className="text-center">
              <h1 className="text-2xl font-bold text-purple-600">Public Rooms</h1>
              <p className="text-sm text-gray-600">Join ongoing quiz battles</p>
            </div>
            <div></div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <Brain className="h-12 w-12 animate-pulse text-purple-600 mx-auto mb-4" />
              <div className="text-xl font-semibold">Loading rooms...</div>
            </div>
          ) : rooms.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-6xl mb-4">🏠</div>
                <h2 className="text-xl font-semibold mb-2">No Public Rooms</h2>
                <p className="text-gray-600 mb-4">Be the first to create a public room!</p>
                <Button onClick={() => window.location.href = '/'}>
                  Create Room
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {rooms.map((room) => (
                <Card key={room.roomCode} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">
                        {room.topic}
                      </CardTitle>
                      <div className="text-sm text-gray-500">
                        Room: {room.roomCode}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>Difficulty: {room.difficulty}</span>
                          <span>Questions: {room.questionCount}</span>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            room.status === 'waiting' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {room.status === 'waiting' ? 'Waiting' : 'Playing'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Users className="h-4 w-4" />
                          <span>{room.players.length}/8 players</span>
                          {room.spectators?.length > 0 && (
                            <span className="text-gray-500">• {room.spectators.length} spectators</span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {room.status === 'waiting' && room.players.length < 8 && (
                          <Button onClick={() => joinRoom(room.roomCode, false)}>
                            Join Game
                          </Button>
                        )}
                        <Button 
                          variant="outline" 
                          onClick={() => joinRoom(room.roomCode, true)}
                          className="flex items-center gap-1"
                        >
                          <Eye className="h-4 w-4" />
                          Spectate
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}