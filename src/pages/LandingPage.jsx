import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HeroSection } from '../components/ui/HeroSection';
import Button from '../components/ui/Button';
import Icon from '../components/AppIcon';
import { MobileOptimizer } from '../components/ui/MobileOptimizer';
import { designTokens, LAYOUT_TEMPLATES, ANIMATION_TEMPLATES } from '../design-system';
import { cn } from '../utils/cn';

const LandingPage = () => {
    const navigate = useNavigate();

    return (
        <MobileOptimizer>
            <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
                {/* Header - Mobile Optimized */}
                <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-gradient-to-r from-zinc-50/90 via-white/95 to-zinc-100/90 dark:from-zinc-950/90 dark:via-zinc-900/95 dark:to-zinc-950/90 border-b border-zinc-200/50 dark:border-zinc-700/50 shadow-lg shadow-purple-500/5 dark:shadow-purple-500/10">
                    {/* Purple gradient background overlay - Simplified for mobile */}
                    <div className="absolute inset-0 bg-purple-950/5 dark:bg-purple-950/10" />
                    
                    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between h-16 sm:h-16">
                            {/* Logo/Brand - Mobile Optimized */}
                            <motion.button
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.4, delay: 0.2 }}
                                className="relative text-xl sm:text-2xl md:text-3xl font-heading font-extrabold hover:scale-105 transition-all duration-300 focus-ring rounded-lg p-2 min-h-[44px] min-w-[44px] touch-target group"
                                onClick={() => navigate('/')}
                                aria-label="Direktor home"
                            >
                                {/* Logo background with gradient - Simplified */}
                                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-500 rounded-lg opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
                                
                                {/* Logo text with gradient */}
                                <span className="relative bg-gradient-to-r from-zinc-900 to-zinc-700 dark:from-white dark:to-zinc-300 bg-clip-text text-transparent group-hover:bg-gradient-to-r group-hover:from-purple-600 group-hover:to-pink-500 group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300">
                                    Direktor
                                </span>
                            </motion.button>
                            
                            {/* Right side actions - Mobile Optimized */}
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="flex items-center gap-2 sm:gap-4"
                            >
                                <Button 
                                    variant="ghost" 
                                    onClick={() => navigate('/login')}
                                    className="hover:text-primary min-h-[44px] px-3 sm:px-4 text-sm sm:text-base"
                                >
                                    Login
                                </Button>
                                <Button 
                                    onClick={() => navigate('/signup')}
                                    className="shadow-lg hover:shadow-xl transition-shadow min-h-[44px] px-3 sm:px-4 text-sm sm:text-base"
                                >
                                    Sign Up
                                </Button>
                            </motion.div>
                        </div>
                    </div>
                </header>

                {/* Hero Section - Mobile Optimized */}
                <HeroSection
                    title="Run World-Class Scrabble Tournaments — with Direktor."
                    subtitle={{
                        regular: "Powerful. Professional. ",
                        gradient: "Effortless."
                    }}
                    description="Join tournament directors worldwide who trust Direktor for their competitive Scrabble events. Advanced algorithms, real-time updates, and professional-grade features — all in one platform."
                    ctaText="Sign Up"
                    onCtaClick={() => navigate('/signup')}
                    gridOptions={{
                        angle: 65,
                        opacity: 0.2, // Reduced opacity for mobile performance
                        cellSize: 60, // Increased cell size for mobile
                        lightLineColor: "#e5e7eb",
                        darkLineColor: "#374151"
                    }}
                    className="pt-16 sm:pt-20"
                />

                {/* Feature Highlights */}
                <section className="py-16 sm:py-20">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                            {[
                                { title: "AI-Powered Pairings", icon: "Network" },
                                { title: "Live Standings", icon: "BarChart3" },
                                { title: "Gibsonization", icon: "Settings" },
                                { title: "Professional Results", icon: "FileText" }
                            ].map((feature, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: index * 0.1 }}
                                    className="text-center p-4 sm:p-6 bg-card/50 backdrop-blur-sm rounded-xl border border-border/20 hover:bg-card/80 transition-all duration-300 group"
                                >
                                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3 sm:mb-4 group-hover:bg-primary/20 transition-colors">
                                        <Icon name={feature.icon} size={24} className="text-primary" />
                                    </div>
                                    <h3 className="text-sm sm:text-base font-medium text-foreground group-hover:text-primary transition-colors">
                                        {feature.title}
                                    </h3>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Footer - Mobile Optimized */}
                <footer className="bg-zinc-900 dark:bg-zinc-950 text-white py-8 sm:py-12">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center">
                            {/* Brand section */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-50px" }}
                                className="mb-6 sm:mb-8"
                            >
                                <div className="text-2xl sm:text-3xl font-heading font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent mb-3 sm:mb-4">
                                    Direktor
                                </div>
                                <p className="text-gray-300 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto px-4">
                                    Professional tournament management software built specifically for the Scrabble community. 
                                    Streamline your events with powerful automation tools.
                                </p>
                            </motion.div>
                            
                            {/* Quick links - Mobile Optimized */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-50px" }}
                                className="flex flex-wrap justify-center gap-4 sm:gap-6 mb-6 sm:mb-8 px-4"
                            >
                                {['Tournaments', 'Players', 'Dashboard', 'Settings'].map((link, index) => (
                                    <motion.button
                                        key={link}
                                        initial={{ opacity: 0, y: 10 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true, margin: "-50px" }}
                                        transition={{ delay: index * 0.1 }}
                                        className="text-gray-300 hover:text-white transition-colors duration-300 hover:scale-105 transform min-h-[44px] px-3 py-2 rounded-lg touch-target"
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
                            viewport={{ once: true, margin: "-50px" }}
                            className="pt-4 sm:pt-6 border-t border-gray-700/50 text-center"
                        >
                            <div className="text-gray-400 text-xs sm:text-sm px-4">
                                © 2024 Direktor. Built with ❤️ for the Scrabble community.
                            </div>
                        </motion.div>
                    </div>
                </footer>
            </div>
        </MobileOptimizer>
    );
};

export default LandingPage;