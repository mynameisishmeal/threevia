'use client'

import { useState, useEffect } from 'react'
import { Brain, Users, Eye } from 'lucide-react'
import Navbar from '@/components/Navbar'

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-2">🎮 Battle Rooms</h1>
          <p className="text-slate-600 dark:text-slate-400">Join epic multiplayer quiz battles!</p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <Brain className="h-12 w-12 animate-pulse text-cyan-500 mx-auto mb-4" />
            <div className="text-xl font-semibold text-slate-900 dark:text-slate-100">Loading rooms...</div>
          </div>
        ) : rooms.length === 0 ? (
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-blue-200 dark:border-slate-700 p-8 text-center">
            <div className="text-6xl mb-4 animate-bounce">🏠</div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">No Public Rooms</h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6">Be the first to create a public room!</p>
            <button 
              onClick={() => window.location.href = '/'}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white font-bold rounded-xl transition-all transform hover:scale-105 shadow-lg"
            >
              Create Room
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {rooms.map((room) => (
              <div key={room.roomCode} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 truncate">
                    {room.topic}
                  </h3>
                  <div className="text-sm text-slate-500 flex-shrink-0">
                    Room: {room.roomCode}
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-2 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-sm text-slate-600 dark:text-slate-400">
                      <span className="whitespace-nowrap">Difficulty: {room.difficulty}</span>
                      <span className="whitespace-nowrap">Questions: {room.questionCount}</span>
                      <span className={`px-2 py-1 rounded-full text-xs whitespace-nowrap ${
                        room.status === 'waiting' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                      }`}>
                        {room.status === 'waiting' ? 'Waiting' : 'Playing'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                      <Users className="h-4 w-4 flex-shrink-0" />
                      <span className="whitespace-nowrap">{room.players.length}/8 players</span>
                      {room.spectators?.length > 0 && (
                        <span className="whitespace-nowrap">• {room.spectators.length} spectators</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    {room.status === 'waiting' && room.players.length < 8 && (
                      <button 
                        onClick={() => joinRoom(room.roomCode, false)} 
                        className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors whitespace-nowrap"
                      >
                        Join Game
                      </button>
                    )}
                    <button 
                      onClick={() => joinRoom(room.roomCode, true)}
                      className="flex items-center gap-1 px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 font-medium rounded-lg transition-colors whitespace-nowrap"
                    >
                      <Eye className="h-4 w-4" />
                      Spectate
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