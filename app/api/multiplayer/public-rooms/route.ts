import { NextResponse } from 'next/server'
import { getDatabase } from '@/lib/auth-utils'

export async function GET() {
  try {
    const db = await getDatabase()
    
    const rooms = await db.collection('multiplayer_rooms')
      .find({ 
        status: 'waiting',
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      })
      .sort({ createdAt: -1 })
      .limit(20)
      .toArray()
    
    return NextResponse.json({ rooms })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch rooms' }, { status: 500 })
  }
}