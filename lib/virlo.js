const VIRLO_BASE = 'https://api.virlo.ai/v1'

async function virloFetch(path, params = {}) {
  const url = new URL(`${VIRLO_BASE}${path}`)
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${process.env.VIRLO_API_KEY}` },
    next: { revalidate: 3600 }
  })
  if (!res.ok) throw new Error(`Virlo ${path} → ${res.status}`)
  return res.json()
}

export async function getTrendingTopics() {
  if (!process.env.VIRLO_API_KEY) return getFallbackTopics()

  try {
    const hashtagData = await virloFetch('/hashtags', { limit: 50, order_by: 'views', sort: 'desc' })
    const hashtags = hashtagData?.data?.hashtags || []
    if (hashtags.length === 0) return getFallbackTopics()

    const vanity = /^#?(fyp|foryou|foryoupage|viral|trending|video|reels|tiktok|instagram|youtube|funny|meme|shorts|likes|follow|love)$/i
    const newsworthy = hashtags.filter(h => !vanity.test(h.hashtag || ''))

    const seeds = newsworthy.slice(0, 12).map((h, i) => ({
      id: i + 1,
      virloTrend: h.hashtag?.replace('#', '') || '',
      virloViews: h.total_views || h.count || 0,
      virloRank: i + 1,
      section: assignSection(h.hashtag || ''),
    }))

    return seeds.length >= 6 ? seeds : getFallbackTopics()
  } catch (err) {
    console.error('Virlo fetch failed, using fallback:', err.message)
    return getFallbackTopics()
  }
}

function assignSection(topic) {
  const t = topic.toLowerCase()
  if (/tech|ai|crypto|software|apple|google|openai|robot|cyber|data|chip|quantum/.test(t)) return 'Technology'
  if (/climate|carbon|fossil|renewable|energy|wildfire|flood|ocean|emission|green/.test(t)) return 'Climate'
  if (/election|vote|congress|senate|president|parliament|policy|democrat|republican|minister/.test(t)) return 'Politics'
  if (/market|stock|fed|inflation|gdp|economy|trade|bank|finance|dollar|crypto|bitcoin/.test(t)) return 'Economy'
  if (/health|cancer|virus|vaccine|fda|drug|mental|brain|medical|research|study|science/.test(t)) return 'Science'
  if (/war|conflict|nato|ukraine|israel|china|russia|africa|middle|east|global|world/.test(t)) return 'World'
  const sections = ['World', 'Technology', 'Economy', 'Politics', 'Science', 'Climate']
  return sections[Math.abs(topic.charCodeAt(0) % sections.length)]
}

// 2 stories per section = 12 total, every tab always has content
function getFallbackTopics() {
  return [
    // World
    { id: 1,  virloTrend: 'NATO alliance tensions eastern Europe security', virloViews: 0, virloRank: 1,  section: 'World' },
    { id: 2,  virloTrend: 'China US trade relations tariffs diplomacy 2026', virloViews: 0, virloRank: 2,  section: 'World' },
    // Politics
    { id: 3,  virloTrend: 'US Congress debt ceiling budget negotiations 2026', virloViews: 0, virloRank: 3,  section: 'Politics' },
    { id: 4,  virloTrend: 'election integrity voting rights legislation', virloViews: 0, virloRank: 4,  section: 'Politics' },
    // Economy
    { id: 5,  virloTrend: 'Federal Reserve interest rate inflation outlook', virloViews: 0, virloRank: 5,  section: 'Economy' },
    { id: 6,  virloTrend: 'global recession risk GDP growth slowdown', virloViews: 0, virloRank: 6,  section: 'Economy' },
    // Technology
    { id: 7,  virloTrend: 'AI regulation international governance treaty', virloViews: 0, virloRank: 7,  section: 'Technology' },
    { id: 8,  virloTrend: 'semiconductor chip shortage supply chain 2026', virloViews: 0, virloRank: 8,  section: 'Technology' },
    // Science
    { id: 9,  virloTrend: 'chronic stress cognitive aging brain research', virloViews: 0, virloRank: 9,  section: 'Science' },
    { id: 10, virloTrend: 'cancer immunotherapy breakthrough clinical trials', virloViews: 0, virloRank: 10, section: 'Science' },
    // Climate
    { id: 11, virloTrend: 'Arctic ice melt accelerating sea level rise', virloViews: 0, virloRank: 11, section: 'Climate' },
    { id: 12, virloTrend: 'renewable energy solar wind adoption global', virloViews: 0, virloRank: 12, section: 'Climate' },
  ]
}
