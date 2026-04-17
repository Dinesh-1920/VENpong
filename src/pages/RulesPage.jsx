export default function RulesPage() {
  return (
    <div className="page">
      <h2 style={{ fontSize: 32 }}>📖 TT RULES</h2>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {[
          { icon: '🎯', label: 'First to 11', desc: 'Win by 2' },
          { icon: '🔄', label: 'Switch Serve', desc: 'Every 2 pts' },
          { icon: '📏', label: 'Net Touch', desc: 'Replay point' },
          { icon: '✋', label: 'Edge = Point', desc: 'Side edges out' },
        ].map(r => (
          <div key={r.label} className="card" style={{ flex: '1 1 45%', textAlign: 'center', padding: '14px 10px' }}>
            <div style={{ fontSize: 24 }}>{r.icon}</div>
            <div style={{ fontWeight: 700, fontSize: 13, marginTop: 4 }}>{r.label}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{r.desc}</div>
          </div>
        ))}
      </div>

      <RuleSection title="🏓 Serving Rules">
        <RuleItem>Ball must rest on open palm before serve</RuleItem>
        <RuleItem>Toss ball vertically at least 16cm (6 inches)</RuleItem>
        <RuleItem>Strike ball on the way down</RuleItem>
        <RuleItem>Ball must bounce once on your side, then opponent's side</RuleItem>
        <RuleItem>Serve must be visible to umpire at all times — no hiding with body</RuleItem>
        <RuleItem>In doubles: serve from right half court to opponent's right half</RuleItem>
        <RuleItem>Let serve (hits net, lands correctly) → replay the point</RuleItem>
      </RuleSection>

      <RuleSection title="🏆 Scoring & Winning">
        <RuleItem>First player/team to 11 points wins the game</RuleItem>
        <RuleItem>Must win by 2 clear points (e.g. 12-10, 14-12)</RuleItem>
        <RuleItem>Serve switches every 2 points</RuleItem>
        <RuleItem>At 10-10 (deuce): serve switches every 1 point</RuleItem>
        <RuleItem>Best of 3 or 5 games is typical in match play</RuleItem>
      </RuleSection>

      <RuleSection title="👥 Doubles Rules">
        <RuleItem>Serve must go from right half to opponent's right half</RuleItem>
        <RuleItem>Partners must alternate hitting the ball</RuleItem>
        <RuleItem>Serve rotates after every 2 points among all 4 players</RuleItem>
        <RuleItem>At the start of each game, teams choose who serves first</RuleItem>
        <RuleItem>After each game, opponents switch receiving order</RuleItem>
      </RuleSection>

      <RuleSection title="⚡ Legal & Illegal Shots">
        <RuleItem>✅ Ball bounces on your side and crosses the net</RuleItem>
        <RuleItem>✅ Ball clips the top edge of the table (edge ball)</RuleItem>
        <RuleItem>✅ Any paddle grip, any spin</RuleItem>
        <RuleItem>❌ Ball bounces on your side twice (point to opponent)</RuleItem>
        <RuleItem>❌ Hitting the ball twice</RuleItem>
        <RuleItem>❌ Ball hits side of table (not top) — out</RuleItem>
        <RuleItem>❌ Touching the table with free hand during a rally</RuleItem>
        <RuleItem>❌ Moving the table during play</RuleItem>
      </RuleSection>

      <RuleSection title="🏢 Office Variations">
        <RuleItem>Casual games: first to 11, no deuce (clean win)</RuleItem>
        <RuleItem>Lunch league: best of 3 games</RuleItem>
        <RuleItem>Doubles rotation: all 4 players rotate serving</RuleItem>
        <RuleItem>House serve rule: 3 service faults = point to opponent</RuleItem>
      </RuleSection>

      <RuleSection title="🤝 Etiquette">
        <RuleItem>Call your own faults honestly</RuleItem>
        <RuleItem>Shake hands / fist bump after every match</RuleItem>
        <RuleItem>No slamming paddles on the table</RuleItem>
        <RuleItem>Retrieve opponent's balls promptly</RuleItem>
        <RuleItem>No coaching from spectators during active play</RuleItem>
      </RuleSection>

      <RuleSection title="🎤 Venzo Ping Score Modes">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { icon: '👥', name: 'Spectator Mode', desc: 'A watcher manually taps the score buttons. Best for casual play.' },
            { icon: '⚡', name: 'Quick Tap Mode', desc: 'Giant buttons for fast, one-handed scoring. Built for players between points.' },
            { icon: '🔊', name: 'Voice Mode', desc: 'Say the team name to add a point. Hands-free for intense rallies!' },
          ].map(m => (
            <div key={m.name} style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontSize: 24, flexShrink: 0 }}>{m.icon}</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{m.name}</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 3 }}>{m.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </RuleSection>
    </div>
  )
}

function RuleSection({ title, children }) {
  return (
    <div className="card">
      <h3 style={{ fontSize: 20, marginBottom: 12, borderBottom: '2px solid var(--primary)', paddingBottom: 6 }}>
        {title}
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {children}
      </div>
    </div>
  )
}

function RuleItem({ children }) {
  return (
    <div style={{ display: 'flex', gap: 10, fontSize: 14, lineHeight: 1.4, color: 'var(--text)' }}>
      <span style={{ color: 'var(--primary)', flexShrink: 0, fontWeight: 700 }}>→</span>
      <span>{children}</span>
    </div>
  )
}
