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
        <div className="min-h-screen bg-background text-foreground flex flex-col relative">
            <ParticleBackground />
            
            <div className="relative z-10 flex flex-col flex-1">
                {/* Header */}
                <header className="fixed top-0 left-0 right-0 z-50">
                    <div className="flex items-center justify-between h-20 px-6 md:px-12">
                        <motion.h1 
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, delay: 1.2 }}
                            className="text-2xl font-heading font-bold text-gradient cursor-pointer"
                            onClick={() => navigate('/')}
                        >
                            Direktor
                        </motion.h1>
                        <motion.div 
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, delay: 1.2 }}
                            className="flex items-center space-x-2"
                        >
                            <Button variant="ghost" onClick={() => navigate('/login')}>Login</Button>
                            <Button onClick={() => navigate('/signup')}>Sign Up</Button>
                        </motion.div>
                    </div>
                </header>

                {/* Main Hero Section */}
                <main className="flex-1 flex items-center justify-center text-center px-6">
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="max-w-4xl mx-auto"
                    >
                        <motion.h2
                            variants={itemVariants}
                            className="text-4xl md:text-6xl font-heading font-bold text-foreground leading-tight"
                        >
                            The Future of Tournament Management
                        </motion.h2>
                        <motion.p
                            variants={itemVariants}
                            className="text-lg md:text-xl text-muted-foreground mt-6 max-w-2xl mx-auto"
                        >
                            Run Scrabble tournaments anywhere, anytime—without complex setup or downloads.
                        </motion.p>
                        <motion.div
                            variants={itemVariants}
                            className="mt-10 flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4"
                        >
                            <Button size="xl" className="w-full sm:w-auto shadow-glow" onClick={() => navigate('/signup')}>
                                Get Started for Free
                            </Button>
                            <Button size="xl" variant="outline" className="w-full sm:w-auto" onClick={() => navigate('/documentation')}>
                                <Icon name="BookOpen" className="mr-2" />
                                Read the Docs
                            </Button>
                        </motion.div>
                    </motion.div>
                </main>

                {/* Footer */}
                <footer className="py-8 text-center text-muted-foreground text-sm">
                    <p>&copy; {new Date().getFullYear()} Direktor. All rights reserved.</p>
                </footer>
            </div>
        </div>
    );
};

export default LandingPage;