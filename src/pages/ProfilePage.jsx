import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { createProfile, updateProfile } from '../services/profiles'
import Avatar from '../components/ui/Avatar'

const AVATARS = ['🏓', '🔥', '⚡', '🎯', '👑', '🦅', '🐉', '🌟', '💪', '🎮']

export default function ProfilePage() {
  const { currentUser, login, logout, refreshUser } = useApp()
  const [name, setName] = useState(currentUser?.name || '')
  const [avatar, setAvatar] = useState(currentUser?.avatar || '🏓')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [editing, setEditing] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) { setError('Please enter your name'); return }
    setSaving(true); setError(''); setSuccess(false)
    try {
      if (currentUser) {
        await updateProfile(currentUser.id, { name: name.trim(), avatar })
        await refreshUser()
      } else {
        const profile = await createProfile(name.trim(), avatar)
        login(profile)
      }
      setSuccess(true)
      setEditing(false)
      setTimeout(() => setSuccess(false), 2000)
    } catch (err) {
      console.error('Profile save error:', err)
      setError(`Error: ${err?.message || JSON.stringify(err) || 'Unknown error'}`)
    } finally {
      setSaving(false)
    }
  }

  if (currentUser && !editing) {
    const total = currentUser.total_wins + currentUser.total_losses
    const winRate = total > 0 ? Math.round((currentUser.total_wins / total) * 100) : 0

    return (
      <div className="page">
        <div className="card" style={{ textAlign: 'center', padding: '32px 20px' }}>
          <Avatar emoji={currentUser.avatar} size="xl" online />
          <h2 style={{ fontSize: 32, marginTop: 16 }}>{currentUser.name}</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>Active Player</p>
          <div className="grid-3" style={{ marginTop: 24 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontFamily: 'var(--font-heading)', color: 'var(--primary)' }}>{currentUser.total_wins}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Wins</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontFamily: 'var(--font-heading)', color: 'var(--secondary)' }}>{currentUser.total_losses}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Losses</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontFamily: 'var(--font-heading)', color: 'var(--success)' }}>{winRate}%</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Win Rate</div>
            </div>
          </div>
        </div>

        <button className="btn btn-outline btn-block" onClick={() => setEditing(true)}>
          ✏️ Edit Profile
        </button>
        <button className="btn btn-ghost btn-block" onClick={logout}>
          Sign Out
        </button>
      </div>
    )
  }

  return (
    <div className="page">
      <div style={{ textAlign: 'center' }}>
        <Avatar emoji={avatar} size="xl" />
        <h2 style={{ fontSize: 36, marginTop: 16 }}>{currentUser ? 'EDIT PROFILE' : 'CREATE PROFILE'}</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>
          {currentUser ? 'Update your info' : 'Join the ping pong league'}
        </p>
      </div>

      <div className="card">
        <div style={{ marginBottom: 16 }}>
          <div className="form-label" style={{ marginBottom: 10 }}>Choose your avatar</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {AVATARS.map(em => (
              <button key={em} onClick={() => setAvatar(em)} style={{
                width: 48, height: 48, borderRadius: '50%', fontSize: 24,
                border: avatar === em ? '3px solid var(--primary)' : '2px solid var(--border)',
                background: avatar === em ? '#FFF3EF' : 'var(--bg)',
                cursor: 'pointer', transition: 'all 0.15s',
                transform: avatar === em ? 'scale(1.15)' : 'scale(1)'
              }}>
                {em}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Your Name</label>
            <input
              className="form-input"
              type="text"
              placeholder="e.g. Dinesh"
              value={name}
              onChange={e => setName(e.target.value)}
              maxLength={30}
            />
          </div>

          {error && <div className="error-banner">{error}</div>}
          {success && (
            <div style={{ background: '#E8F5E9', border: '1px solid #C8E6C9', color: 'var(--success)', padding: '12px 16px', borderRadius: 8, fontSize: 13, fontWeight: 500 }}>
              ✅ Profile saved!
            </div>
          )}

          <button className="btn btn-primary btn-block btn-lg" type="submit" disabled={saving}>
            {saving ? 'Saving...' : currentUser ? 'Save Changes' : '🏓 Create Profile'}
          </button>
          {currentUser && (
            <button type="button" className="btn btn-ghost btn-block" onClick={() => setEditing(false)}>
              Cancel
            </button>
          )}
        </form>
      </div>
    </div>
  )
}
