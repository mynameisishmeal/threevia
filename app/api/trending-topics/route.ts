import { NextResponse } from 'next/server'
import { getDatabase } from '@/lib/auth-utils'

export async function GET() {
  try {
    const db = await getDatabase()

    // Get top 10 trending topics
    const trendingTopics = await db.collection('trending_topics')
      .find({})
      .sort({ searchCount: -1, lastSearched: -1 })
      .limit(10)
      .toArray()

    return NextResponse.json({
      topics: trendingTopics.map(topic => ({
        topic: topic.displayTopic,
        searchCount: topic.searchCount
      }))
    })

  } catch (error) {
    console.error('Trending topics error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}