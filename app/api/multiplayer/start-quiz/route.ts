import { NextResponse } from 'next/server'
import { getDatabase } from '@/lib/auth-utils'

export async function POST(req: Request) {
  try {
    const { roomCode, playerName } = await req.json()
    const db = await getDatabase()
    
    const room = await db.collection('multiplayer_rooms').findOne({ roomCode })
    
    if (!room || room.hostName !== playerName) {
      return NextResponse.json({ error: 'Only host can start quiz' }, { status: 403 })
    }
    
    if (room.players.length < 2) {
      return NextResponse.json({ error: 'Need at least 2 players' }, { status: 400 })
    }
    
    // Generate questions
    const response = await fetch(`${process.env.NEXTJS_URL || 'http://localhost:3000'}/api/generate-quiz`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topic: room.topic,
        difficulty: room.difficulty,
        count: room.questionCount
      })
    })
    
    const quizData = await response.json()
    
    if (!quizData.questions) {
      return NextResponse.json({ error: 'Failed to generate questions' }, { status: 500 })
    }
    
    // Start quiz
    await db.collection('multiplayer_rooms').updateOne(
      { roomCode },
      {
        $set: {
          status: 'playing',
          questions: quizData.questions,
          currentQuestion: 0,
          questionStartTime: new Date(),
          playerAnswers: {}
        }
      }
    )
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to start quiz' }, { status: 500 })
  }
}