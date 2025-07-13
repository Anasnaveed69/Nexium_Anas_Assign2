import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  // Check environment variables
  const envVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'MONGODB_URI',
  ]
  const missing = envVars.filter((v) => !process.env[v])

  // Check MongoDB connection
  let mongoStatus = 'ok'
  try {
    const client = await clientPromise
    await client.db('blog_summarizer').command({ ping: 1 })
  } catch (e) {
    mongoStatus = 'error: ' + (e as Error).message
  }

  // Check Supabase connection
  let supabaseStatus = 'ok'
  try {
    const { error } = await supabase.from('summaries').select('*').limit(1)
    if (error) throw error
  } catch (e) {
    supabaseStatus = 'error: ' + (e as Error).message
  }

  return NextResponse.json({
    env: missing.length === 0 ? 'ok' : `missing: ${missing.join(', ')}`,
    mongo: mongoStatus,
    supabase: supabaseStatus,
  })
} 