# Blog Summarizer

A Next.js application that scrapes blog content, generates summaries, translates them to Urdu, and stores data in Supabase and MongoDB.

## Features

- 🔗 **Blog URL Input**: Paste any blog URL to scrape content
- 📝 **AI Summary**: Generate concise summaries (simulated AI)
- 🌐 **Urdu Translation**: Translate summaries to Urdu using dictionary
- 💾 **Dual Database Storage**: 
  - Summaries stored in Supabase
  - Full blog text stored in MongoDB
- 🎨 **Modern UI**: Built with ShadCN UI components
- 🚀 **Vercel Ready**: Optimized for deployment

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, ShadCN UI
- **Database**: Supabase (PostgreSQL), MongoDB Atlas
- **Scraping**: Cheerio, Axios
- **Deployment**: Vercel

## Project Structure

```
assignment-2/
├── app/
│   ├── api/
│   │   └── summarize/
│   │       └── route.ts          # API endpoint for blog summarization
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Main page component
├── components/
│   └── ui/                       # ShadCN UI components
│       ├── button.tsx
│       ├── card.tsx
│       └── input.tsx
├── lib/
│   ├── mongodb.ts                # MongoDB client configuration
│   ├── supabase.ts               # Supabase client configuration
│   └── utils.ts                  # Utility functions
├── .gitignore                    # Git ignore rules
├── env.example                   # Environment variables template
├── package.json                  # Dependencies and scripts
├── tailwind.config.js            # Tailwind CSS configuration
└── tsconfig.json                 # TypeScript configuration
```

## Setup Instructions

### 1. Clone and Install

```bash
cd assignment-2
npm install
```

### 2. Environment Variables

Copy `env.example` to `.env.local` and fill in your credentials:

```bash
cp env.example .env.local
```

Required environment variables:
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# MongoDB Configuration
MONGODB_URI=your_mongodb_connection_string

# Next.js Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

### 3. Database Setup

#### Supabase
1. Create a new project at [supabase.com](https://supabase.com)
2. Run this SQL in the SQL Editor:

```sql
-- Create the summaries table
CREATE TABLE summaries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  url TEXT NOT NULL,
  title TEXT,
  summary TEXT NOT NULL,
  summary_urdu TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE summaries ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow all operations (for demo purposes)
CREATE POLICY "Allow all operations" ON summaries FOR ALL USING (true);
```

#### MongoDB Atlas
1. Create a cluster at [mongodb.com/atlas](https://mongodb.com/atlas)
2. Create a database named `blog_summarizer`
3. The `blog_posts` collection will be created automatically

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. **Enter Blog URL**: Paste any blog URL in the input field
2. **Click Summarize**: The app will scrape the blog content
3. **View Results**: See the summary in English and Urdu
4. **Data Storage**: Summary saved to Supabase, full text to MongoDB

## API Endpoints

### POST `/api/summarize`

Scrapes a blog URL and returns a summary with Urdu translation.

**Request:**
```json
{
  "url": "https://example.com/blog-post"
}
```

**Response:**
```json
{
  "summary": "Blog discusses new technology trends...",
  "summary_urdu": "بلاگ نئی ٹیکنالوجی کے رجحانات پر بحث کرتا ہے...",
  "title": "Blog Post Title"
}
```

## Deployment

### Vercel Deployment

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

### Environment Variables for Production

Make sure to set these in your Vercel dashboard:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `MONGODB_URI`
- `NEXTAUTH_SECRET`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - feel free to use this project for your assignments and learning! 