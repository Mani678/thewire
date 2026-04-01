const VIRLO_BASE = 'https://api.virlo.ai/v1'

async function virloFetch(path, params = {}) {
  const url = new URL(`${VIRLO_BASE}${path}`)
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${process.env.VIRLO_API_KEY}` },
    next: { revalidate: 3600 } // cache 1hr
  })
  if (!res.ok) throw new Error(`Virlo ${path} → ${res.status}`)
  return res.json()
}

/**
 * Pull today's trend digest from Virlo and map it into story seeds.
 * Falls back to a curated set if Virlo key is missing or call fails.
 */
export async function getTrendingTopics() {
  if (!process.env.VIRLO_API_KEY) return getFallbackTopics()

  try {
    // Use hashtags endpoint (free tier) — top trending hashtags by views
    const hashtagData = await virloFetch('/hashtags', { limit: 30, order_by: 'views', sort: 'desc' })
    const hashtags = hashtagData?.data?.hashtags || []

    if (hashtags.length === 0) return getFallbackTopics()

    // Filter out pure vanity tags (#fyp, #viral, #foryou) — not newsworthy
    const vanity = /^#?(fyp|foryou|foryoupage|viral|trending|video|reels|tiktok|instagram|youtube|funny|meme|shorts)$/i
    const newsworthy = hashtags.filter(h => !vanity.test(h.hashtag || ''))

    // Take top 6 by views
    const seeds = newsworthy.slice(0, 6).map((h, i) => ({
      id: i + 1,
      virloTrend: h.hashtag?.replace('#', '') || '',
      virloViews: h.total_views || h.count || 0,
      virloRank: i + 1,
      section: assignSection(h.hashtag || ''),
    }))

    return seeds.length >= 3 ? seeds : getFallbackTopics()
  } catch (err) {
    console.error('Virlo fetch failed, using fallback:', err.message)
    return getFallbackTopics()
  }
}

function assignSection(topic) {
  const t = topic.toLowerCase()
  if (/tech|ai|crypto|software|apple|google|openai|robot/.test(t)) return 'Technology'
  if (/climate|carbon|fossil|renewable|energy|wildfire|flood/.test(t)) return 'Climate'
  if (/election|vote|congress|senate|president|parliament|policy/.test(t)) return 'Politics'
  if (/market|stock|fed|inflation|gdp|economy|trade|bank/.test(t)) return 'Economy'
  if (/health|cancer|virus|vaccine|fda|drug|mental|brain/.test(t)) return 'Science'
  if (/war|conflict|nato|ukraine|israel|china|russia|africa/.test(t)) return 'World'
  // Default rotation
  const sections = ['World', 'Technology', 'Economy', 'Politics', 'Science', 'Climate']
  return sections[Math.abs(topic.charCodeAt(0) % sections.length)]
}

function getFallbackTopics() {
  return [
    { id: 1, virloTrend: 'AI regulation international treaty', virloViews: 0, virloRank: 1, section: 'Technology' },
    { id: 2, virloTrend: 'Federal Reserve interest rate policy', virloViews: 0, virloRank: 2, section: 'Economy' },
    { id: 3, virloTrend: 'semiconductor chip demand shortage', virloViews: 0, virloRank: 3, section: 'Technology' },
    { id: 4, virloTrend: 'Arctic ice melt accelerating climate', virloViews: 0, virloRank: 4, section: 'Climate' },
    { id: 5, virloTrend: 'chronic stress brain aging research', virloViews: 0, virloRank: 5, section: 'Science' },
    { id: 6, virloTrend: 'US Congress debt ceiling negotiations', virloViews: 0, virloRank: 6, section: 'Politics' },
  ]
}
