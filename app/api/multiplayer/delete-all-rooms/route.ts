import { NextResponse } from 'next/server'
import { getDatabase } from '@/lib/auth-utils'

export async function DELETE() {
  try {
    const db = await getDatabase()
    
    const result = await db.collection('multiplayer_rooms').deleteMany({})
    
    return NextResponse.json({ 
      success: true, 
      deletedCount: result.deletedCount 
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete rooms' }, { status: 500 })
  }
}