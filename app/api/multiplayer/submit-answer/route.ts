import { NextResponse } from 'next/server'
import { getDatabase } from '@/lib/auth-utils'

export async function POST(req: Request) {
  try {
    const { roomCode, playerName, questionIndex, answerIndex, timeLeft } = await req.json()
    const db = await getDatabase()
    
    const room = await db.collection('multiplayer_rooms').findOne({ roomCode })
    
    if (!room || room.status !== 'playing') {
      return NextResponse.json({ error: 'Invalid room or quiz not active' }, { status: 400 })
    }
    
    const question = room.questions[questionIndex]
    const isCorrect = answerIndex === question.correct
    const speedBonus = Math.max(0, Math.floor(timeLeft / 6)) // 0-5 bonus points
    const points = isCorrect ? 10 + speedBonus : 0
    
    // Update player score and answer
    await db.collection('multiplayer_rooms').updateOne(
      { roomCode, 'players.name': playerName },
      { 
        $inc: { 'players.$.score': points },
        $set: { [`playerAnswers.${playerName}.q${questionIndex}`]: {
          answer: answerIndex,
          correct: isCorrect,
          points,
          timeLeft
        }}
      }
    )
    
    return NextResponse.json({ success: true, points, isCorrect })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to submit answer' }, { status: 500 })
  }
}