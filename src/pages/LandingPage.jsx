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
import PublicFooter from '../components/public/PublicFooter';

const LandingPage = () => {
    const navigate = useNavigate();

    return (
        <MobileOptimizer>
            <div className="dark min-h-screen bg-[#020617] text-slate-200 selection:bg-emerald-500/30 selection:text-emerald-200 font-sans overflow-x-hidden">
                {/* Header - Mobile Optimized */}
                <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-[#020617]/80 border-b border-slate-800 shadow-sm">

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
                                <span className="relative text-slate-100 font-bold tracking-tight group-hover:opacity-80 transition-opacity duration-300">
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
                                    className="hover:text-emerald-400 hover:bg-emerald-950/30 min-h-[44px] px-3 sm:px-4 text-sm sm:text-base text-slate-300"
                                >
                                    Login
                                </Button>
                                <Button
                                    onClick={() => navigate('/signup')}
                                    className="bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/20 hover:shadow-xl hover:shadow-emerald-900/30 transition-all min-h-[44px] px-3 sm:px-4 text-sm sm:text-base border-0"
                                >
                                    Sign Up
                                </Button>
                            </motion.div>
                        </div>
                    </div>
                </header>

                {/* Hero Section - Mobile Optimized */}
                <HeroSection
                    badge={{ text: "Introducing AI-Powered Pairings", href: "#features" }}
                    title="Direktor"
                    subtitle={{
                        regular: "The best way to run ",
                        gradient: "your tournaments."
                    }}
                    description="Our app eliminates the need for complex spreadsheets and endless email threads, empowering directors to achieve greater efficiency."
                    ctaText="Get started"
                    ctaClassName="bg-white text-black hover:bg-slate-200"
                    secondaryCtaText="Learn more"
                    onCtaClick={() => navigate('/signup')}
                    onSecondaryCtaClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}
                    gridOptions={{
                        angle: 65,
                        opacity: 0.4,
                        cellSize: 50,
                        lightLineColor: "#334155",
                        darkLineColor: "#1e293b"
                    }}
                    className="pt-16 sm:pt-20"
                />

                {/* 3D Product Mockup - Floating & Glowing */}
                <section className="px-4 -mt-20 relative z-10 mb-32">
                    <motion.div
                        initial={{ opacity: 0, y: 40, scale: 0.95 }}
                        whileInView={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 1 }}
                        viewport={{ once: true }}
                        className="max-w-6xl mx-auto"
                    >
                        <div className="rounded-xl border border-white/10 bg-[#020617]/50 backdrop-blur-xl shadow-2xl shadow-emerald-500/10 overflow-hidden ring-1 ring-white/5">
                            <ProductMockup />
                        </div>
                    </motion.div>
                </section>


                {/* Features Section Container - Dark */}
                <section id="features" className="py-32 bg-[#020617] relative border-t border-slate-800/50">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16 text-center">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                        >
                            <h2 className="text-3xl md:text-5xl font-heading font-bold tracking-tight mb-6 text-white text-balance">
                                Everything you need to run a <span className="text-emerald-400">world-class</span> tournament.
                            </h2>
                            <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
                                Built for professional directors. Engineered for speed, reliability, and precision.
                            </p>
                        </motion.div>
                    </div>

                    <BentoGrid>
                        <BentoGridItem
                            title="AI-Powered Pairings"
                            description="Automatically generate balanced pairings using Swiss or Round Robin algorithms. Supports Gibsonization and class avoidance."
                            header={<div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center border border-slate-700/50"><Icon name="Network" className="w-16 h-16 opacity-20 text-emerald-500" /></div>}
                            icon={<Icon name="Network" className="h-4 w-4 text-emerald-500" />}
                            className="md:col-span-2"
                        />
                        <BentoGridItem
                            title="Real-Time Standings"
                            description="Live leaderboards that update instantly as results are entered. Shareable links for players and spectators."
                            header={<div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center border border-slate-700/50"><Icon name="BarChart3" className="w-16 h-16 opacity-20 text-emerald-500" /></div>}
                            icon={<Icon name="BarChart3" className="h-4 w-4 text-emerald-500" />}
                            className="md:col-span-1"
                        />
                        <BentoGridItem
                            title="Player Management"
                            description="Comprehensive profiles, rating history, and automated conflict detection. Import rosters via CSV or NASPA ID."
                            header={<div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center border border-slate-700/50"><Icon name="Users" className="w-16 h-16 opacity-20 text-emerald-500" /></div>}
                            icon={<Icon name="Users" className="h-4 w-4 text-emerald-500" />}
                            className="md:col-span-1"
                        />
                        <BentoGridItem
                            title="Automated Reporting"
                            description="One-click submission to rating agencies. Detailed statistical breakdowns and prize distribution calculation."
                            header={<div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center border border-slate-700/50"><Icon name="FileText" className="w-16 h-16 opacity-20 text-emerald-500" /></div>}
                            icon={<Icon name="FileText" className="h-4 w-4 text-emerald-500" />}
                            className="md:col-span-2"
                        />
                    </BentoGrid>
                </section>

                <PublicFooter />
            </div>
        </MobileOptimizer >
    );
};

export default LandingPage;