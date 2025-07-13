import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import clientPromise from '@/lib/mongodb'
import { supabase } from '@/lib/supabase'
import { urduDict } from '@/lib/urdu-dict'

function checkEnv() {
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'MONGODB_URI',
  ]
  const missing = required.filter((v) => !process.env[v])
  if (missing.length > 0) {
    throw new Error('Missing environment variables: ' + missing.join(', '))
  }
}

// Simple static summary logic
function generateSummary(text: string): string {
  // Just return the first 2 sentences as a 'summary'
  const sentences = text.match(/[^.!?]+[.!?]+/g) || []
  return sentences.slice(0, 2).join(' ').trim() || text.slice(0, 200) + '...'
}





function translateToUrdu(text: string): string {
  return text.split(' ').map(word => urduDict[word.toLowerCase()] || word).join(' ')
}

async function scrapeBlogText(url: string): Promise<{text: string, title: string}> {
  try {
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 10000
    })
    
    // Simple text extraction without Cheerio
    const html = data.toString()
    
    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
    const title = titleMatch ? titleMatch[1].trim() : 'Blog Post'
    
    // Extract text content (remove HTML tags)
    let text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '') // Remove scripts
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '') // Remove styles
      .replace(/<[^>]+>/g, ' ') // Remove HTML tags
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim()
    
    return { text, title }
  } catch (error) {
    console.error('Scraping error:', error)
    throw new Error('Failed to scrape the blog content')
  }
}

export async function POST(req: NextRequest) {
  try {
    checkEnv()
    const { url } = await req.json()
    if (!url) return NextResponse.json({ error: 'No URL provided' }, { status: 400 })

    // Scrape blog
    const { text, title } = await scrapeBlogText(url)
    if (!text) return NextResponse.json({ error: 'Could not extract text' }, { status: 422 })

    // Generate summary
    const summary = generateSummary(text)
    const summary_urdu = translateToUrdu(summary)

    // Save summary to Supabase
    const { error: supabaseError } = await supabase.from('summaries').insert([{ url, title, summary, summary_urdu }])
    if (supabaseError) throw new Error('Supabase error: ' + supabaseError.message)

    // Save full text to MongoDB
    let client
    try {
      client = await clientPromise
    } catch (e) {
      throw new Error('MongoDB connection error: ' + (e as Error).message)
    }
    const db = client.db('blog_summarizer')
    try {
      await db.collection('blog_posts').insertOne({ url, title, fullText: text, createdAt: new Date() })
    } catch (e) {
      throw new Error('MongoDB insert error: ' + (e as Error).message)
    }

    return NextResponse.json({ summary, summary_urdu, title })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Unknown error' }, { status: 500 })
  }
} 