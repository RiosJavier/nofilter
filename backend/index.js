require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const Anthropic = require('@anthropic-ai/sdk');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 8888;
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function getSpotifyToken() {
  const credentials = Buffer.from(
    `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
  ).toString('base64');

  const response = await axios.post(
    'https://accounts.spotify.com/api/token',
    'grant_type=client_credentials',
    {
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }
  );
  return response.data.access_token;
}

async function translateVibe(vibe) {
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 300,
    messages: [
      {
        role: 'user',
        content: `You are a music expert. Someone described the vibe they want as: "${vibe}"
        
Translate this into Spotify search terms. Return ONLY valid JSON, no explanation, no markdown:
{
  "searchQuery": "2-5 descriptive music terms for Spotify search",
  "mood": "one sentence describing the vibe in musical terms"
}`,
      },
    ],
  });

  const raw = message.content[0].text;
  console.log('Claude returned:', raw);
  return JSON.parse(raw);
}

// Main endpoint — vibe goes in, playlist comes out
app.post('/api/playlist', async (req, res) => {
  try {
    const { vibe } = req.body;

    if (!vibe) return res.status(400).json({ error: 'No vibe provided' });

    // Step 1: Claude translates the vibe
    const vibeData = await translateVibe(vibe);

    // Step 2: Search Spotify with those terms
    const token = await getSpotifyToken();

    const randomOffset = Math.floor(Math.random() * 20);
    const searchUrl = `https://api.spotify.com/v1/search?q=${encodeURIComponent(vibeData.searchQuery)}&type=track&limit=10&offset=${randomOffset}`;

    console.log('Sending to Spotify:', searchUrl);

    const result = await axios.get(searchUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });

    // Dedupe by track URL
    const seen = new Set();
    const uniqueTracks = result.data.tracks.items.filter(track => {
      const url = track.external_urls.spotify;
      if (seen.has(url)) return false;
      seen.add(url);
      return true;
    });

    // Shuffle and take 10
    const shuffled = uniqueTracks.sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, 10);

    const tracks = selected.map(track => ({
      name: track.name,
      artist: track.artists[0].name,
      album: track.album.name,
      albumArt: track.album.images[1]?.url,
      url: track.external_urls.spotify,
      preview: track.preview_url,
    }));

    res.json({
      vibe,
      mood: vibeData.mood,
      searchQuery: vibeData.searchQuery,
      tracks,
    });
  } catch (error) {
    console.error('Full error:', error.response?.data || error.message);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://127.0.0.1:${PORT}`);
});