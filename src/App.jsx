import { useState } from 'react'
import { AppProvider, useApp } from './context/AppContext'
import ProfilePage from './pages/ProfilePage'
import CommunityPage from './pages/CommunityPage'
import GamePage from './pages/GamePage'
import LeaderboardPage from './pages/LeaderboardPage'
import StatsPage from './pages/StatsPage'
import RulesPage from './pages/RulesPage'
import './styles/global.css'

const TABS = [
  { id: 'profile', icon: '👤', label: 'Profile' },
  { id: 'community', icon: '🌐', label: 'Players' },
  { id: 'game', icon: '🏓', label: 'Game' },
  { id: 'leaderboard', icon: '🏆', label: 'Ranks' },
  { id: 'stats', icon: '📊', label: 'Stats' },
  { id: 'rules', icon: '📖', label: 'Rules' },
]

function AppShell() {
  const { currentUser, activeMatch, loading } = useApp()
  const [activeTab, setActiveTab] = useState('profile')

  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', flexDirection: 'column', gap: 20,
        background: 'linear-gradient(160deg, #004E89 0%, #1A1A2E 100%)'
      }}>
        <div style={{ position: 'relative', width: 80, height: 80, marginBottom: 8 }}>
          <div style={{
            position: 'absolute', inset: 0, borderRadius: '50%',
            border: '3px solid rgba(255,107,53,0.3)',
            animation: 'spin 1.2s linear infinite'
          }} />
          <div style={{
            position: 'absolute', inset: 0, display: 'flex',
            alignItems: 'center', justifyContent: 'center', fontSize: 40
          }}>🏓</div>
        </div>
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 36, color: 'white', letterSpacing: 4 }}>
          VENZO <span style={{ color: '#FF6B35' }}>PING</span>
        </div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', letterSpacing: 2, textTransform: 'uppercase' }}>
          Office Table Tennis
        </div>
        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    )
  }

  function goToGame(challengedPlayer) {
    setActiveTab('game')
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <div>
          <h1>VENZO <span style={{ color: 'var(--primary)' }}>PING</span></h1>
          <div className="header-sub">Office Table Tennis</div>
        </div>
        {activeMatch && (
          <button
            onClick={() => setActiveTab('game')}
            style={{
              background: 'var(--primary)', color: 'white', border: 'none', borderRadius: 20,
              padding: '6px 16px', fontSize: 12, fontWeight: 800, cursor: 'pointer',
              letterSpacing: 1, animation: 'pulse 2s ease-in-out infinite',
              boxShadow: '0 2px 12px rgba(255,107,53,0.5)'
            }}>
            🏓 LIVE
          </button>
        )}
        {currentUser && !activeMatch && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 22 }}>{currentUser.avatar}</span>
            <span style={{ fontSize: 13, fontWeight: 600 }}>{currentUser.name}</span>
          </div>
        )}
      </header>

      <main className="app-main">
        {activeTab === 'profile' && <ProfilePage />}
        {activeTab === 'community' && <CommunityPage onStartGame={goToGame} />}
        {activeTab === 'game' && <GamePage />}
        {activeTab === 'leaderboard' && <LeaderboardPage />}
        {activeTab === 'stats' && <StatsPage />}
        {activeTab === 'rules' && <RulesPage />}
      </main>

      <nav className="bottom-nav">
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="nav-icon">{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>

    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  )
}
