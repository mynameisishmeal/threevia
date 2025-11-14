import { NextResponse } from 'next/server'
import { getDatabase } from '@/lib/auth-utils'
import jwt from 'jsonwebtoken'

export async function POST(req: Request) {
  try {
    // Verify authentication
    const authHeader = req.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    let decoded
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string, email: string }
    } catch (error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { roomCode } = await req.json()
    const db = await getDatabase()

    const room = await db.collection('multiplayer_rooms').findOne({ roomCode })

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }

    // Only host can end room
    if (room.hostId !== decoded.userId) {
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