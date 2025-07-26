import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import { translateToUrduGemini } from '@/lib/gemini-translate'

function checkEnv() {
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'MONGODB_URI',
    'GEMINI_API_KEY',
  ]
  const missing = required.filter((v) => !process.env[v])
  if (missing.length > 0) {
    throw new Error('Missing environment variables: ' + missing.join(', '))
  }
}

// Use Gemini to generate a high-quality summary and title
async function generateSummaryAndTitle(text: string): Promise<{ summary: string, title: string }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not set');
  const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent?key=' + apiKey;
  const prompt = `Given the following blog post content, write a concise, well-written summary (3-5 sentences, in paragraph form, not a list) and a catchy, human-like title (max 80 characters). Avoid navigation, menu, or unrelated content.\n\nBlog Content:\n${text}\n\nRespond in JSON with keys 'title' and 'summary'.`;
  const body = {
    contents: [
      { parts: [{ text: prompt }] }
    ]
  };
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!response.ok) {
    throw new Error('Gemini API error: ' + (await response.text()));
  }
  const data = await response.json();
  let resultText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  // Remove code block markers and trim
  resultText = resultText.replace(/^```json|```$/g, '').trim();
  // Try to parse JSON from the model's response
  let summary = '', title = '';
  try {
    const json = JSON.parse(resultText);
    summary = (json.summary || '').replace(/^"|"$/g, '').replace(/^[{\[]|[}\]]$/g, '').trim();
    title = (json.title || '').replace(/^"|"$/g, '').replace(/^[{\[]|[}\]]$/g, '').trim();
  } catch {
    // Fallback: try to extract summary and title heuristically
    const summaryMatch = resultText.match(/summary\s*[:\-]?\s*([\s\S]+)/i);
    const titleMatch = resultText.match(/title\s*[:\-]?\s*([\s\S]+)/i);
    summary = summaryMatch ? summaryMatch[1].replace(/^"|"$/g, '').replace(/^[{\[]|[}\]]$/g, '').trim() : resultText;
    title = titleMatch ? titleMatch[1].replace(/^"|"$/g, '').replace(/^[{\[]|[}\]]$/g, '').trim() : 'Blog Post';
  }
  // Limit title length
  if (title.length > 80) title = title.slice(0, 77) + '...';
  // Final cleanup
  summary = summary.replace(/^"|"$/g, '').replace(/^[{\[]|[}\]]$/g, '').replace(/```/g, '').trim();
  title = title.replace(/^"|"$/g, '').replace(/^[{\[]|[}\]]$/g, '').replace(/```/g, '').trim();
  return { summary, title };
}

async function scrapeBlogText(url: string): Promise<{text: string, title: string}> {
  try {
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 10000
    })
    const html = data.toString()
    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
    const title = titleMatch ? titleMatch[1].trim() : 'Blog Post'
    // Extract text content (remove HTML tags)
    let text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
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
    const { text } = await scrapeBlogText(url)
    if (!text) return NextResponse.json({ error: 'Could not extract text' }, { status: 422 })
    // Generate summary and title using Gemini
    const { summary, title } = await generateSummaryAndTitle(text)
    const summary_urdu = await translateToUrduGemini(summary)
    // Save summary to Supabase
    const { supabase } = await import('@/lib/supabase')
    const { error: supabaseError } = await supabase().from('summaries').insert([{ url, title, summary, summary_urdu }])
    if (supabaseError) throw new Error('Supabase error: ' + supabaseError.message)
    // Save full text to MongoDB
    let client
    try {
      const { default: clientPromise } = await import('@/lib/mongodb')
      client = await clientPromise()
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