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
    
    // Mark player as paid and update pot
    await db.collection('gamble_matches').updateOne(
      { matchCode, 'players.name': playerName },
      { 
        $set: { 'players.$.betPaid': true },
        $inc: { totalPot: match.betAmount }
      }
    )
    
    // Check if both players paid, start match
    const updatedMatch = await db.collection('gamble_matches').findOne({ matchCode })
    const allPaid = updatedMatch.players.every(p => p.betPaid)
    
    if (allPaid && updatedMatch.players.length === 2) {
      await db.collection('gamble_matches').updateOne(
        { matchCode },
        { $set: { status: 'playing' } }
      )
    }
    
    return NextResponse.json({ success: true, allPaid })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to submit bet' }, { status: 500 })
  }
}