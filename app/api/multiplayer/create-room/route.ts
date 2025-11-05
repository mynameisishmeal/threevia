import { NextResponse } from 'next/server'
import { getDatabase } from '@/lib/auth-utils'

export async function POST(req: Request) {
  try {
    const { hostName, topic, difficulty, questionCount } = await req.json()
    const db = await getDatabase()
    
    const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase()
    
    const room = {
      roomCode,
      hostName,
      topic,
      difficulty,
      questionCount,
      players: [{ name: hostName, score: 0, ready: false }],
      status: 'waiting',
      currentQuestion: 0,
      questions: [],
      createdAt: new Date()
    }
    
    await db.collection('multiplayer_rooms').insertOne(room)
    
    return NextResponse.json({ roomCode })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create room' }, { status: 500 })
  }
}