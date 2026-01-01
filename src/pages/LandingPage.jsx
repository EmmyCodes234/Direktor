import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HeroSection } from '../components/ui/HeroSection';
import Button from '../components/ui/Button';
import Icon from '../components/AppIcon';
import { MobileOptimizer } from '../components/ui/MobileOptimizer';
import { designTokens, LAYOUT_TEMPLATES, ANIMATION_TEMPLATES } from '../design-system';
import { cn } from '../utils/cn';
import { InfiniteMarquee } from '../components/landing/InfiniteMarquee';
import PublicFooter from '../components/public/PublicFooter';


// --- Advanced Animation Components ---

const SpotlightCard = ({ children, className = "" }) => {
    const mouseX = React.useRef(0);
    const mouseY = React.useRef(0);
    const cardRef = React.useRef(null);
    const [isHovered, setIsHovered] = React.useState(false);

    const handleMouseMove = ({ currentTarget, clientX, clientY }) => {
        const { left, top } = currentTarget.getBoundingClientRect();
        mouseX.current = clientX - left;
        mouseY.current = clientY - top;
        if (cardRef.current) {
            cardRef.current.style.setProperty("--mouse-x", `${mouseX.current}px`);
            cardRef.current.style.setProperty("--mouse-y", `${mouseY.current}px`);
        }
    };

    return (
        <div
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={cn(
                "group/spotlight relative rounded-3xl border border-white/10 bg-slate-900/50 overflow-hidden",
                className
            )}
        >
            <div
                className="pointer-events-none absolute -inset-px opacity-0 transition duration-300 group-hover/spotlight:opacity-100"
                style={{
                    background: `radial-gradient(600px circle at var(--mouse-x) var(--mouse-y), rgba(16, 185, 129, 0.15), transparent 40%)`,
                }}
            />
            <div
                className="pointer-events-none absolute -inset-px opacity-0 transition duration-300 group-hover/spotlight:opacity-100"
                style={{
                    background: `radial-gradient(600px circle at var(--mouse-x) var(--mouse-y), rgba(16, 185, 129, 0.4), transparent 40%)`,
                    maskImage: "linear-gradient(to bottom, black, black)",
                    WebkitMaskImage: "linear-gradient(to bottom, black, black)",
                    zIndex: 1
                }} // Border Glow
            />
            <div className="relative z-10 h-full">
                {children}
            </div>
        </div>
    );
};

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
                {/* Bi-directional Marquee Animation */}
                <section className="relative z-10 mb-20 border-y border-slate-800/50 bg-slate-950/50 backdrop-blur-sm">
                    <InfiniteMarquee />
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

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-7xl mx-auto px-4 relative z-20">
                        {[
                            {
                                icon: "Zap",
                                title: "Zero Latency",
                                desc: "Websocket-powered real-time updates ensure every result syncs instantly across all devices. Experience the speed of thought.",
                                color: "text-amber-400",
                                gradient: "from-amber-500/20 to-transparent"
                            },
                            {
                                icon: "ShieldCheck",
                                title: "Integrity Verification",
                                desc: "Automated conflict detection and cryptographic result signing guarantee tournament fairness. Trust is built-in.",
                                color: "text-emerald-400",
                                gradient: "from-emerald-500/20 to-transparent"
                            },
                            {
                                icon: "Globe",
                                title: "Global Scale",
                                desc: "Built on edge infrastructure to handle thousands of players and millions of requests seamlessly. World-class performance.",
                                color: "text-blue-400",
                                gradient: "from-blue-500/20 to-transparent"
                            }
                        ].map((feature, i) => (
                            <SpotlightCard key={i} className="h-full">
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    viewport={{ once: true }}
                                    className="relative p-8 h-full flex flex-col"
                                >
                                    {/* Background Gradient Mesh */}
                                    <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${feature.gradient} blur-[60px] rounded-full pointer-events-none`} />

                                    <div className="mb-6 p-4 rounded-2xl bg-slate-950/50 border border-white/5 w-fit shadow-lg shadow-black/20 backdrop-blur-sm group-hover/spotlight:scale-110 transition-transform duration-500">
                                        <Icon name={feature.icon} className={`w-8 h-8 ${feature.color}`} />
                                    </div>
                                    <h3 className="text-2xl font-bold text-white mb-3 group-hover/spotlight:text-emerald-300 transition-colors">{feature.title}</h3>
                                    <p className="text-slate-400 leading-relaxed text-sm flex-1">
                                        {feature.desc}
                                    </p>

                                    <div className="mt-6 pt-6 border-t border-white/5 flex items-center text-sm font-medium text-emerald-500 opacity-0 -translate-x-4 group-hover/spotlight:opacity-100 group-hover/spotlight:translate-x-0 transition-all duration-300">
                                        Learn more <Icon name="ArrowRight" className="w-4 h-4 ml-2" />
                                    </div>
                                </motion.div>
                            </SpotlightCard>
                        ))}
                    </div>
                </section>

                <PublicFooter />
            </div>
        </MobileOptimizer >
    );
};

export default LandingPage;