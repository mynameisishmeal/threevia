import { NextResponse } from 'next/server'
import { getDatabase } from '@/lib/auth-utils'

export async function POST(req: Request) {
  try {
    const { roomCode, hostName, playerToKick } = await req.json()
    const db = await getDatabase()
    
    const room = await db.collection('multiplayer_rooms').findOne({ roomCode })
    
    if (!room || room.hostName !== hostName) {
      return NextResponse.json({ error: 'Only host can kick players' }, { status: 403 })
    }
    
    if (playerToKick === hostName) {
      return NextResponse.json({ error: 'Cannot kick yourself' }, { status: 400 })
    }
    
    await db.collection('multiplayer_rooms').updateOne(
      { roomCode },
      { $pull: { players: { name: playerToKick } } } as any
    )
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to kick player' }, { status: 500 })
  }
}