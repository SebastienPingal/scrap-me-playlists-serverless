exports.hello = async (event) => {
  // Import S3 client
  console.log('🚜 Getting tracks')
  const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3')
  const s3Client = new S3Client({ region: 'us-east-1' })
  
  // Get bucket name from environment variable and add error handling
  const bucketName = process.env.BUCKET_NAME

  try {
    // Get the latest playlist file from S3
    const response = await s3Client.send(
      new GetObjectCommand({
        Bucket: bucketName,
        Key: 'playlists/spotify-playlists-latest.json'
      })
    )

    // Convert the streaming body to JSON
    const playlistData = JSON.parse(await response.Body.transformToString())
    const token = playlistData.token
    const PlaylistsWithTracks = []

    for (const playlist of playlistData.items) {
      const tracksData = []
      const tracksResponse = await fetch(`https://api.spotify.com/v1/playlists/${playlist.id}/tracks`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const tracks = await tracksResponse.json()

      for (const track of tracks.items) {
        const trackObject = {
          playlistId: playlist.id,
          track: track.track
        }
        tracksData.push(trackObject)
      }

      PlaylistsWithTracks.push({
        playlistId: playlist.id,
        tracks: tracksData
      })
      console.log('🎵 Playlist', playlist.name, 'has', tracksData.length, 'tracks')
    }

    console.log('📺 PlaylistsWithTracks', PlaylistsWithTracks)



    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Successfully retrieved playlist from S3',
        tracks: tracksData
      })
    }
  } catch (error) {
    console.error('💥 Error retrieving playlist:', error.message)
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Error retrieving playlist from S3',
        error: error.message
      })
    }
  }
}
