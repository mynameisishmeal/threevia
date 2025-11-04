import { NextResponse } from 'next/server'
import { getDatabase, verifyToken } from '@/lib/auth-utils'
import { ObjectId } from 'mongodb'

export async function POST(req: Request) {
  try {
    const { userId, topic, difficulty } = await req.json()

    const db = await getDatabase()

    // Load quiz progress
    const progress = await db.collection('quiz_progress').findOne({
      userId: userId ? new ObjectId(userId) : null,
      topic,
      difficulty
    })

    if (progress) {
      return NextResponse.json({
        found: true,
        currentQuestion: progress.currentQuestion,
        score: progress.score,
        questions: progress.questions,
        lastSaved: progress.lastSaved
      })
    }

    return NextResponse.json({ found: false })

  } catch (error) {
    console.error('Load progress error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}