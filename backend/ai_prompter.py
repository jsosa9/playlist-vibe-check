# ai_prompter.py
import openai
import os
from typing import Dict, Any

def generate_vibe_report(analysis_data: Dict[str, Any]) -> str:
    """
    Generate an AI-powered vibe report from the analyzed data
    """
    # Check if OpenAI API key is available
    api_key = os.getenv('OPENAI_API_KEY')
    if not api_key:
        print("OpenAI API key not found in environment variables")
        return "AI analysis unavailable - OpenAI API key not configured. Your quantitative data is ready!"
    
    # Construct the prompt
    prompt = create_analysis_prompt(analysis_data)
    
    try:
        # Initialize OpenAI client
        client = openai.OpenAI(api_key=api_key)
        
        # Call OpenAI API with new format
        response = client.chat.completions.create(
            model="gpt-4",  # or "gpt-3.5-turbo" for testing
            messages=[
                {"role": "system", "content": "You are a music expert and cultural analyst known for your engaging and witty personality profiles based on music taste."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=800,
            temperature=0.8
        )
        
        return response.choices[0].message.content.strip()
        
    except openai.AuthenticationError:
        print("OpenAI authentication failed - check API key")
        return "AI analysis unavailable - OpenAI authentication failed. Your quantitative data is ready!"
    except openai.RateLimitError:
        print("OpenAI rate limit exceeded")
        return "AI analysis temporarily unavailable - rate limit exceeded. Your quantitative data is ready!"
    except openai.APIError as e:
        print(f"OpenAI API error: {e}")
        return "AI analysis temporarily unavailable due to API error. Your quantitative data is ready!"
    except Exception as e:
        print(f"Unexpected error in AI report generation: {e}")
        return "AI analysis temporarily unavailable. Your quantitative data is ready!"

def create_analysis_prompt(analysis_data: Dict[str, Any]) -> str:
    """Create a detailed prompt for the AI analysis"""
    basic = analysis_data["basic_analysis"]
    samples = analysis_data["track_samples"]
    
    # Format the audio features section
    features_text = ""
    audio_features = ['danceability', 'energy', 'valence', 'acousticness', 
                     'instrumentalness', 'liveness', 'speechiness']
    
    for feature in audio_features:
        avg_key = f'avg_{feature}'
        if avg_key in basic:
            features_text += f"- {feature.title()}: {basic[avg_key]:.2f}/1\n"
    
    # Format track samples
    tracks_text = ""
    for i, track in enumerate(samples[:5], 1):  # Show first 5 samples
        tracks_text += f"{i}. '{track['name']}' by {track['artist']} (Popularity: {track['popularity']}/100)\n"
    
    prompt = f"""
    Analyze this music playlist and provide a engaging "vibe check" report:

    PLAYLIST: {analysis_data['playlist_name']}
    TOTAL TRACKS: {analysis_data['total_tracks']}
    TRACKS ANALYZED: {analysis_data['analyzed_tracks']}

    KEY STATISTICS:
    - Average Popularity: {basic.get('avg_popularity', 0):.1f}/100
    - Unique Artists: {basic.get('artists_count', 0)}
    - Unique Albums: {basic.get('albums_count', 0)}
    - Explicit Content: {basic.get('explicit_ratio', 0)*100:.1f}% of tracks
    - Total Duration: {basic.get('duration_minutes', 0):.1f} minutes

    AUDIO FEATURE PROFILE:
    {features_text}

    TOP ARTISTS: {', '.join(list(basic.get('top_artists', {}).keys())[:3])}

    SAMPLE TRACKS:
    {tracks_text}

    Please write a 3-4 paragraph analysis that:
    1. Summarizes the overall vibe and music taste
    2. Explains what the audio features suggest about the listener's preferences
    3. Makes interesting observations about the artist selection and track diversity
    4. Provides a fun, engaging personality assessment based on the music

    Write in a conversational, witty style that makes the reader feel understood.
    """
    
    return prompt