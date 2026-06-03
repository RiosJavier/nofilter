import { useState } from 'react'
import './App.css'

function App() {
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
      const response = await fetch('http://127.0.0.1:8888/api/playlist', {
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
        <h1>NoFilter</h1>
        <p>Describe any vibe. Get a real playlist. No censorship.</p>
      </div>

      <div className="input-section">
        <textarea
          value={vibe}
          onChange={(e) => setVibe(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="describe a vibe... anything goes"
          rows={3}
        />
        <button onClick={generatePlaylist} disabled={loading || !vibe.trim()}>
          {loading ? 'generating...' : 'generate playlist'}
        </button>
      </div>

      {error && <p className="error">{error}</p>}

      {result && (
        <div className="result">
          <div className="mood-card">
            <p className="mood-label">we heard</p>
            <p className="mood-text">{result.mood}</p>
            <p className="search-query">searched for: "{result.searchQuery}"</p>
          </div>

          <div className="tracks">
            {result.tracks.map((track, i) => (
              <a
                key={i}
                href={track.url}
                target="_blank"
                rel="noreferrer"
                className="track-card"
              >
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