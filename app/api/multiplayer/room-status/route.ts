import { NextResponse } from 'next/server'
import { getDatabase } from '@/lib/auth-utils'

export async function POST(req: Request) {
  try {
    const { roomCode } = await req.json()
    const db = await getDatabase()
    
    const room = await db.collection('multiplayer_rooms').findOne({ roomCode })
    
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }
    
    return NextResponse.json({ room })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get room status' }, { status: 500 })
  }
}