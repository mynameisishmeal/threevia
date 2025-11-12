import { NextResponse } from 'next/server'
import { getDatabase } from '@/lib/auth-utils'

export async function POST(req: Request) {
  try {
    const { roomCode, playerName, asSpectator = false } = await req.json()
    const db = await getDatabase()
    
    const room = await db.collection('multiplayer_rooms').findOne({ roomCode })
    
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }
    
    if (asSpectator) {
      if (!room.allowSpectators) {
        return NextResponse.json({ error: 'Spectators not allowed' }, { status: 400 })
      }
      
      if (room.spectators.length >= room.maxSpectators) {
        return NextResponse.json({ error: 'Spectator limit reached' }, { status: 400 })
      }
      
      await db.collection('multiplayer_rooms').updateOne(
        { roomCode },
        { $push: { spectators: playerName } } as any
      )
    } else {
      if (room.status !== 'waiting') {
        return NextResponse.json({ error: 'Room already started' }, { status: 400 })
      }
      
      if (room.players.length >= 8) {
        return NextResponse.json({ error: 'Room is full' }, { status: 400 })
      }
      
      await db.collection('multiplayer_rooms').updateOne(
        { roomCode },
        { $push: { players: { name: playerName, score: 0, ready: false } } } as any
      )
    }
    
    return NextResponse.json({ success: true, room, isSpectator: asSpectator })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to join room' }, { status: 500 })
  }
}