'use client'

import { motion } from 'framer-motion'
export default function HomePage() {
    return (
        <motion.div
            className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900 text-gray-100"
            initial="hidden"
            animate="show"
            variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { duration: 0.3 } } }}
        >
            {/* Hero Section with Login Button */}
            <section className="container mx-auto px-6 py-24 text-center">
                <motion.h1
                    className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight"
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-20% 0px -20% 0px' }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                >
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-300 via-teal-300 to-cyan-300">Playlist Vibe Check</span>
                </motion.h1>
                <motion.p
                    className="mt-4 text-base sm:text-lg md:text-xl text-gray-300 max-w-2xl mx-auto"
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-20% 0px -20% 0px' }}
                    transition={{ duration: 0.4, delay: 0.1, ease: 'easeOut' }}
                >
                    Discover the story your music tells.
                </motion.p>
                <motion.div
                    className="mt-8 text-center"
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-20% 0px -20% 0px' }}
                    transition={{ duration: 0.4, delay: 0.2, ease: 'easeOut' }}
                >
                    <p className="text-sm text-gray-400">
                        Use the navigation bar above to sign in with Spotify
                    </p>
                </motion.div>
            </section>

            {/* How It Works Section */}
            <section className="container mx-auto px-6 py-12">
                <motion.h2
                    className="text-center text-2xl sm:text-3xl font-bold"
                    initial={{ opacity: 0, y: 8 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4 }}
                >
                    How It Works
                </motion.h2>
                <motion.div
                    className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, amount: 0.3 }}
                    variants={{
                        hidden: { opacity: 1 },
                        show: { opacity: 1, transition: { staggerChildren: 0.12 } },
                    }}
                >
                    {/* Step 1 */}
                    <motion.div
                        className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm shadow-sm hover:shadow-emerald-500/10 transition"
                        variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' } } }}
                        whileHover={{ y: -2 }}
                    >
                        <div className="flex items-center gap-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300 font-bold">1</div>
                            <h3 className="text-lg font-semibold">Connect & Choose</h3>
                        </div>
                        <p className="mt-3 text-sm text-gray-300">Securely connect your Spotify account and choose any playlist to analyze.</p>
                    </motion.div>
                    {/* Step 2 */}
                    <motion.div
                        className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm shadow-sm hover:shadow-emerald-500/10 transition"
                        variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' } } }}
                        whileHover={{ y: -2 }}
                    >
                        <div className="flex items-center gap-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300 font-bold">2</div>
                            <h3 className="text-lg font-semibold">Crunch the Numbers</h3>
                        </div>
                        <p className="mt-3 text-sm text-gray-300">Our engine performs a deep analysis of your tracks, genres, and audio features.</p>
                    </motion.div>
                    {/* Step 3 */}
                    <motion.div
                        className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm shadow-sm hover:shadow-emerald-500/10 transition"
                        variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' } } }}
                        whileHover={{ y: -2 }}
                    >
                        <div className="flex items-center gap-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300 font-bold">3</div>
                            <h3 className="text-lg font-semibold">Get Your Vibe Report</h3>
                        </div>
                        <p className="mt-3 text-sm text-gray-300">Receive a unique AI-powered report explaining what your music says about you.</p>
                    </motion.div>
                </motion.div>
            </section>

            {/* GitHub / About Section */}
            <section className="container mx-auto px-6 py-16">
                <motion.div
                    className="mx-auto max-w-3xl rounded-2xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur-sm"
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                >
                    <h2 className="text-2xl sm:text-3xl font-bold">Open & Transparent</h2>
                    <p className="mt-3 text-gray-300">This is a passion project built for the developer community.</p>
                    <motion.a
                        href="https://github.com/jsosa9/playlist-vibe-check"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-6 inline-flex items-center justify-center rounded-full border border-emerald-400/40 bg-emerald-400/10 px-5 py-2.5 text-sm font-medium text-emerald-300 hover:bg-emerald-400/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
                        whileHover={{ scale: 1.02, y: -1 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        View on GitHub
                    </motion.a>
                    <p className="mt-4 text-sm text-gray-400">Built with Next.js, FastAPI, Spotify API, and OpenAI.</p>
                </motion.div>
            </section>
        </motion.div>
    );
}