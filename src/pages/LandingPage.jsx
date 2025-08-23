import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Button from '../components/ui/Button';
import ParticleBackground from '../components/ui/ParticleBackground';
import Icon from '../components/AppIcon';

const LandingPage = () => {
    const navigate = useNavigate();

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.3
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.6,
                ease: 'easeOut'
            },
        },
    };

    return (
        <div className="layout-mobile text-foreground flex flex-col relative overflow-hidden">
            <ParticleBackground />

            <div className="relative z-10 flex flex-col flex-1">
                {/* Header */}
                <header className="mobile-nav-top">
                    <div className="container-mobile">
                        <div className="flex items-center justify-between h-16 sm:h-20">
                            <motion.button
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.4, delay: 0.2 }}
                                className="text-xl sm:text-2xl md:text-3xl font-heading font-extrabold text-primary hover:scale-105 transition-transform focus-ring rounded-lg p-2 touch-target"
                                onClick={() => navigate('/')}
                                aria-label="Direktor home"
                            >
                                Direktor
                            </motion.button>
                            
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.4, delay: 0.2 }}
                                className="flex items-center gap-2 sm:gap-3"
                            >
                                <Button 
                                    variant="ghost" 
                                    onClick={() => navigate('/login')} 
                                    className="hover:text-primary transition-colors focus-ring"
                                    size="mobile-sm"
                                >
                                    Login
                                </Button>
                                <Button 
                                    onClick={() => navigate('/signup')} 
                                    className="shadow-glow hover:shadow-glow-hover transition-shadow"
                                    size="mobile-sm"
                                >
                                    Sign Up
                                </Button>
                            </motion.div>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="flex-1 flex items-center justify-center text-center mobile-padding pt-20 lg:pt-24 pb-12">
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="max-w-4xl mx-auto"
                    >
                        {/* Main Headline */}
                        <motion.h1
                            variants={itemVariants}
                            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold text-primary leading-tight mb-6 lg:mb-8"
                        >
                            Tournament Management
                            <br />
                            <span className="text-foreground">Made Simple</span>
                        </motion.h1>

                        {/* Subtitle */}
                        <motion.p
                            variants={itemVariants}
                            className="text-lg sm:text-xl md:text-2xl text-muted-foreground mb-8 lg:mb-12 max-w-3xl mx-auto leading-relaxed"
                        >
                            Streamline your Scrabble tournaments with powerful tools for pairings, 
                            standings, and player management. Built for directors, by directors.
                        </motion.p>

                        {/* CTA Buttons */}
                        <motion.div
                            variants={itemVariants}
                            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12 lg:mb-16"
                        >
                            <Button
                                onClick={() => navigate('/signup')}
                                size="mobile-lg"
                                className="w-full sm:w-auto shadow-glow hover:shadow-glow-hover transition-all duration-300 transform hover:scale-105"
                            >
                                Get Started Free
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => navigate('/tournament-setup')}
                                size="mobile-lg"
                                className="w-full sm:w-auto"
                            >
                                Create Tournament
                            </Button>
                        </motion.div>

                        {/* Features Grid */}
                        <motion.div
                            variants={itemVariants}
                            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 mb-12 lg:mb-16"
                        >
                            {[
                                {
                                    icon: 'Users',
                                    title: 'Player Management',
                                    description: 'Easily manage tournament rosters, ratings, and player information.'
                                },
                                {
                                    icon: 'Network',
                                    title: 'Smart Pairings',
                                    description: 'Advanced pairing algorithms with rematch prevention and rating-based matching.'
                                },
                                {
                                    icon: 'Trophy',
                                    title: 'Live Standings',
                                    description: 'Real-time standings updates with tiebreakers and performance tracking.'
                                },
                                {
                                    icon: 'BarChart3',
                                    title: 'Analytics',
                                    description: 'Comprehensive tournament analytics and performance insights.'
                                },
                                {
                                    icon: 'Smartphone',
                                    title: 'Mobile Ready',
                                    description: 'Fully responsive design that works perfectly on all devices.'
                                },
                                {
                                    icon: 'Zap',
                                    title: 'Fast & Reliable',
                                    description: 'Lightning-fast performance with offline capabilities and data sync.'
                                }
                            ].map((feature, index) => (
                                <motion.div
                                    key={index}
                                    variants={itemVariants}
                                    className="mobile-card-hover p-6 text-center group"
                                >
                                    <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                                        <Icon name={feature.icon} size={32} className="text-primary" />
                                    </div>
                                    <h3 className="text-lg sm:text-xl font-semibold mb-2 text-foreground">
                                        {feature.title}
                                    </h3>
                                    <p className="text-muted-foreground text-sm sm:text-base">
                                        {feature.description}
                                    </p>
                                </motion.div>
                            ))}
                        </motion.div>

                        {/* Social Proof */}
                        <motion.div
                            variants={itemVariants}
                            className="text-center"
                        >
                            <p className="text-muted-foreground mb-4 text-sm sm:text-base">
                                Trusted by tournament directors worldwide
                            </p>
                            <div className="flex items-center justify-center space-x-8 opacity-60">
                                <div className="text-2xl font-bold text-primary">500+</div>
                                <div className="text-2xl font-bold text-primary">10K+</div>
                                <div className="text-2xl font-bold text-primary">99.9%</div>
                            </div>
                            <div className="flex items-center justify-center space-x-8 text-sm text-muted-foreground">
                                <div>Tournaments</div>
                                <div>Players</div>
                                <div>Uptime</div>
                            </div>
                        </motion.div>
                    </motion.div>
                </main>

                {/* Footer */}
                <footer className="mobile-padding py-8 border-t border-border/10">
                    <div className="container-mobile">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="text-sm text-muted-foreground">
                                © 2024 Direktor. All rights reserved.
                            </div>
                            <div className="flex items-center space-x-6 text-sm">
                                <a href="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">
                                    Privacy
                                </a>
                                <a href="/terms" className="text-muted-foreground hover:text-foreground transition-colors">
                                    Terms
                                </a>
                                <a href="/support" className="text-muted-foreground hover:text-foreground transition-colors">
                                    Support
                                </a>
                            </div>
                        </div>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default LandingPage;