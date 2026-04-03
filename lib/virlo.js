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
    const hashtagData = await virloFetch('/hashtags', { limit: 80, order_by: 'views', sort: 'desc' })
    const hashtags = hashtagData?.data?.hashtags || []
    if (hashtags.length === 0) return getFallbackTopics()

    const vanity = /^#?(fyp|foryou|foryoupage|viral|trending|video|reels|tiktok|instagram|youtube|funny|meme|shorts|likes|follow|love|cute|lol|fail)$/i
    const newsworthy = hashtags.filter(h => !vanity.test(h.hashtag || ''))

    const seeds = newsworthy.slice(0, 24).map((h, i) => ({
      id: i + 1,
      virloTrend: h.hashtag?.replace('#', '') || '',
      virloViews: h.total_views || h.count || 0,
      virloRank: i + 1,
      section: assignSection(h.hashtag || ''),
    }))

    return seeds.length >= 12 ? seeds : getFallbackTopics()
  } catch (err) {
    console.error('Virlo fetch failed, using fallback:', err.message)
    return getFallbackTopics()
  }
}

function assignSection(topic) {
  const t = topic.toLowerCase()
  if (/tech|ai|crypto|software|apple|google|openai|robot|cyber|data|chip|quantum|meta|nvidia/.test(t)) return 'Technology'
  if (/climate|carbon|fossil|renewable|energy|wildfire|flood|ocean|emission|green|weather|storm/.test(t)) return 'Climate'
  if (/election|vote|congress|senate|president|parliament|policy|democrat|republican|minister|law|court/.test(t)) return 'Politics'
  if (/market|stock|fed|inflation|gdp|economy|trade|bank|finance|dollar|bitcoin|recession|tariff/.test(t)) return 'Economy'
  if (/health|cancer|virus|vaccine|fda|drug|mental|brain|medical|research|study|science|space|nasa/.test(t)) return 'Science'
  if (/war|conflict|nato|ukraine|israel|china|russia|africa|middle|east|global|world|military|crisis/.test(t)) return 'World'
  const sections = ['World', 'Technology', 'Economy', 'Politics', 'Science', 'Climate']
  return sections[Math.abs(topic.charCodeAt(0) % sections.length)]
}

// 4 stories per section = 24 total
function getFallbackTopics() {
  return [
    // World
    { id: 1,  virloTrend: 'NATO alliance eastern Europe Russia military buildup', virloViews: 0, virloRank: 1,  section: 'World' },
    { id: 2,  virloTrend: 'China US trade war tariffs 2026 diplomacy breakdown', virloViews: 0, virloRank: 2,  section: 'World' },
    { id: 3,  virloTrend: 'Middle East ceasefire negotiations collapse humanitarian', virloViews: 0, virloRank: 3,  section: 'World' },
    { id: 4,  virloTrend: 'UN Security Council veto reform global governance', virloViews: 0, virloRank: 4,  section: 'World' },
    // Politics
    { id: 5,  virloTrend: 'US Congress debt ceiling budget crisis 2026', virloViews: 0, virloRank: 5,  section: 'Politics' },
    { id: 6,  virloTrend: 'election integrity voting rights legislation polarization', virloViews: 0, virloRank: 6,  section: 'Politics' },
    { id: 7,  virloTrend: 'Supreme Court landmark ruling constitutional rights', virloViews: 0, virloRank: 7,  section: 'Politics' },
    { id: 8,  virloTrend: 'immigration policy border crisis political deadlock', virloViews: 0, virloRank: 8,  section: 'Politics' },
    // Economy
    { id: 9,  virloTrend: 'Federal Reserve interest rate inflation labor market', virloViews: 0, virloRank: 9,  section: 'Economy' },
    { id: 10, virloTrend: 'global recession risk GDP slowdown emerging markets', virloViews: 0, virloRank: 10, section: 'Economy' },
    { id: 11, virloTrend: 'US China tariffs supply chain manufacturing reshoring', virloViews: 0, virloRank: 11, section: 'Economy' },
    { id: 12, virloTrend: 'cryptocurrency bitcoin regulation institutional adoption', virloViews: 0, virloRank: 12, section: 'Economy' },
    // Technology
    { id: 13, virloTrend: 'AI regulation international governance treaty 2026', virloViews: 0, virloRank: 13, section: 'Technology' },
    { id: 14, virloTrend: 'semiconductor chip shortage TSMC supply chain demand', virloViews: 0, virloRank: 14, section: 'Technology' },
    { id: 15, virloTrend: 'OpenAI Google Anthropic AGI race safety concerns', virloViews: 0, virloRank: 15, section: 'Technology' },
    { id: 16, virloTrend: 'cybersecurity attacks critical infrastructure nation state', virloViews: 0, virloRank: 16, section: 'Technology' },
    // Science
    { id: 17, virloTrend: 'chronic stress cognitive aging brain neuroimaging research', virloViews: 0, virloRank: 17, section: 'Science' },
    { id: 18, virloTrend: 'cancer immunotherapy breakthrough clinical trial results', virloViews: 0, virloRank: 18, section: 'Science' },
    { id: 19, virloTrend: 'NASA Mars mission space exploration funding 2026', virloViews: 0, virloRank: 19, section: 'Science' },
    { id: 20, virloTrend: 'quantum computing breakthrough encryption implications', virloViews: 0, virloRank: 20, section: 'Science' },
    // Climate
    { id: 21, virloTrend: 'Arctic ice melt accelerating sea level rise projections', virloViews: 0, virloRank: 21, section: 'Climate' },
    { id: 22, virloTrend: 'renewable energy solar wind adoption grid investment', virloViews: 0, virloRank: 22, section: 'Climate' },
    { id: 23, virloTrend: 'extreme weather events climate change attribution science', virloViews: 0, virloRank: 23, section: 'Climate' },
    { id: 24, virloTrend: 'carbon capture technology investment scale deployment', virloViews: 0, virloRank: 24, section: 'Climate' },
  ]
}
