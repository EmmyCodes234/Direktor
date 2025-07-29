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
                delayChildren: 0.3 // Delay child animations slightly after container appears
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
                {/* Header - Added backdrop-blur for glassmorphism effect */}
                <header className="fixed top-0 left-0 right-0 z-50 bg-background/50 backdrop-blur-md border-b border-primary/10 shadow-sm">
                    <div className="flex items-center justify-between h-20 px-6 md:px-12 max-w-7xl mx-auto">
                        <motion.h1
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, delay: 0.8 }}
                            // Adjusted delay for header animation
                            className="text-2xl md:text-3xl font-heading font-extrabold text-gradient cursor-pointer hover:scale-105 transition-transform"
                            onClick={() => navigate('/')}
                        >
                            Direktor
                        </motion.h1>
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, delay: 0.8 }}
                            // Adjusted delay for header animation
                            className="flex items-center space-x-2"
                        >
                            <Button variant="ghost" onClick={() => navigate('/login')} className="hover:text-primary transition-colors">Login</Button>
                            <Button onClick={() => navigate('/signup')} className="shadow-sm hover:shadow-md transition-shadow">Sign Up</Button>
                        </motion.div>
                    </div>
                </header>

                {/* Main Hero Section */}
                <main className="flex-1 flex items-center justify-center text-center px-6 pt-24 pb-12"> {/* Added pt for header offset */}
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="max-w-4xl mx-auto"
                    >
                        <motion.h2
                            variants={itemVariants}
                            className="text-4xl md:text-6xl lg:text-7xl font-heading font-bold text-gradient leading-tight md:leading-tight"
                        >
                            The Future of <br className="hidden sm:inline" /> Tournament Management
                        </motion.h2>
                        <motion.p
                            variants={itemVariants}
                            className="text-lg md:text-xl text-muted-foreground mt-6 max-w-2xl mx-auto leading-relaxed"
                        >
                            Run Scrabble tournaments anywhere, anytime—without complex setup or downloads.
                            Streamline your events with intuitive pairing, scoring, and ranking.
                        </motion.p>
                        <motion.div
                            variants={itemVariants}
                            className="mt-10 flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4"
                        >
                            <Button size="xl" className="w-full sm:w-auto shadow-glow animate-pulse-bright" onClick={() => navigate('/signup')}>
                                Get Started for Free
                            </Button>
                            <Button size="xl" variant="outline" className="w-full sm:w-auto border-primary/30 text-primary hover:bg-primary/10 transition-colors" onClick={() => navigate('/documentation')}>
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