import Anthropic from '@anthropic-ai/sdk'
import { getTrendingTopics } from '../../lib/virlo'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const PROMPT = (seeds) => `You are the editor of a major newspaper. For each topic below write a serious headline and deck as they would appear in the Financial Times or New York Times — precise, authoritative, specific, no clickbait. Use real institution names, figures, and stakes where possible.

Topics:
${seeds.map((s, i) => `${i + 1}. [${s.section}] ${s.virloTrend}`).join('\n')}

Return ONLY a valid JSON array, no markdown, no backticks:
[{"id":1,"section":"World","hed":"Headline here","dek":"Two sentences of context and stakes.","topic":"expanded topic for article generation"}]`

async function generateBatch(seeds) {
  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2400,
    messages: [{ role: 'user', content: PROMPT(seeds) }]
  })
  const text = response.content[0].text.trim()
  const clean = text.replace(/```json|```/g, '').trim()
  return JSON.parse(clean)
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  try {
    // 1. Pull 24 trending seeds from Virlo (or fallback)
    const seeds = await getTrendingTopics()

    // 2. Split into two batches of 12 and run in PARALLEL — cuts time in half
    const batch1 = seeds.slice(0, 12)
    const batch2 = seeds.slice(12, 24)

    const [headlines1, headlines2] = await Promise.all([
      generateBatch(batch1).catch(() => batch1.map(s => ({
        id: s.id, section: s.section, hed: s.virloTrend, dek: 'Developing story.', topic: s.virloTrend
      }))),
      generateBatch(batch2).catch(() => batch2.map(s => ({
        id: s.id, section: s.section, hed: s.virloTrend, dek: 'Developing story.', topic: s.virloTrend
      })))
    ])

    const allHeadlines = [...headlines1, ...headlines2]

    // 3. Merge Virlo metadata back in
    const stories = allHeadlines.map((h, i) => ({
      ...h,
      id: i + 1,
      virloRank: seeds[i]?.virloRank || i + 1,
      virloViews: seeds[i]?.virloViews || 0,
      hasVirloData: !!process.env.VIRLO_API_KEY && seeds[i]?.virloViews > 0
    }))

    // Cache for 1 hour — cron job keeps this fresh in background
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=3600')
    res.json({ stories, generatedAt: new Date().toISOString() })
  } catch (err) {
    console.error('Feed error:', err)
    res.status(500).json({ error: err.message })
  }
}
