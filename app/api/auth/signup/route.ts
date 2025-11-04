import { NextResponse } from 'next/server'
import { getDatabase, hashPassword, generateToken } from '@/lib/auth-utils'

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
    }

    const db = await getDatabase()
    
    // Check if user exists
    const existingUser = await db.collection('users').findOne({ email })
    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 })
    }

    // Hash password and create user
    const hashedPassword = await hashPassword(password)
    const result = await db.collection('users').insertOne({
      email,
      password: hashedPassword,
      createdAt: new Date(),
      totalPoints: 0,
      quizzesCompleted: 0
    })

    const userId = result.insertedId.toString()
    const token = generateToken(userId)

    return NextResponse.json({
      token,
      user: { id: userId, email }
    })

  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}