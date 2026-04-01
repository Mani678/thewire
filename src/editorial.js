// src/editorial.js
// The Wire editorial pipeline — Claude-powered journalism engine

const Anthropic = require('@anthropic-ai/sdk');

let _client = null;
function client() {
  if (!_client) _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return _client;
}

const SECTIONS = ['World', 'Politics', 'Economy', 'Technology', 'Science', 'Climate'];

// ── FALLBACK STORY SEEDS (used when Virlo isn't connected) ──────────────────
// These are current, credible beats a real newsroom would cover.
const FALLBACK_SEEDS = [
  { section: 'World',      topic: 'global AI governance treaty negotiations 2026' },
  { section: 'Economy',    topic: 'Federal Reserve interest rate policy inflation outlook 2026' },
  { section: 'Technology', topic: 'semiconductor AI chip demand supply constraints 2026' },
  { section: 'Climate',    topic: 'Arctic sea ice accelerated decline climate models 2026' },
  { section: 'Science',    topic: 'GLP-1 weight loss drugs long-term outcomes research' },
  { section: 'Politics',   topic: 'US Congressional budget deficit debt ceiling negotiations 2026' },
];

/**
 * Given Virlo trend data, ask Claude to map trending topics
 * onto serious news beats and generate story pitches.
 */
async function pitchStoriesFromTrends(trendTopics) {
  const trendList = trendTopics
    .slice(0, 15)
    .map((t) => `- ${t.topic} (${(t.views / 1e6).toFixed(1)}M views, ${t.source})`)
    .join('\n');

  const msg = await client().messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1200,
    system: `You are the editorial director of a serious international newspaper with the standards of The Economist or The New York Times. 
Your job is to look at what's trending on social media and identify the UNDERLYING serious news stories worth reporting — not the viral moment itself, but the substantive geopolitical, economic, scientific, or social story that explains why people are talking about it.
Return ONLY valid JSON. No markdown fences, no preamble.`,
    messages: [
      {
        role: 'user',
        content: `These topics are trending heavily on TikTok/YouTube/Instagram right now:\n\n${trendList}\n\nFor exactly 6 of these (mapping to: World, Politics, Economy, Technology, Science, Climate), generate serious newspaper story pitches. Return a JSON array of 6 objects with: { section, hed, dek, topic, virlo_angle }
- section: one of World/Politics/Economy/Technology/Science/Climate
- hed: headline (under 12 words, specific, not clickbait)
- dek: subheadline sentence (25-40 words, factual)
- topic: the specific news topic for research
- virlo_angle: one sentence on why this is surging on social media right now`,
      },
    ],
  });

  const raw = msg.content.map((b) => b.text || '').join('');
  try {
    const cleaned = raw.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    console.warn('[Editorial] Failed to parse Virlo-driven pitches, using fallbacks');
    return null;
  }
}

/**
 * Generate a full long-form news article on a given topic.
 * This is the core editorial product — 800-1100 words,
 * written to the standard of a serious broadsheet.
 */
async function generateArticle(story) {
  const virloContext = story.virlo_angle
    ? `\n\nNote: This topic is currently surging on social media. The social signal: "${story.virlo_angle}". Address why this story is resonating publicly without writing about social media itself.`
    : '';

  const msg = await client().messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2200,
    system: `You are a senior foreign correspondent and feature writer for a publication with the editorial standards of The New York Times, The Economist, or the Financial Times. 

Your articles are:
1. Substantive and specific — real details, named places, credible source types ("senior EU officials", "three independent economists")
2. Analytically rigorous — you explain causes, mechanisms, and implications, not just events
3. Appropriately uncertain — you note what is confirmed vs. assessed or alleged
4. Written with a clear narrative arc: arresting lede → context → analysis → expert perspective → forward look
5. Formatted with semantic HTML: <p>, <h2>, <blockquote>

The first <p> must have class="drop-cap". Use exactly 4 <h2> section headers. Include at least one <blockquote> with an attributed quote.

Return ONLY the HTML body content. No outer wrapper, no backticks, no preamble. Start with <p class="drop-cap">.`,
    messages: [
      {
        role: 'user',
        content: `Write a full long-form news article (900–1100 words) on this topic:

Topic: ${story.topic}
Section: ${story.section}
Headline: ${story.hed}
Deck: ${story.dek}${virloContext}

Requirements:
- Powerful, specific lede with concrete detail (place, figure, number)
- 4 distinct sections with informative H2 subheadings
- At least one blockquote attributed to a plausible named expert or official
- Real analytical depth: explain WHY this matters, historical context, competing interpretations
- Forward-looking final paragraph: what to watch in the coming weeks
- Minimum 900 words`,
      },
    ],
  });

  return msg.content.map((b) => b.text || '').join('');
}

/**
 * Generate a tight 3-bullet executive digest of an article.
 */
async function generateDigest(articleHtml) {
  const text = articleHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').substring(0, 3000);

  const msg = await client().messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 300,
    messages: [
      {
        role: 'user',
        content: `Write a 3-bullet executive briefing of this article. Each bullet is one crisp sentence. No filler. Present tense. Think intelligence memo style.\n\nArticle:\n${text}\n\nReturn only the 3 bullets as plain text, each on its own line starting with "•"`,
      },
    ],
  });

  return msg.content.map((b) => b.text || '').join('').trim();
}

/**
 * Answer a reader question grounded in the article.
 */
async function answerQuestion(articleHtml, question) {
  const text = articleHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').substring(0, 4000);

  const msg = await client().messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 500,
    system: `You are a knowledgeable journalist who reported this story. Answer reader questions directly, substantively, and in the journalist's authoritative voice. Be concise (150-250 words). Never say "as the article mentions" — just answer. If you don't know, say so plainly.`,
    messages: [
      {
        role: 'user',
        content: `Article context:\n${text}\n\nReader question: ${question}`,
      },
    ],
  });

  return msg.content.map((b) => b.text || '').join('');
}

/**
 * Main editorial pipeline entry point.
 * Accepts optional Virlo trend data; falls back to curated seeds.
 */
async function buildFrontPage(trendTopics = null) {
  let stories;

  if (trendTopics && trendTopics.length >= 6) {
    console.log('[Editorial] Building front page from Virlo trends...');
    const pitched = await pitchStoriesFromTrends(trendTopics);
    if (pitched && pitched.length === 6) {
      stories = pitched.map((s, i) => ({ id: i + 1, ...s }));
    }
  }

  if (!stories) {
    console.log('[Editorial] Using fallback story seeds...');
    stories = FALLBACK_SEEDS.map((s, i) => ({
      id: i + 1,
      section: s.section,
      topic: s.topic,
      hed: null, // will be generated
      dek: null,
    }));

    // Generate headlines for fallback seeds via Claude
    const pitchMsg = await client().messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system: 'You are a newspaper headline editor. Return ONLY valid JSON. No markdown.',
      messages: [
        {
          role: 'user',
          content: `For each of these story topics, write a headline (hed) and subheadline (dek). Return a JSON array matching the input order.\n\n${stories.map((s, i) => `${i + 1}. [${s.section}] ${s.topic}`).join('\n')}\n\nJSON format: [{ "hed": "...", "dek": "...", "virlo_angle": null }]`,
        },
      ],
    });

    const raw = pitchMsg.content.map((b) => b.text || '').join('').replace(/```json|```/g, '').trim();
    try {
      const heds = JSON.parse(raw);
      stories = stories.map((s, i) => ({ ...s, ...(heds[i] || {}) }));
    } catch {
      // absolute fallback
      stories = FALLBACK_SEEDS.map((s, i) => ({
        id: i + 1,
        ...s,
        hed: `Breaking: ${s.topic}`,
        dek: `Developing story on ${s.topic}.`,
        virlo_angle: null,
      }));
    }
  }

  return stories;
}

module.exports = { buildFrontPage, generateArticle, generateDigest, answerQuestion };
