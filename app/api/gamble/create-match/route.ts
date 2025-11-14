import { NextResponse } from 'next/server'
import { getDatabase } from '@/lib/auth-utils'

export async function POST(req: Request) {
  try {
    const { playerName, betAmount, topic, difficulty, questionCount, timePerQuestion, gameRules, isPrivate } = await req.json()
    const db = await getDatabase()
    
    const matchCode = Math.random().toString(36).substring(2, 8).toUpperCase()
    
    const match = {
      matchCode,
      creator: playerName,
      betAmount,
      topic,
      difficulty,
      questionCount,
      timePerQuestion: timePerQuestion || 30,
      gameRules: gameRules || 'standard',
      isPrivate: isPrivate || false,
      players: [{ name: playerName, betPaid: false, score: 0 }],
      status: 'waiting',
      totalPot: 0,
      winner: null,
      questions: [],
      createdAt: new Date()
    }
    
    await db.collection('gamble_matches').insertOne(match)
    
    return NextResponse.json({ matchCode })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create match' }, { status: 500 })
  }
}