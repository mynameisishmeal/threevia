import { NextResponse } from 'next/server'
import { getDatabase } from '@/lib/auth-utils'

export async function GET() {
  try {
    const db = await getDatabase()
    
    const matches = await db.collection('gamble_matches')
      .find({ 
        status: 'waiting',
        isPrivate: { $ne: true }
      })
      .sort({ createdAt: -1 })
      .limit(20)
      .toArray()
    
    return NextResponse.json({ matches })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch matches' }, { status: 500 })
  }
}