exports.run = async () => {
  // Log the credentials being used (partially masked for security)
  const clientId = process.env.SPOTIFY_CLIENT_ID
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI
  const userId = process.env.SPOTIFY_USER_ID
  const bucketName = process.env.BUCKET_NAME

  // Import S3 client
  const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3')
  const s3Client = new S3Client({ region: 'us-east-1' }) // Change to your region


  async function getToken() {
    let token = null
    console.log('🚀 Making request to Spotify API for access token...')

    const request_body = {
      "grant_type": "client_credentials",
      "redirect_uri": redirectUri,
      "client_id": clientId,
      "client_secret": clientSecret
    }

    try {
      const responseToken = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams(request_body).toString()
      })
      const data = await responseToken.json()
      token = data.access_token

      if (data.access_token) {
        console.log('✅ Successfully obtained Spotify access token!')
      } else if (data.error) {
        throw new Error(`Error from Spotify API: ${data.error} - ${data.error_description}`)
      }
    } catch (error) {
      console.error('💥 Error fetching token:', error.message)
      throw new Error('Failed to obtain access token')
    }

    return token
  }

  async function getPlaylists(token) {
    console.log('🚀 Making request to Spotify API for playlists...')
    try {
      console.log('📋 Fetching user playlists...')
      const responsePlaylist = await fetch(`https://api.spotify.com/v1/users/${userId}/playlists?limit=50`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const playlistsData = await responsePlaylist.json()

      if (playlistsData.error) {
        throw new Error(`Error from Spotify API: ${playlistsData.error.message}`)
      }

      console.log(`🎵 Found ${playlistsData.items.length} playlists`)
      return playlistsData

    } catch (error) {
      console.error('💥 Error fetching playlists:', error.message)
      throw new Error('Failed to fetch playlists')
    }
  }

  async function uploadPlaylistsToS3(playlistsData) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const s3Key = `playlists/spotify-playlists-${timestamp}.json`

    try {
      await s3Client.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: s3Key,
          Body: JSON.stringify(playlistsData),
          ContentType: 'application/json'
        })
      )

      console.log(`✅ Successfully uploaded playlists data to S3: s3://${bucketName}/${s3Key}`)

      return {
        statusCode: 200,
        body: JSON.stringify({
          message: 'Successfully fetched playlists and tracks and uploaded to S3',
          playlistCount: playlistsWithTracks.length,
          totalTracks: playlistsWithTracks.reduce((sum, playlist) => sum + playlist.tracks.length, 0),
          s3Location: `s3://${bucketName}/${s3Key}`
        })
      }
    } catch (error) {
      console.error('💥 Error processing playlists:', error.message)
      throw new Error('Failed to upload playlists to S3')
    }
  }





  // 4. Main handler function that orchestrates the process
  async function main() {
    console.log('🚀 Starting Spotify data processing...')
    try {
      // Step 1: Authenticate
      const accessToken = await getToken()
      console.log('🚀 Successfully obtained Spotify access token!')


      // Step 2: Get playlists
      const playlists = await getPlaylists(accessToken)
      console.log(`🚀 Successfully fetched ${playlists.items.length} playlists!`)

      await uploadPlaylistsToS3(playlists)
      console.log('🚀 Successfully uploaded playlists to S3!')


      return {
        statusCode: 200,
        body: JSON.stringify({
          message: "Successfully processed Spotify playlists",
          playlistCount: playlists.length,
          playlists: playlists
        })
      }
    } catch (error) {
      console.error(`❌ Error processing Spotify data: ${error.message}`)
      return {
        statusCode: 500,
        body: JSON.stringify({
          message: "Error processing Spotify data",
          error: error.message
        })
      }
    }
  }

  await main()
}
