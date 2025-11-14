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

    const { hostName, topic, difficulty, questionCount, isPrivate = false } = await req.json()
    const db = await getDatabase()
    
    const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase()
    
    const room = {
      roomCode,
      hostId: decoded.userId,
      hostName,
      topic,
      difficulty,
      questionCount,
      players: [{ name: hostName, score: 0, ready: false }],
      spectators: [],
      allowSpectators: true,
      maxSpectators: 20,
      isPrivate,
      status: 'waiting',
      currentQuestion: 0,
      questions: [],
      createdAt: new Date(),
      endedAt: null
    }
    
    await db.collection('multiplayer_rooms').insertOne(room)
    
    return NextResponse.json({ roomCode })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create room' }, { status: 500 })
  }
}