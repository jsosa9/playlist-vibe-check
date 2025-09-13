# sampling_strategy.py
import pandas as pd
import random

def create_strategic_sample(df: pd.DataFrame, max_tracks: int = 100) -> pd.DataFrame:
    """
    Create a smart sample that represents the playlist's diversity
    without external dependencies
    """
    if len(df) <= max_tracks:
        return df
    
    # Set random seed for reproducibility
    random.seed(42)
    
    # Strategy 1: Most popular tracks (40%)
    popular_count = int(max_tracks * 0.4)
    if 'Popularity' in df.columns:
        popular_samples = df.nlargest(popular_count * 2, 'Popularity')  # Get extra to account for duplicates
    else:
        popular_samples = df.head(popular_count * 2)
    
    # Strategy 2: Diverse audio features (40%)
    diverse_count = int(max_tracks * 0.4)
    diverse_samples = get_diverse_tracks_simple(df, diverse_count * 2)
    
    # Strategy 3: Random sample (20%)
    random_count = max_tracks - (popular_count + diverse_count)
    random_samples = df.sample(min(random_count * 2, len(df)), random_state=42)
    
    # Combine all strategies
    combined = pd.concat([popular_samples, diverse_samples, random_samples])
    
    # Remove duplicates and trim to max_tracks
    result = combined.drop_duplicates().head(max_tracks)
    
    # If we don't have enough tracks, fill with random
    if len(result) < max_tracks:
        additional_needed = max_tracks - len(result)
        additional_tracks = df[~df.index.isin(result.index)].sample(additional_needed, random_state=42)
        result = pd.concat([result, additional_tracks])
    
    return result

def get_diverse_tracks_simple(df: pd.DataFrame, n: int) -> pd.DataFrame:
    """Simple diversity sampling without scipy"""
    if n <= 0:
        return pd.DataFrame()
    
    features = ['Danceability', 'Energy', 'Valence', 'Acousticness']
    available_features = [f for f in features if f in df.columns]
    
    if not available_features:
        return df.sample(min(n, len(df)), random_state=42)
    
    # Get tracks with extreme values for each feature
    diverse_indices = set()
    
    for feature in available_features:
        # Highest values
        high_indices = df[feature].nlargest(3).index
        diverse_indices.update(high_indices)
        
        # Lowest values
        low_indices = df[feature].nsmallest(3).index
        diverse_indices.update(low_indices)
    
    # Convert to DataFrame
    diverse_tracks = df.loc[list(diverse_indices)]
    
    # If we need more tracks, add random ones
    if len(diverse_tracks) < n:
        additional_needed = n - len(diverse_tracks)
        additional_tracks = df[~df.index.isin(diverse_tracks.index)].sample(additional_needed, random_state=42)
        diverse_tracks = pd.concat([diverse_tracks, additional_tracks])
    
    return diverse_tracks.head(n)