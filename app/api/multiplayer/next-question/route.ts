import { NextResponse } from 'next/server'
import { getDatabase } from '@/lib/auth-utils'

export async function POST(req: Request) {
  try {
    const { roomCode } = await req.json()
    const db = await getDatabase()
    
    const room = await db.collection('multiplayer_rooms').findOne({ roomCode })
    
    if (!room || room.status !== 'playing') {
      return NextResponse.json({ error: 'Invalid room' }, { status: 400 })
    }
    
    const nextQuestion = room.currentQuestion + 1
    
    if (nextQuestion >= room.questions.length) {
      // Quiz finished
      await db.collection('multiplayer_rooms').updateOne(
        { roomCode },
        { $set: { status: 'finished' } }
      )
    } else {
      // Next question
      await db.collection('multiplayer_rooms').updateOne(
        { roomCode },
        { 
          $set: { 
            currentQuestion: nextQuestion,
            questionStartTime: new Date()
          }
        }
      )
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to advance question' }, { status: 500 })
  }
}