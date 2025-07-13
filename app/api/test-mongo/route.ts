import { NextRequest, NextResponse } from 'next/server'
import { testMongoDBConnection } from '@/lib/mongodb-test'

export async function GET(req: NextRequest) {
  try {
    const result = await testMongoDBConnection()
    return NextResponse.json({ 
      success: result, 
      message: result ? 'MongoDB connection successful' : 'MongoDB connection failed',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: (error as Error).message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
} 