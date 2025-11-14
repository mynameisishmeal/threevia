import { NextResponse } from 'next/server'
import { getDatabase } from '@/lib/auth-utils'
import jwt from 'jsonwebtoken'

export async function GET(req: Request) {
  try {
    // Verify authentication
    const authHeader = req.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    let decoded
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string, email: string }
    } catch (error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const db = await getDatabase()

    // Get rooms created by this user
    const rooms = await db.collection('multiplayer_rooms')
      .find({ hostId: decoded.userId })
      .sort({ createdAt: -1 })
      .toArray()

    return NextResponse.json({ rooms })
  } catch (error) {
    console.error('Error fetching user rooms:', error)
    return NextResponse.json({ error: 'Failed to fetch rooms' }, { status: 500 })
  }
}