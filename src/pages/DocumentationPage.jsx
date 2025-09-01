import React, { useState } from 'react';
import Header from '../components/ui/Header';
import Icon from '../components/AppIcon';
import { motion } from 'framer-motion';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '../components/ui/Accordion';
import Button from '../components/ui/Button';
import ExpandableTabsJS from '../components/ui/expandable-tabs';
import { Home, Play, Settings, Users, Shuffle, BarChart3, LayoutDashboard, Zap, HelpCircle, Code, Database, Image, Shield, Smartphone } from 'lucide-react';

const DocSection = ({ title, id, children }) => (
    <section id={id} className="mb-16 scroll-mt-24">
        <h2 className="text-3xl font-heading font-bold text-primary mb-6 pb-2 border-b border-border/30">{title}</h2>
        <div className="prose prose-invert max-w-none text-muted-foreground leading-relaxed space-y-4">
            {children}
        </div>
    </section>
);

const DocSubSection = ({ title, children }) => (
    <div className="mb-8">
        <h3 className="text-xl font-heading font-semibold text-foreground mb-4">{title}</h3>
        <div className="space-y-3">
            {children}
        </div>
    </div>
);

const FeatureCard = ({ icon, title, description, className = "" }) => (
    <div className={`glass-card p-6 rounded-xl ${className}`}>
        <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Icon name={icon} size={24} className="text-primary" />
            </div>
            <div>
                <h4 className="font-semibold text-foreground mb-2">{title}</h4>
                <p className="text-sm text-muted-foreground">{description}</p>
            </div>
        </div>
    </div>
);

const DocumentationPage = () => {
    const [activeSection, setActiveSection] = useState('overview');

    const navigationItems = [
        { id: 'overview', label: 'Overview', icon: 'Home' },
        { id: 'getting-started', label: 'Getting Started', icon: 'Play' },
        { id: 'tournament-setup', label: 'Tournament Setup', icon: 'Settings' },
        { id: 'player-management', label: 'Player Management', icon: 'Users' },
        { id: 'photo-system', label: 'Photo System', icon: 'Image' },
        { id: 'pairing-systems', label: 'Pairing Systems', icon: 'Shuffle' },
        { id: 'scoring-results', label: 'Scoring & Results', icon: 'BarChart3' },
        { id: 'dashboard', label: 'Tournament Dashboard', icon: 'LayoutDashboard' },
        { id: 'mobile-optimization', label: 'Mobile Features', icon: 'Smartphone' },
        { id: 'advanced-features', label: 'Advanced Features', icon: 'Zap' },
        { id: 'security', label: 'Security & Privacy', icon: 'Shield' },
        { id: 'troubleshooting', label: 'Troubleshooting', icon: 'HelpCircle' },
        { id: 'api-reference', label: 'API Reference', icon: 'Code' }
    ];

    return (
        <div className="min-h-screen bg-background">
            <Header />
            <div className="flex pt-20">
                {/* Sidebar Navigation */}
                <aside className="w-64 fixed left-0 top-20 h-screen overflow-y-auto border-r border-hero-purple/20 bg-background/50 backdrop-blur-sm">
                    <nav className="p-4">
                        <div className="space-y-2">
                            {navigationItems.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveSection(item.id)}
                                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                                        activeSection === item.id
                                            ? 'bg-hero-purple/20 text-hero-primary border border-hero-purple/30'
                                            : 'text-hero-secondary hover:text-hero-primary hover:bg-hero-purple/10'
                                    }`}
                                >
                                    <Icon name={item.icon} size={16} />
                                    <span className="text-sm font-medium">{item.label}</span>
                                </button>
                            ))}
                        </div>
                    </nav>
                </aside>

                {/* Main Content */}
                <main className="flex-1 ml-64">
                    <div className="max-w-4xl mx-auto px-8 lg:px-12 py-8 lg:py-12">
                        {/* Mobile Navigation */}
                        <div className="lg:hidden mb-8">
                            <ExpandableTabsJS 
                                tabs={[
                                    { title: "Overview", icon: Home },
                                    { title: "Getting Started", icon: Play },
                                    { title: "Tournament Setup", icon: Settings },
                                    { title: "Player Management", icon: Users },
                                    { title: "Photo System", icon: Image },
                                    { title: "Pairing Systems", icon: Shuffle },
                                    { title: "Scoring & Results", icon: BarChart3 },
                                    { title: "Dashboard", icon: LayoutDashboard },
                                    { title: "Mobile Features", icon: Smartphone },
                                    { title: "Advanced Features", icon: Zap },
                                    { title: "Security", icon: Shield },
                                    { title: "Troubleshooting", icon: HelpCircle },
                                    { title: "API Reference", icon: Code },
                                ]}
                                activeColor="text-purple-500"
                                className="border-purple-200 dark:border-purple-800 bg-gradient-to-r from-purple-50/50 to-pink-950/50"
                                onChange={(index) => {
                                    const sections = ['overview', 'getting-started', 'tournament-setup', 'player-management', 'photo-system', 'pairing-systems', 'scoring-results', 'dashboard', 'mobile-optimization', 'advanced-features', 'security', 'troubleshooting', 'api-reference'];
                                    setActiveSection(sections[index]);
                                }}
                            />
                        </div>

                        {/* Overview Section */}
                        {activeSection === 'overview' && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5 }}
                            >
                                <div className="text-center mb-16">
                                    <Icon name="BookOpenCheck" size={64} className="mx-auto text-primary mb-6" />
                                    <h1 className="text-5xl font-heading font-bold text-foreground mb-4">Direktor Documentation</h1>
                                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                                        Your complete guide to running world-class Scrabble tournaments with the most advanced tournament management platform.
                                    </p>
                                </div>

                                <DocSection title="What is Direktor?" id="what-is-direktor">
                                    <p className="text-lg">
                                        Direktor is a next-generation, web-based platform designed to revolutionize Scrabble tournament management. 
                                        Built on the core principle of <strong>Guided Workflow</strong>, it transforms the director's role from a 
                                        technical operator into a true manager by providing context-aware assistance throughout the tournament lifecycle.
                                    </p>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                                        <FeatureCard
                                            icon="Zap"
                                            title="Smart Automation"
                                            description="Intelligent pairing systems, automated scoring, and real-time result tracking eliminate manual work."
                                        />
                                        <FeatureCard
                                            icon="Users"
                                            title="Player Management"
                                            description="Comprehensive player database with ratings, history, and photo management for easy identification."
                                        />
                                        <FeatureCard
                                            icon="BarChart3"
                                            title="Advanced Analytics"
                                            description="Detailed statistics, performance metrics, and insights to improve tournament quality."
                                        />
                                        <FeatureCard
                                            icon="Smartphone"
                                            title="Mobile-First Design"
                                            description="Optimized for mobile devices with touch-friendly controls and responsive layouts."
                                        />
                                    </div>
                                </DocSection>

                                <DocSection title="Key Features" id="key-features">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <FeatureCard
                                            icon="Shuffle"
                                            title="Multiple Pairing Systems"
                                            description="Swiss, Round Robin, King of the Hill, and custom pairing algorithms with intelligent optimization."
                                        />
                                        <FeatureCard
                                            icon="Image"
                                            title="Photo Management System"
                                            description="Bulk photo upload, intelligent player matching, and secure storage for tournament identification."
                                        />
                                        <FeatureCard
                                            icon="Database"
                                            title="Master Player Library"
                                            description="Centralized player database with ratings, history, and cross-tournament statistics."
                                        />
                                        <FeatureCard
                                            icon="LayoutDashboard"
                                            title="Real-Time Dashboard"
                                            description="Live tournament status, current pairings, and instant result updates."
                                        />
                                    </div>
                                </DocSection>

                                <DocSection title="Technology Stack" id="technology-stack">
                                    <p className="text-lg mb-6">
                                        Direktor is built with modern, scalable technologies to ensure reliability and performance:
                                    </p>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                                            <h4 className="font-semibold text-foreground mb-2">Frontend</h4>
                                            <p className="text-sm text-muted-foreground">React Native, Framer Motion, Tailwind CSS</p>
                                        </div>
                                        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                                            <h4 className="font-semibold text-foreground mb-2">Backend</h4>
                                            <p className="text-sm text-muted-foreground">Supabase, PostgreSQL, Row Level Security</p>
                                        </div>
                                        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                                            <h4 className="font-semibold text-foreground mb-2">Storage</h4>
                                            <p className="text-sm text-muted-foreground">Supabase Storage, Image optimization, CDN</p>
                                        </div>
                                    </div>
                                </DocSection>
                            </motion.div>
                        )}

                        {/* Getting Started Section */}
                        {activeSection === 'getting-started' && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5 }}
                            >
                                <DocSection title="Getting Started" id="getting-started">
                                    <p className="text-lg mb-6">
                                        Welcome to Direktor! This guide will walk you through creating your first tournament and understanding the core concepts.
                                    </p>

                                    <DocSubSection title="1. Creating Your Account">
                                        <p>Start by creating a Direktor account to access the tournament management features:</p>
                                        <ul className="list-disc pl-5 space-y-2">
                                            <li><strong>Email Registration:</strong> Provide your full name, email address, and a secure password</li>
                                            <li><strong>Google Sign-in:</strong> Quick access using your existing Google account</li>
                                            <li><strong>Email Verification:</strong> Check your email and click the verification link to activate your account</li>
                                        </ul>
                                    </DocSubSection>

                                    <DocSubSection title="2. Understanding the Interface">
                                        <p>Direktor uses a clean, intuitive interface designed for tournament directors:</p>
                                        <ul className="list-disc pl-5 space-y-2">
                                            <li><strong>Tournament Lobby:</strong> Your home dashboard showing all your tournaments</li>
                                            <li><strong>Command Center:</strong> Active tournament management with context-aware controls</li>
                                            <li><strong>Settings Panel:</strong> Configure tournament parameters and pairing systems</li>
                                            <li><strong>Player Management:</strong> Add, edit, and manage tournament participants</li>
                                        </ul>
                                    </DocSubSection>

                                    <DocSubSection title="3. Your First Tournament">
                                        <p>Creating your first tournament is straightforward with our guided setup process:</p>
                                        <ol className="list-decimal pl-5 space-y-2">
                                            <li>Click "New Tournament" from the Tournament Lobby</li>
                                            <li>Enter basic tournament information (name, venue, date)</li>
                                            <li>Add players using our Master Player Library system</li>
                                            <li>Configure rounds and pairing settings</li>
                                            <li>Start your tournament and begin pairing rounds</li>
                                        </ol>
                                    </DocSubSection>

                                    <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 mt-8">
                                        <h4 className="font-semibold text-foreground mb-3">💡 Pro Tip</h4>
                                        <p className="text-sm text-muted-foreground">
                                            Take advantage of the guided workflow system. Direktor will suggest the next logical step 
                                            based on your current tournament state, making it impossible to miss critical steps.
                                        </p>
                                    </div>
                                </DocSection>
                            </motion.div>
                        )}

                        {/* Tournament Setup Section */}
                        {activeSection === 'tournament-setup' && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5 }}
                            >
                                <DocSection title="Tournament Setup" id="tournament-setup">
                                    <p className="text-lg mb-6">
                                        Learn how to configure and customize your tournaments with Direktor's flexible setup options.
                                    </p>

                                    <DocSubSection title="Tournament Configuration">
                                        <p>Essential tournament settings that define your event:</p>
                                        <ul className="list-disc pl-5 space-y-2">
                                            <li><strong>Basic Information:</strong> Name, venue, date, and description</li>
                                            <li><strong>Tournament Format:</strong> Number of rounds, time controls, and scoring system</li>
                                            <li><strong>Pairing System:</strong> Swiss, Round Robin, or custom algorithms</li>
                                            <li><strong>Divisions:</strong> Multiple skill divisions with separate pairings</li>
                                        </ul>
                                    </DocSubSection>

                                    <DocSubSection title="Advanced Settings">
                                        <p>Customize your tournament experience with advanced options:</p>
                                        <ul className="list-disc pl-5 space-y-2">
                                            <li><strong>Rating Systems:</strong> NASPA, WESPA, or custom rating calculations</li>
                                            <li><strong>Bye Handling:</strong> Configure how byes are distributed and scored</li>
                                            <li><strong>Time Controls:</strong> Set game time limits and overtime rules</li>
                                            <li><strong>Scoring Rules:</strong> Customize point values and bonus systems</li>
                                        </ul>
                                    </DocSubSection>

                                    <DocSubSection title="Tournament Templates">
                                        <p>Save and reuse tournament configurations for consistency:</p>
                                        <ul className="list-disc pl-5 space-y-2">
                                            <li><strong>Quick Start:</strong> Use predefined templates for common tournament types</li>
                                            <li><strong>Custom Templates:</strong> Save your own configurations for future use</li>
                                            <li><strong>Template Sharing:</strong> Share templates with other tournament directors</li>
                                        </ul>
                                    </DocSubSection>
                                </DocSection>
                            </motion.div>
                        )}

                        {/* Player Management Section */}
                                {activeSection === 'player-management' && (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <DocSection title="Player Management" id="player-management">
                    <p className="text-lg mb-6">
                        Manage tournament participants efficiently with our comprehensive player management system.
                    </p>

                    <DocSubSection title="Adding Players">
                        <p>Multiple ways to add players to your tournament:</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong>Master Library:</strong> Search and add players from the central database</li>
                            <li><strong>Bulk Import:</strong> Upload CSV files with multiple players</li>
                            <li><strong>Manual Entry:</strong> Add individual players with custom information</li>
                            <li><strong>Quick Add:</strong> Fast entry for last-minute registrations</li>
                        </ul>
                    </DocSubSection>

                    <DocSubSection title="Player Information">
                        <p>Comprehensive player profiles with essential details:</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong>Basic Details:</strong> Name, email, phone, and emergency contact</li>
                            <li><strong>Rating Information:</strong> Current rating, rating history, and rating system</li>
                            <li><strong>Tournament History:</strong> Previous tournaments, results, and statistics</li>
                            <li><strong>Preferences:</strong> Pairing preferences, bye preferences, and special needs</li>
                        </ul>
                    </DocSubSection>

                    <DocSubSection title="Player Organization">
                        <p>Organize players effectively for smooth tournament operation:</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong>Divisions:</strong> Group players by skill level or rating</li>
                            <li><strong>Seeding:</strong> Automatic or manual seeding based on ratings</li>
                            <li><strong>Status Tracking:</strong> Monitor player registration and participation</li>
                            <li><strong>Communication:</strong> Send announcements and updates to players</li>
                        </ul>
                    </DocSubSection>
                </DocSection>
            </motion.div>
        )}



                        {/* Photo System Section */}
                        {activeSection === 'photo-system' && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5 }}
                            >
                                <DocSection title="Photo Management System" id="photo-system">
                                    <p className="text-lg mb-6">
                                        The Photo Management System allows tournament directors to upload, manage, and display player photos 
                                        for easy identification during tournaments.
                                    </p>

                                    <DocSubSection title="System Overview">
                                        <p>The photo system provides comprehensive photo management capabilities:</p>
                                        <ul className="list-disc pl-5 space-y-2">
                                            <li><strong>Bulk Upload:</strong> Upload ZIP files containing multiple player photos</li>
                                            <li><strong>Intelligent Matching:</strong> Automatic player matching using filename recognition</li>
                                            <li><strong>Secure Storage:</strong> Supabase storage with proper access controls</li>
                                            <li><strong>Mobile Optimization:</strong> Touch-friendly interface for mobile devices</li>
                                        </ul>
                                    </DocSubSection>

                                    <DocSubSection title="Photo Upload Process">
                                        <p>Step-by-step guide to uploading player photos:</p>
                                        <ol className="list-decimal pl-5 space-y-2">
                                            <li><strong>Prepare Photos:</strong> Organize photos in a ZIP file with clear naming</li>
                                            <li><strong>Upload ZIP:</strong> Use the PhotoDatabaseManager to upload your ZIP file</li>
                                            <li><strong>Automatic Processing:</strong> System extracts, compresses, and matches photos</li>
                                            <li><strong>Review Matches:</strong> Check automatic matching results</li>
                                            <li><strong>Manual Matching:</strong> Assign unmatched photos to players manually</li>
                                        </ol>
                                    </DocSubSection>

                                    <DocSubSection title="Photo Naming Conventions">
                                        <p>Best practices for naming photos to ensure accurate matching:</p>
                                        <div className="bg-muted/20 rounded-lg p-4 mb-4">
                                            <h5 className="font-semibold text-foreground mb-2">Recommended Formats:</h5>
                                            <ul className="list-disc pl-5 space-y-1 text-sm">
                                                <li><code>John Smith.jpg</code> - Exact player name</li>
                                                <li><code>John_Smith.jpg</code> - With underscores</li>
                                                <li><code>John-Smith.jpg</code> - With hyphens</li>
                                                <li><code>john smith.jpg</code> - Lowercase (will be matched)</li>
                                            </ul>
                                        </div>
                                        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                                            <h5 className="font-semibold text-foreground mb-2">Avoid These:</h5>
                                            <ul className="list-disc pl-5 space-y-1 text-sm">
                                                <li><code>IMG_001.jpg</code> - Unclear naming</li>
                                                <li><code>Photo1.png</code> - Generic names</li>
                                                <li><code>DSC_1234.jpeg</code> - Camera default names</li>
                                            </ul>
                                        </div>
                                    </DocSubSection>

                                    <DocSubSection title="Supported File Formats">
                                        <p>The system supports various image formats with automatic optimization:</p>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                                                <h5 className="font-semibold text-foreground mb-2">Image Formats:</h5>
                                                <ul className="list-disc pl-5 space-y-1 text-sm">
                                                    <li>JPEG/JPG - Best for photos</li>
                                                    <li>PNG - Good for graphics</li>
                                                    <li>GIF - Animated images</li>
                                                    <li>WebP - Modern format</li>
                                                </ul>
                                            </div>
                                            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                                                <h5 className="font-semibold text-foreground mb-2">Upload Format:</h5>
                                                <ul className="list-disc pl-5 space-y-1 text-sm">
                                                    <li>ZIP files only</li>
                                                    <li>Max 50MB total</li>
                                                    <li>Max 10MB per photo</li>
                                                    <li>Automatic compression</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </DocSubSection>

                                    <DocSubSection title="Player Matching Algorithm">
                                        <p>How the system automatically matches photos to players:</p>
                                        <ol className="list-decimal pl-5 space-y-2">
                                            <li><strong>Exact Match:</strong> Filename exactly matches player name</li>
                                            <li><strong>Normalized Match:</strong> Handles spaces, underscores, and hyphens</li>
                                            <li><strong>Partial Match:</strong> Filename contains unique player identifier</li>
                                            <li><strong>Word Match:</strong> Multiple words match between filename and player name</li>
                                        </ol>
                                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mt-4">
                                            <p className="text-sm text-muted-foreground">
                                                <strong>Note:</strong> If automatic matching fails, you can manually assign photos to players 
                                                using the manual matching interface.
                                            </p>
                                        </div>
                                    </DocSubSection>

                                    <DocSubSection title="Photo Management Features">
                                        <p>Comprehensive tools for managing uploaded photos:</p>
                                        <ul className="list-disc pl-5 space-y-2">
                                            <li><strong>Photo Viewing:</strong> Browse all uploaded photos with player details</li>
                                            <li><strong>Photo Editing:</strong> Replace photos for existing players</li>
                                            <li><strong>Bulk Operations:</strong> Select and manage multiple photos at once</li>
                                            <li><strong>Photo Removal:</strong> Delete individual or multiple photos</li>
                                            <li><strong>Export Functionality:</strong> Download photo database as CSV</li>
                                        </ul>
                                    </DocSubSection>

                                    <DocSubSection title="Security & Privacy">
                                        <p>How your photos are protected and secured:</p>
                                        <ul className="list-disc pl-5 space-y-2">
                                            <li><strong>Access Control:</strong> Only tournament owners can manage photos</li>
                                            <li><strong>Row Level Security:</strong> Database-level access control</li>
                                            <li><strong>Secure Storage:</strong> Encrypted storage with Supabase</li>
                                            <li><strong>Public Access:</strong> Photos are publicly viewable for tournament identification</li>
                                        </ul>
                                    </DocSubSection>

                                    <DocSubSection title="Mobile Optimization">
                                        <p>Mobile-first design for tournament directors on the go:</p>
                                        <ul className="list-disc pl-5 space-y-2">
                                            <li><strong>Touch Interface:</strong> 44px+ touch targets for all controls</li>
                                            <li><strong>Responsive Design:</strong> Adapts to all screen sizes</li>
                                            <li><strong>Mobile Upload:</strong> Easy photo upload from mobile devices</li>
                                            <li><strong>Performance:</strong> Optimized for mobile bandwidth and processing</li>
                                        </ul>
                                    </DocSubSection>
                                </DocSection>
                            </motion.div>
                        )}

                        {/* Pairing Systems Section */}
                        {activeSection === 'pairing-systems' && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5 }}
                            >
                                <DocSection title="Pairing Systems" id="pairing-systems">
                                    <p className="text-lg mb-6">
                                        Direktor offers multiple pairing algorithms to suit different tournament formats and preferences.
                                    </p>

                                    <DocSubSection title="Swiss System">
                                        <p>The most common pairing system for competitive tournaments:</p>
                                        <ul className="list-disc pl-5 space-y-2">
                                            <li><strong>Automatic Pairing:</strong> Players are paired based on current score</li>
                                            <li><strong>Color Balance:</strong> System maintains equal white/black distribution</li>
                                            <li><strong>Bye Handling:</strong> Automatic bye distribution for odd numbers</li>
                                            <li><strong>Pairing Rules:</strong> Configurable rules for maximum flexibility</li>
                                        </ul>
                                    </DocSubSection>

                                    <DocSubSection title="Round Robin">
                                        <p>Complete round-robin system for smaller tournaments:</p>
                                        <ul className="list-disc pl-5 space-y-2">
                                            <li><strong>All vs All:</strong> Every player faces every other player</li>
                                            <li><strong>Optimal Scheduling:</strong> Minimizes waiting time between rounds</li>
                                            <li><strong>Color Balance:</strong> Equal white and black games for each player</li>
                                        </ul>
                                    </DocSubSection>

                                    <DocSubSection title="King of the Hill">
                                        <p>Dynamic pairing system for competitive play:</p>
                                        <ul className="list-disc pl-5 space-y-2">
                                            <li><strong>Performance Based:</strong> Winners play winners, losers play losers</li>
                                            <li><strong>Rapid Advancement:</strong> Strong players advance quickly</li>
                                            <li><strong>Engaging Matches:</strong> Keeps all players competitive</li>
                                        </ul>
                                    </DocSubSection>
                                </DocSection>
                            </motion.div>
                        )}

                        {/* Scoring & Results Section */}
                        {activeSection === 'scoring-results' && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5 }}
                            >
                                <DocSection title="Scoring & Results" id="scoring-results">
                                    <p className="text-lg mb-6">
                                        Track scores, calculate standings, and generate comprehensive tournament results.
                                    </p>

                                    <DocSubSection title="Score Entry">
                                        <p>Multiple ways to enter and manage game scores:</p>
                                        <ul className="list-disc pl-5 space-y-2">
                                            <li><strong>Individual Entry:</strong> Enter scores game by game</li>
                                            <li><strong>Bulk Entry:</strong> Upload multiple scores at once</li>
                                            <li><strong>Mobile Entry:</strong> Enter scores from mobile devices</li>
                                            <li><strong>Validation:</strong> Automatic score validation and error checking</li>
                                        </ul>
                                    </DocSubSection>

                                    <DocSubSection title="Standings Calculation">
                                        <p>Automatic calculation of tournament standings:</p>
                                        <ul className="list-disc pl-5 space-y-2">
                                            <li><strong>Score Points:</strong> Game points and bonus points</li>
                                            <li><strong>Game Points:</strong> Win/loss/draw records</li>
                                            <li><strong>Tiebreakers:</strong> Multiple tiebreaking methods</li>
                                            <li><strong>Real-time Updates:</strong> Instant standings updates</li>
                                        </ul>
                                    </DocSubSection>
                                </DocSection>
                            </motion.div>
                        )}

                        {/* Dashboard Section */}
                        {activeSection === 'dashboard' && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5 }}
                            >
                                <DocSection title="Tournament Dashboard" id="dashboard">
                                    <p className="text-lg mb-6">
                                        The tournament dashboard provides real-time information and control over your active tournament.
                                    </p>

                                    <DocSubSection title="Live Information">
                                        <p>Real-time tournament status and updates:</p>
                                        <ul className="list-disc pl-5 space-y-2">
                                            <li><strong>Current Round:</strong> Active round status and progress</li>
                                            <li><strong>Player Status:</strong> Who's playing, finished, or waiting</li>
                                            <li><strong>Game Results:</strong> Live score updates and game completion</li>
                                            <li><strong>Pairing Status:</strong> Current pairings and next round preparation</li>
                                        </ul>
                                    </DocSubSection>

                                    <DocSubSection title="Control Center">
                                        <p>Manage tournament flow and operations:</p>
                                        <ul className="list-disc pl-5 space-y-2">
                                            <li><strong>Round Management:</strong> Start, pause, and complete rounds</li>
                                            <li><strong>Pairing Generation:</strong> Create new pairings for next round</li>
                                            <li><strong>Result Processing:</strong> Process completed games and update standings</li>
                                            <li><strong>Tournament Control:</strong> Pause, resume, or end tournament</li>
                                        </ul>
                                    </DocSubSection>
                                </DocSection>
                            </motion.div>
                        )}

                        {/* Mobile Optimization Section */}
                        {activeSection === 'mobile-optimization' && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5 }}
                            >
                                <DocSection title="Mobile Features & Optimization" id="mobile-optimization">
                                    <p className="text-lg mb-6">
                                        Direktor is optimized for mobile devices, allowing tournament directors to manage events from anywhere.
                                    </p>

                                    <DocSubSection title="Mobile-First Design">
                                        <p>Built from the ground up for mobile devices:</p>
                                        <ul className="list-disc pl-5 space-y-2">
                                            <li><strong>Touch Interface:</strong> All controls optimized for touch interaction</li>
                                            <li><strong>Responsive Layout:</strong> Adapts to all screen sizes and orientations</li>
                                            <li><strong>Mobile Navigation:</strong> Intuitive navigation designed for mobile</li>
                                            <li><strong>Performance:</strong> Optimized for mobile bandwidth and processing</li>
                                        </ul>
                                    </DocSubSection>

                                    <DocSubSection title="Mobile-Specific Features">
                                        <p>Features designed specifically for mobile tournament management:</p>
                                        <ul className="list-disc pl-5 space-y-2">
                                            <li><strong>Photo Upload:</strong> Easy photo capture and upload from mobile cameras</li>
                                            <li><strong>Score Entry:</strong> Quick score entry with mobile-optimized forms</li>
                                            <li><strong>Player Check-in:</strong> Mobile check-in for tournament participants</li>
                                            <li><strong>Real-time Updates:</strong> Push notifications for important events</li>
                                        </ul>
                                    </DocSubSection>

                                    <DocSubSection title="Performance Optimization">
                                        <p>Mobile-specific performance enhancements:</p>
                                        <ul className="list-disc pl-5 space-y-2">
                                            <li><strong>Image Compression:</strong> Automatic compression for mobile uploads</li>
                                            <li><strong>Lazy Loading:</strong> Load content as needed to save bandwidth</li>
                                            <li><strong>Offline Support:</strong> Basic functionality without internet connection</li>
                                            <li><strong>Battery Optimization:</strong> Efficient power usage during long tournaments</li>
                                        </ul>
                                    </DocSubSection>
                                </DocSection>
                            </motion.div>
                        )}

                        {/* Advanced Features Section */}
                        {activeSection === 'advanced-features' && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5 }}
                            >
                                <DocSection title="Advanced Features" id="advanced-features">
                                    <p className="text-lg mb-6">
                                        Explore advanced features that make Direktor the most powerful tournament management platform available.
                                    </p>

                                    <DocSubSection title="Export & Reporting">
                                        <p>Comprehensive data export and reporting capabilities:</p>
                                        <ul className="list-disc pl-5 space-y-2">
                                            <li><strong>Tournament Reports:</strong> Detailed tournament summaries and statistics</li>
                                            <li><strong>Player Reports:</strong> Individual player performance and history</li>
                                            <li><strong>Data Export:</strong> Export data in multiple formats (CSV, JSON, PDF)</li>
                                            <li><strong>Custom Reports:</strong> Create custom reports for specific needs</li>
                                        </ul>
                                    </DocSubSection>

                                    <DocSubSection title="Integration & APIs">
                                        <p>Connect Direktor with other systems and services:</p>
                                        <ul className="list-disc pl-5 space-y-2">
                                            <li><strong>Rating Systems:</strong> Integration with NASPA, WESPA, and custom systems</li>
                                            <li><strong>Tournament Software:</strong> Export data for other tournament software</li>
                                            <li><strong>Communication Tools:</strong> Integration with email and messaging services</li>
                                            <li><strong>Analytics Platforms:</strong> Connect with external analytics tools</li>
                                        </ul>
                                    </DocSubSection>
                                </DocSection>
                            </motion.div>
                        )}

                        {/* Security Section */}
                        {activeSection === 'security' && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5 }}
                            >
                                <DocSection title="Security & Privacy" id="security">
                                    <p className="text-lg mb-6">
                                        Direktor implements enterprise-grade security measures to protect your tournament data and player information.
                                    </p>

                                    <DocSubSection title="Data Protection">
                                        <p>Comprehensive data security and privacy measures:</p>
                                        <ul className="list-disc pl-5 space-y-2">
                                            <li><strong>Encryption:</strong> All data encrypted in transit and at rest</li>
                                            <li><strong>Access Control:</strong> Role-based access control for all users</li>
                                            <li><strong>Audit Logging:</strong> Complete audit trail of all system activities</li>
                                            <li><strong>Data Backup:</strong> Regular automated backups with point-in-time recovery</li>
                                        </ul>
                                    </DocSubSection>

                                    <DocSubSection title="Privacy Compliance">
                                        <p>Compliance with privacy regulations and best practices:</p>
                                        <ul className="list-disc pl-5 space-y-2">
                                            <li><strong>GDPR Compliance:</strong> European privacy regulation compliance</li>
                                            <li><strong>Data Minimization:</strong> Only collect necessary data</li>
                                            <li><strong>User Consent:</strong> Clear consent for data collection and use</li>
                                            <li><strong>Data Portability:</strong> Users can export their data</li>
                                        </ul>
                                    </DocSubSection>
                                </DocSection>
                            </motion.div>
                        )}

                        {/* Troubleshooting Section */}
                        {activeSection === 'troubleshooting' && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5 }}
                            >
                                <DocSection title="Troubleshooting" id="troubleshooting">
                                    <p className="text-lg mb-6">
                                        Common issues and solutions to help you resolve problems quickly and get back to managing your tournament.
                                    </p>

                                    <DocSubSection title="Common Issues">
                                        <div className="space-y-4">
                                            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                                                <h5 className="font-semibold text-foreground mb-2">Photo Upload Issues</h5>
                                                <ul className="list-disc pl-5 space-y-1 text-sm">
                                                    <li><strong>ZIP file not uploading:</strong> Check file size (max 50MB) and format (.zip only)</li>
                                                    <li><strong>Photos not matching:</strong> Ensure filenames follow naming conventions</li>
                                                    <li><strong>Upload errors:</strong> Check internet connection and try again</li>
                                                </ul>
                                            </div>
                                            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                                                <h5 className="font-semibold text-foreground mb-2">Tournament Management Issues</h5>
                                                <ul className="list-disc pl-5 space-y-1 text-sm">
                                                    <li><strong>Can't start tournament:</strong> Verify all players are added and rounds configured</li>
                                                    <li><strong>Pairing errors:</strong> Check player count and pairing system settings</li>
                                                    <li><strong>Score entry issues:</strong> Ensure games are properly created before entering scores</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </DocSubSection>

                                    <DocSubSection title="Getting Help">
                                        <p>When you need additional assistance:</p>
                                        <ul className="list-disc pl-5 space-y-2">
                                            <li><strong>Documentation:</strong> Check this guide for detailed information</li>
                                            <li><strong>Community Support:</strong> Join our community forums for peer support</li>
                                            <li><strong>Technical Support:</strong> Contact our support team for technical issues</li>
                                            <li><strong>Feature Requests:</strong> Submit suggestions for new features</li>
                                        </ul>
                                    </DocSubSection>
                                </DocSection>
                            </motion.div>
                        )}

                        {/* API Reference Section */}
                        {activeSection === 'api-reference' && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5 }}
                            >
                                <DocSection title="API Reference" id="api-reference">
                                    <p className="text-lg mb-6">
                                        Technical documentation for developers and advanced users who want to integrate with Direktor.
                                    </p>

                                    <DocSubSection title="Component Props">
                                        <p>Key component interfaces and properties:</p>
                                        <div className="bg-muted/20 rounded-lg p-4">
                                            <h5 className="font-semibold text-foreground mb-2">PhotoDatabaseManager Props</h5>
                                            <pre className="text-sm bg-background p-3 rounded border overflow-x-auto">
{`interface PhotoDatabaseManagerProps {
  isOpen: boolean;                    // Modal open state
  onClose: () => void;               // Close handler
  players: Player[];                  // Tournament players
  tournamentId: number;               // Tournament ID
  onPhotosUpdated?: () => void;      // Callback when photos updated
}`}
                                            </pre>
                                        </div>
                                    </DocSubSection>

                                    <DocSubSection title="Database Schema">
                                        <p>Key database tables and relationships:</p>
                                        <div className="bg-muted/20 rounded-lg p-4">
                                            <h5 className="font-semibold text-foreground mb-2">Player Photos Table</h5>
                                            <pre className="text-sm bg-background p-3 rounded border overflow-x-auto">
{`CREATE TABLE player_photos (
    id BIGSERIAL PRIMARY KEY,
    tournament_id BIGINT NOT NULL REFERENCES tournaments(id),
    player_id BIGINT NOT NULL REFERENCES players(id),
    photo_url TEXT NOT NULL,
    filename TEXT NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tournament_id, player_id)
);`}
                                            </pre>
                                        </div>
                                    </DocSubSection>
                                </DocSection>
                            </motion.div>
                        )}

                        {/* Continue with other sections... */}
                        {!['overview', 'getting-started', 'tournament-setup', 'player-management', 'photo-system', 'pairing-systems', 'scoring-results', 'dashboard', 'mobile-optimization', 'advanced-features', 'security', 'troubleshooting', 'api-reference'].includes(activeSection) && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5 }}
                                className="text-center py-16"
                            >
                                <Icon name="Construction" size={64} className="mx-auto text-muted-foreground mb-4" />
                                <h2 className="text-2xl font-heading font-bold text-foreground mb-2">Section Under Development</h2>
                                <p className="text-muted-foreground">
                                    This documentation section is being expanded with comprehensive details. 
                                    Check back soon for complete coverage of {activeSection.replace('-', ' ')}.
                                </p>
                            </motion.div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default DocumentationPage;