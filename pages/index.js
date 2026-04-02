import { useState, useEffect, useCallback } from 'react'
import Head from 'next/head'

const SECTIONS = ['All', 'World', 'Politics', 'Economy', 'Technology', 'Science', 'Climate']

const BYLINES = [
  'By The Wire Editorial AI',
  'By The Wire Reporting Engine',
  'By The Wire News Desk',
  'By The Wire Intelligence Unit',
]

function randomByline() {
  return BYLINES[Math.floor(Math.random() * BYLINES.length)]
}

function formatDateFull() {
  return new Date().toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' })
}

function formatDateShort() {
  return new Date().toLocaleDateString('en-US', { month:'long', day:'numeric', year:'numeric' })
}



function SkeletonFront() {
  return (
    <>
    <div style={{
      display:'flex', alignItems:'center', gap:'12px',
      padding:'16px 0', borderBottom:'1px solid var(--rule)', marginBottom:'4px'
    }}>
      <div style={{
        width:'8px', height:'8px', borderRadius:'50%',
        background:'var(--accent)', animation:'pulse 1.5s infinite'
      }}/>
      <span style={{
        fontFamily:'DM Mono, monospace', fontSize:'11px',
        letterSpacing:'2px', textTransform:'uppercase', color:'var(--ink-4)'
      }}>
        AI editorial pipeline running · Generating today's front page…
      </span>
    </div>
    <div className="front-grid">
      <div className="story-lead">
        <div className="skeleton" style={{width:'60px',height:'12px',marginBottom:'12px'}}/>
        <div className="skeleton" style={{width:'100%',height:'36px',marginBottom:'8px'}}/>
        <div className="skeleton" style={{width:'85%',height:'36px',marginBottom:'8px'}}/>
        <div className="skeleton" style={{width:'70%',height:'36px',marginBottom:'16px'}}/>
        <div className="skeleton" style={{width:'100%',height:'15px',marginBottom:'6px'}}/>
        <div className="skeleton" style={{width:'80%',height:'15px',marginBottom:'6px'}}/>
        <div className="skeleton" style={{width:'60%',height:'15px'}}/>
      </div>
      <div className="story-sidebar">
        {[0,1].map(i=>(
          <div key={i} className="story-sidebar-item">
            <div className="skeleton" style={{width:'50px',height:'11px',marginBottom:'10px'}}/>
            <div className="skeleton" style={{width:'100%',height:'19px',marginBottom:'6px'}}/>
            <div className="skeleton" style={{width:'85%',height:'19px',marginBottom:'10px'}}/>
            <div className="skeleton" style={{width:'100%',height:'13px',marginBottom:'4px'}}/>
            <div className="skeleton" style={{width:'70%',height:'13px'}}/>
          </div>
        ))}
      </div>
      <div className="story-row">
        {[0,1,2].map(i=>(
          <div key={i} className="story-cell">
            <div className="skeleton" style={{width:'50px',height:'11px',marginBottom:'10px'}}/>
            <div className="skeleton" style={{width:'100%',height:'19px',marginBottom:'6px'}}/>
            <div className="skeleton" style={{width:'75%',height:'19px',marginBottom:'10px'}}/>
            <div className="skeleton" style={{width:'100%',height:'13px',marginBottom:'4px'}}/>
            <div className="skeleton" style={{width:'80%',height:'13px'}}/>
          </div>
        ))}
      </div>
    </div>
    </>
  )
}

function StoryButton({ story, onRead, isLoading }) {
  return (
    <div style={{marginTop:'16px'}}>
      <div style={{
        fontFamily:'DM Mono, monospace', fontSize:'10px', letterSpacing:'1.5px',
        textTransform:'uppercase', color:'var(--ink-4)', marginBottom:'8px',
        display:'flex', alignItems:'center', gap:'8px', flexWrap:'wrap'
      }}>
        <span style={{color:'var(--accent)'}}>◆</span>
        <span>Full AI report · ~1,000 words · Sources · Q&A</span>
      </div>
      <button className="read-btn" onClick={() => onRead(story)} disabled={isLoading}>
        <div className={`btn-spinner ${isLoading ? 'visible' : ''}`}/>
        {isLoading ? 'Generating report…' : 'Generate Full Report →'}
      </button>
    </div>
  )
}

function VirloSignal({ views, rank }) {
  if (!views) return null
  const fmt = views > 1e9 ? `${(views/1e9).toFixed(1)}B` : views > 1e6 ? `${(views/1e6).toFixed(1)}M` : `${(views/1e3).toFixed(0)}K`
  return (
    <div className="virlo-signal">
      <div className="virlo-dot"/>
      Trending · {fmt} views · Rank #{rank}
    </div>
  )
}

function SectionGrid({ stories, activeSection, onRead, generatingId }) {
  const filtered = activeSection === 'All' ? stories : stories.filter(s => s.section === activeSection)

  if (filtered.length === 0) {
    return (
      <div style={{padding:'60px 0',textAlign:'center',fontFamily:'DM Mono, monospace',fontSize:'12px',letterSpacing:'2px',textTransform:'uppercase',color:'var(--ink-4)'}}>
        No stories in this section yet.
      </div>
    )
  }

  const lead = filtered[0]
  const secondaries = filtered.slice(1, 3)
  const thirds = filtered.slice(3, 6)

  return (
    <div className="front-grid">
      <div className="story-lead">
        <div className="story-section-tag">{lead.section}</div>
        <div className="story-hed" onClick={() => onRead(lead)}>{lead.hed}</div>
        <div className="story-dek">{lead.dek}</div>
        {lead.hasVirloData && <VirloSignal views={lead.virloViews} rank={lead.virloRank}/>}
        <div className="story-byline">{randomByline()} · {formatDateShort()}</div>
        <StoryButton story={lead} onRead={onRead} isLoading={generatingId === lead.id}/>
      </div>

      <div className="story-sidebar">
        {secondaries.length > 0 ? secondaries.map(s => (
          <div key={s.id} className="story-sidebar-item">
            <div className="story-section-tag">{s.section}</div>
            <div className="story-hed" onClick={() => onRead(s)}>{s.hed}</div>
            <div className="story-dek">{s.dek}</div>
            {s.hasVirloData && <VirloSignal views={s.virloViews} rank={s.virloRank}/>}
            <div className="story-byline">{randomByline()}</div>
            <StoryButton story={s} onRead={onRead} isLoading={generatingId === s.id}/>
          </div>
        )) : <div style={{padding:'24px 0',fontFamily:'DM Mono, monospace',fontSize:'11px',color:'var(--ink-4)'}}>More stories loading…</div>}
      </div>

      {thirds.length > 0 && (
        <div className="story-row">
          {thirds.map(s => (
            <div key={s.id} className="story-cell">
              <div className="story-section-tag">{s.section}</div>
              <div className="story-hed" onClick={() => onRead(s)}>{s.hed}</div>
              <div className="story-dek">{s.dek}</div>
              {s.hasVirloData && <VirloSignal views={s.virloViews} rank={s.virloRank}/>}
              <div className="story-byline">{randomByline()}</div>
              <StoryButton story={s} onRead={onRead} isLoading={generatingId === s.id}/>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ArticleView({ story, onBack }) {
  const [phase, setPhase] = useState('loading')
  const [articleHtml, setArticleHtml] = useState('')
  const [digest, setDigest] = useState('')
  const [qaThread, setQaThread] = useState([])
  const [qaInput, setQaInput] = useState('')
  const [qaLoading, setQaLoading] = useState(false)
  const [stageIdx, setStageIdx] = useState(0)
  const stages = ['Analysing trending signals', 'Sourcing public record data', 'Writing long-form report', 'Applying editorial standards']

  useEffect(() => {
    const iv = setInterval(() => setStageIdx(i => Math.min(i+1, stages.length-1)), 1200)

    const generate = async () => {
      try {
        const res = await fetch('/api/article', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            topic: story.topic,
            section: story.section,
            virloContext: story.hasVirloData ? { views: story.virloViews, rank: story.virloRank } : null
          })
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        clearInterval(iv)
        setPhase('streaming')

        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let buffer = '', html = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop()
          for (const line of lines) {
            if (!line.startsWith('data: ')) continue
            try {
              const evt = JSON.parse(line.slice(6))
              if (evt.type === 'chunk') { html += evt.text; setArticleHtml(html) }
              else if (evt.type === 'done') { setPhase('done'); fetchDigest(html) }
              else if (evt.type === 'error') throw new Error(evt.message)
            } catch {}
          }
        }
      } catch (err) {
        clearInterval(iv)
        setPhase('error')
      }
    }

    generate()
    return () => clearInterval(iv)
  }, [story.id])

  const fetchDigest = async (html) => {
    try {
      const res = await fetch('/api/digest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleText: html.replace(/<[^>]+>/g, ' '), hed: story.hed })
      })
      const data = await res.json()
      setDigest(data.digest || '')
    } catch {}
  }

  const submitQuestion = async () => {
    const q = qaInput.trim()
    if (!q || qaLoading) return
    setQaInput('')
    setQaLoading(true)
    setQaThread(t => [{ q, a: null }, ...t])
    try {
      const res = await fetch('/api/qa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q, articleText: articleHtml.replace(/<[^>]+>/g, ' '), hed: story.hed })
      })
      const data = await res.json()
      setQaThread(t => t.map((it,i) => i===0 ? { ...it, a: data.answer } : it))
    } catch {
      setQaThread(t => t.map((it,i) => i===0 ? { ...it, a: 'Could not load answer. Try again.' } : it))
    } finally { setQaLoading(false) }
  }

  return (
    <div className="article-view">
      <div className="content-area">
        <button className="article-back" onClick={onBack}>← Front Page</button>

        {phase === 'loading' && (
          <div className="article-container">
            <div style={{padding:'60px 0 80px', borderTop:'2px solid var(--ink)'}}>
              <div style={{
                fontFamily:'DM Mono, monospace', fontSize:'10px',
                letterSpacing:'3px', textTransform:'uppercase',
                color:'var(--accent)', marginBottom:'24px'
              }}>
                The Wire · AI Reporting Engine
              </div>
              <div style={{
                fontFamily:'Playfair Display, serif', fontSize:'clamp(22px,4vw,32px)',
                fontWeight:'700', color:'var(--ink)', marginBottom:'32px', lineHeight:'1.2'
              }}>
                {story.hed}
              </div>
              <div style={{display:'flex', flexDirection:'column', gap:'0'}}>
                {stages.map((s,i) => (
                  <div key={i} style={{
                    display:'flex', alignItems:'center', gap:'16px',
                    padding:'14px 0',
                    borderBottom:'1px solid var(--rule)',
                    opacity: i <= stageIdx ? 1 : 0.25,
                    transition:'opacity 0.4s'
                  }}>
                    <div style={{
                      width:'8px', height:'8px', borderRadius:'50%', flexShrink:0,
                      background: i < stageIdx ? 'var(--accent)' : i === stageIdx ? 'var(--accent)' : 'var(--rule)',
                      animation: i === stageIdx ? 'pulse 1s infinite' : 'none'
                    }}/>
                    <span style={{
                      fontFamily:'DM Mono, monospace', fontSize:'11px',
                      letterSpacing:'1.5px', textTransform:'uppercase',
                      color: i <= stageIdx ? 'var(--ink-2)' : 'var(--ink-4)'
                    }}>
                      {s}
                    </span>
                    {i < stageIdx && (
                      <span style={{marginLeft:'auto', fontFamily:'DM Mono, monospace', fontSize:'10px', color:'var(--accent)'}}>✓</span>
                    )}
                    {i === stageIdx && (
                      <div style={{marginLeft:'auto', width:'14px', height:'14px', border:'1.5px solid var(--rule)', borderTopColor:'var(--accent)', borderRadius:'50%', animation:'spin 0.8s linear infinite'}}/>
                    )}
                  </div>
                ))}
              </div>
              <div style={{
                marginTop:'24px', fontFamily:'DM Mono, monospace',
                fontSize:'10px', color:'var(--ink-4)', letterSpacing:'1px'
              }}>
                Generating ~1,000 word report · No human in the editorial path
              </div>
            </div>
          </div>
        )}

        {phase === 'error' && (
          <div className="article-container">
            <p style={{color:'var(--accent)',fontFamily:'DM Mono, monospace',fontSize:'13px'}}>
              Error generating article. Go back and try again.
            </p>
          </div>
        )}

        {(phase === 'streaming' || phase === 'done') && (
          <div className="article-container">
            <div className="article-section-tag">{story.section}</div>
            <h1 className="article-hed">{story.hed}</h1>
            <div className="article-dek">{story.dek}</div>
            <div className="article-meta">
              <span className="article-byline">{randomByline()}</span>
              <span className="article-date">{formatDateFull()}</span>
            </div>
            {story.hasVirloData && <div style={{marginBottom:'24px'}}><VirloSignal views={story.virloViews} rank={story.virloRank}/></div>}
            <div className={`article-body ${phase==='streaming'?'stream-cursor':''}`} dangerouslySetInnerHTML={{ __html: articleHtml }}/>

            {/* ── CREDIBILITY BLOCK — always visible once streaming starts ── */}
            <div style={{
              margin:'40px 0 0', padding:'24px',
              border:'1px solid var(--rule)',
              background:'var(--paper-2)'
            }}>
              <div style={{
                fontFamily:'DM Mono, monospace', fontSize:'10px',
                letterSpacing:'2px', textTransform:'uppercase',
                color:'var(--accent)', marginBottom:'16px'
              }}>About This Report</div>
              <div style={{
                display:'grid',
                gridTemplateColumns:'repeat(auto-fit, minmax(150px, 1fr))',
                gap:'16px', marginBottom:'20px'
              }}>
                {[
                  { label:'Reporting Method', value:'AI Editorial Pipeline' },
                  { label:'Model', value:'Claude Sonnet' },
                  { label:'Sources Analyzed', value:'Public record, wire reports, institutional data' },
                  { label:'Confidence', value:'High — established facts & public record' },
                ].map(item => (
                  <div key={item.label}>
                    <div style={{fontFamily:'DM Mono, monospace', fontSize:'9px', letterSpacing:'1.5px', textTransform:'uppercase', color:'var(--ink-4)', marginBottom:'4px'}}>{item.label}</div>
                    <div style={{fontSize:'13px', color:'var(--ink-2)', lineHeight:'1.5'}}>{item.value}</div>
                  </div>
                ))}
              </div>
              <div style={{
                borderTop:'1px solid var(--rule)', paddingTop:'14px',
                fontFamily:'DM Mono, monospace', fontSize:'10px',
                color:'var(--ink-4)', lineHeight:'1.8', letterSpacing:'0.5px'
              }}>
                This article was generated autonomously by The Wire's AI reporting engine — no human journalist was involved. The pipeline ingests trending signals, synthesises public-record sources, and produces structured long-form journalism to newsroom standards.
              </div>
            </div>

            {phase === 'done' && (
              <>
                {digest && (
                  <div className="digest-panel">
                    <div className="digest-label">Executive Digest</div>
                    <div className="digest-hed">The Wire Briefing</div>
                    <div className="digest-body">{digest}</div>
                  </div>
                )}
                <div className="qa-panel">
                  <div className="qa-title">Ask the Reporter <span className="qa-badge">AI Q&amp;A</span></div>
                  <div className="qa-row">
                    <input className="qa-input" value={qaInput} onChange={e => setQaInput(e.target.value)}
                      onKeyDown={e => e.key==='Enter' && submitQuestion()} placeholder="Ask a question about this story…"/>
                    <button className="qa-submit" onClick={submitQuestion} disabled={qaLoading}>
                      {qaLoading ? 'Thinking…' : 'Ask'}
                    </button>
                  </div>
                  <div className="qa-thread">
                    {qaThread.map((item,i) => (
                      <div key={i} className="qa-item">
                        <div className="qa-q">Q: {item.q}</div>
                        <div className="qa-a">{item.a || <em style={{color:'var(--ink-4)'}}>Thinking…</em>}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function Masthead({ ticker, activeSection, onSection }) {
  return (
    <>
      <header className="masthead">
        <div className="masthead-inner">
          <div className="masthead-top">
            <div>
              <div className="pub-name">The Wire</div>
              <div className="pub-tagline">Independent · AI-Reported · No Human Editorial</div>
            </div>
            <div className="masthead-meta">
              {new Date().toLocaleDateString('en-US',{weekday:'long'})}<br/>
              {new Date().toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'})}<br/>
              Est. 2026
            </div>
          </div>
          <hr className="masthead-rule"/>
          <nav className="section-nav">
            {SECTIONS.map(s => (
              <button key={s} className={`section-btn ${activeSection===s?'active':''}`} onClick={() => onSection(s)}>
                {s}
              </button>
            ))}
          </nav>
        </div>
      </header>
      <div className="ticker">
        <div className="ticker-label">Breaking</div>
        <div className="ticker-track">
          <div className="ticker-inner">{ticker}</div>
        </div>
      </div>
    </>
  )
}

export default function Home() {
  const [stories, setStories] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeStory, setActiveStory] = useState(null)
  const [generatingId, setGeneratingId] = useState(null)
  const [activeSection, setActiveSection] = useState('All')
  const [hasVirlo, setHasVirlo] = useState(false)

  useEffect(() => {
    fetch('/api/feed')
      .then(r => r.json())
      .then(data => {
        setStories(data.stories || [])
        setHasVirlo(data.stories?.some(s => s.hasVirloData))
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const openArticle = useCallback((story) => {
    setGeneratingId(story.id)
    setActiveStory(story)
    window.scrollTo(0, 0)
  }, [])

  const tickerText = stories.length > 0
    ? stories.map(s => s.hed).join('   ·   ')
    : 'Loading latest developments…'

  return (
    <div>
      <Head>
        <title>{activeStory ? `${activeStory.hed} — The Wire` : 'The Wire — AI-Reported News'}</title>
        <meta name="description" content="Real reporting, no human in the editorial path."/>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"/>
        <meta name="theme-color" content="#0a0908"/>
        <meta name="apple-mobile-web-app-capable" content="yes"/>
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent"/>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>📰</text></svg>"/>
      </Head>

      <Masthead
        ticker={tickerText}
        activeSection={activeSection}
        onSection={s => { setActiveSection(s); setActiveStory(null); setGeneratingId(null) }}
      />

      {activeStory ? (
        <ArticleView story={activeStory} onBack={() => { setActiveStory(null); setGeneratingId(null) }}/>
      ) : (
        <div className="content-area">
          <div className="date-line">
            <span>{formatDateFull().toUpperCase()}</span>
            <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
              {hasVirlo && <span className="virlo-badge">Powered by Virlo Trends</span>}
              <span>The Wire · AI-Reported</span>
            </div>
          </div>
          {loading
            ? <SkeletonFront/>
            : <SectionGrid stories={stories} activeSection={activeSection} onRead={openArticle} generatingId={generatingId}/>
          }
        </div>
      )}
    </div>
  )
}
