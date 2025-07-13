import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  // During build time, return a simple response without checking connections
  if (process.env.NODE_ENV === 'production' && !process.env.VERCEL) {
    return NextResponse.json({
      status: 'build-time',
      message: 'Health check not available during build',
    })
  }

  // Check environment variables
  const envVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'MONGODB_URI',
  ]
  const missing = envVars.filter((v) => !process.env[v])

  // Check MongoDB connection
  let mongoStatus = 'ok'
  if (!process.env.MONGODB_URI) {
    mongoStatus = 'error: MONGODB_URI environment variable not set'
  } else {
    try {
      const { default: clientPromise } = await import('@/lib/mongodb')
      const client = await clientPromise()
      await client.db('blog_summarizer').command({ ping: 1 })
    } catch (e) {
      const error = e as Error
      console.error('MongoDB connection error:', error)
      mongoStatus = `error: ${error.message}`
      
      // Provide more specific error information
      if (error.message.includes('SSL') || error.message.includes('TLS')) {
        mongoStatus += ' (SSL/TLS configuration issue)'
      } else if (error.message.includes('timeout')) {
        mongoStatus += ' (Connection timeout - check network access)'
      } else if (error.message.includes('authentication')) {
        mongoStatus += ' (Authentication failed - check credentials)'
      }
    }
  }

  // Check Supabase connection
  let supabaseStatus = 'ok'
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    supabaseStatus = 'error: Supabase environment variables not set'
  } else {
    try {
      const { supabase } = await import('@/lib/supabase')
      const { error } = await supabase().from('summaries').select('*').limit(1)
      if (error) throw error
    } catch (e) {
      supabaseStatus = 'error: ' + (e as Error).message
    }
  }

  return NextResponse.json({
    env: missing.length === 0 ? 'ok' : `missing: ${missing.join(', ')}`,
    mongo: mongoStatus,
    supabase: supabaseStatus,
  })
} 