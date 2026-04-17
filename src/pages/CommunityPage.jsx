import { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import { getAllProfiles, getFriendships, addFriend } from '../services/profiles'
import PlayerCard from '../components/features/PlayerCard'

export default function CommunityPage({ onStartGame }) {
  const { currentUser } = useApp()
  const [players, setPlayers] = useState([])
  const [friendships, setFriendships] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)
    try {
      const [allPlayers, allFriendships] = await Promise.all([
        getAllProfiles(),
        currentUser ? getFriendships(currentUser.id) : Promise.resolve([])
      ])
      setPlayers(allPlayers)
      setFriendships(allFriendships)
    } catch {
      setError('Failed to load players.')
    } finally {
      setLoading(false)
    }
  }

  function getFriendStatus(playerId) {
    if (!currentUser) return null
    const f = friendships.find(f =>
      (f.user_id === currentUser.id && f.friend_id === playerId) ||
      (f.friend_id === currentUser.id && f.user_id === playerId)
    )
    return f?.status || null
  }

  async function handleAddFriend(player) {
    if (!currentUser) return
    try {
      const f = await addFriend(currentUser.id, player.id)
      setFriendships(prev => [...prev, f])
    } catch {
      setError('Failed to send friend request.')
    }
  }

  if (loading) return <div className="loading">Loading players...</div>

  return (
    <div className="page">
      {error && <div className="error-banner">{error}</div>}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ fontSize: 26 }}>PLAYERS ({players.length})</h2>
        <button className="btn btn-primary btn-sm" onClick={onStartGame}>
          🏓 New Game
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {players.map(player => (
          <PlayerCard
            key={player.id}
            player={player}
            isCurrentUser={player.id === currentUser?.id}
            friendStatus={getFriendStatus(player.id)}
            onAddFriend={handleAddFriend}
            onChallenge={() => onStartGame?.(player)}
          />
        ))}
        {players.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">🏓</div>
            <p>No players yet. Create your profile to get started!</p>
          </div>
        )}
      </div>

      <button className="btn btn-ghost btn-block btn-sm" onClick={load}>
        ↻ Refresh
      </button>
    </div>
  )
}
