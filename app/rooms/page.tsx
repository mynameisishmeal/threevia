'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Brain, Users, Crown, ArrowLeft, RefreshCw } from 'lucide-react'

export default function PublicRoomsPage() {
  const [rooms, setRooms] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPublicRooms()
    const interval = setInterval(fetchPublicRooms, 5000) // Refresh every 5 seconds
    return () => clearInterval(interval)
  }, [])

  const fetchPublicRooms = async () => {
    try {
      const response = await fetch('/api/multiplayer/public-rooms')
      const data = await response.json()
      setRooms(data.rooms || [])
      setLoading(false)
    } catch (error) {
      console.error('Failed to fetch rooms:', error)
      setLoading(false)
    }
  }

  const joinRoom = async (roomCode: string) => {
    const randomName = `Player${Math.floor(Math.random() * 1000)}`
    
    try {
      const response = await fetch('/api/multiplayer/join-room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomCode, playerName: randomName })
      })
      
      const data = await response.json()
      if (data.success) {
        window.location.href = `/multiplayer?room=${roomCode}&player=${randomName}`
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
          <div className="flex items-center justify-between mb-8">
            <Button variant="outline" onClick={() => window.location.href = '/'}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
            <div className="text-center">
              <h1 className="text-3xl font-bold text-purple-600 flex items-center gap-2">
                <Users className="h-8 w-8" />
                Public Rooms
              </h1>
              <p className="text-gray-600">Join an active multiplayer quiz</p>
            </div>
            <Button variant="outline" onClick={fetchPublicRooms} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
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
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {rooms.map((room) => (
                <Card key={room.roomCode} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="text-lg">{room.topic}</span>
                      <span className="text-sm font-mono bg-purple-100 px-2 py-1 rounded">
                        {room.roomCode}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Difficulty:</span>
                        <span className="capitalize font-medium">{room.difficulty}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Questions:</span>
                        <span className="font-medium">{room.questionCount}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 flex items-center gap-1">
                          <Crown className="h-3 w-3" />
                          Host:
                        </span>
                        <span className="font-medium">{room.hostName}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          Players:
                        </span>
                        <span className="font-medium">{room.players.length}/8</span>
                      </div>
                      <Button 
                        onClick={() => joinRoom(room.roomCode)}
                        className="w-full mt-4 bg-gradient-to-r from-purple-600 to-pink-600"
                        disabled={room.players.length >= 8 || room.status !== 'waiting'}
                      >
                        {room.players.length >= 8 ? 'Room Full' : 
                         room.status !== 'waiting' ? 'In Progress' : 'Join Room'}
                      </Button>
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