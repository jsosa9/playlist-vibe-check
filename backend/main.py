# main.py
import os
from dotenv import load_dotenv
import pandas as pd
from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
import requests
from fastapi import File, UploadFile
from analysis_engine import analyze_playlist_data
from ai_prompter import generate_vibe_report
from typing import List, Dict
import httpx

# loading .env
load_dotenv(dotenv_path="./.env")

# This line is crucial - it creates the FastAPI instance named 'app'
app = FastAPI(title="Playlist Vibe Check API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# begin of backend connection test
@app.get("/")
async def root():
    return {"message": "🎵 Backend server is running! Ready to analyze some vibes."}

@app.get("/test")
async def test_route():
    return {"status": "success", "data": [1, 2, 3]}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "message": "Backend is running", "timestamp": "2024-01-01T00:00:00Z"}

# end of backend connection test

# spotify auth
@app.post("/api/exchange-token")
async def exchange_token(data: dict):
    print("here")
    code = data.get('code')
    # Use the 'requests' library to call Spotify's token endpoint
    response = requests.post(
        'https://accounts.spotify.com/api/token',
        data={
            'grant_type': 'authorization_code',
            'code': code,
            'redirect_uri': 'http://127.0.0.1:3000/api/auth/callback',
            'client_id': os.getenv("SPOTIFY_CLIENT_ID"),
            'client_secret': os.getenv("SPOTIFY_CLIENT_SECRET")
        }
    )
    token_data = response.json()
    return token_data # Returns access_token and refresh_token to the frontend

@app.post("/analyze/playlist/{playlist_id}")
async def analyze_playlist_direct(playlist_id: str, authorization: str = Header(None)):
    print("got here")
    """
    Analyze a playlist directly from Spotify API (no CSV needed)
    """
    print(f"🔍 Received analysis request for playlist: {playlist_id}")
    print(f"🔍 Authorization header: {authorization}")
    
    if not authorization or not authorization.startswith("Bearer "):
        print("❌ Missing or invalid authorization header")
        raise HTTPException(status_code=401, detail="Missing access token")
    
    access_token = authorization.split(" ")[1]
    print(f"🔍 Extracted access token: {access_token[:20]}...")
    
    try:
        # 1. Get playlist data from Spotify
        print(f"🔍 Fetching playlist data for: {playlist_id}")
        playlist_data, df = await get_playlist_from_spotify(access_token, playlist_id)
        playlist_name = playlist_data['name']
        print(f"✅ Got playlist: {playlist_name} with {len(df)} tracks")
        
        # 2. Analyze the data using your existing engine
        print("🔍 Starting analysis...")
        analysis_data = analyze_playlist_from_dataframe(df, playlist_name)
        print("✅ Analysis completed")
        
        # 3. Generate AI report
        print("🔍 Generating AI report...")
        ai_report = generate_vibe_report(analysis_data)
        print("✅ AI report generated")
        
        # 4. Prepare response with safe values
        response_data = {
            "playlist_name": playlist_name,
            "quantitative_analysis": analysis_data["basic_analysis"],
            "ai_vibe_report": ai_report,
            "analysis_metadata": {
                "total_tracks": analysis_data["total_tracks"],
                "tracks_analyzed": analysis_data["analyzed_tracks"]
            }
        }
        
        print("✅ Response prepared successfully")
        return response_data
        
    except Exception as e:
        print(f"❌ Analysis error: {str(e)}")
        print(f"❌ Error type: {type(e).__name__}")
        import traceback
        print(f"❌ Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

async def get_playlist_from_spotify(access_token: str, playlist_id: str):
    """Get playlist data from Spotify API and convert to DataFrame"""
    headers = {"Authorization": f"Bearer {access_token}"}
    
    async with httpx.AsyncClient() as client:
        # Get playlist metadata
        playlist_response = await client.get(
            f"https://api.spotify.com/v1/playlists/{playlist_id}",
            headers=headers
        )
        playlist_response.raise_for_status()
        playlist_data = playlist_response.json()
        
        # Get all tracks with pagination
        all_tracks = []
        tracks_url = f"https://api.spotify.com/v1/playlists/{playlist_id}/tracks?limit=100"
        
        while tracks_url:
            tracks_response = await client.get(tracks_url, headers=headers)
            tracks_response.raise_for_status()
            tracks_data = tracks_response.json()
            
            # Extract track objects
            for item in tracks_data['items']:
                if item['track']:  # Skip null tracks
                    all_tracks.append(item['track'])
            
            tracks_url = tracks_data.get('next')
        
        # Get audio features in batches
        track_ids = [track['id'] for track in all_tracks if track.get('id')]
        audio_features_map = {}
        
        for i in range(0, len(track_ids), 100):
            batch_ids = track_ids[i:i+100]
            print(f"🔍 Fetching audio features for batch {i//100 + 1}, track IDs: {batch_ids[:3]}...")
            features_response = await client.get(
                f"https://api.spotify.com/v1/audio-features?ids={','.join(batch_ids)}",
                headers=headers
            )
            print(f"🔍 Audio features response status: {features_response.status_code}")
            if features_response.status_code == 200:
                features_data = features_response.json()
                print(f"🔍 Got {len(features_data.get('audio_features', []))} audio features")
                for feature in features_data.get('audio_features', []):
                    if feature:
                        audio_features_map[feature['id']] = feature
                        print("audio_features_map")
                        print(audio_features_map)
                        print(f"🔍 Sample audio feature for {feature['id']}: danceability={feature.get('danceability')}, energy={feature.get('energy')}")
            else:
                print(f"❌ Failed to fetch audio features: {features_response.status_code}")
        
        # Convert to DataFrame (same format as Exportify CSV)
        df = create_dataframe_from_spotify_data(all_tracks, audio_features_map)
        
        return playlist_data, df

def create_dataframe_from_spotify_data(tracks: list, audio_features_map: dict) -> pd.DataFrame:
    """Convert Spotify API response to DataFrame matching Exportify format"""
    import math
    
    def safe_float(value, default=0.0):
        """Convert value to float, handling None and NaN"""
        if value is None:
            return default
        try:
            float_val = float(value)
            return default if math.isnan(float_val) else float_val
        except (ValueError, TypeError):
            return default
    
    rows = []
    
    for track in tracks:
        if not track or not track.get('id'):
            continue
            
        features = audio_features_map.get(track['id'], {})
        
        # Safely extract artist names
        artist_names = []
        for artist in track.get('artists', []):
            if isinstance(artist, dict) and 'name' in artist:
                artist_names.append(artist['name'])
        
        # Debug audio features for first few tracks
        if len(rows) < 3:
            print(f"🔍 Track {len(rows) + 1}: {track.get('name', 'Unknown')}")
            print(f"🔍 Raw features: {features}")
            print(f"🔍 Danceability raw: {features.get('danceability')}, safe_float: {safe_float(features.get('danceability'))}")
            print(f"🔍 Energy raw: {features.get('energy')}, safe_float: {safe_float(features.get('energy'))}")
        
        row = {
            "Track Name": track.get('name', ''),
            "Artist Name(s)": ", ".join(artist_names),
            "Album Name": track.get('album', {}).get('name', '') if isinstance(track.get('album'), dict) else '',
            "Track ID": track.get('id', ''),
            "Popularity": safe_float(track.get('popularity'), 0),
            "Duration (ms)": safe_float(track.get('duration_ms'), 0),
            "Explicit": bool(track.get('explicit', False)),
            # Audio features - ensure all are valid floats
            "Danceability": safe_float(features.get('danceability')),
            "Energy": safe_float(features.get('energy')),
            "Valence": safe_float(features.get('valence')),
            "Acousticness": safe_float(features.get('acousticness')),
            "Instrumentalness": safe_float(features.get('instrumentalness')),
            "Liveness": safe_float(features.get('liveness')),
            "Speechiness": safe_float(features.get('speechiness')),
            "Tempo": safe_float(features.get('tempo')),
        }
        rows.append(row)
    
    if not rows:
        # Return empty DataFrame with expected columns if no tracks
        return pd.DataFrame(columns=[
            "Track Name", "Artist Name(s)", "Album Name", "Track ID", "Popularity",
            "Duration (ms)", "Explicit", "Danceability", "Energy", "Valence",
            "Acousticness", "Instrumentalness", "Liveness", "Speechiness", "Tempo"
        ])
    
    return pd.DataFrame(rows)

def analyze_playlist_from_dataframe(df: pd.DataFrame, playlist_name: str):
    """Adapter to use your existing analysis engine with DataFrame"""
    print(f"🔍 Input DataFrame shape: {df.shape}")
    print(f"🔍 Input DataFrame columns: {list(df.columns)}")
    print(f"🔍 Sample audio features before CSV conversion:")
    if 'Danceability' in df.columns:
        print(f"  Danceability: {df['Danceability'].head(3).tolist()}")
    if 'Energy' in df.columns:
        print(f"  Energy: {df['Energy'].head(3).tolist()}")
    
    # Convert DataFrame to CSV string to reuse your existing code
    csv_content = df.to_csv(index=False)
    
    print(f"🔍 CSV content length: {len(csv_content)}")
    print(f"🔍 CSV sample (first 500 chars): {csv_content[:500]}")
    
    return analyze_playlist_data(csv_content, playlist_name)