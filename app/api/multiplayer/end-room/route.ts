import { NextResponse } from 'next/server'
import { getDatabase } from '@/lib/auth-utils'

export async function POST(req: Request) {
  try {
    const { roomCode, playerName } = await req.json()
    const db = await getDatabase()
    
    const room = await db.collection('multiplayer_rooms').findOne({ roomCode })
    
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }
    
    // Only host can end room
    if (room.hostName !== playerName) {
      return NextResponse.json({ error: 'Only host can end room' }, { status: 403 })
    }
    
    await db.collection('multiplayer_rooms').updateOne(
      { roomCode },
      { 
        $set: { 
          status: 'ended',
          endedAt: new Date()
        }
      }
    )
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to end room' }, { status: 500 })
  }
}