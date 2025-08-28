import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HeroSection } from '../components/ui/HeroSection';
import Button from '../components/ui/Button';
import { designTokens, LAYOUT_TEMPLATES, ANIMATION_TEMPLATES } from '../design-system';
import { cn } from '../utils/cn';

const LandingPage = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-background text-foreground">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-gradient-to-r from-zinc-50/90 via-white/95 to-zinc-100/90 dark:from-zinc-950/90 dark:via-zinc-900/95 dark:to-zinc-950/90 border-b border-zinc-200/50 dark:border-zinc-700/50 shadow-lg shadow-purple-500/5 dark:shadow-purple-500/10">
                {/* Purple gradient background overlay */}
                <div className="absolute inset-0 bg-purple-950/5 dark:bg-purple-950/10 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(120,119,198,0.08),rgba(255,255,255,0))] dark:bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(120,119,198,0.15),rgba(255,255,255,0))]" />
                
                <div className="relative max-w-7xl mx-auto px-4 lg:px-6">
                    <div className="flex items-center justify-between h-14 sm:h-16">
                        {/* Logo/Brand */}
                        <motion.button
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.4, delay: 0.2 }}
                            className="relative text-xl sm:text-2xl md:text-3xl font-heading font-extrabold hover:scale-105 transition-all duration-300 focus-ring rounded-lg p-2 touch-target group"
                            onClick={() => navigate('/')}
                            aria-label="Direktor home"
                        >
                            {/* Logo background with gradient */}
                            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-500 rounded-lg opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
                            
                            {/* Logo text with gradient */}
                            <span className="relative bg-gradient-to-r from-zinc-900 to-zinc-700 dark:from-white dark:to-zinc-300 bg-clip-text text-transparent group-hover:bg-gradient-to-r group-hover:from-purple-600 group-hover:to-pink-500 group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300">
                                Direktor
                            </span>
                        </motion.button>
                        
                        {/* Right side actions */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-center gap-4"
                        >
                            <Button 
                                variant="ghost" 
                                onClick={() => navigate('/login')}
                                className="hover:text-primary"
                            >
                                Login
                            </Button>
                            <Button 
                                onClick={() => navigate('/signup')}
                                className="shadow-lg hover:shadow-xl transition-shadow"
                            >
                                Sign Up
                            </Button>
                        </motion.div>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <HeroSection
                title="Professional Tournament Management"
                subtitle={{
                    regular: "Streamline your Scrabble tournaments with ",
                    gradient: "powerful automation tools."
                }}
                description="From player registration to final standings, Direktor handles every aspect of tournament organization with precision and ease. Built by tournament directors, for tournament directors."
                ctaText="Start Your Tournament"
                secondaryCtaText="View Demo"
                onCtaClick={() => navigate('/signup')}
                onSecondaryCtaClick={() => navigate('/demo')}
                gridOptions={{
                    angle: 65,
                    opacity: 0.3,
                    cellSize: 50,
                    lightLineColor: "#e5e7eb",
                    darkLineColor: "#374151"
                }}
                className="pt-16"
            />

            {/* Footer */}
            <footer className="bg-zinc-900 dark:bg-zinc-950 text-white py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        {/* Brand section */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="mb-8"
                        >
                            <div className="text-3xl font-heading font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent mb-4">
                                Direktor
                            </div>
                            <p className="text-gray-300 text-lg leading-relaxed max-w-2xl mx-auto">
                                Professional tournament management software built specifically for the Scrabble community. 
                                Streamline your events with powerful automation tools.
                            </p>
                        </motion.div>
                        
                        {/* Quick links */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="flex flex-wrap justify-center gap-6 mb-8"
                        >
                            {['Tournaments', 'Players', 'Dashboard', 'Settings'].map((link, index) => (
                                <motion.button
                                    key={link}
                                    initial={{ opacity: 0, y: 10 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: index * 0.1 }}
                                    className="text-gray-300 hover:text-white transition-colors duration-300 hover:scale-105 transform"
                                >
                                    {link}
                                </motion.button>
                            ))}
                        </motion.div>
                    </div>
                    
                    {/* Bottom section */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="pt-6 border-t border-gray-700/50 text-center"
                    >
                        <div className="text-gray-400 text-sm">
                            © 2024 Direktor. Built with ❤️ for the Scrabble community.
                        </div>
                    </motion.div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;