exports.run = async () => {
  // Log the credentials being used (partially masked for security)
  const clientId = process.env.SPOTIFY_CLIENT_ID
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI

  try {
    console.log('🚀 Making request to Spotify API for access token...')

    const request_body = {
      "grant_type": "client_credentials",
      "redirect_uri": redirectUri,
      "client_id": clientId,
      "client_secret": clientSecret
    }

    const responseToken = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams(request_body).toString()
    })

    // Log the response status
    console.log('📡 Spotify API response status:', responseToken.status)

    const data = await responseToken.json()
    console.log('🎵 Spotify API response data:', data)

    if (data.access_token) {
      console.log('✅ Successfully obtained Spotify access token!')
    } else if (data.error) {
      console.log(`❌ Error from Spotify API: ${data.error} - ${data.error_description}`)
    }
  } catch (error) {
    console.error('💥 Error fetching token:', error.message)
  }
}
