export async function translateToUrduGemini(text: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not set');

  // Updated model name for Gemini API (as per user's available models)
  const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent?key=' + apiKey;

  // Clean the input text first
  const cleanText = text
    .replace(/&mdash;/g, '—')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/→/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  const prompt = `Translate the following text to Urdu. Provide a clean, well-formatted translation without HTML entities, arrows, or special characters. Format it as natural Urdu text:

${cleanText}`;

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
  
  // Extract the translated text and clean it further
  let translatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  
  // Additional cleaning of the output
  translatedText = translatedText
    .replace(/→/g, '') // Remove any remaining arrows
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/^\s*[-–—]\s*/gm, '') // Remove leading dashes
    .trim();

  return translatedText;
} 