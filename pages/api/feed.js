import Anthropic from '@anthropic-ai/sdk'
import { getTrendingTopics } from '../../lib/virlo'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  try {
    // 1. Pull trending topics from Virlo (or fallback)
    const seeds = await getTrendingTopics()

    // 2. Ask Claude to turn each seed into a proper headline + deck
    const prompt = `You are the editor of a major newspaper. Below are trending topics sourced from social media analytics. For each, write a serious news headline and deck as they would appear in the Financial Times or New York Times — precise, authoritative, no clickbait.

Topics:
${seeds.map((s, i) => `${i + 1}. [${s.section}] ${s.virloTrend}`).join('\n')}

Return ONLY valid JSON array, no markdown:
[
  {
    "id": 1,
    "section": "Technology",
    "hed": "Precise compelling headline here",
    "dek": "Two-sentence deck that gives context and stakes",
    "topic": "expanded search-ready topic description for article generation"
  }
]`

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1200,
      messages: [{ role: 'user', content: prompt }]
    })

    let headlines
    try {
      const text = response.content[0].text.trim()
      const clean = text.replace(/```json|```/g, '').trim()
      headlines = JSON.parse(clean)
    } catch {
      // If parsing fails, return seeds with placeholder headlines
      headlines = seeds.map(s => ({
        id: s.id,
        section: s.section,
        hed: s.virloTrend,
        dek: 'Developing story.',
        topic: s.virloTrend
      }))
    }

    // Merge Virlo metadata back in
    const stories = headlines.map((h, i) => ({
      ...h,
      virloRank: seeds[i]?.virloRank || i + 1,
      virloViews: seeds[i]?.virloViews || 0,
      hasVirloData: !!process.env.VIRLO_API_KEY && seeds[i]?.virloViews > 0
    }))

    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate')
    res.json({ stories, generatedAt: new Date().toISOString() })
  } catch (err) {
    console.error('Feed error:', err)
    res.status(500).json({ error: err.message })
  }
}
