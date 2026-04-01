import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { articleText, hed } = req.body
  if (!articleText) return res.status(400).json({ error: 'articleText required' })

  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      messages: [{
        role: 'user',
        content: `Write a 3-sentence executive briefing memo summary of this article. Format: one sentence on what happened, one on why it matters, one on what to watch. Analytical, present-tense, no filler.

Headline: ${hed}
Article: ${articleText.substring(0, 3000)}`
      }]
    })

    res.json({ digest: response.content[0].text })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
