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

    // Get user basic stats
    const user = await db.collection('users').findOne({ _id: userId })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get quiz results for calculations
    const quizResults = await db.collection('quiz_results')
      .find({ userId })
      .toArray()

    // Calculate average score
    const totalScore = quizResults.reduce((sum, quiz) => sum + quiz.score, 0)
    const totalQuestions = quizResults.reduce((sum, quiz) => sum + quiz.totalQuestions, 0)
    const averageScore = totalQuestions > 0 ? Math.round((totalScore / totalQuestions) * 100) : 0

    // Calculate best streak (consecutive correct answers)
    let bestStreak = 0
    let currentStreak = 0
    
    quizResults.forEach(quiz => {
      if (quiz.score === quiz.totalQuestions) {
        currentStreak++
        bestStreak = Math.max(bestStreak, currentStreak)
      } else {
        currentStreak = 0
      }
    })

    return NextResponse.json({
      totalPoints: user.totalPoints || 0,
      quizzesCompleted: user.quizzesCompleted || 0,
      averageScore,
      bestStreak
    })

  } catch (error) {
    console.error('User stats error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}