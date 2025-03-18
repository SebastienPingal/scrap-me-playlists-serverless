exports.hello = async (event) => {
  const bucketName = process.env.BUCKET_NAME
  // Add verbose flag, defaulting to false
  const verbose = event?.verbose || false
  
  // Import S3 client
  const { S3Client, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3')
  const s3Client = new S3Client({ region: 'us-east-1' })

  async function getS3Object(key) {
    try {
      // Get the latest playlist file from S3
      const response = await s3Client.send(
        new GetObjectCommand({
          Bucket: bucketName,
          Key: key
        })
      )
      if (!response) {
        throw new Error('No response from S3')
      }
      if (verbose) console.log('🤲 ', key, 'has been retrieved from S3')
      return response
    } catch (error) {
      console.error('💥 Error getting S3 object:', error.message)
      return null
    }
  }

  async function getTracks(playlistId, token) {
    if (verbose) console.log('🎵 Getting tracks for playlist:', playlistId)
    try {
      const tracksResponse = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const tracks = await tracksResponse.json()
      if (verbose) console.log('🎵 ', playlistId, 'tracks have been retrieved from Spotify')
      return tracks
    } catch (error) {
      console.error('💥 Error getting tracks:', error.message)
      return null
    }
  }

  async function putS3Object(key, body) {
    if (verbose) console.log('🎵 Putting in S3', key)
    try {
      const response = await s3Client.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: key,
          Body: body,
          ContentType: 'application/json'
        }))
      if (verbose) console.log('🤚 ', key, 'has been put in S3')
      return response
    } catch (error) {
      throw new Error('Failed to put S3 object: ' + error.message)
    }
  }

  async function deletePlaylistAndReplaceInS3(playlists, playlistId) {
    if (verbose) console.log('🎵 Deleting playlist:', playlistId)

    const newPlaylists = {
      token: playlists.token,
      items: playlists.items.filter(playlist => playlist.id !== playlistId)
    }

    try {
      const response = await putS3Object('playlists/spotify-playlists-latest.json', JSON.stringify(newPlaylists))

      if (verbose) console.log('🦆 ', 'spotify-playlists-latest.json', 'has been updated in S3')

      return {
        statusCode: 200,
        body: JSON.stringify({
          message: 'Successfully deleted playlist and replaced in S3',
          playlists: newPlaylists
        })
      }
    } catch (error) {
      throw new Error('Failed to delete playlist and replace in S3 ' + error.message)
    }
  }

  async function updateTreatedPlaylist(playlistWithTracks) {
    let treatedPlaylist = []

    try {
      const treatedPlaylistResponse = await getS3Object(`playlists/treated-playlists.json`)
      if (!treatedPlaylistResponse || !treatedPlaylistResponse.Body) {
        throw new Error('Invalid S3 response')
      }
      const bodyString = await treatedPlaylistResponse.Body.transformToString()
      treatedPlaylist = JSON.parse(bodyString)
    } catch (error) {
      treatedPlaylist = []
    }

    try {
      treatedPlaylist.push(playlistWithTracks)
      await putS3Object(`playlists/treated-playlists.json`, JSON.stringify(treatedPlaylist))
      if (verbose) console.log('💃 ', 'treated-playlists.json', 'has been updated in S3')
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: `Successfully updated treated playlist with ${playlistWithTracks.name}`,
          playlistWithTracks: playlistWithTracks
        })
      }
    } catch (error) {
      throw new Error('Failed to update treated playlist')
    }
  }

  async function main() {
    try {
      const playlistsDataResponse = await getS3Object(`playlists/spotify-playlists-latest.json`)
      if (!playlistsDataResponse || !playlistsDataResponse.Body) {
        throw new Error('Invalid S3 response')
      }

      // Wait for the body stream to be converted to string before parsing
      const bodyString = await playlistsDataResponse.Body.transformToString()
      const playlistsData = JSON.parse(bodyString)

      // Initialize tracksData array before using it
      const tracksData = []

      const token = playlistsData.token
      if (verbose) console.log('🎫 token:', token)

      const playlistBeingTreated = playlistsData.items[0]
      if (verbose) console.log('🎵 playlistBeingTreated:', playlistBeingTreated)
      if (!playlistBeingTreated) {
        throw new Error('😻 All playlists have been treated')
      }
      const tracks = await getTracks(playlistBeingTreated.id, token)

      for (const track of tracks.items) {
        const trackObject = {
          playlistId: playlistBeingTreated.id,
          playlistName: playlistBeingTreated.name,
          track: track.track
        }
        tracksData.push(trackObject)
      }

      await deletePlaylistAndReplaceInS3(playlistsData, playlistBeingTreated.id)
      await updateTreatedPlaylist(playlistBeingTreated)

      console.log('🔈 ', playlistBeingTreated.name, 'has been treated')

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

  await main()
}
