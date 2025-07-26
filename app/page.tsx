"use client"
import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'

function useDarkMode() {
  const [dark, setDark] = useState(false)
  useEffect(() => {
    // Check system preference or localStorage
    const isDark =
      localStorage.theme === 'dark' ||
      (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)
    setDark(isDark)
    document.documentElement.classList.toggle('dark', isDark)
  }, [])
  const toggle = () => {
    setDark((d) => {
      document.documentElement.classList.toggle('dark', !d)
      localStorage.theme = !d ? 'dark' : 'light'
      return !d
    })
  }
  return [dark, toggle] as const
}

export default function Home() {
  const [url, setUrl] = useState('')
  const [summary, setSummary] = useState('')
  const [summaryUrdu, setSummaryUrdu] = useState('')
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [dark, toggleDark] = useDarkMode()

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
    <main className="min-h-screen flex flex-col items-center justify-center px-2 py-8 sm:px-4 bg-gradient-to-br from-indigo-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 transition-all duration-700">
      <div className="flex flex-col items-center mb-8 animate-fade-in-heading w-full relative">
        {/* Dark mode toggle */}
        <button
          aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
          onClick={toggleDark}
          className="absolute right-0 top-0 sm:right-2 sm:top-2 z-10 p-2 rounded-full bg-white/80 dark:bg-gray-800/80 shadow-md border border-gray-200 dark:border-gray-700 transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-indigo-400"
        >
          {dark ? (
            <svg className="h-6 w-6 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4.22 2.03a1 1 0 011.42 1.42l-.7.7a1 1 0 11-1.42-1.42l.7-.7zM18 9a1 1 0 100 2h-1a1 1 0 100-2h1zm-2.03 4.22a1 1 0 011.42 1.42l-.7.7a1 1 0 11-1.42-1.42l.7-.7zM10 16a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zm-4.22-2.03a1 1 0 00-1.42 1.42l.7.7a1 1 0 001.42-1.42l-.7-.7zM4 11a1 1 0 100-2H3a1 1 0 100 2h1zm2.03-4.22a1 1 0 00-1.42-1.42l-.7.7a1 1 0 001.42 1.42l.7-.7z" /></svg>
          ) : (
            <svg className="h-6 w-6 text-gray-700 dark:text-gray-200" fill="currentColor" viewBox="0 0 20 20"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" /></svg>
          )}
        </button>
        <span className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-tr from-indigo-500 to-blue-500 dark:from-indigo-700 dark:to-blue-900 mb-3 shadow-2xl animate-bounce-slow">
          {/* Feather icon */}
          <svg width="44" height="44" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-white drop-shadow-lg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 20c0-4.418 7.163-8 16-8M4 20c0-2.21 3.582-4 8-4m-8 4c0-1.105.895-2 2-2m6-2c0-2.21 3.582-4 8-4" />
          </svg>
        </span>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-indigo-800 dark:text-indigo-200 mb-2 text-center tracking-tight relative">
          Blog Summarizer
          <span className="block h-1 w-24 mx-auto mt-3 bg-gradient-to-r from-indigo-400 to-blue-400 dark:from-indigo-700 dark:to-blue-700 rounded-full animate-underline"></span>
        </h1>
        <p className="text-gray-500 dark:text-gray-300 text-center max-w-lg animate-fade-in-caption text-lg font-medium">Summarize blogs instantly with AI-powered translation to Urdu.</p>
      </div>
      <Card className="w-full max-w-2xl shadow-2xl rounded-3xl border-0 card-animate animate-fade-in-card backdrop-blur-md bg-white/80 dark:bg-gray-900/80">
        <CardHeader>
          <CardTitle className="text-2xl sm:text-3xl font-bold dark:text-indigo-100">Summarize a Blog</CardTitle>
          <CardDescription className="text-base dark:text-gray-300">Enter a blog URL below</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <Input
              type="url"
              placeholder="Paste blog URL here..."
              value={url}
              onChange={e => setUrl(e.target.value)}
              required
              disabled={loading}
              className="text-lg px-5 py-4 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 focus:border-indigo-400 input-animate bg-white/90 dark:bg-gray-800/90 text-gray-900 dark:text-gray-100"
            />
            <Button type="submit" disabled={loading || !url} className="h-14 text-lg font-bold bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-800 dark:hover:bg-indigo-900 transition-all duration-200 btn-animate rounded-xl shadow-lg">
              {loading ? (
                <span className="flex items-center gap-2 justify-center">
                  <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                  </svg>
                  Summarizing...
                </span>
              ) : 'Summarize'}
            </Button>
          </form>
          {error && <p className="text-red-500 mt-4 text-center font-semibold animate-fade-in-caption">{error}</p>}
          {summary && (
            <div className="mt-10 flex flex-col gap-6">
              <div className="bg-white/90 dark:bg-gray-800/90 rounded-2xl shadow-lg p-6 border border-indigo-100 dark:border-indigo-900 transition-all floating-card animate-fade-in-card hover:scale-[1.02] hover:shadow-2xl">
                <h3 className="font-semibold text-xl text-indigo-700 dark:text-indigo-200 mb-2">Title</h3>
                <p className="text-gray-800 dark:text-gray-100 break-words text-lg font-medium">{title}</p>
              </div>
              <div className="bg-indigo-50/80 dark:bg-indigo-900/80 rounded-2xl shadow-lg p-6 border border-indigo-200 dark:border-indigo-800 transition-all floating-card animate-fade-in-card hover:scale-[1.02] hover:shadow-2xl">
                <h3 className="font-semibold text-xl text-indigo-700 dark:text-indigo-200 mb-2">Summary</h3>
                <p className="text-gray-800 dark:text-gray-100 break-words text-base leading-relaxed">{summary}</p>
              </div>
              <div className="bg-green-50/80 dark:bg-green-900/80 rounded-2xl shadow-lg p-6 border border-green-200 dark:border-green-800 transition-all floating-card animate-fade-in-card hover:scale-[1.02] hover:shadow-2xl">
                <h3 className="font-semibold text-xl text-green-700 dark:text-green-200 mb-2">Urdu</h3>
                <p className="text-gray-800 dark:text-gray-100 break-words text-base leading-relaxed font-medium" dir="rtl">{summaryUrdu}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      <footer className="mt-12 text-gray-400 dark:text-gray-500 text-sm text-center animate-fade-in-caption">
        &copy; {new Date().getFullYear()} Blog Summarizer. Made by Anas Butt
      </footer>
    </main>
  )
} 