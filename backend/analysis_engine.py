# analysis_engine.py
from io import StringIO
import pandas as pd
from typing import Dict, Any, List
from sampling_strategy import create_strategic_sample

def analyze_playlist_data(csv_content: str, playlist_name: str) -> Dict[str, Any]:
    """
    Main function: Takes CSV content, returns rich analysis ready for AI
    """
    # Convert CSV to DataFrame
    df = pd.read_csv(StringIO(csv_content))
    
    print(f"🔍 After CSV conversion - DataFrame shape: {df.shape}")
    print(f"🔍 After CSV conversion - DataFrame columns: {list(df.columns)}")
    print(f"🔍 After CSV conversion - Sample audio features:")
    if 'Danceability' in df.columns:
        print(f"  Danceability: {df['Danceability'].head(3).tolist()}")
    if 'Energy' in df.columns:
        print(f"  Energy: {df['Energy'].head(3).tolist()}")
    
    # 1. Basic quantitative analysis
    basic_analysis = generate_basic_analysis(df)
    
    # 2. Strategic sampling for AI context
    sample_df = create_strategic_sample(df, max_tracks=100)
    track_samples = format_track_samples(sample_df)
    
    # 3. Prepare data for AI
    analysis_payload = {
        "playlist_name": playlist_name,
        "basic_analysis": basic_analysis,
        "track_samples": track_samples,
        "total_tracks": len(df),
        "analyzed_tracks": len(sample_df)
    }
    
    return analysis_payload

def generate_basic_analysis(df: pd.DataFrame) -> Dict[str, Any]:
    """Generate quantitative analysis"""
    import math
    
    def safe_mean(series):
        """Calculate mean and replace NaN with 0"""
        mean_val = series.mean()
        return 0 if math.isnan(mean_val) else mean_val
    
    def safe_std(series):
        """Calculate std and replace NaN with 0"""
        std_val = series.std()
        return 0 if math.isnan(std_val) else std_val
    
    print(f"🔍 DataFrame columns: {list(df.columns)}")
    print(f"🔍 DataFrame shape: {df.shape}")
    print(f"🔍 Sample data:")
    print(df.head(2))
    
    analysis = {
        "track_count": len(df),
        "artists_count": df['Artist Name(s)'].nunique(),
        "albums_count": df['Album Name'].nunique(),
        "avg_popularity": safe_mean(df['Popularity']) if 'Popularity' in df.columns else 0,
        "duration_minutes": (df['Duration (ms)'].sum() / 60000) if 'Duration (ms)' in df.columns else 0,
    }
    
    # Handle Explicit column (might be boolean or string)
    if 'Explicit' in df.columns:
        if df['Explicit'].dtype == 'bool':
            analysis["explicit_ratio"] = safe_mean(df['Explicit'])
        else:
            # Handle string values like 'True'/'False'
            analysis["explicit_ratio"] = safe_mean((df['Explicit'].str.lower() == 'true').astype(float))
    
    # Audio features analysis
    audio_features = ['Danceability', 'Energy', 'Valence', 'Acousticness', 
                     'Instrumentalness', 'Liveness', 'Speechiness', 'Tempo']
    
    print(f"🔍 Processing audio features...")
    for feature in audio_features:
        if feature in df.columns:
            mean_val = safe_mean(df[feature])
            std_val = safe_std(df[feature])
            analysis[f'avg_{feature.lower()}'] = mean_val
            analysis[f'std_{feature.lower()}'] = std_val
            print(f"🔍 {feature}: mean={mean_val}, std={std_val}")
        else:
            print(f"❌ {feature} not found in columns")
    
    # Top artists
    if 'Artist Name(s)' in df.columns:
        analysis['top_artists'] = df['Artist Name(s)'].value_counts().head(10).to_dict()
    
    print(f"🔍 Final analysis keys: {list(analysis.keys())}")
    print(f"🔍 Audio feature averages: {[k for k in analysis.keys() if k.startswith('avg_')]}")
    
    return analysis

def format_track_samples(sample_df: pd.DataFrame) -> List[Dict]:
    """Format track samples for AI context"""
    samples = []
    for _, track in sample_df.iterrows():
        sample_data = {
            "name": track.get('Track Name', 'Unknown Track'),
            "artist": track.get('Artist Name(s)', 'Unknown Artist'),
            "popularity": track.get('Popularity', 0),
        }
        
        # Add audio features if available
        audio_features = ['Danceability', 'Energy', 'Valence', 'Acousticness']
        for feature in audio_features:
            if feature in track:
                sample_data[feature.lower()] = track[feature]
        
        samples.append(sample_data)
    
    return samples