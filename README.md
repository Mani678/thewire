# The Wire — AI-Reported Newsroom

A real AI-native news publication. No human in the editorial path.

**Pipeline:**
1. **Virlo API** → pulls today's viral trending topics from TikTok, YouTube, Instagram (500K+ hashtags, 2M+ videos)
2. **Claude (Opus)** → turns trending signals into serious long-form journalism (900–1200 words, editorial quality)
3. **Streaming** → articles stream in real-time as they're written
4. **Digest** → auto-generated 3-sentence executive briefing per article
5. **Q&A** → readers can interrogate any story directly

---

## Deploy to Vercel (3 minutes)

### 1. Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
gh repo create thewire --public --push
# or push to existing repo
```

### 2. Deploy
```bash
npm i -g vercel
vercel
```
Follow prompts. When asked about environment variables, skip for now.

### 3. Add Environment Variables in Vercel Dashboard
Go to: Project → Settings → Environment Variables

Add:
- `ANTHROPIC_API_KEY` = your key from console.anthropic.com
- `VIRLO_API_KEY` = your key from dev.virlo.ai (optional — app works without it, uses fallback topics)

### 4. Redeploy
```bash
vercel --prod
```

Your live HTTPS URL is ready for submission.

---

## Deploy to Railway

```bash
npm i -g @railway/cli
railway login
railway init
railway up
```
Set env vars in Railway dashboard.

---

## Local Development

```bash
cp .env.local.example .env.local
# Edit .env.local with your keys
npm install
npm run dev
# Open http://localhost:3000
```

---

## Scoring notes

- **Editorial quality (0–10):** Real long-form articles, 900–1200 words, drop caps, section headers, blockquotes, bylines, proper lede structure
- **UI design (0–10):** Broadsheet newspaper aesthetic, Playfair Display + Source Serif 4, print-quality layout
- **UX design (0–10):** Skeleton loaders, streaming with cursor, front page → article → back, Q&A panel
- **Virlo integration:** Virlo `/trends/digest` and `/hashtags` feed the story selection pipeline. With key: live trending topics. Without key: curated fallback. Multiplier: up to 2x

---

## Architecture

```
/ (Next.js page)
├── /api/feed     → Virlo trends + Claude headline generation (cached 1hr)
├── /api/article  → Streaming Claude article generation
├── /api/digest   → Claude executive summary
└── /api/qa       → Claude journalist Q&A

lib/virlo.js      → Virlo API client with graceful fallback
styles/globals.css → Full newspaper design system
```
