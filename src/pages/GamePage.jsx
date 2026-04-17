import { useState, useEffect, useRef } from 'react'
import { useApp } from '../context/AppContext'
import { getAllProfiles } from '../services/profiles'
import { createMatch, updateMatchScore, endMatch, updatePlayerStats } from '../services/matches'
import { supabase } from '../services/supabase'
import Avatar from '../components/ui/Avatar'

// ─── Lobby ────────────────────────────────────────────────────────────────────
function Lobby({ players, onStartTeamSelection }) {
  const { currentUser } = useApp()
  const [slots, setSlots] = useState([null, null, null, null])

  useEffect(() => {
    if (currentUser) {
      setSlots(prev => {
        if (prev.some(s => s?.id === currentUser.id)) return prev
        const idx = prev.findIndex(s => s === null)
        if (idx === -1) return prev
        const next = [...prev]
        next[idx] = currentUser
        return next
      })
    }
  }, [currentUser])

  function joinSlot(player) {
    if (!player) return
    if (slots.some(s => s?.id === player.id)) return
    const idx = slots.findIndex(s => s === null)
    if (idx === -1) return
    const next = [...slots]
    next[idx] = player
    setSlots(next)
  }

  function removeSlot(idx) {
    if (slots[idx]?.id === currentUser?.id) return
    const next = [...slots]
    next[idx] = null
    setSlots(next)
  }

  const filled = slots.filter(Boolean).length
  const canStart = filled === 4
  const available = players.filter(p => !slots.some(s => s?.id === p.id))

  return (
    <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ fontSize: 32 }}>GAME LOBBY</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Need 4 players to start</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div className="form-label">Player Slots ({filled}/4)</div>
        <div className="grid-2" style={{ gap: 10 }}>
          {slots.map((slot, i) => (
            <div key={i} className="card" style={{
              minHeight: 80, display: 'flex', alignItems: 'center', gap: 10,
              border: slot ? '2px solid var(--primary)' : '2px dashed var(--border)',
              background: slot ? '#FFF3EF' : 'white',
              cursor: slot && slot.id !== currentUser?.id ? 'pointer' : 'default'
            }}
              onClick={() => slot && slot.id !== currentUser?.id && removeSlot(i)}
            >
              {slot ? (
                <>
                  <Avatar emoji={slot.avatar} size="sm" />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{slot.name}</div>
                    {slot.id === currentUser?.id
                      ? <div style={{ fontSize: 10, color: 'var(--primary)' }}>YOU</div>
                      : <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>tap to remove</div>}
                  </div>
                </>
              ) : (
                <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Empty slot</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {available.length > 0 && !canStart && (
        <div>
          <div className="form-label" style={{ marginBottom: 8 }}>Add Players</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {available.map(p => (
              <button key={p.id} className="btn btn-ghost" onClick={() => joinSlot(p)}
                style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'flex-start' }}>
                <Avatar emoji={p.avatar} size="sm" />
                <span>{p.name}</span>
                <span style={{ marginLeft: 'auto', color: 'var(--primary)', fontWeight: 700 }}>+</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <button className="btn btn-primary btn-block btn-lg" disabled={!canStart}
        onClick={() => onStartTeamSelection(slots)}>
        {canStart ? '⚡ Select Teams' : `Waiting for ${4 - filled} more player${4 - filled !== 1 ? 's' : ''}...`}
      </button>
    </div>
  )
}

// ─── Team Selection ────────────────────────────────────────────────────────────
// FIX: Added click-to-swap + HTML5 drag-and-drop for player switching between teams.
// Tap a player to select (highlighted in yellow), then tap a player on the other team
// to swap them. Also supports drag-and-drop on desktop.
function TeamSelection({ players, onStartMatch, onBack }) {
  const [teamA, setTeamA] = useState([players[0], players[1]])
  const [teamB, setTeamB] = useState([players[2], players[3]])
  const [teamAName, setTeamAName] = useState('Team Alpha')
  const [teamBName, setTeamBName] = useState('Team Beta')
  const [starting, setStarting] = useState(false)
  const [selected, setSelected] = useState(null)  // { player, team: 'a'|'b' }
  const [dragOver, setDragOver] = useState(null)   // 'a' | 'b' | null
  const dragRef = useRef(null)

  // Tap a player to select; tap another on the opposing team to swap.
  function handlePlayerClick(player, team) {
    if (!selected) {
      setSelected({ player, team })
      return
    }
    if (selected.player.id === player.id) {
      setSelected(null) // deselect same player
      return
    }
    if (selected.team === team) {
      setSelected({ player, team }) // re-select within same team
      return
    }
    // Different team → swap
    const { player: from, team: fromTeam } = selected
    if (fromTeam === 'a') {
      setTeamA(prev => prev.map(p => p?.id === from.id ? player : p))
      setTeamB(prev => prev.map(p => p?.id === player.id ? from : p))
    } else {
      setTeamB(prev => prev.map(p => p?.id === from.id ? player : p))
      setTeamA(prev => prev.map(p => p?.id === player.id ? from : p))
    }
    setSelected(null)
  }

  // HTML5 drag-and-drop (desktop)
  function handleDragStart(player, team) {
    dragRef.current = { player, team }
  }

  function handleDropOnPlayer(targetPlayer, targetTeam) {
    setDragOver(null)
    if (!dragRef.current) return
    const { player: dragged, team: fromTeam } = dragRef.current
    dragRef.current = null
    if (dragged.id === targetPlayer.id || fromTeam === targetTeam) return

    if (fromTeam === 'a') {
      setTeamA(prev => prev.map(p => p?.id === dragged.id ? targetPlayer : p))
      setTeamB(prev => prev.map(p => p?.id === targetPlayer.id ? dragged : p))
    } else {
      setTeamB(prev => prev.map(p => p?.id === dragged.id ? targetPlayer : p))
      setTeamA(prev => prev.map(p => p?.id === targetPlayer.id ? dragged : p))
    }
  }

  async function handleStart() {
    setStarting(true)
    try {
      await onStartMatch({ teamA, teamB, teamAName, teamBName })
    } finally {
      setStarting(false)
    }
  }

  function PlayerChip({ player, team }) {
    const isSelected = selected?.player?.id === player?.id
    const isSwapTarget = selected && selected.team !== team

    if (!player) return null
    return (
      <div
        draggable
        onDragStart={() => handleDragStart(player, team)}
        onDragOver={e => { e.preventDefault(); setDragOver(team) }}
        onDrop={() => handleDropOnPlayer(player, team)}
        onDragEnd={() => setDragOver(null)}
        onClick={() => handlePlayerClick(player, team)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8, marginTop: 8,
          padding: '6px 10px', borderRadius: 8, cursor: 'pointer',
          border: isSelected
            ? '2px solid var(--accent)'
            : isSwapTarget ? '2px dashed var(--primary)' : '2px solid transparent',
          background: isSelected ? '#FFFDE7' : isSwapTarget ? '#FFF3EF' : 'transparent',
          transition: 'all 0.15s', userSelect: 'none',
        }}
      >
        <span style={{ fontSize: 14, opacity: 0.5, cursor: 'grab' }}>⠿</span>
        <Avatar emoji={player.avatar} size="sm" />
        <span style={{ fontSize: 13, fontWeight: 600 }}>{player.name}</span>
        {isSelected && <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--accent)', fontWeight: 700 }}>SELECTED</span>}
        {isSwapTarget && !isSelected && <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--primary)', fontWeight: 700 }}>TAP TO SWAP</span>}
      </div>
    )
  }

  return (
    <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button className="btn btn-ghost btn-sm" onClick={onBack}>← Back</button>
        <h2 style={{ fontSize: 26 }}>TEAM SELECTION</h2>
      </div>

      <div style={{ background: '#FFFDE7', border: '1px solid var(--accent)', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>
        💡 Tap a player to select, then tap a player on the other team to swap positions
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {/* Team A */}
        <div
          className="card"
          onDragOver={e => { e.preventDefault(); setDragOver('a') }}
          onDragLeave={() => setDragOver(null)}
          style={{
            border: dragOver === 'a' ? '2px dashed var(--primary)' : '2px solid var(--primary)',
            background: dragOver === 'a' ? '#FFE8DF' : '#FFF3EF',
            transition: 'background 0.15s'
          }}>
          <div style={{ marginBottom: 10 }}>
            <div className="form-label" style={{ marginBottom: 4 }}>Team A Name</div>
            <input className="form-input" value={teamAName} onChange={e => setTeamAName(e.target.value)}
              style={{ fontSize: 13, padding: '8px 10px' }} />
          </div>
          {teamA.map(p => p && <PlayerChip key={p.id} player={p} team="a" />)}
          <div style={{ marginTop: 10, padding: '6px', background: 'var(--primary)', color: 'white', borderRadius: 6, textAlign: 'center', fontSize: 11, fontWeight: 700 }}>
            TEAM A
          </div>
        </div>

        {/* Team B */}
        <div
          className="card"
          onDragOver={e => { e.preventDefault(); setDragOver('b') }}
          onDragLeave={() => setDragOver(null)}
          style={{
            border: dragOver === 'b' ? '2px dashed var(--secondary)' : '2px solid var(--secondary)',
            background: dragOver === 'b' ? '#D0E4F5' : '#E8F0F8',
            transition: 'background 0.15s'
          }}>
          <div style={{ marginBottom: 10 }}>
            <div className="form-label" style={{ marginBottom: 4 }}>Team B Name</div>
            <input className="form-input" value={teamBName} onChange={e => setTeamBName(e.target.value)}
              style={{ fontSize: 13, padding: '8px 10px' }} />
          </div>
          {teamB.map(p => p && <PlayerChip key={p.id} player={p} team="b" />)}
          <div style={{ marginTop: 10, padding: '6px', background: 'var(--secondary)', color: 'white', borderRadius: 6, textAlign: 'center', fontSize: 11, fontWeight: 700 }}>
            TEAM B
          </div>
        </div>
      </div>

      <button className="btn btn-primary btn-block btn-lg" onClick={handleStart} disabled={starting}>
        {starting ? 'Starting...' : '🏓 Start Match!'}
      </button>
    </div>
  )
}

// ─── Live Scoreboard ───────────────────────────────────────────────────────────
// FIX 1 (Voice): Score state is mirrored to refs. addPoint/undoPoint use refs for
// calculations so voice callbacks always read fresh values, not stale closures.
// Recognition runs in single-shot mode and auto-restarts after each utterance,
// guaranteeing a fresh closure on every call.
//
// FIX 2 (Team Names): Inline editing on the scoreboard. Click a team name to edit,
// press Enter or blur to save. Changes persist to Supabase immediately.
function LiveScoreboard({ match, onEndMatch }) {
  // ── Render state ──────────────────────────────────────────────────────────
  const [scoreA, setScoreA] = useState(match.team_a_score || 0)
  const [scoreB, setScoreB] = useState(match.team_b_score || 0)
  const [history, setHistory] = useState([])
  const [mode, setMode] = useState('spectator')
  const [listening, setListening] = useState(false)
  const [voiceStatus, setVoiceStatus] = useState('')
  const [winner, setWinner] = useState(null)
  const [saving, setSaving] = useState(false)
  const [liveTeamAName, setLiveTeamAName] = useState(match.team_a_name)
  const [liveTeamBName, setLiveTeamBName] = useState(match.team_b_name)
  const [editingTeam, setEditingTeam] = useState(null) // null | 'a' | 'b'

  // ── Refs (stay current across stale closures) ─────────────────────────────
  const scoreARef = useRef(match.team_a_score || 0)
  const scoreBRef = useRef(match.team_b_score || 0)
  const historyRef = useRef([])
  const teamANameRef = useRef(match.team_a_name)
  const teamBNameRef = useRef(match.team_b_name)
  const recognitionRef = useRef(null)
  const listeningRef = useRef(false)  // tracks intent to listen (survives restarts)

  // Keep name refs in sync with editable state
  useEffect(() => { teamANameRef.current = liveTeamAName }, [liveTeamAName])
  useEffect(() => { teamBNameRef.current = liveTeamBName }, [liveTeamBName])

  // Real-time Supabase subscription
  useEffect(() => {
    const channel = supabase
      .channel('match-' + match.id)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'matches', filter: `id=eq.${match.id}`
      }, payload => {
        scoreARef.current = payload.new.team_a_score
        scoreBRef.current = payload.new.team_b_score
        setScoreA(payload.new.team_a_score)
        setScoreB(payload.new.team_b_score)
        if (payload.new.status === 'completed') setWinner(payload.new.winner)
      })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [match.id])

  // ── Game rules ────────────────────────────────────────────────────────────
  const WINNING_SCORE = 21
  const SERVES_PER_ROTATION = 5
  const DEUCE_SCORE = 20

  useEffect(() => {
    const a = scoreARef.current
    const b = scoreBRef.current
    if ((a >= WINNING_SCORE || b >= WINNING_SCORE) && Math.abs(a - b) >= 2) {
      setWinner(a > b ? 'team_a' : 'team_b')
    }
  }, [scoreA, scoreB])

  // ── Scoring (uses refs so voice callbacks never go stale) ─────────────────
  async function addPoint(team) {
    const newA = team === 'a' ? scoreARef.current + 1 : scoreARef.current
    const newB = team === 'b' ? scoreBRef.current + 1 : scoreBRef.current

    const newHistory = [...historyRef.current, { a: scoreARef.current, b: scoreBRef.current }]
    historyRef.current = newHistory
    setHistory(newHistory)

    scoreARef.current = newA
    scoreBRef.current = newB
    setScoreA(newA)
    setScoreB(newB)

    try {
      await updateMatchScore(match.id, newA, newB)
      if (navigator.vibrate) navigator.vibrate(30)
    } catch {}
  }

  async function undoPoint() {
    if (historyRef.current.length === 0) return
    const last = historyRef.current[historyRef.current.length - 1]
    const newHistory = historyRef.current.slice(0, -1)
    historyRef.current = newHistory
    setHistory(newHistory)

    scoreARef.current = last.a
    scoreBRef.current = last.b
    setScoreA(last.a)
    setScoreB(last.b)

    try { await updateMatchScore(match.id, last.a, last.b) } catch {}
  }

  // ── Voice mode ────────────────────────────────────────────────────────────
  // Runs single-shot (continuous=false) and auto-restarts after each result.
  // This guarantees a fresh execution context for every utterance, and combined
  // with ref-based scores, completely eliminates the stale closure problem.
  function startVoiceSession() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) { setVoiceStatus('Voice not supported in this browser'); return }

    const rec = new SR()
    rec.continuous = false    // single-shot: one result then auto-ends
    rec.interimResults = false

    rec.onresult = e => {
      const t = e.results[0][0].transcript.toLowerCase()
      setVoiceStatus(`Heard: "${t}"`)

      if (t.includes(teamANameRef.current?.toLowerCase())) {
        addPoint('a')
        speak(`${scoreARef.current + 1} to ${scoreBRef.current}`)
      } else if (t.includes(teamBNameRef.current?.toLowerCase())) {
        addPoint('b')
        speak(`${scoreARef.current} to ${scoreBRef.current + 1}`)
      } else if (t.includes('undo')) {
        undoPoint()
        speak('Point undone')
      }
    }

    rec.onerror = e => {
      // Ignore no-speech and aborted (from stopVoice) — treat as silent gaps
      if (e.error !== 'no-speech' && e.error !== 'aborted') {
        setVoiceStatus(`Voice error: ${e.error}`)
      }
    }

    rec.onend = () => {
      // Auto-restart while listening intent is active
      if (listeningRef.current) {
        setTimeout(startVoiceSession, 150)
      } else {
        setListening(false)
      }
    }

    recognitionRef.current = rec
    try { rec.start() } catch {}
  }

  function startVoice() {
    listeningRef.current = true
    setListening(true)
    setVoiceStatus(`Listening… say "${liveTeamAName}" or "${liveTeamBName}"`)
    startVoiceSession()
  }

  function stopVoice() {
    listeningRef.current = false
    setListening(false)
    setVoiceStatus('')
    try { recognitionRef.current?.stop() } catch {}
  }

  // Stop voice if mode changes away from voice
  useEffect(() => {
    if (mode !== 'voice') stopVoice()
  }, [mode])

  function speak(text) {
    const u = new SpeechSynthesisUtterance(text)
    window.speechSynthesis.speak(u)
  }

  // ── Inline team name editing ───────────────────────────────────────────────
  async function saveTeamName(team, newName) {
    const trimmed = newName.trim() || (team === 'a' ? match.team_a_name : match.team_b_name)
    if (team === 'a') setLiveTeamAName(trimmed)
    else setLiveTeamBName(trimmed)
    setEditingTeam(null)
    try {
      await supabase
        .from('matches')
        .update(team === 'a' ? { team_a_name: trimmed } : { team_b_name: trimmed })
        .eq('id', match.id)
    } catch {}
  }

  function InlineTeamName({ team }) {
    const name = team === 'a' ? liveTeamAName : liveTeamBName
    const isEditing = editingTeam === team
    const color = team === 'a' ? '#FF6B35' : '#4A9EFF'
    const [draft, setDraft] = useState(name)

    if (isEditing) {
      return (
        <input
          autoFocus
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onBlur={() => saveTeamName(team, draft)}
          onKeyDown={e => {
            if (e.key === 'Enter') saveTeamName(team, draft)
            if (e.key === 'Escape') setEditingTeam(null)
          }}
          style={{
            background: 'rgba(255,255,255,0.15)', border: 'none',
            borderBottom: `2px solid ${color}`, color: 'white',
            fontFamily: 'var(--font-heading)', fontSize: 20,
            textAlign: 'center', outline: 'none', width: '100%',
            padding: '2px 4px', borderRadius: '4px 4px 0 0'
          }}
        />
      )
    }
    return (
      <div
        onClick={() => { setEditingTeam(team) }}
        style={{
          fontFamily: 'var(--font-heading)', fontSize: 20, marginTop: 6,
          opacity: 0.9, cursor: 'pointer', display: 'flex', alignItems: 'center',
          justifyContent: 'center', gap: 4
        }}
        title="Click to edit team name"
      >
        {name}
        <span style={{ fontSize: 11, opacity: 0.5 }}>✏️</span>
      </div>
    )
  }

  // ── End match ─────────────────────────────────────────────────────────────
  async function handleEndMatch() {
    setSaving(true)
    try {
      const w = scoreARef.current > scoreBRef.current ? 'team_a' : 'team_b'
      await endMatch(match.id, scoreARef.current, scoreBRef.current, w)
      const isTeamAWin = w === 'team_a'
      await updatePlayerStats(
        isTeamAWin ? match.team_a_player1_id : match.team_b_player1_id,
        isTeamAWin ? match.team_a_player2_id : match.team_b_player2_id,
        isTeamAWin ? match.team_b_player1_id : match.team_a_player1_id,
        isTeamAWin ? match.team_b_player2_id : match.team_a_player2_id,
      )
      onEndMatch()
    } catch {
      alert('Failed to save match result.')
    } finally {
      setSaving(false)
    }
  }

  // ── Derived display values ─────────────────────────────────────────────────
  const totalPoints = scoreA + scoreB
  const isDeuce = scoreA >= DEUCE_SCORE && scoreB >= DEUCE_SCORE
  const serving = isDeuce
    ? (totalPoints % 2 === 0 ? 'team_a' : 'team_b')
    : (Math.floor(totalPoints / SERVES_PER_ROTATION) % 2 === 0 ? 'team_a' : 'team_b')

  // ── Render ────────────────────────────────────────────────────────────────
  const modeBtns = [
    { id: 'spectator', label: 'Spectator', icon: '👥' },
    { id: 'voice',     label: 'Voice',     icon: '🎤' },
    { id: 'quicktap',  label: 'Quick Tap', icon: '⚡' },
  ]

  return (
    <div style={{ background: '#1C1C1E', minHeight: '100%', display: 'flex', flexDirection: 'column', gap: 0 }}>

      {/* ── Winner banner ─────────────────────────────────────────────────── */}
      {winner && (
        <div style={{
          background: 'linear-gradient(135deg, #FF6B35, #FFD23F)',
          color: 'white', padding: '24px 20px', textAlign: 'center'
        }}>
          <div style={{ fontSize: 52 }}>🏆</div>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: '2.8rem', letterSpacing: 2, marginTop: 8 }}>
            {winner === 'team_a' ? liveTeamAName : liveTeamBName} WINS!
          </div>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.8rem', opacity: 0.9, marginTop: 4 }}>
            {scoreA} — {scoreB}
          </div>
          <button onClick={handleEndMatch} disabled={saving} style={{
            marginTop: 20, width: '100%', padding: '14px', borderRadius: 12,
            background: 'white', color: '#FF6B35', border: 'none',
            fontWeight: 800, fontSize: 16, cursor: 'pointer'
          }}>
            {saving ? 'Saving...' : '✅ Save & Finish'}
          </button>
        </div>
      )}

      {/* ── LIVE MATCH title bar ───────────────────────────────────────────── */}
      <div style={{
        background: '#2A2A2A', padding: '14px 20px', textAlign: 'center',
        borderBottom: '1px solid #3A3A3A'
      }}>
        <div style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', letterSpacing: 3, color: 'white' }}>
          LIVE MATCH
        </div>
        {isDeuce && (
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 2, color: '#FFD23F', marginTop: 2 }}>
            ⚡ DEUCE — WIN BY 2
          </div>
        )}
      </div>

      {/* ── Score display ─────────────────────────────────────────────────── */}
      <div style={{ background: '#2A2A2A', padding: '24px 20px 20px', textAlign: 'center' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 4 }}>

          {/* Team A */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <InlineTeamName team="a" />
            <div style={{
              fontFamily: 'var(--font-heading)', fontSize: '9rem', lineHeight: 1,
              color: '#FF6B35', textShadow: '0 4px 24px rgba(255,107,53,0.6)', marginTop: 4
            }}>
              {scoreA}
            </div>
            <div style={{
              fontSize: 10, fontWeight: 800, letterSpacing: 1, marginTop: 8, height: 16,
              color: serving === 'team_a' ? '#FF6B35' : 'transparent'
            }}>
              🏓 SERVING
            </div>
          </div>

          {/* Separator */}
          <div style={{
            fontFamily: 'var(--font-heading)', fontSize: '4rem', color: '#555',
            lineHeight: 1, paddingBottom: 20
          }}>:</div>

          {/* Team B */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <InlineTeamName team="b" />
            <div style={{
              fontFamily: 'var(--font-heading)', fontSize: '9rem', lineHeight: 1,
              color: '#4A9EFF', textShadow: '0 4px 24px rgba(74,158,255,0.6)', marginTop: 4
            }}>
              {scoreB}
            </div>
            <div style={{
              fontSize: 10, fontWeight: 800, letterSpacing: 1, marginTop: 8, height: 16,
              color: serving === 'team_b' ? '#4A9EFF' : 'transparent'
            }}>
              🏓 SERVING
            </div>
          </div>
        </div>

        <div style={{ fontSize: 11, color: '#555', marginTop: 12, fontWeight: 600, letterSpacing: 1 }}>
          FIRST TO 21 · SERVE EVERY 5 PTS · TAP NAME TO EDIT
        </div>
      </div>

      {/* ── Mode pills ────────────────────────────────────────────────────── */}
      <div style={{ background: '#1C1C1E', padding: '14px 16px', display: 'flex', gap: 8 }}>
        {modeBtns.map(m => (
          <button key={m.id} onClick={() => setMode(m.id)} style={{
            flex: 1, padding: '9px 4px', borderRadius: 25, border: 'none', cursor: 'pointer',
            background: mode === m.id ? '#FFD23F' : '#3A3A3A',
            color: mode === m.id ? '#1A1A1A' : '#888',
            fontWeight: 700, fontSize: 11, letterSpacing: 0.3,
            transition: 'background 0.18s, color 0.18s',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4
          }}>
            <span>{m.icon}</span>
            <span>{m.label}</span>
          </button>
        ))}
      </div>

      {/* ── Score controls ────────────────────────────────────────────────── */}
      <div style={{ background: '#1C1C1E', padding: '0 16px 12px', display: 'flex', flexDirection: 'column', gap: 10 }}>

        {(mode === 'spectator' || mode === 'quicktap') && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <button onClick={() => addPoint('a')}
                onPointerDown={e => e.currentTarget.style.transform = 'scale(0.96)'}
                onPointerUp={e => e.currentTarget.style.transform = 'scale(1)'}
                style={{
                  padding: mode === 'quicktap' ? '2rem 1rem' : '1.5rem 1rem',
                  background: '#FF6B35', color: 'white', border: 'none', borderRadius: 12,
                  fontFamily: 'var(--font-heading)', fontSize: '1.1rem', letterSpacing: 1,
                  cursor: 'pointer', transition: 'transform 0.1s',
                  boxShadow: '0 4px 16px rgba(255,107,53,0.35)'
                }}>
                + {liveTeamAName}
              </button>
              <button onClick={() => addPoint('b')}
                onPointerDown={e => e.currentTarget.style.transform = 'scale(0.96)'}
                onPointerUp={e => e.currentTarget.style.transform = 'scale(1)'}
                style={{
                  padding: mode === 'quicktap' ? '2rem 1rem' : '1.5rem 1rem',
                  background: '#4A9EFF', color: 'white', border: 'none', borderRadius: 12,
                  fontFamily: 'var(--font-heading)', fontSize: '1.1rem', letterSpacing: 1,
                  cursor: 'pointer', transition: 'transform 0.1s',
                  boxShadow: '0 4px 16px rgba(74,158,255,0.35)'
                }}>
                + {liveTeamBName}
              </button>
            </div>
            <button onClick={undoPoint} disabled={history.length === 0} style={{
              width: '100%', padding: '13px', background: '#3A3A3A',
              color: history.length === 0 ? '#555' : '#CCC',
              border: 'none', borderRadius: 12, fontWeight: 700, fontSize: 14,
              cursor: history.length === 0 ? 'not-allowed' : 'pointer',
              transition: 'opacity 0.15s'
            }}>
              ↶ Undo Last Point
            </button>
          </>
        )}

        {mode === 'voice' && (
          <>
            <div style={{
              background: '#2A2A2A', borderRadius: 12, padding: '16px',
              textAlign: 'center', border: `1px solid ${listening ? '#27AE60' : '#3A3A3A'}`
            }}>
              <p style={{ fontSize: 13, color: '#888', marginBottom: 12 }}>
                Say <strong style={{ color: '#FF6B35' }}>"{liveTeamAName}"</strong> or{' '}
                <strong style={{ color: '#4A9EFF' }}>"{liveTeamBName}"</strong> or{' '}
                <strong style={{ color: '#CCC' }}>"undo"</strong>
              </p>
              {voiceStatus && (
                <div style={{
                  background: listening ? 'rgba(39,174,96,0.15)' : 'rgba(255,255,255,0.05)',
                  borderRadius: 8, padding: '8px 12px', fontSize: 13,
                  color: listening ? '#27AE60' : '#888', marginBottom: 12
                }}>
                  {voiceStatus}
                </div>
              )}
              <button onClick={listening ? stopVoice : startVoice} style={{
                width: '100%', padding: '14px', borderRadius: 12, border: 'none',
                background: listening ? '#E74C3C' : '#FF6B35', color: 'white',
                fontWeight: 800, fontSize: 15, cursor: 'pointer'
              }}>
                {listening ? '🔴 Stop Listening' : '🎤 Start Listening'}
              </button>
            </div>
            <button onClick={undoPoint} disabled={history.length === 0} style={{
              width: '100%', padding: '13px', background: '#3A3A3A',
              color: history.length === 0 ? '#555' : '#CCC',
              border: 'none', borderRadius: 12, fontWeight: 700, fontSize: 14,
              cursor: history.length === 0 ? 'not-allowed' : 'pointer'
            }}>
              ↶ Undo Last Point
            </button>
          </>
        )}

        {!winner && (
          <button onClick={handleEndMatch} disabled={saving} style={{
            width: '100%', padding: '12px', background: 'transparent',
            border: '1.5px solid #E74C3C', color: '#E74C3C',
            borderRadius: 8, fontWeight: 700, fontSize: 13,
            cursor: saving ? 'not-allowed' : 'pointer', marginTop: 4,
            opacity: saving ? 0.6 : 1
          }}>
            {saving ? 'Saving...' : '🏁 End Match'}
          </button>
        )}
      </div>
    </div>
  )
}

// ─── GamePage ──────────────────────────────────────────────────────────────────
export default function GamePage() {
  const { currentUser, activeMatch, startMatch, clearMatch } = useApp()
  const [stage, setStage] = useState(activeMatch ? 'scoring' : 'lobby')
  const [players, setPlayers] = useState([])
  const [lobbyPlayers, setLobbyPlayers] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAllProfiles().then(setPlayers).finally(() => setLoading(false))
  }, [])

  async function handleStartMatch({ teamA, teamB, teamAName, teamBName }) {
    const match = await createMatch({
      team_a_name: teamAName,
      team_a_player1_id: teamA[0]?.id,
      team_a_player2_id: teamA[1]?.id,
      team_b_name: teamBName,
      team_b_player1_id: teamB[0]?.id,
      team_b_player2_id: teamB[1]?.id,
    })
    startMatch(match)
    setStage('scoring')
  }

  function handleEndMatch() {
    clearMatch()
    setStage('lobby')
    setLobbyPlayers(null)
  }

  if (loading) return <div className="loading">Loading...</div>

  if (!currentUser) {
    return (
      <div className="page">
        <div className="empty-state">
          <div className="empty-icon">🏓</div>
          <p>Create your profile first to start a game!</p>
        </div>
      </div>
    )
  }

  if (stage === 'lobby') {
    return <Lobby players={players} onStartTeamSelection={slots => { setLobbyPlayers(slots); setStage('teams') }} />
  }
  if (stage === 'teams') {
    return <TeamSelection players={lobbyPlayers} onStartMatch={handleStartMatch} onBack={() => setStage('lobby')} />
  }
  if (stage === 'scoring' && activeMatch) {
    return <LiveScoreboard match={activeMatch} onEndMatch={handleEndMatch} />
  }
  return null
}
