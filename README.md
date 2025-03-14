# Spotify Playlist Downloader

This project allows you to automatically fetch your Spotify playlists, store them in DynamoDB, and download the music on a Raspberry Pi.

## Architecture

The project consists of three serverless functions:

1. **DailyCheck** - Fetches playlists and tracks from Spotify API and stores them in an S3 bucket
2. **PlaylistsDB** - Triggered by S3 uploads, processes the data and stores it in DynamoDB
3. **DownloadMusic** - Provides API endpoints for the Raspberry Pi to fetch playlist and track data

## Setup

### Prerequisites

- AWS Account
- Serverless Framework
- Node.js 20.x
- Spotify Developer Account
- Raspberry Pi (for downloading music)

### Environment Variables

Create a `.env` file in each function directory with the following variables:

```
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
SPOTIFY_REDIRECT_URI=your_spotify_redirect_uri
SPOTIFY_USER_ID=your_spotify_user_id
SPOTIFY_BUCKET_NAME=your-spotify-bucket-name
```

### Installation

1. Install dependencies:

```bash
pnpm install
```

2. Deploy the serverless functions:

```bash
cd DailyCheck
serverless deploy

cd ../PlaylistsDB
serverless deploy

cd ../DownloadMusic
serverless deploy
```

3. Set up the Raspberry Pi:

```bash
# Install required packages
pip install requests youtube-dl

# Copy the download_music.py script to your Raspberry Pi
# Update the API_BASE_URL in the script with your API Gateway URL

# Make the script executable
chmod +x download_music.py
```

## Usage

### Raspberry Pi

Run the script on your Raspberry Pi to download music:

```bash
# Download all playlists (limited to 10 tracks each by default)
./download_music.py --all

# Download a specific playlist
./download_music.py --playlist your_playlist_id

# Download with a custom limit
./download_music.py --all --limit 20
```

## How It Works

1. The DailyCheck function runs once a day to fetch your Spotify playlists and tracks
2. It stores the data in an S3 bucket
3. The S3 upload triggers the PlaylistsDB function
4. PlaylistsDB processes the data and stores it in DynamoDB
5. The Raspberry Pi can fetch the data using the DownloadMusic API endpoints
6. The Raspberry Pi downloads the music using youtube-dl

## DynamoDB Schema

### SpotifyPlaylists Table

- **id** (String, Primary Key) - Playlist ID
- **name** (String) - Playlist name
- **description** (String) - Playlist description
- **track_count** (Number) - Number of tracks in the playlist
- **last_updated** (String) - Timestamp of last update

### SpotifyTracks Table

- **id** (String, Primary Key) - Track ID
- **playlist_id** (String, GSI) - Playlist ID
- **name** (String) - Track name
- **artists** (List) - List of artists
- **album** (Map) - Album information
- **duration_ms** (Number) - Track duration in milliseconds
- **preview_url** (String) - URL to preview the track
- **external_urls** (Map) - External URLs
- **last_updated** (String) - Timestamp of last update 