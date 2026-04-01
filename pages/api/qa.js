import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { question, articleText, hed } = req.body
  if (!question || !articleText) return res.status(400).json({ error: 'question and articleText required' })

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 500,
      system: `You are the journalist who reported this story. Answer reader questions directly and specifically, drawing on your reporting. Be authoritative but accessible. Speak in first person when natural ("In my reporting...", "Sources indicated..."). Never say "as mentioned in the article" — just answer the question. Keep answers to 2-4 paragraphs.`,
      messages: [{
        role: 'user',
        content: `Story: "${hed}"\n\nArticle text:\n${articleText.substring(0, 4000)}\n\nReader question: ${question}`
      }]
    })

    res.json({ answer: response.content[0].text })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
