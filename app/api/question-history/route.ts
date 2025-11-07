import { NextResponse } from 'next/server'
import { getDatabase } from '@/lib/auth-utils'

export async function POST(req: Request) {
  try {
    const { questions, topic, difficulty } = await req.json()
    const db = await getDatabase()
    
    const questionTexts = questions.map((q: any) => q.question)
    
    await db.collection('question_history').insertOne({
      topic,
      difficulty,
      questions: questionTexts,
      createdAt: new Date()
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save question history' }, { status: 500 })
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const topic = searchParams.get('topic')
    const difficulty = searchParams.get('difficulty')
    
    if (!topic || !difficulty) {
      return NextResponse.json({ usedQuestions: [] })
    }
    
    const db = await getDatabase()
    
    const history = await db.collection('question_history')
      .find({ 
        topic, 
        difficulty,
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
      })
      .toArray()
    
    const usedQuestions = history.flatMap(h => h.questions)
    
    return NextResponse.json({ usedQuestions })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get question history' }, { status: 500 })
  }
}