export default function Avatar({ emoji, size = 'md', online = false }) {
  const sizes = { sm: 36, md: 48, lg: 64, xl: 80 }
  const px = sizes[size] || sizes.md
  const fontSize = px * 0.5

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <div style={{
        width: px, height: px, borderRadius: '50%',
        background: 'linear-gradient(135deg, #FF6B35 0%, #FFD23F 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize, flexShrink: 0,
        boxShadow: '0 2px 8px rgba(255,107,53,0.25)'
      }}>
        {emoji || '🏓'}
      </div>
      {online && (
        <div style={{
          position: 'absolute', bottom: 2, right: 2,
          width: 10, height: 10, borderRadius: '50%',
          background: '#27AE60', border: '2px solid white'
        }} />
      )}
    </div>
  )
}
