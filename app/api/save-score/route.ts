import { NextResponse } from 'next/server'
import { getDatabase } from '@/lib/auth-utils'
import { ObjectId } from 'mongodb'

export async function POST(req: Request) {
  try {
    const { userId, topic, score, totalQuestions, difficulty } = await req.json()

    if (!userId) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 })
    }

    const db = await getDatabase()

    // Save quiz result
    await db.collection('quiz_results').insertOne({
      userId: new ObjectId(userId),
      topic,
      score,
      totalQuestions,
      difficulty,
      completedAt: new Date()
    })

    // Calculate points (10 points per correct answer, bonus for difficulty)
    const basePoints = score * 10
    const difficultyMultiplier = difficulty === 'hard' ? 1.5 : difficulty === 'medium' ? 1.2 : 1
    const points = Math.round(basePoints * difficultyMultiplier)

    // Update user points
    await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      { 
        $inc: { 
          totalPoints: points,
          quizzesCompleted: 1
        }
      }
    )

    return NextResponse.json({ 
      success: true, 
      points,
      message: `Earned ${points} points!` 
    })

  } catch (error) {
    console.error('Save score error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}