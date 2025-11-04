import { NextResponse } from 'next/server'
import { getDatabase, verifyPassword, generateToken } from '@/lib/auth-utils'

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
    }

    const db = await getDatabase()
    
    // Find user
    const user = await db.collection('users').findOne({ email })
    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    // Verify password
    const isValid = await verifyPassword(password, user.password)
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const token = generateToken(user._id.toString())

    return NextResponse.json({
      token,
      user: { id: user._id.toString(), email: user.email }
    })

  } catch (error) {
    console.error('Signin error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}