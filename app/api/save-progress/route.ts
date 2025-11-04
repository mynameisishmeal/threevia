import { NextResponse } from 'next/server'
import { getDatabase, verifyToken } from '@/lib/auth-utils'
import { ObjectId } from 'mongodb'

export async function POST(req: Request) {
  try {
    const { userId, topic, difficulty, currentQuestion, score, questions } = await req.json()

    const db = await getDatabase()

    // Save or update quiz progress
    await db.collection('quiz_progress').updateOne(
      { userId: userId ? new ObjectId(userId) : null, topic, difficulty },
      {
        $set: {
          userId: userId ? new ObjectId(userId) : null,
          topic,
          difficulty,
          currentQuestion,
          score,
          questions,
          lastSaved: new Date()
        }
      },
      { upsert: true }
    )

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Save progress error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}