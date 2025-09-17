'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../components/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

interface Playlist {
    id: string;
    name: string;
    description: string | null;
    images: { url: string }[];
    owner: { display_name: string };
    tracks: { total: number };
}

interface QuantitativeAnalysis {
    track_count: number;
    artists_count: number;
    albums_count: number;
    avg_popularity: number;
    explicit_ratio: number;
    duration_minutes: number;
    top_artists: Record<string, number>;
    // Audio features with optional properties
    avg_danceability?: number;
    avg_energy?: number;
    avg_valence?: number;
    avg_acousticness?: number;
    avg_instrumentalness?: number;
    avg_liveness?: number;
    avg_speechiness?: number;
    avg_tempo?: number;
    // Allow other unknown properties
    [key: string]: unknown;
}

interface AnalysisResults {
    playlist_name: string;
    quantitative_analysis: QuantitativeAnalysis;
    ai_vibe_report: string;
    analysis_metadata: {
        total_tracks: number;
        tracks_analyzed: number;
    };
}

// Analysis steps for progress indicator
const ANALYSIS_STEPS = [
    "Fetching playlist data",
    "Analyzing audio features",
    "Generating AI insights",
    "Finalizing your vibe report"
];

// Helper function to safely get numeric values from quantitative analysis
const getNumericValue = (analysis: QuantitativeAnalysis, key: string): number => {
    const value = analysis[key];
    
    if (typeof value === 'number') {
        return value;
    }
    
    if (typeof value === 'string') {
        const parsed = parseFloat(value);
        return isNaN(parsed) ? 0 : parsed;
    }
    
    return 0;
};

export default function Dashboard() {
    const { accessToken } = useAuth();
    const [playlists, setPlaylists] = useState<Playlist[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [analysisResults, setAnalysisResults] = useState<AnalysisResults | null>(null);
    const [analyzingPlaylistId, setAnalyzingPlaylistId] = useState<string | null>(null);
    const [analysisProgress, setAnalysisProgress] = useState(0);
    const [currentStep, setCurrentStep] = useState(0);

    // Fetch the user's playlists when the component loads
    useEffect(() => {
        if (!accessToken) return;

        const fetchPlaylists = async () => {
            try {
                const response = await fetch('https://api.spotify.com/v1/me/playlists?limit=50', {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`
                    }
                });

                if (!response.ok) {
                    throw new Error(`Failed to fetch playlists: ${response.status}`);
                }

                const data = await response.json();
                setPlaylists(data.items);
            } catch (err: unknown) {
                if (err instanceof Error) {
                    setError(err.message);
                    console.error('Error fetching playlists:', err);
                } else {
                    setError('An unexpected error occurred');
                    console.error('Unknown error type:', err);
                }
            } finally {
                setLoading(false);
            }
        };

        fetchPlaylists();
    }, [accessToken]);

    // Debug analysis results
    useEffect(() => {
        if (analysisResults) {
            console.log('🎭 Analysis results state updated:', analysisResults);
        }
    }, [analysisResults]);

    const analyzePlaylist = async (playlistId: string) => {
        console.log("Analyzing playlist:", playlistId);

        if (!accessToken) {
            setError("No access token available. Please sign in again.");
            return;
        }

        setAnalyzingPlaylistId(playlistId);
        setAnalysisProgress(0);
        setCurrentStep(0);
        setError(null);

        try {
            // Simulate progress updates
            const progressInterval = setInterval(() => {
                setAnalysisProgress(prev => {
                    const newProgress = prev + 5;
                    return newProgress >= 100 ? 100 : newProgress;
                });

                // Update step text based on progress
                if (analysisProgress < 25) setCurrentStep(0);
                else if (analysisProgress < 50) setCurrentStep(1);
                else if (analysisProgress < 75) setCurrentStep(2);
                else setCurrentStep(3);
            }, 300);

            // Test backend connectivity first
            try {
                const testResponse = await fetch('http://127.0.0.1:8000/', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                console.log('✅ Backend connectivity test:', testResponse.ok);
            } catch (e) {
                console.error('❌ Backend connectivity test failed:', e);
                throw new Error('Cannot connect to backend server');
            }

            // Call backend to analyze the playlist
            const response = await fetch(`http://127.0.0.1:8000/analyze/playlist/${playlistId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            });

            clearInterval(progressInterval);
            setAnalysisProgress(100);

            if (!response.ok) {
                let errorMessage = `Analysis failed: ${response.status}`;
                try {
                    const errorData = await response.json();
                    errorMessage = (errorData as { detail?: string }).detail || errorMessage;
                } catch (e) {
                    console.error('❌ Could not parse error response:', e);
                }
                throw new Error(errorMessage);
            }

            const results: unknown = await response.json();
            
            // Basic validation of the response
            if (typeof results === 'object' && results !== null && 
                'playlist_name' in results && 'quantitative_analysis' in results) {
                setAnalysisResults(results as AnalysisResults);
            } else {
                throw new Error('Invalid response format from analysis API');
            }

        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message);
                console.error('Error analyzing playlist:', err);
            } else {
                setError('Failed to analyze playlist');
                console.error('Unknown error:', err);
            }
        } finally {
            setAnalyzingPlaylistId(null);
            setAnalysisProgress(0);
        }
    };

    const closeResultsModal = () => {
        setAnalysisResults(null);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900 text-gray-100 flex justify-center items-center">
                <motion.div
                    className="text-center"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-300">Loading your playlists...</p>
                </motion.div>
            </div>
        );
    }

    if (error && !analyzingPlaylistId) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900 text-gray-100 flex justify-center items-center">
                <motion.div
                    className="text-center"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <p className="text-red-400 mb-4">Error: {error}</p>
                    <p className="text-gray-300">Please try refreshing the page or signing in again.</p>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900 text-gray-100">
            <div className="container mx-auto px-6 py-12">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <h1 className="text-4xl sm:text-5xl font-bold mb-4">
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-300 to-cyan-300">
                            Your Playlists
                        </span>
                    </h1>
                    <p className="text-lg text-gray-300 mb-8">Select a playlist to analyze its vibe.</p>
                    {analysisResults && (
                        <div className="mb-4 p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-lg">
                            <p className="text-emerald-300 text-sm">
                                ✅ Analysis complete! Check the results below.
                            </p>
                        </div>
                    )}
                </motion.div>

                <motion.div
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    initial="hidden"
                    animate="show"
                    variants={{
                        hidden: { opacity: 1 },
                        show: { opacity: 1, transition: { staggerChildren: 0.1 } },
                    }}
                >
                    {playlists.map((playlist) => (
                        <motion.div
                            key={playlist.id}
                            className={`rounded-2xl border p-6 backdrop-blur-sm shadow-sm transition-all duration-300 cursor-pointer group ${analyzingPlaylistId === playlist.id
                                ? 'border-emerald-400 bg-emerald-500/10'
                                : 'border-white/10 bg-white/5 hover:shadow-emerald-500/10'
                                }`}
                            onClick={() => analyzePlaylist(playlist.id)}
                            variants={{
                                hidden: { opacity: 0, y: 20 },
                                show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
                            }}
                            whileHover={analyzingPlaylistId === playlist.id ? {} : { y: -4, scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            {/* Playlist Image */}
                            {playlist.images[0]?.url && (
                                <div className="relative overflow-hidden rounded-xl mb-4">
                                    <img
                                        src={playlist.images[0].url}
                                        alt={playlist.name}
                                        className={`w-full h-48 object-cover transition-transform duration-300 ${analyzingPlaylistId === playlist.id ? 'opacity-50' : 'group-hover:scale-105'
                                            }`}
                                    />
                                    {analyzingPlaylistId === playlist.id && (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="w-12 h-12 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Playlist Info */}
                            <h2 className="text-xl font-semibold mb-2 line-clamp-2 text-white group-hover:text-emerald-300 transition-colors">
                                {playlist.name}
                            </h2>
                            <p className="text-gray-400 mb-2">By: {playlist.owner.display_name}</p>
                            <p className="text-gray-400 mb-4">{playlist.tracks.total} tracks</p>

                            <motion.button
                                className={`w-full font-medium py-3 px-4 rounded-full transition-colors duration-200 ${analyzingPlaylistId === playlist.id
                                    ? 'bg-emerald-600 text-white cursor-not-allowed'
                                    : 'bg-emerald-500 hover:bg-emerald-400 text-white'
                                    }`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    analyzePlaylist(playlist.id);
                                }}
                                disabled={analyzingPlaylistId === playlist.id}
                                whileHover={analyzingPlaylistId === playlist.id ? {} : { scale: 1.02 }}
                                whileTap={analyzingPlaylistId === playlist.id ? {} : { scale: 0.98 }}
                            >
                                {analyzingPlaylistId === playlist.id ? (
                                    <div className="flex items-center justify-center">
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                        Analyzing...
                                    </div>
                                ) : (
                                    'Analyze Vibe'
                                )}
                            </motion.button>
                        </motion.div>
                    ))}
                </motion.div>
            </div>

            {/* Analysis Progress Modal */}
            <AnimatePresence>
                {analyzingPlaylistId && (
                    <motion.div
                        className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            className="bg-gray-900 rounded-2xl p-8 max-w-md w-full"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                        >
                            <h2 className="text-2xl font-bold mb-6 text-center text-white">
                                Analyzing Playlist
                            </h2>

                            {/* Progress Bar */}
                            <div className="w-full bg-gray-700 rounded-full h-2.5 mb-4">
                                <motion.div
                                    className="bg-emerald-500 h-2.5 rounded-full"
                                    initial={{ width: "0%" }}
                                    animate={{ width: `${analysisProgress}%` }}
                                    transition={{ duration: 0.3 }}
                                />
                            </div>

                            {/* Step Indicator */}
                            <div className="text-center mb-6">
                                <p className="text-gray-300 text-sm mb-1">
                                    Step {currentStep + 1} of {ANALYSIS_STEPS.length}
                                </p>
                                <p className="text-white font-medium">
                                    {ANALYSIS_STEPS[currentStep]}...
                                </p>
                            </div>

                            {/* Progress Percentage */}
                            <div className="text-center">
                                <span className="text-3xl font-bold text-emerald-400">
                                    {analysisProgress}%
                                </span>
                                <p className="text-gray-400 text-sm mt-1">complete</p>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Results Modal */}
            <AnimatePresence>
                {analysisResults && (
                    <motion.div
                        className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={closeResultsModal}
                    >
                        <motion.div
                            className="bg-gray-900 rounded-2xl p-6 max-w-2xl max-h-[80vh] overflow-y-auto w-full"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex justify-between items-start mb-6">
                                <h2 className="text-2xl font-bold text-white">
                                    Your Vibe Report: {analysisResults.playlist_name}
                                </h2>
                                <button
                                    onClick={closeResultsModal}
                                    className="text-gray-400 hover:text-white"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            {/* Statistics Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                                <div className="bg-gray-800 p-4 rounded-lg text-center">
                                    <div className="text-2xl font-bold text-emerald-400">
                                        {analysisResults.quantitative_analysis.track_count}
                                    </div>
                                    <div className="text-sm text-gray-400">Total Tracks</div>
                                </div>
                                <div className="bg-gray-800 p-4 rounded-lg text-center">
                                    <div className="text-2xl font-bold text-emerald-400">
                                        {analysisResults.quantitative_analysis.artists_count}
                                    </div>
                                    <div className="text-sm text-gray-400">Unique Artists</div>
                                </div>
                                <div className="bg-gray-800 p-4 rounded-lg text-center">
                                    <div className="text-2xl font-bold text-emerald-400">
                                        {Math.round(analysisResults.quantitative_analysis.avg_popularity)}%
                                    </div>
                                    <div className="text-sm text-gray-400">Avg Popularity</div>
                                </div>
                                <div className="bg-gray-800 p-4 rounded-lg text-center">
                                    <div className="text-2xl font-bold text-emerald-400">
                                        {Math.round(analysisResults.quantitative_analysis.duration_minutes)}
                                    </div>
                                    <div className="text-sm text-gray-400">Minutes</div>
                                </div>
                            </div>

                            {/* Audio Features Radar Chart */}
                            <div className="mb-8">
                                <h3 className="text-xl font-semibold mb-4 text-white">🎵 Audio Features Profile</h3>
                                <div className="bg-gray-800 p-6 rounded-lg">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {[
                                            { key: 'danceability', label: 'Danceability', icon: '💃' },
                                            { key: 'energy', label: 'Energy', icon: '⚡' },
                                            { key: 'valence', label: 'Valence', icon: '😊' },
                                            { key: 'acousticness', label: 'Acousticness', icon: '🎸' },
                                            { key: 'instrumentalness', label: 'Instrumental', icon: '🎼' },
                                            { key: 'liveness', label: 'Liveness', icon: '🎤' },
                                            { key: 'speechiness', label: 'Speechiness', icon: '🗣️' },
                                            { key: 'tempo', label: 'Tempo', icon: '🎼' }
                                        ].map((feature, index) => {
                                            const value = getNumericValue(analysisResults.quantitative_analysis, `avg_${feature.key}`);
                                            const percentage = feature.key === 'tempo' ? Math.min(value / 200 * 100, 100) : value * 100;

                                            return (
                                                <motion.div
                                                    key={feature.key}
                                                    className="text-center"
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ duration: 0.5, delay: index * 0.1 }}
                                                >
                                                    <motion.div
                                                        className="text-2xl mb-2"
                                                        whileHover={{ scale: 1.2, rotate: 5 }}
                                                        transition={{ type: "spring", stiffness: 300 }}
                                                    >
                                                        {feature.icon}
                                                    </motion.div>
                                                    <div className="text-sm text-gray-300 mb-2">{feature.label}</div>
                                                    <div className="w-full bg-gray-700 rounded-full h-2 mb-1">
                                                        <motion.div
                                                            className="bg-gradient-to-r from-emerald-400 to-cyan-400 h-2 rounded-full"
                                                            initial={{ width: "0%" }}
                                                            animate={{ width: `${Math.max(percentage, 5)}%` }}
                                                            transition={{ duration: 1.5, delay: index * 0.1, ease: "easeOut" }}
                                                        ></motion.div>
                                                    </div>
                                                    <div className="text-xs text-gray-400">
                                                        {feature.key === 'tempo' ? `${Math.round(value)} BPM` : `${Math.round(percentage)}%`}
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* Music Taste Insights */}
                            <div className="mb-8">
                                <h3 className="text-xl font-semibold mb-4 text-white">🎯 Your Music Taste Insights</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Diversity Score */}
                                    <motion.div
                                        className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 p-4 rounded-lg border border-purple-500/20"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ duration: 0.5, delay: 0.1 }}
                                        whileHover={{ scale: 1.02, y: -2 }}
                                    >
                                        <div className="flex items-center mb-2">
                                            <motion.span
                                                className="text-2xl mr-2"
                                                animate={{ rotate: [0, 10, -10, 0] }}
                                                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                                            >
                                                🌈
                                            </motion.span>
                                            <span className="font-semibold text-purple-300">Diversity Score</span>
                                        </div>
                                        <motion.div
                                            className="text-3xl font-bold text-purple-400 mb-1"
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ duration: 0.5, delay: 0.3, type: "spring" }}
                                        >
                                            {Math.round((analysisResults.quantitative_analysis.artists_count / analysisResults.quantitative_analysis.track_count) * 100)}%
                                        </motion.div>
                                        <div className="text-sm text-gray-300">
                                            {analysisResults.quantitative_analysis.artists_count / analysisResults.quantitative_analysis.track_count > 0.7
                                                ? "You love exploring different artists!"
                                                : analysisResults.quantitative_analysis.artists_count / analysisResults.quantitative_analysis.track_count > 0.4
                                                    ? "You have a balanced mix of artists"
                                                    : "You tend to stick with favorite artists"}
                                        </div>
                                    </motion.div>

                                    {/* Mood Profile */}
                                    <motion.div
                                        className="bg-gradient-to-br from-blue-900/20 to-cyan-900/20 p-4 rounded-lg border border-blue-500/20"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ duration: 0.5, delay: 0.2 }}
                                        whileHover={{ scale: 1.02, y: -2 }}
                                    >
                                        <div className="flex items-center mb-2">
                                            <motion.span
                                                className="text-2xl mr-2"
                                                animate={{ scale: [1, 1.1, 1] }}
                                                transition={{ duration: 2, repeat: Infinity, repeatDelay: 4 }}
                                            >
                                                🎭
                                            </motion.span>
                                            <span className="font-semibold text-blue-300">Mood Profile</span>
                                        </div>
                                        <motion.div
                                            className="text-lg font-bold text-blue-400 mb-1"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ duration: 0.5, delay: 0.4 }}
                                        >
                                            {getNumericValue(analysisResults.quantitative_analysis, 'avg_valence') > 0.6
                                                ? "Upbeat & Positive"
                                                : getNumericValue(analysisResults.quantitative_analysis, 'avg_valence') > 0.4
                                                    ? "Balanced & Mellow"
                                                    : "Deep & Introspective"}
                                        </motion.div>
                                        <div className="text-sm text-gray-300">
                                            {getNumericValue(analysisResults.quantitative_analysis, 'avg_energy') > 0.7
                                                ? "High energy tracks dominate your playlist"
                                                : getNumericValue(analysisResults.quantitative_analysis, 'avg_energy') > 0.4
                                                    ? "You enjoy a mix of energetic and calm music"
                                                    : "You prefer more relaxed, chill vibes"}
                                        </div>
                                    </motion.div>

                                    {/* Listening Style */}
                                    <motion.div
                                        className="bg-gradient-to-br from-green-900/20 to-emerald-900/20 p-4 rounded-lg border border-green-500/20"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ duration: 0.5, delay: 0.3 }}
                                        whileHover={{ scale: 1.02, y: -2 }}
                                    >
                                        <div className="flex items-center mb-2">
                                            <motion.span
                                                className="text-2xl mr-2"
                                                animate={{ rotate: [0, 5, -5, 0] }}
                                                transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
                                            >
                                                🎧
                                            </motion.span>
                                            <span className="font-semibold text-green-300">Listening Style</span>
                                        </div>
                                        <motion.div
                                            className="text-lg font-bold text-green-400 mb-1"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ duration: 0.5, delay: 0.5 }}
                                        >
                                            {getNumericValue(analysisResults.quantitative_analysis, 'avg_acousticness') > 0.7
                                                ? "Acoustic Lover"
                                                : getNumericValue(analysisResults.quantitative_analysis, 'avg_acousticness') > 0.3
                                                    ? "Mixed Preferences"
                                                    : "Electronic Enthusiast"}
                                        </motion.div>
                                        <div className="text-sm text-gray-300">
                                            {getNumericValue(analysisResults.quantitative_analysis, 'avg_instrumentalness') > 0.5
                                                ? "You appreciate instrumental music"
                                                : "You prefer music with vocals"}
                                        </div>
                                    </motion.div>

                                    {/* Popularity Trend */}
                                    <motion.div
                                        className="bg-gradient-to-br from-orange-900/20 to-red-900/20 p-4 rounded-lg border border-orange-500/20"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ duration: 0.5, delay: 0.4 }}
                                        whileHover={{ scale: 1.02, y: -2 }}
                                    >
                                        <div className="flex items-center mb-2">
                                            <motion.span
                                                className="text-2xl mr-2"
                                                animate={{ y: [0, -2, 0] }}
                                                transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 3 }}
                                            >
                                                📈
                                            </motion.span>
                                            <span className="font-semibold text-orange-300">Popularity Trend</span>
                                        </div>
                                        <motion.div
                                            className="text-lg font-bold text-orange-400 mb-1"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ duration: 0.5, delay: 0.6 }}
                                        >
                                            {analysisResults.quantitative_analysis.avg_popularity > 70
                                                ? "Mainstream Lover"
                                                : analysisResults.quantitative_analysis.avg_popularity > 40
                                                    ? "Balanced Taste"
                                                    : "Underground Explorer"}
                                        </motion.div>
                                        <div className="text-sm text-gray-300">
                                            {analysisResults.quantitative_analysis.avg_popularity > 70
                                                ? "You enjoy popular, well-known tracks"
                                                : analysisResults.quantitative_analysis.avg_popularity > 40
                                                    ? "You have a mix of popular and niche music"
                                                    : "You discover hidden gems and lesser-known artists"}
                                        </div>
                                    </motion.div>
                                </div>
                            </div>

                            {/* AI Vibe Report */}
                            <div className="bg-gradient-to-br from-emerald-900/20 to-cyan-900/20 p-6 rounded-lg mb-6">
                                <h3 className="text-xl font-semibold mb-4 text-emerald-300">✨ AI Vibe Analysis</h3>
                                <div className="prose prose-invert max-w-none">
                                    <p className="text-gray-200 whitespace-pre-wrap leading-relaxed">
                                        {analysisResults.ai_vibe_report}
                                    </p>
                                </div>
                            </div>

                            {/* Top Artists */}
                            {analysisResults.quantitative_analysis.top_artists && (
                                <div className="mb-6">
                                    <h3 className="text-xl font-semibold mb-4 text-white">🎤 Top Artists</h3>
                                    <div className="space-y-3">
                                        {Object.entries(analysisResults.quantitative_analysis.top_artists)
                                            .slice(0, 5)
                                            .map(([artist, count], index) => {
                                                const maxCount = Math.max(...Object.values(analysisResults.quantitative_analysis.top_artists));
                                                const percentage = (count / maxCount) * 100;

                                                return (
                                                    <div key={artist} className="flex items-center space-x-3">
                                                        <div className="text-lg font-bold text-emerald-400 w-8">
                                                            #{index + 1}
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="flex justify-between items-center mb-1">
                                                                <span className="text-white font-medium">{artist}</span>
                                                                <span className="text-emerald-400 text-sm">{count} tracks</span>
                                                            </div>
                                                            <div className="w-full bg-gray-700 rounded-full h-2">
                                                                <div
                                                                    className="bg-gradient-to-r from-emerald-400 to-cyan-400 h-2 rounded-full transition-all duration-1000"
                                                                    style={{ width: `${percentage}%` }}
                                                                ></div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                    </div>
                                </div>
                            )}

                            {/* Playlist Summary */}
                            <div className="mb-6">
                                <h3 className="text-xl font-semibold mb-4 text-white">📊 Playlist Summary</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="bg-gray-800 p-4 rounded-lg">
                                        <div className="text-sm text-gray-400 mb-1">Explicit Content</div>
                                        <div className="text-2xl font-bold text-emerald-400">
                                            {Math.round(analysisResults.quantitative_analysis.explicit_ratio * 100)}%
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {analysisResults.quantitative_analysis.explicit_ratio > 0.5
                                                ? "Mostly explicit content"
                                                : analysisResults.quantitative_analysis.explicit_ratio > 0.2
                                                    ? "Some explicit content"
                                                    : "Clean playlist"}
                                        </div>
                                    </div>

                                    <div className="bg-gray-800 p-4 rounded-lg">
                                        <div className="text-sm text-gray-400 mb-1">Average Track Length</div>
                                        <div className="text-2xl font-bold text-emerald-400">
                                            {Math.round(analysisResults.quantitative_analysis.duration_minutes / analysisResults.quantitative_analysis.track_count * 60)}s
                                        </div>
                                        <div className="text-xs text-gray-500">per track</div>
                                    </div>

                                    <div className="bg-gray-800 p-4 rounded-lg">
                                        <div className="text-sm text-gray-400 mb-1">Albums Represented</div>
                                        <div className="text-2xl font-bold text-emerald-400">
                                            {analysisResults.quantitative_analysis.albums_count}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {analysisResults.quantitative_analysis.albums_count / analysisResults.quantitative_analysis.track_count > 0.8
                                                ? "Very diverse albums"
                                                : analysisResults.quantitative_analysis.albums_count / analysisResults.quantitative_analysis.track_count > 0.5
                                                    ? "Good album variety"
                                                    : "Focused on specific albums"}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <button
                                    onClick={closeResultsModal}
                                    className="bg-emerald-500 hover:bg-emerald-400 text-white px-6 py-2 rounded-full font-medium transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}