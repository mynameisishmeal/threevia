import { NextResponse } from 'next/server'
import { getDatabase } from '@/lib/auth-utils'

export async function POST(req: Request) {
  try {
    const { roomCode, playerName, ready } = await req.json()
    const db = await getDatabase()
    
    await db.collection('multiplayer_rooms').updateOne(
      { roomCode, 'players.name': playerName },
      { $set: { 'players.$.ready': ready } }
    ) as any
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to toggle ready' }, { status: 500 })
  }
}