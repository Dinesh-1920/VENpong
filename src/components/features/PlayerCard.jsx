import Avatar from '../ui/Avatar'

export default function PlayerCard({ player, onChallenge, onAddFriend, onViewProfile, friendStatus, isCurrentUser }) {
  const total = player.total_wins + player.total_losses
  const winRate = total > 0 ? Math.round((player.total_wins / total) * 100) : 0

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Avatar emoji={player.avatar} size="md" online={player.is_online} />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 15 }}>
            {player.name}
            {isCurrentUser && <span style={{ fontSize: 11, color: 'var(--primary)', marginLeft: 6, fontWeight: 600 }}>YOU</span>}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
            {player.total_wins}W · {player.total_losses}L · {winRate}% WR
          </div>
        </div>
        <div style={{
          background: player.is_online ? '#E8F5E9' : 'var(--bg)',
          color: player.is_online ? 'var(--success)' : 'var(--text-muted)',
          fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 20
        }}>
          {player.is_online ? '● Online' : '○ Away'}
        </div>
      </div>

      {!isCurrentUser && (
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => onViewProfile?.(player)}
            style={{ flex: 1 }}>
            Profile
          </button>
          {friendStatus === 'accepted' ? (
            <button className="btn btn-ghost btn-sm" disabled style={{ flex: 1 }}>
              ✓ Friends
            </button>
          ) : friendStatus === 'pending' ? (
            <button className="btn btn-ghost btn-sm" disabled style={{ flex: 1 }}>
              Pending...
            </button>
          ) : (
            <button className="btn btn-ghost btn-sm" onClick={() => onAddFriend?.(player)}
              style={{ flex: 1 }}>
              + Friend
            </button>
          )}
          <button className="btn btn-primary btn-sm" onClick={() => onChallenge?.(player)}
            style={{ flex: 1 }}>
            Challenge
          </button>
        </div>
      )}
    </div>
  )
}
