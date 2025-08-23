import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform, useSpring, useMotionValue, useAnimationControls } from 'framer-motion';
import Button from '../components/ui/Button';
import ParticleBackground from '../components/ui/ParticleBackground';
import Icon from '../components/AppIcon';

const LandingPage = () => {
    const navigate = useNavigate();
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [isHovered, setIsHovered] = useState(false);
    const controls = useAnimationControls();
    const { scrollY } = useScroll();
    
    // Parallax effects
    const y1 = useTransform(scrollY, [0, 1000], [0, -200]);
    const y2 = useTransform(scrollY, [0, 1000], [0, -100]);
    const y3 = useTransform(scrollY, [0, 1000], [0, -300]);
    
    // Mouse tracking for interactive elements
    useEffect(() => {
        const handleMouseMove = (e) => {
            setMousePosition({ x: e.clientX, y: e.clientY });
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    // Floating animation variants
    const floatingVariants = {
        float: {
            y: [-10, 10, -10],
            transition: {
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
            }
        }
    };

    // Staggered container animation
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.15,
                delayChildren: 0.2
            }
        }
    };

    // Enhanced item animations
    const itemVariants = {
        hidden: { 
            opacity: 0, 
            y: 30,
            scale: 0.95
        },
        visible: {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: {
                duration: 0.8,
                ease: [0.25, 0.46, 0.45, 0.94]
            },
        },
    };

    // Text reveal animation
    const textRevealVariants = {
        hidden: { 
            opacity: 0,
            y: 50,
            filter: "blur(10px)"
        },
        visible: {
            opacity: 1,
            y: 0,
            filter: "blur(0px)",
            transition: {
                duration: 1,
                ease: "easeOut"
            }
        }
    };

    // Feature card hover animation
    const featureCardVariants = {
        initial: { 
            scale: 1,
            rotateY: 0,
            boxShadow: "0 4px 20px rgba(0,0,0,0.1)"
        },
        hover: {
            scale: 1.05,
            rotateY: 5,
            boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
            transition: {
                duration: 0.3,
                ease: "easeOut"
            }
        }
    };

    // Glowing effect for CTA buttons
    const glowVariants = {
        initial: { 
            boxShadow: "0 0 20px rgba(59, 130, 246, 0.3)",
            scale: 1
        },
        hover: {
            boxShadow: "0 0 40px rgba(59, 130, 246, 0.6)",
            scale: 1.05,
            transition: {
                duration: 0.3,
                ease: "easeOut"
            }
        },
        tap: {
            scale: 0.95,
            transition: {
                duration: 0.1
            }
        }
    };

    // Animated background elements
    const AnimatedBackground = () => (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* Floating geometric shapes */}
            <motion.div
                className="absolute top-20 left-10 w-20 h-20 bg-primary/10 rounded-full"
                animate={{
                    x: [0, 30, 0],
                    y: [0, -20, 0],
                    rotate: [0, 180, 360],
                }}
                transition={{
                    duration: 8,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
            />
            <motion.div
                className="absolute top-40 right-20 w-16 h-16 bg-secondary/10 rounded-lg"
                animate={{
                    x: [0, -25, 0],
                    y: [0, 15, 0],
                    rotate: [0, -90, -180],
                }}
                transition={{
                    duration: 6,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 1
                }}
            />
            <motion.div
                className="absolute bottom-40 left-1/4 w-12 h-12 bg-accent/10 rounded-full"
                animate={{
                    x: [0, 20, 0],
                    y: [0, -30, 0],
                    scale: [1, 1.2, 1],
                }}
                transition={{
                    duration: 7,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 2
                }}
            />
            
            {/* Gradient orbs */}
            <motion.div
                className="absolute top-1/3 right-1/4 w-32 h-32 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-full blur-xl"
                animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.3, 0.6, 0.3],
                }}
                transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
            />
            <motion.div
                className="absolute bottom-1/3 left-1/3 w-24 h-24 bg-gradient-to-r from-accent/20 to-primary/20 rounded-full blur-xl"
                animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.2, 0.5, 0.2],
                }}
                transition={{
                    duration: 5,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 1
                }}
            />
        </div>
    );

    return (
        <div className="layout-mobile text-foreground flex flex-col relative overflow-hidden min-h-screen">
            <ParticleBackground />
            <AnimatedBackground />

            <div className="relative z-10 flex flex-col flex-1">
                {/* Enhanced Header */}
                <header className="mobile-nav-top backdrop-blur-md bg-background/80">
                    <div className="container-mobile">
                        <div className="flex items-center justify-between h-16 sm:h-20">
                            <motion.button
                                initial={{ opacity: 0, x: -30 }}
                                animate={{ opacity: 1, x: 0 }}
                                whileHover={{ 
                                    scale: 1.05,
                                    rotate: [0, -5, 5, 0],
                                    transition: { duration: 0.3 }
                                }}
                                whileTap={{ scale: 0.95 }}
                                transition={{ 
                                    duration: 0.6, 
                                    delay: 0.2,
                                    ease: "easeOut"
                                }}
                                className="text-xl sm:text-2xl md:text-3xl font-heading font-extrabold text-primary hover:text-primary/80 transition-colors focus-ring rounded-lg p-2 touch-target relative overflow-hidden group"
                                onClick={() => navigate('/')}
                                aria-label="Direktor home"
                            >
                                <span className="relative z-10">Direktor</span>
                                <motion.div
                                    className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent"
                                    initial={{ x: "-100%" }}
                                    whileHover={{ x: "100%" }}
                                    transition={{ duration: 0.6 }}
                                />
                            </motion.button>
                            
                            <motion.div
                                initial={{ opacity: 0, x: 30 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ 
                                    duration: 0.6, 
                                    delay: 0.3,
                                    ease: "easeOut"
                                }}
                                className="flex items-center gap-2 sm:gap-3"
                            >
                                <motion.div
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <Button 
                                        variant="ghost" 
                                        onClick={() => navigate('/login')} 
                                        className="hover:text-primary transition-colors focus-ring relative overflow-hidden group"
                                        size="mobile-sm"
                                    >
                                        <span className="relative z-10">Login</span>
                                        <motion.div
                                            className="absolute inset-0 bg-primary/10"
                                            initial={{ scaleX: 0 }}
                                            whileHover={{ scaleX: 1 }}
                                            transition={{ duration: 0.3 }}
                                            style={{ originX: 0 }}
                                        />
                                    </Button>
                                </motion.div>
                                <motion.div
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <Button 
                                        onClick={() => navigate('/signup')} 
                                        className="shadow-glow hover:shadow-glow-hover transition-all duration-300 relative overflow-hidden group"
                                        size="mobile-sm"
                                    >
                                        <span className="relative z-10">Sign Up</span>
                                        <motion.div
                                            className="absolute inset-0 bg-gradient-to-r from-primary to-primary/80"
                                            initial={{ scaleX: 0 }}
                                            whileHover={{ scaleX: 1 }}
                                            transition={{ duration: 0.3 }}
                                            style={{ originX: 0 }}
                                        />
                                    </Button>
                                </motion.div>
                            </motion.div>
                        </div>
                    </div>
                </header>

                {/* Enhanced Main Content */}
                <main className="flex-1 flex items-center justify-center text-center mobile-padding pt-20 lg:pt-24 pb-12 relative">
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="max-w-4xl mx-auto relative"
                    >
                        {/* Animated Main Headline */}
                        <motion.div
                            variants={textRevealVariants}
                            className="relative mb-6 lg:mb-8"
                        >
                            <motion.h1
                                className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold leading-tight"
                                style={{ y: y1 }}
                            >
                                <motion.span
                                    className="text-primary"
                                    animate={{
                                        backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                                    }}
                                    transition={{
                                        duration: 3,
                                        repeat: Infinity,
                                        ease: "easeInOut"
                                    }}
                                    style={{
                                        background: "linear-gradient(90deg, #3b82f6, #8b5cf6, #3b82f6)",
                                        backgroundSize: "200% 200%",
                                        WebkitBackgroundClip: "text",
                                        WebkitTextFillColor: "transparent",
                                        backgroundClip: "text"
                                    }}
                                >
                                    Tournament Management
                                </motion.span>
                                <br />
                                <motion.span 
                                    className="text-foreground"
                                    animate={{ opacity: [0.8, 1, 0.8] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                >
                                    Made Simple
                                </motion.span>
                            </motion.h1>
                            
                            {/* Floating accent elements */}
                            <motion.div
                                className="absolute -top-4 -right-4 w-8 h-8 bg-primary/20 rounded-full"
                                animate={{
                                    scale: [1, 1.2, 1],
                                    opacity: [0.5, 0.8, 0.5],
                                }}
                                transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                }}
                            />
                            <motion.div
                                className="absolute -bottom-2 -left-2 w-6 h-6 bg-secondary/20 rounded-full"
                                animate={{
                                    scale: [1, 1.3, 1],
                                    opacity: [0.3, 0.6, 0.3],
                                }}
                                transition={{
                                    duration: 2.5,
                                    repeat: Infinity,
                                    ease: "easeInOut",
                                    delay: 0.5
                                }}
                            />
                        </motion.div>

                        {/* Enhanced Subtitle */}
                        <motion.p
                            variants={textRevealVariants}
                            className="text-lg sm:text-xl md:text-2xl text-muted-foreground mb-8 lg:mb-12 max-w-3xl mx-auto leading-relaxed"
                            style={{ y: y2 }}
                        >
                            <motion.span
                                animate={{ opacity: [0.7, 1, 0.7] }}
                                transition={{ duration: 3, repeat: Infinity }}
                            >
                                Streamline your Scrabble tournaments with powerful tools for pairings, 
                                standings, and player management.
                            </motion.span>
                            <br />
                            <motion.span
                                className="text-primary font-semibold"
                                animate={{ opacity: [0.8, 1, 0.8] }}
                                transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                            >
                                Built for directors, by directors.
                            </motion.span>
                        </motion.p>

                        {/* Enhanced CTA Buttons */}
                        <motion.div
                            variants={itemVariants}
                            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12 lg:mb-16"
                            style={{ y: y3 }}
                        >
                            <motion.div
                                variants={glowVariants}
                                initial="initial"
                                whileHover="hover"
                                whileTap="tap"
                            >
                                <Button
                                    onClick={() => navigate('/signup')}
                                    size="mobile-lg"
                                    className="w-full sm:w-auto relative overflow-hidden group"
                                >
                                    <span className="relative z-10">Get Started Free</span>
                                    <motion.div
                                        className="absolute inset-0 bg-gradient-to-r from-primary to-secondary"
                                        initial={{ x: "-100%" }}
                                        whileHover={{ x: "0%" }}
                                        transition={{ duration: 0.3 }}
                                    />
                                </Button>
                            </motion.div>
                            <motion.div
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <Button
                                    variant="outline"
                                    onClick={() => navigate('/tournament-setup')}
                                    size="mobile-lg"
                                    className="w-full sm:w-auto border-2 hover:border-primary transition-colors"
                                >
                                    Create Tournament
                                </Button>
                            </motion.div>
                        </motion.div>

                        {/* Enhanced Features Grid */}
                        <motion.div
                            variants={itemVariants}
                            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 mb-12 lg:mb-16"
                        >
                            {[
                                {
                                    icon: 'Users',
                                    title: 'Player Management',
                                    description: 'Easily manage tournament rosters, ratings, and player information.',
                                    color: 'from-blue-500 to-cyan-500'
                                },
                                {
                                    icon: 'Network',
                                    title: 'Smart Pairings',
                                    description: 'Advanced pairing algorithms with rematch prevention and rating-based matching.',
                                    color: 'from-purple-500 to-pink-500'
                                },
                                {
                                    icon: 'Trophy',
                                    title: 'Live Standings',
                                    description: 'Real-time standings updates with tiebreakers and performance tracking.',
                                    color: 'from-yellow-500 to-orange-500'
                                },
                                {
                                    icon: 'BarChart3',
                                    title: 'Analytics',
                                    description: 'Comprehensive tournament analytics and performance insights.',
                                    color: 'from-green-500 to-emerald-500'
                                },
                                {
                                    icon: 'Smartphone',
                                    title: 'Mobile Ready',
                                    description: 'Fully responsive design that works perfectly on all devices.',
                                    color: 'from-indigo-500 to-blue-500'
                                },
                                {
                                    icon: 'Zap',
                                    title: 'Fast & Reliable',
                                    description: 'Lightning-fast performance with offline capabilities and data sync.',
                                    color: 'from-red-500 to-pink-500'
                                }
                            ].map((feature, index) => (
                                <motion.div
                                    key={index}
                                    variants={featureCardVariants}
                                    initial="initial"
                                    whileHover="hover"
                                    className="mobile-card-hover p-6 text-center group relative overflow-hidden rounded-xl backdrop-blur-sm bg-background/50 border border-border/20"
                                    style={{
                                        background: `linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))`,
                                    }}
                                >
                                    {/* Animated background gradient */}
                                    <motion.div
                                        className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}
                                        animate={{
                                            scale: [1, 1.1, 1],
                                            rotate: [0, 5, 0],
                                        }}
                                        transition={{
                                            duration: 4,
                                            repeat: Infinity,
                                            ease: "easeInOut",
                                            delay: index * 0.2
                                        }}
                                    />
                                    
                                    <motion.div
                                        className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 relative z-10"
                                        animate={{
                                            rotate: [0, 5, -5, 0],
                                        }}
                                        transition={{
                                            duration: 3,
                                            repeat: Infinity,
                                            ease: "easeInOut",
                                            delay: index * 0.1
                                        }}
                                    >
                                        <Icon name={feature.icon} size={32} className="text-primary group-hover:text-primary/80 transition-colors" />
                                    </motion.div>
                                    
                                    <motion.h3 
                                        className="text-lg sm:text-xl font-semibold mb-2 text-foreground relative z-10"
                                        animate={{ opacity: [0.8, 1, 0.8] }}
                                        transition={{ duration: 2, repeat: Infinity, delay: index * 0.1 }}
                                    >
                                        {feature.title}
                                    </motion.h3>
                                    
                                    <p className="text-muted-foreground text-sm sm:text-base relative z-10">
                                        {feature.description}
                                    </p>
                                    
                                    {/* Floating particles around each card */}
                                    <motion.div
                                        className="absolute top-2 right-2 w-2 h-2 bg-primary/30 rounded-full"
                                        animate={{
                                            y: [0, -10, 0],
                                            opacity: [0.3, 0.8, 0.3],
                                        }}
                                        transition={{
                                            duration: 2,
                                            repeat: Infinity,
                                            ease: "easeInOut",
                                            delay: index * 0.2
                                        }}
                                    />
                                </motion.div>
                            ))}
                        </motion.div>

                        {/* Enhanced Social Proof */}
                        <motion.div
                            variants={itemVariants}
                            className="text-center relative"
                        >
                            <motion.p 
                                className="text-muted-foreground mb-4 text-sm sm:text-base"
                                animate={{ opacity: [0.6, 1, 0.6] }}
                                transition={{ duration: 3, repeat: Infinity }}
                            >
                                Trusted by tournament directors worldwide
                            </motion.p>
                            
                            <motion.div 
                                className="flex items-center justify-center space-x-8 opacity-60 mb-2"
                                animate={{ scale: [1, 1.02, 1] }}
                                transition={{ duration: 2, repeat: Infinity }}
                            >
                                {[
                                    { number: "500+", label: "Tournaments" },
                                    { number: "10K+", label: "Players" },
                                    { number: "99.9%", label: "Uptime" }
                                ].map((stat, index) => (
                                    <motion.div
                                        key={index}
                                        className="text-center"
                                        whileHover={{ scale: 1.1 }}
                                        animate={{
                                            y: [0, -5, 0],
                                        }}
                                        transition={{
                                            duration: 2,
                                            repeat: Infinity,
                                            ease: "easeInOut",
                                            delay: index * 0.3
                                        }}
                                    >
                                        <motion.div 
                                            className="text-2xl font-bold text-primary"
                                            animate={{ 
                                                backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                                            }}
                                            transition={{
                                                duration: 3,
                                                repeat: Infinity,
                                                ease: "easeInOut",
                                                delay: index * 0.2
                                            }}
                                            style={{
                                                background: "linear-gradient(90deg, #3b82f6, #8b5cf6, #3b82f6)",
                                                backgroundSize: "200% 200%",
                                                WebkitBackgroundClip: "text",
                                                WebkitTextFillColor: "transparent",
                                                backgroundClip: "text"
                                            }}
                                        >
                                            {stat.number}
                                        </motion.div>
                                        <div className="text-sm text-muted-foreground">{stat.label}</div>
                                    </motion.div>
                                ))}
                            </motion.div>
                        </motion.div>
                    </motion.div>
                </main>

                {/* Enhanced Footer */}
                <footer className="mobile-padding py-8 border-t border-border/10 backdrop-blur-md bg-background/50">
                    <div className="container-mobile">
                        <motion.div 
                            className="flex flex-col sm:flex-row items-center justify-between gap-4"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.8 }}
                        >
                            <motion.div 
                                className="text-sm text-muted-foreground"
                                whileHover={{ scale: 1.05 }}
                            >
                                © 2024 Direktor. All rights reserved.
                            </motion.div>
                            <motion.div 
                                className="flex items-center space-x-6 text-sm"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.6, delay: 1 }}
                            >
                                {['Privacy', 'Terms', 'Support'].map((link, index) => (
                                    <motion.a
                                        key={link}
                                        href={`/${link.toLowerCase()}`}
                                        className="text-muted-foreground hover:text-foreground transition-colors relative overflow-hidden group"
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.3, delay: 1.2 + index * 0.1 }}
                                    >
                                        <span className="relative z-10">{link}</span>
                                        <motion.div
                                            className="absolute inset-0 bg-primary/10"
                                            initial={{ scaleX: 0 }}
                                            whileHover={{ scaleX: 1 }}
                                            transition={{ duration: 0.3 }}
                                            style={{ originX: 0 }}
                                        />
                                    </motion.a>
                                ))}
                            </motion.div>
                        </motion.div>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default LandingPage;