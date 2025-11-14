import { NextResponse } from 'next/server'
import { getDatabase } from '@/lib/auth-utils'

export async function POST(req: Request) {
  try {
    const { matchCode, playerName } = await req.json()
    const db = await getDatabase()
    
    const match = await db.collection('gamble_matches').findOne({ matchCode })
    
    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 })
    }
    
    if (match.status !== 'waiting') {
      return NextResponse.json({ error: 'Match already started' }, { status: 400 })
    }
    
    if (match.players.length >= 2) {
      return NextResponse.json({ error: 'Match is full' }, { status: 400 })
    }
    
    await db.collection('gamble_matches').updateOne(
      { matchCode },
      { $push: { players: { name: playerName, betPaid: false, score: 0 } } } as any
    )
    
    return NextResponse.json({ success: true, match })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to join match' }, { status: 500 })
  }
}