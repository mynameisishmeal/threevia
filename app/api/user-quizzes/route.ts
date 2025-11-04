import { NextResponse } from 'next/server'
import { getDatabase, verifyToken } from '@/lib/auth-utils'
import { ObjectId } from 'mongodb'

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const db = await getDatabase()
    const userId = new ObjectId(decoded.userId)

    // Get recent quiz results
    const quizzes = await db.collection('quiz_results')
      .find({ userId })
      .sort({ completedAt: -1 })
      .limit(10)
      .toArray()

    return NextResponse.json({
      quizzes: quizzes.map(quiz => ({
        topic: quiz.topic,
        score: quiz.score,
        totalQuestions: quiz.totalQuestions,
        difficulty: quiz.difficulty,
        completedAt: quiz.completedAt
      }))
    })

  } catch (error) {
    console.error('User quizzes error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}