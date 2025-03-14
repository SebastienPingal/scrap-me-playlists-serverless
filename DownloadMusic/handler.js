const { DynamoDBClient } = require('@aws-sdk/client-dynamodb')
const { DynamoDBDocumentClient, ScanCommand, QueryCommand, GetCommand } = require('@aws-sdk/lib-dynamodb')

// Initialize clients
const dynamoClient = new DynamoDBClient({ region: 'us-east-1' }) // Change to your region
const docClient = DynamoDBDocumentClient.from(dynamoClient)

/**
 * Get all playlists
 */
exports.getPlaylists = async (event) => {
  console.log('🎵 Getting all playlists')
  
  try {
    const params = {
      TableName: 'SpotifyPlaylists'
    }
    
    const result = await docClient.send(new ScanCommand(params))
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        playlists: result.Items,
        count: result.Count
      })
    }
  } catch (error) {
    console.error('💥 Error getting playlists:', error)
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: error.message })
    }
  }
}

/**
 * Get all tracks
 */
exports.getTracks = async (event) => {
  console.log('🎵 Getting all tracks')
  
  try {
    // Get query parameters
    const queryParams = event.queryStringParameters || {}
    const limit = parseInt(queryParams.limit) || 100
    
    const params = {
      TableName: 'SpotifyTracks',
      Limit: limit
    }
    
    const result = await docClient.send(new ScanCommand(params))
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        tracks: result.Items,
        count: result.Count,
        lastEvaluatedKey: result.LastEvaluatedKey
      })
    }
  } catch (error) {
    console.error('💥 Error getting tracks:', error)
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: error.message })
    }
  }
}

/**
 * Get tracks by playlist ID
 */
exports.getTracksByPlaylist = async (event) => {
  const playlistId = event.pathParameters.playlistId
  console.log(`🎵 Getting tracks for playlist: ${playlistId}`)
  
  try {
    const params = {
      TableName: 'SpotifyTracks',
      IndexName: 'PlaylistIndex',
      KeyConditionExpression: 'playlist_id = :playlistId',
      ExpressionAttributeValues: {
        ':playlistId': playlistId
      }
    }
    
    const result = await docClient.send(new QueryCommand(params))
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        tracks: result.Items,
        count: result.Count
      })
    }
  } catch (error) {
    console.error(`💥 Error getting tracks for playlist ${playlistId}:`, error)
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: error.message })
    }
  }
} 