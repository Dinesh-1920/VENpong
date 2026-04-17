import { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import { getPlayerMatches } from '../services/matches'
import { getAllProfiles } from '../services/profiles'

function StatCard({ icon, label, value, color = 'var(--primary)' }) {
  return (
    <div className="card" style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 28 }}>{icon}</div>
      <div style={{ fontFamily: 'var(--font-heading)', fontSize: 36, color, marginTop: 4 }}>{value}</div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginTop: 2 }}>{label}</div>
    </div>
  )
}

export default function StatsPage() {
  const { currentUser } = useApp()
  const [matches, setMatches] = useState([])
  const [allPlayers, setAllPlayers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (currentUser) {
      Promise.all([
        getPlayerMatches(currentUser.id),
        getAllProfiles()
      ]).then(([m, p]) => { setMatches(m); setAllPlayers(p) })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [currentUser])

  if (!currentUser) {
    return (
      <div className="page">
        <div className="empty-state">
          <div className="empty-icon">📊</div>
          <p>Create your profile to see your stats!</p>
        </div>
      </div>
    )
  }

  if (loading) return <div className="loading">Loading stats...</div>

  const total = currentUser.total_wins + currentUser.total_losses
  const winRate = total > 0 ? Math.round((currentUser.total_wins / total) * 100) : 0

  // Calculate best partner
  const partnerWins = {}
  matches.forEach(m => {
    const isTeamA = m.team_a_player1_id === currentUser.id || m.team_a_player2_id === currentUser.id
    const won = (isTeamA && m.winner === 'team_a') || (!isTeamA && m.winner === 'team_b')
    if (!won) return
    const partner = isTeamA
      ? (m.team_a_player1_id === currentUser.id ? m.team_a_player2_id : m.team_a_player1_id)
      : (m.team_b_player1_id === currentUser.id ? m.team_b_player2_id : m.team_b_player1_id)
    if (partner) partnerWins[partner] = (partnerWins[partner] || 0) + 1
  })

  const bestPartnerId = Object.entries(partnerWins).sort((a, b) => b[1] - a[1])[0]?.[0]
  const bestPartner = allPlayers.find(p => p.id === bestPartnerId)

  // Head-to-head
  const h2h = {}
  matches.forEach(m => {
    const isTeamA = m.team_a_player1_id === currentUser.id || m.team_a_player2_id === currentUser.id
    const won = (isTeamA && m.winner === 'team_a') || (!isTeamA && m.winner === 'team_b')
    const opponents = isTeamA
      ? [m.team_b_player1_id, m.team_b_player2_id]
      : [m.team_a_player1_id, m.team_a_player2_id]
    opponents.filter(Boolean).forEach(opId => {
      if (!h2h[opId]) h2h[opId] = { wins: 0, losses: 0 }
      if (won) h2h[opId].wins++; else h2h[opId].losses++
    })
  })

  return (
    <div className="page">
      <h2 style={{ fontSize: 30 }}>MY STATS</h2>

      <div className="grid-2">
        <StatCard icon="🏓" label="Total Matches" value={total} color="var(--secondary)" />
        <StatCard icon="🏆" label="Win Rate" value={`${winRate}%`} color="var(--primary)" />
        <StatCard icon="✅" label="Wins" value={currentUser.total_wins} color="var(--success)" />
        <StatCard icon="❌" label="Losses" value={currentUser.total_losses} color="var(--danger)" />
      </div>

      {bestPartner && (
        <div className="card">
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>🤝 Best Duo Partner</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 32 }}>{bestPartner.avatar}</span>
            <div>
              <div style={{ fontWeight: 700 }}>{bestPartner.name}</div>
              <div style={{ fontSize: 13, color: 'var(--success)' }}>{partnerWins[bestPartnerId]} wins together</div>
            </div>
          </div>
        </div>
      )}

      {Object.keys(h2h).length > 0 && (
        <div className="card">
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>⚔️ Head-to-Head Records</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {Object.entries(h2h).slice(0, 5).map(([opId, record]) => {
              const op = allPlayers.find(p => p.id === opId)
              if (!op) return null
              return (
                <div key={opId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 20 }}>{op.avatar}</span>
                    <span style={{ fontSize: 14, fontWeight: 600 }}>{op.name}</span>
                  </div>
                  <div style={{ fontSize: 13 }}>
                    <span style={{ color: 'var(--success)', fontWeight: 700 }}>{record.wins}W</span>
                    <span style={{ color: 'var(--text-muted)', margin: '0 4px' }}>-</span>
                    <span style={{ color: 'var(--danger)', fontWeight: 700 }}>{record.losses}L</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {matches.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">📊</div>
          <p>Play some matches to see your stats!</p>
        </div>
      )}
    </div>
  )
}
