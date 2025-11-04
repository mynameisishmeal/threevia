import { NextResponse } from 'next/server'
import { getDatabase } from '@/lib/auth-utils'

export async function POST(req: Request) {
  try {
    const { topic } = await req.json()

    if (!topic || topic.trim().length === 0) {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 })
    }

    const db = await getDatabase()
    const normalizedTopic = topic.trim().toLowerCase()

    // Update or create trending topic
    await db.collection('trending_topics').updateOne(
      { topic: normalizedTopic },
      { 
        $inc: { searchCount: 1 },
        $set: { 
          displayTopic: topic.trim(),
          lastSearched: new Date()
        }
      },
      { upsert: true }
    )

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Track topic error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}