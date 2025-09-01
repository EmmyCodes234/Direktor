import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HeroSection } from '../components/ui/HeroSection';
import Button from '../components/ui/Button';
import Icon from '../components/AppIcon';

const NewLandingPage = () => {
    const navigate = useNavigate();

    const features = [
        {
            icon: 'Users',
            title: 'Player Management',
            description: 'Effortlessly manage tournament rosters, ratings, and player profiles with our intuitive interface.',
            color: 'from-blue-500 to-cyan-500'
        },
        {
            icon: 'Network',
            title: 'Smart Pairings',
            description: 'Advanced algorithms ensure fair pairings with rematch prevention and rating-based matching.',
            color: 'from-purple-500 to-pink-500'
        },
        {
            icon: 'Trophy',
            title: 'Live Standings',
            description: 'Real-time standings with automatic tiebreakers and comprehensive performance tracking.',
            color: 'from-yellow-500 to-orange-500'
        },
        {
            icon: 'BarChart3',
            title: 'Tournament Analytics',
            description: 'Deep insights into player performance, game statistics, and tournament trends.',
            color: 'from-green-500 to-emerald-500'
        },
        {
            icon: 'Smartphone',
            title: 'Mobile Optimized',
            description: 'Fully responsive design that works seamlessly across all devices and screen sizes.',
            color: 'from-indigo-500 to-blue-500'
        },
        {
            icon: 'Zap',
            title: 'Lightning Fast',
            description: 'Optimized performance with offline capabilities and real-time data synchronization.',
            color: 'from-red-500 to-pink-500'
        }
    ];

    const testimonials = [
        {
            quote: "Direktor has revolutionized how we run our tournaments. The automated pairings save us hours of work.",
            author: "Sarah Johnson",
            role: "Tournament Director",
            location: "Seattle Scrabble Club"
        },
        {
            quote: "The real-time standings and mobile interface keep our players engaged throughout the event.",
            author: "Michael Chen",
            role: "Club President",
            location: "Bay Area Word Warriors"
        },
        {
            quote: "Finally, a tournament management system built by people who actually understand Scrabble.",
            author: "Emma Rodriguez",
            role: "Regional Coordinator",
            location: "Southwest Scrabble Association"
        }
    ];

    return (
        <div className="min-h-screen bg-background text-foreground">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-background/80 border-b border-border/20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-14">
                        <motion.button
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="text-2xl font-heading font-bold text-primary hover:text-primary/80 transition-colors"
                            onClick={() => navigate('/')}
                        >
                            Direktor
                        </motion.button>
                        
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
                    opacity: 0.3,
                    cellSize: 50,
                    lightLineColor: "#e5e7eb",
                    darkLineColor: "#374151"
                }}
                className="pt-16"
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

            {/* Features Section */}
            <section className="py-24 bg-muted/30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-16"
                    >
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">
                            Everything you need to run
                            <span className="text-primary"> professional tournaments</span>
                        </h2>
                        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                            Comprehensive tools designed specifically for Scrabble tournament management
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {features.map((feature, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                                whileHover={{ y: -5 }}
                                className="bg-card p-8 rounded-xl border border-border/20 shadow-sm hover:shadow-lg transition-all duration-300 group"
                            >
                                <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${feature.color} p-4 mb-6 group-hover:scale-110 transition-transform duration-300`}>
                                    <Icon name={feature.icon} size={32} className="text-white" />
                                </div>
                                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                                <p className="text-muted-foreground">{feature.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center"
                    >
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">
                            Trusted by the <span className="text-primary">Scrabble community</span>
                        </h2>
                        <p className="text-xl text-muted-foreground mb-16 max-w-2xl mx-auto">
                            Join hundreds of tournament directors who have streamlined their events with Direktor
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                            {[
                                { number: "500+", label: "Tournaments Managed", icon: "Trophy" },
                                { number: "10,000+", label: "Players Registered", icon: "Users" },
                                { number: "50,000+", label: "Games Tracked", icon: "BarChart3" },
                                { number: "99.9%", label: "Uptime Reliability", icon: "Zap" }
                            ].map((stat, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, scale: 0.5 }}
                                    whileInView={{ opacity: 1, scale: 1 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: index * 0.1 }}
                                    className="text-center"
                                >
                                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Icon name={stat.icon} size={24} className="text-primary" />
                                    </div>
                                    <div className="text-4xl font-bold text-primary mb-2">{stat.number}</div>
                                    <div className="text-muted-foreground">{stat.label}</div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Testimonials Section */}
            <section className="py-24 bg-muted/30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-16"
                    >
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">
                            What tournament directors are saying
                        </h2>
                        <p className="text-xl text-muted-foreground">
                            Real feedback from real tournament organizers
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {testimonials.map((testimonial, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                                className="bg-card p-8 rounded-xl border border-border/20 shadow-sm"
                            >
                                <div className="mb-6">
                                    <Icon name="Quote" size={32} className="text-primary/20" />
                                </div>
                                <p className="text-muted-foreground mb-6 italic">"{testimonial.quote}"</p>
                                <div>
                                    <div className="font-semibold">{testimonial.author}</div>
                                    <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                                    <div className="text-sm text-primary">{testimonial.location}</div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <h2 className="text-3xl md:text-4xl font-bold mb-6">
                            Ready to transform your tournaments?
                        </h2>
                        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                            Join the growing community of tournament directors who trust Direktor to manage their events.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Button
                                size="lg"
                                onClick={() => navigate('/signup')}
                                className="shadow-lg hover:shadow-xl transition-shadow"
                            >
                                <Icon name="Rocket" className="mr-2" size={20} />
                                Get Started Free
                            </Button>
                            <Button
                                variant="outline"
                                size="lg"
                                onClick={() => navigate('/contact')}
                            >
                                <Icon name="MessageCircle" className="mr-2" size={20} />
                                Contact Sales
                            </Button>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 border-t border-border/20 bg-muted/20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row items-center justify-between">
                        <div className="text-2xl font-heading font-bold text-primary mb-4 md:mb-0">
                            Direktor
                        </div>
                        <div className="flex items-center gap-6 text-sm text-muted-foreground">
                            <button onClick={() => navigate('/privacy')} className="hover:text-foreground transition-colors">
                                Privacy Policy
                            </button>
                            <button onClick={() => navigate('/terms')} className="hover:text-foreground transition-colors">
                                Terms of Service
                            </button>
                            <button onClick={() => navigate('/contact')} className="hover:text-foreground transition-colors">
                                Contact
                            </button>
                        </div>
                    </div>
                    <div className="mt-8 pt-8 border-t border-border/20 text-center text-sm text-muted-foreground">
                        © 2024 Direktor. Built for the Scrabble community.
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default NewLandingPage;