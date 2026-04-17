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
                    {slot.id === currentUser?.id && <div style={{ fontSize: 10, color: 'var(--primary)' }}>YOU</div>}
                    {slot.id !== currentUser?.id && <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>tap to remove</div>}
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
function TeamSelection({ players, onStartMatch, onBack }) {
  const [teamA, setTeamA] = useState([players[0], players[1]])
  const [teamB, setTeamB] = useState([players[2], players[3]])
  const [teamAName, setTeamAName] = useState("Team Alpha")
  const [teamBName, setTeamBName] = useState("Team Beta")
  const [starting, setStarting] = useState(false)

  function swap(playerA, playerB) {
    setTeamA(prev => {
      const next = [...prev]
      const idxA = next.indexOf(playerA)
      if (idxA !== -1) { next[idxA] = playerB; setTeamB(pb => { const nb = [...pb]; nb[nb.indexOf(playerB)] = playerA; return nb }); return next }
      return prev
    })
  }

  async function handleStart() {
    setStarting(true)
    try {
      await onStartMatch({ teamA, teamB, teamAName, teamBName })
    } finally {
      setStarting(false)
    }
  }

  return (
    <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button className="btn btn-ghost btn-sm" onClick={onBack}>← Back</button>
        <h2 style={{ fontSize: 26 }}>TEAM SELECTION</h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {/* Team A */}
        <div className="card" style={{ border: '2px solid var(--primary)', background: '#FFF3EF' }}>
          <div style={{ marginBottom: 10 }}>
            <div className="form-label" style={{ marginBottom: 4 }}>Team A Name</div>
            <input className="form-input" value={teamAName} onChange={e => setTeamAName(e.target.value)}
              style={{ fontSize: 13, padding: '8px 10px' }} />
          </div>
          {teamA.map(p => p && (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
              <Avatar emoji={p.avatar} size="sm" />
              <span style={{ fontSize: 13, fontWeight: 600 }}>{p.name}</span>
            </div>
          ))}
          <div style={{ marginTop: 10, padding: '6px', background: 'var(--primary)', color: 'white', borderRadius: 6, textAlign: 'center', fontSize: 11, fontWeight: 700 }}>
            TEAM A
          </div>
        </div>

        {/* Team B */}
        <div className="card" style={{ border: '2px solid var(--secondary)', background: '#E8F0F8' }}>
          <div style={{ marginBottom: 10 }}>
            <div className="form-label" style={{ marginBottom: 4 }}>Team B Name</div>
            <input className="form-input" value={teamBName} onChange={e => setTeamBName(e.target.value)}
              style={{ fontSize: 13, padding: '8px 10px' }} />
          </div>
          {teamB.map(p => p && (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
              <Avatar emoji={p.avatar} size="sm" />
              <span style={{ fontSize: 13, fontWeight: 600 }}>{p.name}</span>
            </div>
          ))}
          <div style={{ marginTop: 10, padding: '6px', background: 'var(--secondary)', color: 'white', borderRadius: 6, textAlign: 'center', fontSize: 11, fontWeight: 700 }}>
            TEAM B
          </div>
        </div>
      </div>

      <div className="card" style={{ background: '#FFFDE7', border: '1px solid #FFD23F' }}>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center' }}>
          💡 Drag players between teams or tap to swap — coming soon
        </p>
      </div>

      <button className="btn btn-primary btn-block btn-lg" onClick={handleStart} disabled={starting}>
        {starting ? 'Starting...' : '🏓 Start Match!'}
      </button>
    </div>
  )
}

// ─── Live Scoreboard ───────────────────────────────────────────────────────────
function LiveScoreboard({ match, onEndMatch }) {
  const [scoreA, setScoreA] = useState(match.team_a_score || 0)
  const [scoreB, setScoreB] = useState(match.team_b_score || 0)
  const [history, setHistory] = useState([])
  const [mode, setMode] = useState('spectator') // spectator | voice | quicktap
  const [listening, setListening] = useState(false)
  const [voiceStatus, setVoiceStatus] = useState('')
  const [winner, setWinner] = useState(null)
  const [saving, setSaving] = useState(false)
  const recognitionRef = useRef(null)

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('match-' + match.id)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'matches', filter: `id=eq.${match.id}`
      }, payload => {
        setScoreA(payload.new.team_a_score)
        setScoreB(payload.new.team_b_score)
        if (payload.new.status === 'completed') setWinner(payload.new.winner)
      })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [match.id])

  useEffect(() => {
    checkWinner(scoreA, scoreB)
  }, [scoreA, scoreB])

  function checkWinner(a, b) {
    if ((a >= 11 || b >= 11) && Math.abs(a - b) >= 2) {
      setWinner(a > b ? 'team_a' : 'team_b')
    }
  }

  async function addPoint(team) {
    const newA = team === 'a' ? scoreA + 1 : scoreA
    const newB = team === 'b' ? scoreB + 1 : scoreB
    setHistory(h => [...h, { a: scoreA, b: scoreB }])
    setScoreA(newA); setScoreB(newB)
    try {
      await updateMatchScore(match.id, newA, newB)
      if (navigator.vibrate) navigator.vibrate(30)
    } catch {}
  }

  async function undoPoint() {
    if (history.length === 0) return
    const last = history[history.length - 1]
    setHistory(h => h.slice(0, -1))
    setScoreA(last.a); setScoreB(last.b)
    try { await updateMatchScore(match.id, last.a, last.b) } catch {}
  }

  function startVoice() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) { setVoiceStatus('Voice not supported in this browser'); return }
    const rec = new SR()
    rec.continuous = true; rec.interimResults = false
    rec.onresult = e => {
      const t = e.results[e.results.length - 1][0].transcript.toLowerCase()
      setVoiceStatus(`Heard: "${t}"`)
      if (t.includes(match.team_a_name?.toLowerCase())) {
        addPoint('a')
        speak(`${scoreA + 1} to ${scoreB}`)
      } else if (t.includes(match.team_b_name?.toLowerCase())) {
        addPoint('b')
        speak(`${scoreA} to ${scoreB + 1}`)
      } else if (t.includes('undo')) {
        undoPoint()
        speak('Point undone')
      }
    }
    rec.onerror = () => { setListening(false); setVoiceStatus('Voice error. Try again.') }
    rec.onend = () => setListening(false)
    recognitionRef.current = rec
    rec.start()
    setListening(true)
    setVoiceStatus('Listening... say a team name')
  }

  function stopVoice() {
    recognitionRef.current?.stop()
    setListening(false)
    setVoiceStatus('')
  }

  function speak(text) {
    const u = new SpeechSynthesisUtterance(text)
    window.speechSynthesis.speak(u)
  }

  async function handleEndMatch() {
    setSaving(true)
    try {
      const w = scoreA > scoreB ? 'team_a' : 'team_b'
      await endMatch(match.id, scoreA, scoreB, w)
      const isTeamAWin = w === 'team_a'
      await updatePlayerStats(
        isTeamAWin ? match.team_a_player1_id : match.team_b_player1_id,
        isTeamAWin ? match.team_a_player2_id : match.team_b_player2_id,
        isTeamAWin ? match.team_b_player1_id : match.team_a_player1_id,
        isTeamAWin ? match.team_b_player2_id : match.team_a_player2_id,
      )
      onEndMatch()
    } catch (err) {
      alert('Failed to save match result.')
    } finally {
      setSaving(false)
    }
  }

  const serving = (scoreA + scoreB) % 4 < 2 ? 'team_a' : 'team_b'

  return (
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>

      {winner && (
        <div style={{
          background: 'linear-gradient(135deg, var(--primary), var(--accent))',
          color: 'white', borderRadius: 16, padding: '20px', textAlign: 'center'
        }}>
          <div style={{ fontSize: 48 }}>🏆</div>
          <h2 style={{ fontSize: 36 }}>{winner === 'team_a' ? match.team_a_name : match.team_b_name} WINS!</h2>
          <p style={{ fontSize: 24, fontFamily: 'var(--font-heading)' }}>{scoreA} - {scoreB}</p>
          <button className="btn btn-block" onClick={handleEndMatch} disabled={saving}
            style={{ marginTop: 16, background: 'white', color: 'var(--primary)', fontWeight: 700 }}>
            {saving ? 'Saving...' : '✅ Save & Finish'}
          </button>
        </div>
      )}

      {/* Scoreboard */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, #1A1A2E 0%, #004E89 100%)',
        color: 'white', textAlign: 'center', padding: '24px 16px'
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 8 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1, opacity: 0.7, marginBottom: 4 }}>
              {serving === 'team_a' ? '🏓 SERVING' : ''}
            </div>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 96, lineHeight: 1, color: '#FF6B35' }}>
              {scoreA}
            </div>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 18, marginTop: 4 }}>{match.team_a_name}</div>
          </div>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 36, opacity: 0.4 }}>VS</div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1, opacity: 0.7, marginBottom: 4 }}>
              {serving === 'team_b' ? '🏓 SERVING' : ''}
            </div>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 96, lineHeight: 1, color: '#FFD23F' }}>
              {scoreB}
            </div>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 18, marginTop: 4 }}>{match.team_b_name}</div>
          </div>
        </div>
      </div>

      {/* Mode selector */}
      <div style={{ display: 'flex', gap: 6, background: 'var(--bg)', borderRadius: 10, padding: 4 }}>
        {[
          { id: 'spectator', label: '👥 Spectator' },
          { id: 'voice', label: '🔊 Voice' },
          { id: 'quicktap', label: '⚡ Quick Tap' },
        ].map(m => (
          <button key={m.id} onClick={() => setMode(m.id)} style={{
            flex: 1, padding: '8px 4px', borderRadius: 8, border: 'none', cursor: 'pointer',
            background: mode === m.id ? 'white' : 'transparent',
            color: mode === m.id ? 'var(--primary)' : 'var(--text-muted)',
            fontWeight: 700, fontSize: 12,
            boxShadow: mode === m.id ? 'var(--shadow-sm)' : 'none',
            transition: 'all 0.2s'
          }}>
            {m.label}
          </button>
        ))}
      </div>

      {/* Score controls */}
      {mode === 'spectator' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div className="grid-2" style={{ gap: 10 }}>
            <button className="btn btn-primary btn-lg" onClick={() => addPoint('a')} style={{ fontSize: 13 }}>
              +1 {match.team_a_name}
            </button>
            <button className="btn btn-secondary btn-lg" onClick={() => addPoint('b')} style={{ fontSize: 13 }}>
              +1 {match.team_b_name}
            </button>
          </div>
          <button className="btn btn-ghost" onClick={undoPoint} disabled={history.length === 0}>
            ↩ Undo Last Point
          </button>
        </div>
      )}

      {mode === 'quicktap' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button onClick={() => addPoint('a')} style={{
            height: 100, background: 'var(--primary)', color: 'white', border: 'none',
            borderRadius: 16, fontSize: 20, fontWeight: 800, cursor: 'pointer',
            fontFamily: 'var(--font-heading)', letterSpacing: 1,
            boxShadow: '0 6px 20px rgba(255,107,53,0.4)', transition: 'transform 0.1s'
          }}
            onPointerDown={e => e.currentTarget.style.transform = 'scale(0.96)'}
            onPointerUp={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            ➕ {match.team_a_name} POINT
          </button>
          <button onClick={() => addPoint('b')} style={{
            height: 100, background: 'var(--secondary)', color: 'white', border: 'none',
            borderRadius: 16, fontSize: 20, fontWeight: 800, cursor: 'pointer',
            fontFamily: 'var(--font-heading)', letterSpacing: 1,
            boxShadow: '0 6px 20px rgba(0,78,137,0.4)', transition: 'transform 0.1s'
          }}
            onPointerDown={e => e.currentTarget.style.transform = 'scale(0.96)'}
            onPointerUp={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            ➕ {match.team_b_name} POINT
          </button>
          <button className="btn btn-ghost" onClick={undoPoint} disabled={history.length === 0}>
            ↩ Undo
          </button>
        </div>
      )}

      {mode === 'voice' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
          <div className="card" style={{ textAlign: 'center', width: '100%' }}>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
              Say "<strong>{match.team_a_name}</strong>" or "<strong>{match.team_b_name}</strong>" or "undo"
            </p>
            {voiceStatus && (
              <div style={{
                background: listening ? '#E8F5E9' : 'var(--bg)', borderRadius: 8, padding: '8px 12px',
                fontSize: 13, color: listening ? 'var(--success)' : 'var(--text-muted)', marginBottom: 12
              }}>
                {voiceStatus}
              </div>
            )}
            <button className="btn btn-block btn-lg" onClick={listening ? stopVoice : startVoice}
              style={{ background: listening ? 'var(--danger)' : 'var(--primary)', color: 'white' }}>
              {listening ? '🔴 Stop Listening' : '🎤 Start Listening'}
            </button>
          </div>
          <button className="btn btn-ghost" onClick={undoPoint} disabled={history.length === 0}>
            ↩ Undo Last Point
          </button>
        </div>
      )}

      {!winner && (
        <button className="btn btn-danger btn-block btn-sm" onClick={handleEndMatch} disabled={saving}>
          {saving ? 'Saving...' : '🏁 End Match'}
        </button>
      )}
    </div>
  )
}

// ─── GamePage ──────────────────────────────────────────────────────────────────
export default function GamePage() {
  const { currentUser, activeMatch, startMatch, clearMatch } = useApp()
  const [stage, setStage] = useState(activeMatch ? 'scoring' : 'lobby') // lobby | teams | scoring
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
