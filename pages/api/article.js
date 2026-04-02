import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { topic, section, virloContext } = req.body
  if (!topic) return res.status(400).json({ error: 'topic required' })

  try {
    // Stream the article back
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')

    const virloNote = virloContext
      ? `\n\nEditorial signal: This topic is trending on social media with approximately ${virloContext.views?.toLocaleString() || 'significant'} views across TikTok, YouTube, and Instagram (Virlo rank #${virloContext.rank}). This signals public appetite — write to inform readers who have seen fragments of this story and need authoritative depth.`
      : ''

    const stream = await client.messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: 2500,
      system: `You are a senior correspondent at a world-class newspaper — the caliber of the Financial Times, The Economist, or the New York Times. Your mandate is rigorous, authoritative long-form journalism.

Your articles always:
- Open with a specific, concrete lede grounded in named facts, dates, or figures — NEVER vague openers
- Use real names of institutions, officials, countries, and organisations — never "officials said" without context
- Include specific data points, percentages, dollar figures, or statistics wherever relevant
- Build narrative arc: lede → context → why now → competing perspectives → expert analysis → forward implications
- Attribute quotes naturally ("according to analysts at Goldman Sachs...", "a senior Treasury official said...")
- Include at least one <blockquote> with a realistic attributed quote from a named expert or official
- Use at minimum 4 <h2> section headers
- End with a concrete "what to watch" paragraph with specific dates or thresholds
- Run 900–1200 words minimum
- Use HTML: <p class="drop-cap"> for the first paragraph, then <p>, <h2>, <blockquote>
- Return ONLY the article HTML body — no wrapper, no backticks, no preamble
- NEVER use vague phrases like "experts say", "many believe", "it is widely thought" — always be specific`,

      messages: [{
        role: 'user',
        content: `Write a full long-form news article.

Section: ${section}
Topic: ${topic}${virloNote}

Requirements:
1. Invent a precise, compelling headline angle — don't just summarize, find the story
2. The lede must answer: what happened, to whom, why it matters right now
3. Minimum 4 <h2> sections
4. One <blockquote> with speaker name and title
5. 900–1200 words
6. Serious, precise, authoritative tone — no AI-speak, no hedging, no clichés
7. The drop-cap first paragraph should be at least 3 sentences

Start immediately with <p class="drop-cap">`
      }]
    })

    // Send metadata first
    const metaEvent = JSON.stringify({ type: 'meta', section, topic })
    res.write(`data: ${metaEvent}\n\n`)

    // Stream article chunks
    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
        const chunk = JSON.stringify({ type: 'chunk', text: event.delta.text })
        res.write(`data: ${chunk}\n\n`)
      }
    }

    res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`)
    res.end()
  } catch (err) {
    console.error('Article generation error:', err)
    if (!res.headersSent) {
      res.status(500).json({ error: err.message })
    } else {
      res.write(`data: ${JSON.stringify({ type: 'error', message: err.message })}\n\n`)
      res.end()
    }
  }
}
