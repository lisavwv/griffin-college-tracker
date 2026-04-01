import React, { useState, useEffect, useCallback } from 'react'
import { SCORING_CRITERIA, ESSAY_SECTIONS, ALL_ESSAY_QUESTIONS, getCriteriaForTourType } from './data/questions'
import * as store from './data/store'
import { SCHOOLS, getSchoolById, getAllSchools } from './data/schools'
import { getBranding, getLogoUrl } from './data/branding'

const TIER_LABELS = { reach: 'Reach', target: 'Target', safety: 'Safety', low_interest: 'Low Interest' }

function SchoolLogo({ schoolId, size = 36, fallback = '—' }) {
  const [failed, setFailed] = useState(false)
  const logoUrl = getLogoUrl(schoolId)
  const branding = getBranding(schoolId)

  if (!logoUrl || failed) {
    return (
      <div className="school-rank" style={{ width: size, height: size, background: branding.color, color: 'white' }}>
        {fallback}
      </div>
    )
  }
  return (
    <img
      src={logoUrl}
      alt=""
      className="school-logo"
      style={{ width: size, height: size }}
      onError={() => setFailed(true)}
    />
  )
}

// ============================================================
// APP
// ============================================================
export default function App() {
  const [screen, setScreen] = useState('schools') // schools, detail, score, essay, rankings, matrix, addSchool
  const [selectedSchool, setSelectedSchool] = useState(null)
  const [toast, setToast] = useState(null)
  const [synced, setSynced] = useState(false)

  // Sync from Supabase on first load
  useEffect(() => {
    store.pullFromSupabase().then((ok) => {
      setSynced(true)
      if (ok) console.log('Synced from Supabase')
    })
  }, [])

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const nav = (s, school = null) => {
    setScreen(s)
    if (school) setSelectedSchool(school)
    window.scrollTo(0, 0)
  }

  return (
    <div className="app">
      {screen === 'schools' && <SchoolsScreen nav={nav} />}
      {screen === 'detail' && <DetailScreen school={selectedSchool} nav={nav} showToast={showToast} />}
      {screen === 'score' && <ScoreScreen school={selectedSchool} nav={nav} showToast={showToast} />}
      {screen === 'essay' && <EssayScreen school={selectedSchool} nav={nav} showToast={showToast} />}
      {screen === 'rankings' && <RankingsScreen nav={nav} />}
      {screen === 'matrix' && <MatrixScreen nav={nav} />}
      {screen === 'weights' && <WeightsScreen nav={nav} showToast={showToast} />}
      {screen === 'addSchool' && <AddSchoolScreen nav={nav} showToast={showToast} />}

      <nav className="bottom-nav">
        <button className={`nav-item ${screen === 'schools' ? 'active' : ''}`} onClick={() => nav('schools')}>
          <span className="nav-icon">🎓</span>Schools
        </button>
        <button className={`nav-item ${screen === 'rankings' ? 'active' : ''}`} onClick={() => nav('rankings')}>
          <span className="nav-icon">🏆</span>Rankings
        </button>
        <button className={`nav-item ${screen === 'matrix' ? 'active' : ''}`} onClick={() => nav('matrix')}>
          <span className="nav-icon">📊</span>Matrix
        </button>
        <button className={`nav-item ${screen === 'weights' ? 'active' : ''}`} onClick={() => nav('weights')}>
          <span className="nav-icon">⚙️</span>Priorities
        </button>
      </nav>

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}

// ============================================================
// SCHOOLS LIST SCREEN
// ============================================================
function SchoolsScreen({ nav }) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all') // all, visited, not_visited, reach, target, safety
  const visits = store.getVisits()
  const allSchools = getAllSchools()

  const filtered = allSchools.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.location.toLowerCase().includes(search.toLowerCase())
    const visit = visits[s.id]
    if (filter === 'visited') return matchesSearch && visit?.visited
    if (filter === 'not_visited') return matchesSearch && !visit?.visited
    if (filter === 'reach') return matchesSearch && visit?.tier === 'reach'
    if (filter === 'target') return matchesSearch && visit?.tier === 'target'
    if (filter === 'safety') return matchesSearch && visit?.tier === 'safety'
    if (filter === 'low_interest') return matchesSearch && visit?.tier === 'low_interest'
    return matchesSearch && visit?.tier !== 'low_interest'
  })

  const visitedCount = Object.values(visits).filter(v => v.visited).length

  return (
    <>
      <div className="header">
        <h1>Griffin's College Tracker</h1>
        <div className="subtitle">{allSchools.length} schools &middot; {visitedCount} visited</div>
      </div>

      <div className="search-bar">
        <span className="search-icon">🔍</span>
        <input
          className="search-input"
          placeholder="Search schools..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="filter-bar">
        {[
          { id: 'all', label: 'All' },
          { id: 'visited', label: 'Visited' },
          { id: 'not_visited', label: 'Not Visited' },
          { id: 'reach', label: 'Reach' },
          { id: 'target', label: 'Target' },
          { id: 'safety', label: 'Safety' },
          { id: 'low_interest', label: 'Low Interest' },
        ].map(f => (
          <button
            key={f.id}
            className={`chip ${filter === f.id ? 'active' : ''}`}
            onClick={() => setFilter(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="school-list">
        {filtered.map(school => {
          const visit = visits[school.id]
          return (
            <div key={school.id} className="school-list-item" onClick={() => nav('detail', school)}>
              <SchoolLogo schoolId={school.id} size={36} fallback={school.rank || '—'} />
              <div className="school-info">
                <div className="school-name">{school.name}</div>
                <div className="school-location">{school.location} &middot; {school.acceptanceRate}</div>
              </div>
              <div className="school-badges">
                {visit?.visited && <span className="badge badge-visited">Visited</span>}
                {visit?.tier && <span className={`badge badge-${visit.tier}`}>{TIER_LABELS[visit.tier] || visit.tier}</span>}
              </div>
              <span className="chevron">›</span>
            </div>
          )
        })}
      </div>

      <div style={{ padding: '16px' }}>
        <button className="btn btn-outline" onClick={() => nav('addSchool')}>
          + Add Custom School
        </button>
      </div>
    </>
  )
}

// ============================================================
// SCHOOL DETAIL SCREEN
// ============================================================
function DetailScreen({ school, nav, showToast }) {
  const [visit, setVisit] = useState(store.getVisit(school.id) || {})
  const [expandedSections, setExpandedSections] = useState({})
  const branding = getBranding(school.id)
  const logoUrl = getLogoUrl(school.id)

  const toggleSection = (id) => {
    setExpandedSections(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const handleMarkVisited = (tourType) => {
    const today = new Date().toISOString().split('T')[0]
    store.markVisited(school.id, today)
    store.saveVisit(school.id, { tourType })
    setVisit(store.getVisit(school.id))
    showToast(tourType === 'official' ? 'Marked as Official Tour!' : 'Marked as Self-Guided!')
  }

  const handleChangeTourType = (tourType) => {
    store.saveVisit(school.id, { tourType })
    setVisit(store.getVisit(school.id))
  }

  const handleTier = (tier) => {
    store.saveTier(school.id, tier)
    if (tier !== 'low_interest') {
      store.saveVisit(school.id, { lowInterestReason: null, lowInterestComment: null })
    }
    setVisit(store.getVisit(school.id))
  }

  const handleLowInterestReason = (reason) => {
    store.saveVisit(school.id, { lowInterestReason: reason })
    setVisit(store.getVisit(school.id))
  }

  const handleLowInterestComment = (comment) => {
    store.saveVisit(school.id, { lowInterestComment: comment })
    setVisit(store.getVisit(school.id))
  }

  const totalScore = visit?.scores
    ? Object.values(visit.scores).reduce((sum, s) => sum + (s || 0), 0)
    : null

  const essayNotes = store.getEssayNotes(school.id)
  const essayCount = Object.values(essayNotes).filter(n => n && n.trim()).length

  const statSections = [
    {
      id: 'admissions', title: 'Admissions', items: [
        { label: 'Acceptance Rate', value: school.acceptanceRate },
        { label: 'SAT Range', value: school.satRange },
        { label: 'ACT Range', value: school.actRange },
      ]
    },
    {
      id: 'academics', title: 'Academics', items: [
        { label: 'Type', value: school.type },
        { label: 'Student:Faculty', value: school.studentFacultyRatio },
        { label: 'Grad Rate', value: school.gradRate },
        { label: 'Top Programs', value: school.topPrograms },
      ]
    },
    {
      id: 'campus', title: 'Campus Life', items: [
        { label: 'Setting', value: school.setting },
        { label: 'UG Enrollment', value: school.undergradEnrollment?.toLocaleString() },
        { label: 'Total Enrollment', value: school.totalEnrollment?.toLocaleString() },
        { label: 'Greek Life', value: school.greekLife },
        { label: 'Athletics', value: school.athletics },
        { label: 'Sports', value: school.sportsHighlights },
      ]
    },
    {
      id: 'cost', title: 'Cost & Aid', items: [
        { label: 'Total Cost', value: school.tuition },
        { label: 'Financial Aid', value: school.financialAid },
      ]
    },
    {
      id: 'culture', title: 'Culture & Extras', items: [
        { label: 'Known For', value: school.knownFor },
        { label: 'Notable Alumni', value: school.notableAlumni },
        { label: 'Traditions', value: school.traditions },
        { label: 'Entrepreneurship', value: school.entrepreneurship },
      ]
    },
  ]

  return (
    <>
      <div className="detail-hero" style={{ background: `linear-gradient(135deg, ${branding.color}, ${branding.color}dd)` }}>
        <div className="header-back">
          <button className="back-btn" style={{ color: 'white' }} onClick={() => nav('schools')}>← Back</button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '0 16px 16px' }}>
          {logoUrl && (
            <img
              src={logoUrl}
              alt={school.name}
              style={{ width: 56, height: 56, borderRadius: 12, background: 'white', padding: 4, objectFit: 'contain' }}
              onError={e => { e.target.style.display = 'none' }}
            />
          )}
          <div>
            <h1 style={{ color: 'white', margin: 0, fontSize: 22 }}>{school.name}</h1>
            <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13, marginTop: 2 }}>{school.location} &middot; {school.type}</div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="card">
        <div className="card-header">
          <div>
            <span className="badge badge-rank">#{school.rank || 'NR'}</span>
            {visit?.visited && <span className="badge badge-visited" style={{ marginLeft: 6 }}>Visited{visit.dateVisited ? ` ${visit.dateVisited}` : ''}</span>}
            {visit?.tourType && <span className="badge" style={{ marginLeft: 6, background: 'var(--gray-100)', color: 'var(--gray-600)' }}>{visit.tourType === 'official' ? 'Official Tour' : 'Self-Guided'}</span>}
          </div>
          {totalScore !== null && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: branding.color }}>{totalScore}</div>
              <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>/ 130</div>
            </div>
          )}
        </div>
        <div className="stats-grid">
          <div className="stat"><div className="stat-label">Accept Rate</div><div className="stat-value">{school.acceptanceRate}</div></div>
          <div className="stat"><div className="stat-label">SAT Range</div><div className="stat-value">{school.satRange}</div></div>
          <div className="stat"><div className="stat-label">Students</div><div className="stat-value">{school.undergradEnrollment?.toLocaleString() || '—'}</div></div>
          <div className="stat"><div className="stat-label">Cost</div><div className="stat-value">{school.tuition}</div></div>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {!visit?.visited && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-success" style={{ flex: 1 }} onClick={() => handleMarkVisited('official')}>
              ✓ Official Tour
            </button>
            <button className="btn btn-outline" style={{ flex: 1, borderColor: 'var(--green)', color: 'var(--green)' }} onClick={() => handleMarkVisited('self_guided')}>
              ✓ Self-Guided
            </button>
          </div>
        )}
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => nav('score', school)}>
            {visit?.scores ? '✏️ Edit Scores' : '📊 Visit Scorecard'}
          </button>
          <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => nav('essay', school)}>
            📝 Why This School {essayCount > 0 && `(${essayCount})`}
          </button>
        </div>
      </div>

      {/* Tour Type Toggle */}
      {visit?.visited && (
        <div className="tier-options">
          {['official', 'self_guided'].map(tt => (
            <button
              key={tt}
              className={`tier-option ${visit?.tourType === tt ? 'selected-tour' : ''}`}
              onClick={() => handleChangeTourType(tt)}
            >
              {tt === 'official' ? 'Official Tour' : 'Self-Guided'}
            </button>
          ))}
        </div>
      )}

      {/* Tier Selection */}
      {visit?.visited && (
        <>
          <div className="tier-options">
            {['reach', 'target', 'safety', 'low_interest'].map(tier => (
              <button
                key={tier}
                className={`tier-option ${visit?.tier === tier ? `selected-${tier}` : ''}`}
                onClick={() => handleTier(tier)}
              >
                {TIER_LABELS[tier]}
              </button>
            ))}
          </div>

          {visit?.tier === 'low_interest' && (
            <div className="low-interest-panel">
              <label className="form-label">Why low interest?</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                {['Too small', 'Too large', 'Too urban', 'Too rural', 'Bad vibe', 'Location', 'Wrong focus', 'Too expensive', 'Other'].map(reason => (
                  <button
                    key={reason}
                    className={`chip ${visit?.lowInterestReason === reason ? 'active' : ''}`}
                    onClick={() => handleLowInterestReason(reason)}
                  >
                    {reason}
                  </button>
                ))}
              </div>
              <textarea
                className="note-textarea"
                placeholder="Add a comment (optional)..."
                value={visit?.lowInterestComment || ''}
                onChange={e => handleLowInterestComment(e.target.value)}
                style={{ minHeight: 60 }}
              />
            </div>
          )}
        </>
      )}

      {/* Expandable Detail Sections */}
      {statSections.map(section => (
        <div key={section.id} className="detail-section">
          <button className="detail-toggle" onClick={() => toggleSection(section.id)}>
            {section.title}
            <span>{expandedSections[section.id] ? '▼' : '▶'}</span>
          </button>
          {expandedSections[section.id] && (
            <div className="detail-content">
              {section.items.map((item, i) => (
                item.value ? (
                  <div key={i} style={{ marginBottom: 8 }}>
                    <strong style={{ fontSize: 12, color: 'var(--gray-500)' }}>{item.label}</strong>
                    <div>{item.value}</div>
                  </div>
                ) : null
              ))}
            </div>
          )}
        </div>
      ))}

      {/* Delete custom school */}
      {school.isCustom && (
        <div style={{ padding: '24px 16px' }}>
          <button
            className="btn btn-danger"
            onClick={() => {
              if (window.confirm(`Delete ${school.name}? This will remove all scores and notes for this school.`)) {
                store.deleteCustomSchool(school.id)
                showToast(`${school.name} deleted`)
                nav('schools')
              }
            }}
          >
            Delete This School
          </button>
        </div>
      )}
    </>
  )
}

// ============================================================
// SCORING SCREEN (one criterion at a time)
// ============================================================
function ScoreScreen({ school, nav, showToast }) {
  const existing = store.getVisit(school.id)
  const tourType = existing?.tourType || 'official'
  const applicableCriteria = getCriteriaForTourType(tourType)
  const [step, setStep] = useState(0)
  const [scores, setScores] = useState(existing?.scores || {})
  const [notes, setNotes] = useState(existing?.scoreNotes || {})

  const criterion = applicableCriteria[step]
  const total = applicableCriteria.length

  const handleScore = (value) => {
    const updated = { ...scores, [criterion.id]: value }
    setScores(updated)
    store.saveVisit(school.id, { scores: updated, scoreNotes: notes })
  }

  const handleNote = (text) => {
    const updated = { ...notes, [criterion.id]: text }
    setNotes(updated)
    store.saveVisit(school.id, { scores, scoreNotes: updated })
  }

  const handleNext = () => {
    if (step < total - 1) {
      setStep(step + 1)
    } else {
      showToast('Scores saved!')
      nav('detail', school)
    }
  }

  const handleBack = () => {
    if (step > 0) setStep(step - 1)
    else nav('detail', school)
  }

  const currentScore = scores[criterion.id] || 5

  return (
    <>
      <div className="header">
        <div className="header-back">
          <button className="back-btn" onClick={handleBack}>← Back</button>
        </div>
        <h1>Score: <span className="header-link" onClick={() => nav('detail', school)}>{school.name}</span></h1>
      </div>

      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${((step + 1) / total) * 100}%` }} />
      </div>
      <div className="progress-text">{step + 1} of {total}</div>

      <div className="score-card">
        <div style={{ fontSize: 32, marginBottom: 8 }}>{criterion.icon}</div>
        <h4>{criterion.title}</h4>
        <div className="description">{criterion.description}</div>

        <div className="score-display">{currentScore}</div>

        <input
          type="range"
          className="score-slider"
          min="1"
          max="10"
          value={currentScore}
          onChange={e => handleScore(parseInt(e.target.value))}
        />
        <div className="score-labels">
          <span>1 — Not great</span>
          <span>10 — Amazing</span>
        </div>

        <div style={{ marginTop: 16 }}>
          <textarea
            className="note-textarea"
            placeholder="Quick note (optional)..."
            value={notes[criterion.id] || ''}
            onChange={e => handleNote(e.target.value)}
          />
        </div>
      </div>

      <div style={{ padding: '0 16px', display: 'flex', gap: 8 }}>
        {step > 0 && (
          <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setStep(step - 1)}>
            Previous
          </button>
        )}
        <button className="btn btn-primary" style={{ flex: 2 }} onClick={handleNext}>
          {step < total - 1 ? 'Next →' : 'Save Scores ✓'}
        </button>
      </div>

      {/* Score Summary at bottom */}
      <div style={{ padding: '16px', marginTop: 12 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {applicableCriteria.map((c, i) => (
            <div
              key={c.id}
              onClick={() => setStep(i)}
              title={c.title}
              style={{
                width: 44, height: 44, borderRadius: 10,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: 1, cursor: 'pointer',
                background: i === step ? 'var(--blue)' : scores[c.id] ? 'var(--blue-light)' : 'var(--gray-100)',
                color: i === step ? 'white' : scores[c.id] ? 'var(--blue)' : 'var(--gray-400)',
                border: i === step ? '2px solid var(--blue)' : '2px solid transparent',
              }}
            >
              <span style={{ fontSize: 16, lineHeight: 1 }}>{c.icon}</span>
              <span style={{ fontSize: 10, fontWeight: 700, lineHeight: 1 }}>{scores[c.id] || '—'}</span>
            </div>
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: 8, fontSize: 14, fontWeight: 700, color: 'var(--blue)' }}>
          Total: {applicableCriteria.reduce((sum, c) => sum + (scores[c.id] || 0), 0)} / {applicableCriteria.length * 10}
          {tourType === 'self_guided' && <span style={{ fontSize: 11, color: 'var(--gray-400)', marginLeft: 6 }}>(Self-Guided)</span>}
        </div>
      </div>
    </>
  )
}

// ============================================================
// ESSAY NOTES SCREEN (section by section)
// ============================================================
function EssayScreen({ school, nav, showToast }) {
  const [sectionIdx, setSectionIdx] = useState(0)
  const [questionIdx, setQuestionIdx] = useState(0)
  const [notes, setNotes] = useState(store.getEssayNotes(school.id))

  const section = ESSAY_SECTIONS[sectionIdx]
  const question = section.questions[questionIdx]
  const totalQuestions = ALL_ESSAY_QUESTIONS.length
  const answeredCount = Object.values(notes).filter(n => n && n.trim()).length

  // Flat question index for progress
  let flatIdx = 0
  for (let s = 0; s < sectionIdx; s++) flatIdx += ESSAY_SECTIONS[s].questions.length
  flatIdx += questionIdx

  const handleSave = (text) => {
    setNotes(prev => ({ ...prev, [question.id]: text }))
    store.saveEssayNote(school.id, question.id, text)
  }

  const handleNext = () => {
    if (questionIdx < section.questions.length - 1) {
      setQuestionIdx(questionIdx + 1)
    } else if (sectionIdx < ESSAY_SECTIONS.length - 1) {
      setSectionIdx(sectionIdx + 1)
      setQuestionIdx(0)
    } else {
      showToast('Essay notes saved!')
      nav('detail', school)
    }
  }

  const handlePrev = () => {
    if (questionIdx > 0) {
      setQuestionIdx(questionIdx - 1)
    } else if (sectionIdx > 0) {
      const prevSection = ESSAY_SECTIONS[sectionIdx - 1]
      setSectionIdx(sectionIdx - 1)
      setQuestionIdx(prevSection.questions.length - 1)
    } else {
      nav('detail', school)
    }
  }

  return (
    <>
      <div className="header">
        <div className="header-back">
          <button className="back-btn" onClick={() => { showToast('Notes saved!'); nav('detail', school) }}>← Save & Exit</button>
        </div>
        <h1>Essay Notes: <span className="header-link" onClick={() => { showToast('Notes saved!'); nav('detail', school) }}>{school.name}</span></h1>
      </div>

      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${((flatIdx + 1) / totalQuestions) * 100}%` }} />
      </div>
      <div className="progress-text">
        {section.icon} {section.title} &middot; Question {flatIdx + 1} of {totalQuestions} &middot; {answeredCount} answered
      </div>

      <div className="score-card">
        <h4>{question.prompt}</h4>
        <div style={{ marginTop: 12 }}>
          <textarea
            className="note-textarea"
            style={{ minHeight: 120 }}
            placeholder={question.placeholder}
            value={notes[question.id] || ''}
            onChange={e => handleSave(e.target.value)}
          />
        </div>
      </div>

      <div style={{ padding: '0 16px', display: 'flex', gap: 8 }}>
        <button className="btn btn-secondary" style={{ flex: 1 }} onClick={handlePrev}>
          ← Previous
        </button>
        <button className="btn btn-primary" style={{ flex: 2 }} onClick={handleNext}>
          {(sectionIdx === ESSAY_SECTIONS.length - 1 && questionIdx === section.questions.length - 1)
            ? 'Done ✓'
            : 'Next →'}
        </button>
      </div>

      {/* Section jump */}
      <div className="filter-bar" style={{ marginTop: 12 }}>
        {ESSAY_SECTIONS.map((s, i) => {
          const sectionNoteCount = s.questions.filter(q => notes[q.id]?.trim()).length
          return (
            <button
              key={s.id}
              className={`chip ${i === sectionIdx ? 'active' : ''}`}
              onClick={() => { setSectionIdx(i); setQuestionIdx(0) }}
            >
              {s.icon} {s.title} {sectionNoteCount > 0 && `(${sectionNoteCount})`}
            </button>
          )
        })}
      </div>
    </>
  )
}

// ============================================================
// RANKINGS SCREEN
// ============================================================
function RankingsScreen({ nav }) {
  const [sortBy, setSortBy] = useState('weighted') // 'weighted' or 'raw'
  const allRankings = store.getRankings()
  const visits = store.getVisits()
  const visitedCount = Object.values(visits).filter(v => v.visited).length

  const rankings = [...allRankings].sort((a, b) =>
    sortBy === 'weighted' ? b.weightedPct - a.weightedPct : b.rawPct - a.rawPct
  )

  if (rankings.length === 0) {
    return (
      <>
        <div className="header">
          <h1>Rankings</h1>
          <div className="subtitle">Score schools after visiting to see them here</div>
        </div>
        <div className="empty-state">
          <div className="icon">🏆</div>
          <h3>No scores yet</h3>
          <p>Visit and score schools to build your rankings. You've visited {visitedCount} school{visitedCount !== 1 ? 's' : ''} so far.</p>
          <button className="btn btn-primary btn-sm" onClick={() => nav('schools')}>Browse Schools</button>
        </div>
      </>
    )
  }

  return (
    <>
      <div className="header">
        <h1>Rankings</h1>
        <div className="subtitle">{rankings.length} school{rankings.length !== 1 ? 's' : ''} scored</div>
      </div>

      <div className="filter-bar">
        <button className={`chip ${sortBy === 'weighted' ? 'active' : ''}`} onClick={() => setSortBy('weighted')}>
          Weighted
        </button>
        <button className={`chip ${sortBy === 'raw' ? 'active' : ''}`} onClick={() => setSortBy('raw')}>
          Raw
        </button>
      </div>

      {rankings.map((r, i) => {
        const school = getSchoolById(r.schoolId)
        if (!school) return null
        const posClass = i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : 'other'
        const displayPct = sortBy === 'weighted' ? r.weightedPct : r.rawPct
        const otherPct = sortBy === 'weighted' ? r.rawPct : r.weightedPct
        return (
          <div key={r.schoolId} className="ranking-item" onClick={() => nav('detail', school)}>
            <div className={`ranking-position ${posClass}`}>{i + 1}</div>
            <div style={{ flex: 1 }}>
              <div className="school-name">{school.name}</div>
              <div className="school-location">
                {school.location}
                {r.tourType === 'self_guided' && <span style={{ color: 'var(--gray-400)', fontSize: 11 }}> (Self-Guided)</span>}
              </div>
              {r.tier && <span className={`badge badge-${r.tier}`} style={{ marginTop: 4 }}>{TIER_LABELS[r.tier] || r.tier}</span>}
              <div className="score-bar-bg">
                <div className="score-bar-fill" style={{ width: `${displayPct}%` }} />
              </div>
            </div>
            <div className="ranking-score">
              {displayPct}<span className="ranking-max">%</span>
              <div style={{ fontSize: 10, color: 'var(--gray-400)', marginTop: 2 }}>
                {sortBy === 'weighted' ? 'raw' : 'wtd'}: {otherPct}%
              </div>
            </div>
          </div>
        )
      })}
    </>
  )
}

// ============================================================
// MATRIX SCREEN (2x2: Tier vs Score)
// ============================================================
function MatrixScreen({ nav }) {
  const [hoveredSchool, setHoveredSchool] = useState(null)
  const visits = store.getVisits()
  const allSchools = getAllSchools()

  const weights = store.getWeightsMap()

  // Only show schools that have both a tier and scores
  const plotted = allSchools.map(school => {
    const visit = visits[school.id]
    if (!visit?.tier || !visit?.scores) return null
    const tourType = visit.tourType || 'official'
    const applicable = getCriteriaForTourType(tourType)
    const weightedSum = applicable.reduce((sum, c) => sum + (visit.scores[c.id] || 0) * (weights[c.id] || 1), 0)
    const weightedMax = applicable.reduce((sum, c) => sum + 10 * (weights[c.id] || 1), 0)
    const score = weightedMax > 0 ? Math.round((weightedSum / weightedMax) * 100) : 0
    return { school, tier: visit.tier, score }
  }).filter(Boolean)

  // Tier positions on X axis (0-3 mapped to percentage)
  const TIER_X = { reach: 0, target: 1, safety: 2, low_interest: 3 }
  const TIER_COLS = ['Reach', 'Target', 'Safety', 'Low Interest']

  const maxScore = 100
  const minScore = 0

  return (
    <>
      <div className="header">
        <h1>School Matrix</h1>
        <div className="subtitle">{plotted.length} school{plotted.length !== 1 ? 's' : ''} plotted</div>
      </div>

      {plotted.length === 0 ? (
        <div className="empty-state">
          <div className="icon">📊</div>
          <h3>No data yet</h3>
          <p>Score schools and set their tier (Reach/Target/Safety) to see them plotted here.</p>
          <button className="btn btn-primary btn-sm" onClick={() => nav('schools')}>Browse Schools</button>
        </div>
      ) : (
        <div className="matrix-container">
          {/* Y-axis label */}
          <div className="matrix-y-label">Weighted Score %</div>

          <div className="matrix-chart">
            {/* Y-axis ticks */}
            <div className="matrix-y-axis">
              {[100, 75, 50, 25, 0].map(v => (
                <span key={v} className="matrix-y-tick">{v}</span>
              ))}
            </div>

            {/* Plot area */}
            <div className="matrix-plot">
              {/* Grid lines */}
              <div className="matrix-gridlines">
                {[0, 1, 2].map(i => (
                  <div key={i} className="matrix-vline" style={{ left: `${((i + 1) / 4) * 100}%` }} />
                ))}
                {[0.25, 0.5, 0.75].map(f => (
                  <div key={f} className="matrix-hline" style={{ bottom: `${f * 100}%` }} />
                ))}
              </div>

              {/* Dots */}
              {plotted.map(({ school, tier, score }) => {
                const branding = getBranding(school.id)
                const col = TIER_X[tier]
                // Center within the column with small random offset to avoid overlap
                const xPct = ((col + 0.5) / 4) * 100
                const yPct = ((score - minScore) / (maxScore - minScore)) * 100
                const isHovered = hoveredSchool === school.id
                return (
                  <div
                    key={school.id}
                    className={`matrix-dot ${isHovered ? 'hovered' : ''}`}
                    style={{
                      left: `${xPct}%`,
                      bottom: `${yPct}%`,
                      background: branding.color,
                      transform: `translate(-50%, 50%) ${isHovered ? 'scale(1.4)' : ''}`,
                    }}
                    onMouseEnter={() => setHoveredSchool(school.id)}
                    onMouseLeave={() => setHoveredSchool(null)}
                    onTouchStart={() => setHoveredSchool(isHovered ? null : school.id)}
                    onClick={() => nav('detail', school)}
                  >
                    {isHovered && (
                      <div className="matrix-tooltip">
                        <strong>{school.name}</strong>
                        <span>{score}% weighted</span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* X-axis labels */}
          <div className="matrix-x-axis">
            {TIER_COLS.map(label => (
              <span key={label} className="matrix-x-label">{label}</span>
            ))}
          </div>
        </div>
      )}
    </>
  )
}

// ============================================================
// WEIGHTS / PRIORITIES SCREEN (drag-to-rank)
// ============================================================
function WeightsScreen({ nav, showToast }) {
  const [order, setOrder] = useState(store.getPriorityOrder())
  const [dragIdx, setDragIdx] = useState(null)
  const [touchStartY, setTouchStartY] = useState(null)
  const [touchIdx, setTouchIdx] = useState(null)

  const criteriaMap = {}
  SCORING_CRITERIA.forEach(c => { criteriaMap[c.id] = c })

  const moveItem = (fromIdx, toIdx) => {
    if (fromIdx === toIdx) return
    const updated = [...order]
    const [moved] = updated.splice(fromIdx, 1)
    updated.splice(toIdx, 0, moved)
    setOrder(updated)
    store.savePriorityOrder(updated)
  }

  // Desktop drag handlers
  const handleDragStart = (i) => (e) => {
    setDragIdx(i)
    e.dataTransfer.effectAllowed = 'move'
  }
  const handleDragOver = (i) => (e) => {
    e.preventDefault()
    if (dragIdx !== null && dragIdx !== i) {
      moveItem(dragIdx, i)
      setDragIdx(i)
    }
  }
  const handleDragEnd = () => setDragIdx(null)

  // Mobile: move up/down buttons
  const moveUp = (i) => { if (i > 0) moveItem(i, i - 1) }
  const moveDown = (i) => { if (i < order.length - 1) moveItem(i, i + 1) }

  return (
    <>
      <div className="header">
        <h1>Priority Rankings</h1>
        <div className="subtitle">Drag or use arrows to rank what matters most to Griffin. #1 = most important.</div>
      </div>

      <div style={{ padding: '8px 16px' }}>
        {order.map((id, i) => {
          const c = criteriaMap[id]
          if (!c) return null
          const weight = SCORING_CRITERIA.length - i
          return (
            <div
              key={id}
              className={`weight-item ${dragIdx === i ? 'dragging' : ''}`}
              draggable
              onDragStart={handleDragStart(i)}
              onDragOver={handleDragOver(i)}
              onDragEnd={handleDragEnd}
            >
              <div className="weight-rank">#{i + 1}</div>
              <span style={{ fontSize: 20 }}>{c.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{c.title}</div>
                <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>Weight: {weight}x</div>
              </div>
              <div className="weight-arrows">
                <button className="weight-arrow" onClick={() => moveUp(i)} disabled={i === 0}>▲</button>
                <button className="weight-arrow" onClick={() => moveDown(i)} disabled={i === order.length - 1}>▼</button>
              </div>
            </div>
          )
        })}
      </div>

      <div style={{ padding: '16px', textAlign: 'center' }}>
        <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>
          Rankings auto-save. #1 gets {SCORING_CRITERIA.length}x weight, #{SCORING_CRITERIA.length} gets 1x weight.
        </div>
      </div>
    </>
  )
}

// ============================================================
// ADD CUSTOM SCHOOL SCREEN
// ============================================================
function AddSchoolScreen({ nav, showToast }) {
  const [form, setForm] = useState({
    name: '', location: '', type: 'Private Research', setting: 'Suburban',
    rank: '', acceptanceRate: '', satRange: '', actRange: '',
    undergradEnrollment: '', totalEnrollment: '', studentFacultyRatio: '',
    gradRate: '', greekLife: '', athletics: '', tuition: '',
    knownFor: '', topPrograms: '',
  })

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }))

  const handleSubmit = () => {
    if (!form.name.trim()) { showToast('School name is required'); return }
    const school = store.addCustomSchool({
      ...form,
      undergradEnrollment: form.undergradEnrollment ? parseInt(form.undergradEnrollment) : null,
      totalEnrollment: form.totalEnrollment ? parseInt(form.totalEnrollment) : null,
      rank: form.rank ? parseInt(form.rank) : null,
    })
    showToast(`${form.name} added!`)
    nav('schools')
  }

  return (
    <>
      <div className="header">
        <div className="header-back">
          <button className="back-btn" onClick={() => nav('schools')}>← Cancel</button>
        </div>
        <h1>Add School</h1>
      </div>

      {[
        { field: 'name', label: 'School Name *', placeholder: 'e.g., University of Michigan' },
        { field: 'location', label: 'Location', placeholder: 'e.g., Ann Arbor, MI' },
        { field: 'acceptanceRate', label: 'Acceptance Rate', placeholder: 'e.g., 18%' },
        { field: 'satRange', label: 'SAT Mid-50%', placeholder: 'e.g., 1380-1520' },
        { field: 'rank', label: 'US News Rank', placeholder: 'e.g., 25' },
        { field: 'undergradEnrollment', label: 'UG Enrollment', placeholder: 'e.g., 32000' },
        { field: 'tuition', label: 'Total Cost', placeholder: 'e.g., $75,000' },
        { field: 'topPrograms', label: 'Top Programs', placeholder: 'e.g., Engineering, Business, CS' },
        { field: 'knownFor', label: 'Known For', placeholder: 'Brief description...' },
      ].map(({ field, label, placeholder }) => (
        <div key={field} className="form-group">
          <label className="form-label">{label}</label>
          <input
            className="form-input"
            placeholder={placeholder}
            value={form[field]}
            onChange={e => update(field, e.target.value)}
          />
        </div>
      ))}

      <div style={{ padding: '16px' }}>
        <button className="btn btn-primary" onClick={handleSubmit}>Add School</button>
      </div>
    </>
  )
}
