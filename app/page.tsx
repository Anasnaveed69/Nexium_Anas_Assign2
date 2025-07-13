"use client"
import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'

export default function Home() {
  const [url, setUrl] = useState('')
  const [summary, setSummary] = useState('')
  const [summaryUrdu, setSummaryUrdu] = useState('')
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSummary('')
    setSummaryUrdu('')
    setTitle('')
    try {
      const res = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Unknown error')
      setSummary(data.summary)
      setSummaryUrdu(data.summary_urdu)
      setTitle(data.title)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-2 py-8 sm:px-4 bg-gradient-to-br from-indigo-50 to-blue-100 transition-all duration-700">
      <div className="flex flex-col items-center mb-8">
        <span className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-tr from-indigo-400 to-blue-400 mb-2 shadow-lg animate-bounce-slow">
          {/* Feather icon */}
          <svg width="36" height="36" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-white drop-shadow-lg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 20c0-4.418 7.163-8 16-8M4 20c0-2.21 3.582-4 8-4m-8 4c0-1.105.895-2 2-2m6-2c0-2.21 3.582-4 8-4" />
          </svg>
        </span>
        <h1 className="text-3xl sm:text-4xl font-bold text-indigo-700 mb-1 text-center animate-fade-in-heading relative">
          Blog Summarizer
          <span className="block h-1 w-16 mx-auto mt-2 bg-gradient-to-r from-indigo-400 to-blue-400 rounded-full animate-underline"></span>
        </h1>
        <p className="text-gray-500 text-center max-w-md animate-fade-in-caption">Summarize blogs instantly!</p>
      </div>
      <Card className="w-full max-w-xl shadow-2xl rounded-2xl border-0 card-animate animate-fade-in-card">
        <CardHeader>
          <CardTitle className="text-xl sm:text-2xl">Summarize a Blog</CardTitle>
          <CardDescription>Enter a blog URL below</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              type="url"
              placeholder="Paste blog URL here..."
              value={url}
              onChange={e => setUrl(e.target.value)}
              required
              disabled={loading}
              className="text-base px-4 py-3 rounded-lg shadow-sm border border-gray-200 focus:border-indigo-400 input-animate"
            />
            <Button type="submit" disabled={loading || !url} className="h-12 text-base font-semibold bg-indigo-600 hover:bg-indigo-700 transition-colors btn-animate">
              {loading ? (
                <span className="flex items-center gap-2 justify-center">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                  </svg>
                  Summarizing...
                </span>
              ) : 'Summarize'}
            </Button>
          </form>
          {error && <p className="text-red-500 mt-4 text-center font-medium">{error}</p>}
          {summary && (
            <div className="mt-8 flex flex-col gap-4">
              <div className="bg-white rounded-xl shadow p-4 border border-indigo-100 transition-all floating-card animate-fade-in-card">
                <h3 className="font-semibold text-lg text-indigo-700 mb-1">Title</h3>
                <p className="text-gray-800 break-words">{title}</p>
              </div>
              <div className="bg-indigo-50 rounded-xl shadow p-4 border border-indigo-200 transition-all floating-card animate-fade-in-card">
                <h3 className="font-semibold text-lg text-indigo-700 mb-1">Summary</h3>
                <p className="text-gray-800 break-words">{summary}</p>
              </div>
              <div className="bg-green-50 rounded-xl shadow p-4 border border-green-200 transition-all floating-card animate-fade-in-card">
                <h3 className="font-semibold text-lg text-green-700 mb-1">Urdu</h3>
                <p className="text-gray-800 break-words">{summaryUrdu}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      <footer className="mt-10 text-gray-400 text-xs text-center animate-fade-in-caption">
        &copy; {new Date().getFullYear()} Blog Summarizer. Made by Anas Butt
      </footer>
    </main>
  )
} 