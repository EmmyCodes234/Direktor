import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Icon from '../components/AppIcon';
import Button from '../components/ui/Button';
import ParticleBackground from '../components/ui/ParticleBackground';

const LandingPage = () => {
    const navigate = useNavigate();

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.2,
                delayChildren: 0.3
            },
        },
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
        <div className="min-h-screen bg-background text-foreground flex flex-col relative overflow-hidden">
            <ParticleBackground />

            <div className="relative z-10 flex flex-col flex-1">
                {/* Header */}
                <header className="fixed top-0 left-0 right-0 z-50 glass-morphism safe-area-inset-top">
                    <div className="flex items-center justify-between h-16 sm:h-20 px-4 sm:px-6 lg:px-12 max-w-7xl mx-auto">
                        <motion.button
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.4, delay: 0.2 }}
                            className="text-xl sm:text-2xl md:text-3xl font-heading font-extrabold text-primary hover:scale-105 transition-transform focus-ring rounded-lg p-2"
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
                                size="sm"
                            >
                                Login
                            </Button>
                            <Button 
                                onClick={() => navigate('/signup')} 
                                className="shadow-glow hover:shadow-glow-hover transition-shadow"
                                size="sm"
                            >
                                Sign Up
                            </Button>
                        </motion.div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="flex-1 flex items-center justify-center text-center px-4 sm:px-6 pt-20 sm:pt-24 pb-12 safe-area-inset-bottom">
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="max-w-4xl mx-auto"
                    >
                        {/* Main Headline */}
                        <motion.h1
                            variants={itemVariants}
                            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-heading font-bold text-primary leading-tight mb-6"
                        >
                            The Future of{' '}
                            <br className="hidden sm:inline" />
                            Tournament Management
                        </motion.h1>

                        {/* Description */}
                        <motion.p
                            variants={itemVariants}
                            className="text-lg sm:text-xl md:text-2xl text-foreground max-w-3xl mx-auto leading-relaxed mb-8"
                        >
                            Run Scrabble tournaments anywhere, anytime—without complex setup or downloads. 
                            Streamline your events with intuitive pairing, scoring, and ranking.
                        </motion.p>

                        {/* CTA Buttons */}
                        <motion.div
                            variants={itemVariants}
                            className="flex flex-col sm:flex-row items-center justify-center gap-4"
                        >
                            <Button 
                                size="xl" 
                                className="w-full sm:w-auto shadow-glow hover:shadow-glow-hover min-w-[200px]" 
                                onClick={() => navigate('/signup')}
                            >
                                Get Started for Free
                            </Button>
                            <Button 
                                size="xl" 
                                variant="ghost" 
                                className="w-full sm:w-auto hover:bg-muted/10 transition-colors min-w-[200px]" 
                                onClick={() => navigate('/documentation')}
                                iconName="BookOpen"
                                iconPosition="left"
                            >
                                Read the Docs
                            </Button>
                        </motion.div>
                    </motion.div>
                </main>

                {/* Footer */}
                <footer className="py-8 text-center text-muted-foreground text-sm">
                    <p>&copy; 2025 Direktor. All rights reserved.</p>
                </footer>
            </div>
        </div>
    );
};

export default LandingPage;