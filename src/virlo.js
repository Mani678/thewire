// src/virlo.js
// Virlo API client — drives The Wire's editorial agenda with real trend data
// Docs: https://dev.virlo.ai/docs

const VIRLO_BASE = 'https://api.virlo.ai/v1';

async function virloFetch(path, params = {}) {
  const key = process.env.VIRLO_API_KEY;
  if (!key) return null;

  const url = new URL(`${VIRLO_BASE}${path}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  try {
    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${key}` },
    });
    if (!res.ok) {
      console.warn(`[Virlo] ${path} → ${res.status}`);
      return null;
    }
    return res.json();
  } catch (err) {
    console.warn(`[Virlo] fetch error: ${err.message}`);
    return null;
  }
}

/**
 * Get today's trending digest from Virlo.
 * Returns an array of { topic, hashtag, views } objects
 * that we use to select/pitch stories for the front page.
 */
async function getTrendingTopics() {
  // Primary: daily trends digest
  const digest = await virloFetch('/trends/digest');
  if (digest?.data?.trends?.length) {
    return digest.data.trends.map((t) => ({
      topic: t.topic || t.name || t.hashtag,
      hashtag: t.hashtag || null,
      views: t.total_views || t.views || 0,
      source: 'virlo_digest',
    }));
  }

  // Fallback: top hashtags by views
  const hashtags = await virloFetch('/hashtags', { limit: 20, order_by: 'views', sort: 'desc' });
  if (hashtags?.data?.hashtags?.length) {
    return hashtags.data.hashtags.map((h) => ({
      topic: h.hashtag.replace(/^#/, ''),
      hashtag: h.hashtag,
      views: h.total_views || 0,
      source: 'virlo_hashtags',
    }));
  }

  return null;
}

/**
 * Get video digest — top performing videos in last 48hrs.
 * We mine titles/topics from these to find breaking story angles.
 */
async function getVideoDigest() {
  const data = await virloFetch('/videos/digest', { limit: 30 });
  if (!data?.data?.videos?.length) return null;

  return data.data.videos.map((v) => ({
    title: v.title || v.description || '',
    hashtags: v.hashtags || [],
    views: v.views || 0,
    platform: v.platform || 'unknown',
    source: 'virlo_video_digest',
  }));
}

/**
 * Run an Orbit search on a specific keyword — gets us deeper
 * signal on a topic before Claude writes the article.
 * Note: Orbit searches take 5-10 min to process fully;
 * we kick one off and use the immediate metadata.
 */
async function orbitSearch(keyword) {
  const data = await virloFetch('/orbit', {
    method: 'POST', // virloFetch uses GET by default; orbit is POST
  });
  // For orbit we need POST — handle separately
  const key = process.env.VIRLO_API_KEY;
  if (!key) return null;

  try {
    const res = await fetch(`${VIRLO_BASE}/orbit`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: `thewire_${Date.now()}`,
        keywords: [keyword],
        platforms: ['tiktok', 'youtube', 'instagram'],
        min_views: 5000,
        run_analysis: false, // save credits; we use Claude for analysis
      }),
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

module.exports = { getTrendingTopics, getVideoDigest, orbitSearch };
