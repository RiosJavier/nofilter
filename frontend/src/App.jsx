import { useState } from 'react'
import './App.css'

function App() {
  const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8888'
  const [vibe, setVibe] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const generatePlaylist = async () => {
    if (!vibe.trim()) return
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch(`${API_URL}/api/playlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vibe })
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error)
      setResult(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      generatePlaylist()
    }
  }

  return (
    <div className="app">
      <div className="header">
        <span className="flag-badge">flagged: inappropriate content</span>
        <h1 className="wordmark">NoFilter</h1>
        <p className="tagline">Describe any vibe. Get a real playlist. Nothing redacted.</p>
      </div>

      <div className="input-section">
        <label className="field-label" htmlFor="vibe-input">describe the vibe</label>
        <textarea
          id="vibe-input"
          value={vibe}
          onChange={(e) => setVibe(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="anything goes — no filter, no judgment"
          rows={3}
        />
        <button onClick={generatePlaylist} disabled={loading || !vibe.trim()}>
          {loading ? 'translating...' : 'generate playlist'}
        </button>
      </div>

      {error && <p className="error">{error}</p>}

      {result && (
        <div className="result">
          <div className="mood-card">
            <p className="mood-label">translated</p>
            <p className="mood-text">{result.mood}</p>
            <span className="query-tag">{result.searchQuery}</span>
          </div>

          <div className="tracks">
            <p className="tracks-label">tracklist</p>
            {result.tracks.map((track, i) => ( <a
              
                key={i}
                href={track.url}
                target="_blank"
                rel="noreferrer"
                className="track-card"
              >
                <span className="track-index">{String(i + 1).padStart(2, '0')}</span>
                {track.albumArt && (
                  <img src={track.albumArt} alt={track.album} />
                )}
                <div className="track-info">
                  <p className="track-name">{track.name}</p>
                  <p className="track-artist">{track.artist}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default App