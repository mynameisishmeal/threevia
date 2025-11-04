import { NextResponse } from 'next/server'
import { getDatabase, verifyToken } from '@/lib/auth-utils'
import { ObjectId } from 'mongodb'

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const db = await getDatabase()
    const user = await db.collection('users').findOne({ _id: new ObjectId(decoded.userId) })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 })
    }

    return NextResponse.json({
      user: { id: user._id.toString(), email: user.email }
    })

  } catch (error) {
    console.error('Token verification error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}