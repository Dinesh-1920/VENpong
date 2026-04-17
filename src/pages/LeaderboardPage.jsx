import { useState, useEffect } from 'react'
import { getAllProfiles } from '../services/profiles'
import Avatar from '../components/ui/Avatar'

const MEDALS = ['🥇', '🥈', '🥉']

export default function LeaderboardPage() {
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState('wins') // wins | winrate

  useEffect(() => {
    getAllProfiles().then(data => {
      setPlayers(data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const sorted = [...players].sort((a, b) => {
    if (sortBy === 'wins') return b.total_wins - a.total_wins
    const aRate = (a.total_wins + a.total_losses) > 0 ? a.total_wins / (a.total_wins + a.total_losses) : 0
    const bRate = (b.total_wins + b.total_losses) > 0 ? b.total_wins / (b.total_wins + b.total_losses) : 0
    return bRate - aRate
  })

  if (loading) return <div className="loading">Loading leaderboard...</div>

  return (
    <div className="page">
      <div className="section-header">
        <h2 style={{ fontSize: 30 }}>LEADERBOARD</h2>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className={`btn btn-sm ${sortBy === 'wins' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setSortBy('wins')}>Wins</button>
          <button className={`btn btn-sm ${sortBy === 'winrate' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setSortBy('winrate')}>Win %</button>
        </div>
      </div>

      {/* Top 3 podium */}
      {sorted.length >= 3 && (
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8,
          background: 'linear-gradient(135deg, #1A1A2E, #004E89)',
          borderRadius: 16, padding: '20px 12px'
        }}>
          {[sorted[1], sorted[0], sorted[2]].map((p, i) => {
            const realRank = i === 0 ? 1 : i === 1 ? 0 : 2
            const heights = [70, 90, 60]
            return (
              <div key={p.id} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 28 }}>{MEDALS[realRank]}</div>
                <Avatar emoji={p.avatar} size={realRank === 0 ? 'lg' : 'md'} />
                <div style={{ color: 'white', fontWeight: 700, fontSize: 12, marginTop: 6 }}>{p.name}</div>
                <div style={{
                  fontFamily: 'var(--font-heading)', fontSize: realRank === 0 ? 28 : 22,
                  color: realRank === 0 ? 'var(--accent)' : 'rgba(255,255,255,0.8)', marginTop: 2
                }}>
                  {p.total_wins}W
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Full table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{
          display: 'grid', gridTemplateColumns: '40px 1fr 48px 48px 52px',
          padding: '10px 16px', background: 'var(--bg)',
          borderBottom: '1px solid var(--border)',
          fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5
        }}>
          <div>#</div>
          <div>Player</div>
          <div style={{ textAlign: 'center' }}>W</div>
          <div style={{ textAlign: 'center' }}>L</div>
          <div style={{ textAlign: 'center' }}>Win%</div>
        </div>

        {sorted.map((player, idx) => {
          const total = player.total_wins + player.total_losses
          const winRate = total > 0 ? Math.round((player.total_wins / total) * 100) : 0
          return (
            <div key={player.id} style={{
              display: 'grid', gridTemplateColumns: '40px 1fr 48px 48px 52px',
              padding: '12px 16px', borderBottom: '1px solid var(--border)',
              alignItems: 'center', background: idx === 0 ? '#FFFDE7' : 'white'
            }}>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: 18, color: idx < 3 ? 'var(--primary)' : 'var(--text-muted)' }}>
                {idx < 3 ? MEDALS[idx] : idx + 1}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Avatar emoji={player.avatar} size="sm" online={player.is_online} />
                <span style={{ fontWeight: 600, fontSize: 14 }}>{player.name}</span>
              </div>
              <div style={{ textAlign: 'center', fontWeight: 700, color: 'var(--success)' }}>{player.total_wins}</div>
              <div style={{ textAlign: 'center', fontWeight: 700, color: 'var(--danger)' }}>{player.total_losses}</div>
              <div style={{ textAlign: 'center', fontWeight: 700, color: 'var(--secondary)' }}>{winRate}%</div>
            </div>
          )
        })}

        {sorted.length === 0 && (
          <div className="empty-state"><div className="empty-icon">🏆</div><p>No players yet!</p></div>
        )}
      </div>
    </div>
  )
}
