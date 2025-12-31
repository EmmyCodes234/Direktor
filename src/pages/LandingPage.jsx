import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HeroSection } from '../components/ui/HeroSection';
import Button from '../components/ui/Button';
import Icon from '../components/AppIcon';
import { MobileOptimizer } from '../components/ui/MobileOptimizer';
import { designTokens, LAYOUT_TEMPLATES, ANIMATION_TEMPLATES } from '../design-system';
import { cn } from '../utils/cn';
import { BentoGrid, BentoGridItem } from '../components/landing/BentoGrid';
import { ProductMockup } from '../components/landing/ProductMockup';
import { StatsTicker } from '../components/landing/StatsTicker';

const LandingPage = () => {
    const navigate = useNavigate();

    return (
        <MobileOptimizer>
            <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
                {/* Header - Mobile Optimized */}
                {/* Header - Mobile Optimized */}
                <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-background/95 border-b border-border shadow-sm">

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
                                {/* Logo - Monochrome */}
                                <span className="relative text-foreground font-bold tracking-tight group-hover:opacity-80 transition-opacity duration-300">
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
                {/* Hero Section - Mobile Optimized */}
                <HeroSection
                    title="Direktor"
                    subtitle={{
                        regular: "World-Class Scrabble.",
                        gradient: "Simplifed."
                    }}
                    description="The professional standard for tournament management. Advanced pairings, real-time standings, and automated reporting in one unified platform."
                    ctaText="Start Now"
                    onCtaClick={() => navigate('/signup')}
                    gridOptions={{
                        angle: 65,
                        opacity: 0.15,
                        cellSize: 50,
                        lightLineColor: "#e5e7eb",
                        darkLineColor: "#27272a"
                    }}
                    className="pt-16 sm:pt-20"
                />

                {/* 3D Product Mockup */}
                <section className="px-4 -mt-20 relative z-10 mb-24">
                    <ProductMockup />
                </section>

                {/* Stats Ticker */}
                <StatsTicker />

                {/* Feature Highlights - Bento Grid */}
                <section className="py-32 bg-background relative border-t border-border">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16 text-center">
                        <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6">Everything you need to run a tournament.</h2>
                        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                            Built by directors, for directors. Every feature is designed to save you time and reduce errors.
                        </p>
                    </div>

                    <BentoGrid>
                        <BentoGridItem
                            title="AI-Powered Pairings"
                            description="Automatically generate balanced pairings using Swiss or Round Robin algorithms. Supports Gibsonization and class avoidance."
                            header={<div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-neutral-100 to-neutral-50 dark:from-neutral-900 dark:to-neutral-800 flex items-center justify-center"><Icon name="Network" className="w-16 h-16 opacity-10" /></div>}
                            icon={<Icon name="Network" className="h-4 w-4 text-neutral-500" />}
                            className="md:col-span-2"
                        />
                        <BentoGridItem
                            title="Real-Time Standings"
                            description="Live leaderboards that update instantly as results are entered. Shareable links for players and spectators."
                            header={<div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-neutral-100 to-neutral-50 dark:from-neutral-900 dark:to-neutral-800 flex items-center justify-center"><Icon name="BarChart3" className="w-16 h-16 opacity-10" /></div>}
                            icon={<Icon name="BarChart3" className="h-4 w-4 text-neutral-500" />}
                            className="md:col-span-1"
                        />
                        <BentoGridItem
                            title="Player Management"
                            description="Comprehensive profiles, rating history, and automated conflict detection. Import rosters via CSV or NASPA ID."
                            header={<div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-neutral-100 to-neutral-50 dark:from-neutral-900 dark:to-neutral-800 flex items-center justify-center"><Icon name="Users" className="w-16 h-16 opacity-10" /></div>}
                            icon={<Icon name="Users" className="h-4 w-4 text-neutral-500" />}
                            className="md:col-span-1"
                        />
                        <BentoGridItem
                            title="Automated Reporting"
                            description="One-click submission to rating agencies. Detailed statistical breakdowns and prize distribution calculation."
                            header={<div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-neutral-100 to-neutral-50 dark:from-neutral-900 dark:to-neutral-800 flex items-center justify-center"><Icon name="FileText" className="w-16 h-16 opacity-10" /></div>}
                            icon={<Icon name="FileText" className="h-4 w-4 text-neutral-500" />}
                            className="md:col-span-2"
                        />
                    </BentoGrid>
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
                                <div className="text-2xl sm:text-3xl font-heading font-bold text-foreground mb-3 sm:mb-4">
                                    Direktor
                                </div>
                                <p className="text-muted-foreground text-base sm:text-lg leading-relaxed max-w-2xl mx-auto px-4">
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
                                        className="text-muted-foreground hover:text-foreground transition-colors duration-300 hover:scale-105 transform min-h-[44px] px-3 py-2 rounded-lg touch-target"
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