// api/chat.js — Vercel Edge Function
// This file proxies all Claude API calls server-side
// Users never see your Anthropic key
 
export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
 
  // CORS headers — allow your app to call this
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
 
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
 
  try {
    const { prompt, system, maxTokens } = req.body;
 
    if (!prompt) {
      return res.status(400).json({ error: 'prompt is required' });
    }
 
    // Use the key from Vercel environment variables — never exposed to browser
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'API key not configured on server' });
    }
 
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: maxTokens || 600,
        system: system || 'You are a senior VC and startup advisor. Be direct and specific. Use **bold** for key terms.',
        messages: [{ role: 'user', content: prompt }],
      }),
    });
 
    const data = await response.json();
 
    if (data.error) {
      return res.status(400).json({ error: data.error.message });
    }
 
    const text = data.content.map(b => b.text || '').join('').trim();
    return res.status(200).json({ text });
 
  } catch (error) {
    console.error('Proxy error:', error);
    return res.status(500).json({ error: 'Server error — please try again' });
  }
}
