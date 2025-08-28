import React, { useState } from 'react';
import Header from '../components/ui/Header';
import Icon from '../components/AppIcon';
import { motion } from 'framer-motion';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '../components/ui/Accordion';
import Button from '../components/ui/Button';
import ExpandableTabsJS from '../components/ui/expandable-tabs';
import { Home, Play, Settings, Users, Shuffle, BarChart3, LayoutDashboard, Zap, HelpCircle, Code } from 'lucide-react';

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
        { id: 'pairing-systems', label: 'Pairing Systems', icon: 'Shuffle' },
        { id: 'scoring-results', label: 'Scoring & Results', icon: 'BarChart3' },
        { id: 'dashboard', label: 'Tournament Dashboard', icon: 'LayoutDashboard' },
        { id: 'advanced-features', label: 'Advanced Features', icon: 'Zap' },
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
                                    { type: "separator" },
                                    { title: "Pairing Systems", icon: Shuffle },
                                    { title: "Scoring & Results", icon: BarChart3 },
                                    { title: "Dashboard", icon: LayoutDashboard },
                                    { title: "Advanced Features", icon: Zap },
                                    { title: "Troubleshooting", icon: HelpCircle },
                                    { title: "API Reference", icon: Code },
                                ]}
                                activeColor="text-purple-500"
                                className="border-purple-200 dark:border-purple-800 bg-gradient-to-r from-purple-50/50 to-pink-50/50 dark:from-purple-950/50 dark:to-pink-950/50"
                                onChange={(index) => {
                                    if (index !== null) {
                                        const sections = ['overview', 'getting-started', 'tournament-setup', 'player-management', 'pairing-systems', 'scoring-results', 'dashboard', 'advanced-features', 'troubleshooting', 'api-reference'];
                                        if (sections[index]) {
                                            setActiveSection(sections[index]);
                                        }
                                    }
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
                                            title="Guided Workflow"
                                            description="The system analyzes your tournament's current state and presents only relevant actions and information for each moment."
                                        />
                                        <FeatureCard
                                            icon="Shield"
                                            title="Data Security"
                                            description="Enterprise-grade security with Row Level Security (RLS) ensuring each user only sees their own tournament data."
                                        />
                                        <FeatureCard
                                            icon="Database"
                                            title="Master Player Library"
                                            description="Centralized player database that prevents duplicates and maintains player history across all tournaments."
                                        />
                                        <FeatureCard
                                            icon="Globe"
                                            title="Web-Based"
                                            description="Access from anywhere, no downloads required. Works seamlessly on desktop, tablet, and mobile devices."
                                        />
                                    </div>
                                </DocSection>

                                <DocSection title="Key Features" id="key-features">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <FeatureCard
                                            icon="Settings"
                                            title="Smart Tournament Setup"
                                            description="3-step wizard with intelligent defaults and recommendations based on player count and tournament type."
                                        />
                                        <FeatureCard
                                            icon="Shuffle"
                                            title="Advanced Pairing Systems"
                                            description="Support for Swiss, King of the Hill, Round Robin, and custom pairing algorithms with Gibson Rule support."
                                        />
                                        <FeatureCard
                                            icon="BarChart3"
                                            title="Real-time Scoring"
                                            description="Live score entry with automatic standings updates and comprehensive tournament statistics."
                                        />
                                        <FeatureCard
                                            icon="Users"
                                            title="Player Management"
                                            description="Comprehensive player profiles with photos, ratings, and tournament history tracking."
                                        />
                                        <FeatureCard
                                            icon="Share2"
                                            title="Public Tournament Pages"
                                            description="Share live standings and results with players and spectators through public tournament URLs."
                                        />
                                        <FeatureCard
                                            icon="Download"
                                            title="Export & Reporting"
                                            description="Export tournament data in multiple formats and generate detailed reports for tournament analysis."
                                        />
                                    </div>
                                </DocSection>

                                <DocSection title="System Requirements" id="system-requirements">
                                    <div className="bg-muted/20 rounded-lg p-6">
                                        <h4 className="font-semibold text-foreground mb-4">Browser Compatibility</h4>
                                        <ul className="space-y-2 text-sm">
                                            <li>• <strong>Chrome/Edge:</strong> Version 90 or later</li>
                                            <li>• <strong>Firefox:</strong> Version 88 or later</li>
                                            <li>• <strong>Safari:</strong> Version 14 or later</li>
                                            <li>• <strong>Mobile:</strong> iOS Safari 14+, Chrome Mobile 90+</li>
                                        </ul>
                                        
                                        <h4 className="font-semibold text-foreground mt-6 mb-4">Internet Connection</h4>
                                        <p className="text-sm">Stable internet connection required for real-time updates and data synchronization.</p>
                                        
                                        <h4 className="font-semibold text-foreground mt-6 mb-4">Recommended</h4>
                                        <ul className="space-y-2 text-sm">
                                            <li>• <strong>Screen Size:</strong> 1024px or wider for optimal experience</li>
                                            <li>• <strong>RAM:</strong> 4GB or more for smooth performance</li>
                                            <li>• <strong>Storage:</strong> No local storage required (cloud-based)</li>
                                        </ul>
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
                                        <h4 className="font-semibold text-primary mb-3">💡 Pro Tip</h4>
                                        <p className="text-sm">
                                            Take advantage of the <strong>Master Player Library</strong> from the start. Even if you're running your first tournament, 
                                            entering player details properly will save you significant time in future tournaments as the system will 
                                            automatically recognize returning players.
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
                                        The tournament setup process is designed to be intuitive and comprehensive. Follow this step-by-step guide to create your tournament.
                                    </p>

                                    <DocSubSection title="Step 1: Tournament Details">
                                        <p>Begin by providing the essential information for your event:</p>
                                        <div className="bg-muted/20 rounded-lg p-6 mt-4">
                                            <h4 className="font-semibold text-foreground mb-3">Required Information</h4>
                                            <ul className="space-y-2 text-sm">
                                                <li><strong>Tournament Name:</strong> The official name of your event (e.g., "Lagos International Scrabble Open 2025")</li>
                                                <li><strong>Venue:</strong> Physical location or online platform where the tournament will be held</li>
                                                <li><strong>Tournament Date:</strong> The start date of the event</li>
                                                <li><strong>Description:</strong> Optional details about the tournament format, prizes, or special rules</li>
                                            </ul>
                                        </div>
                                    </DocSubSection>

                                    <DocSubSection title="Step 2: Player Roster Management">
                                        <p>Direktor features a powerful <strong>Master Player Library</strong> that prevents duplicate profiles and maintains player history:</p>
                                        
                                        <h4 className="text-lg font-heading font-semibold text-foreground mt-6 mb-3">Adding Players</h4>
                                        <p>You can add players using multiple methods:</p>
                                        <ul className="list-disc pl-5 space-y-2">
                                            <li><strong>Manual Entry:</strong> Add players one by one with full details</li>
                                            <li><strong>Bulk Import:</strong> Paste a list of players in the format: <code>Player Name, Rating</code></li>
                                            <li><strong>CSV Upload:</strong> Import from a CSV file with player data</li>
                                            <li><strong>Existing Players:</strong> Search and add players already in the Master Library</li>
                                        </ul>

                                        <h4 className="text-lg font-heading font-semibold text-foreground mt-6 mb-3">Player Reconciliation</h4>
                                        <p>After importing players, the system will automatically check for potential matches in the Master Library:</p>
                                        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mt-4">
                                            <ul className="space-y-2 text-sm">
                                                <li><strong>Link to Existing:</strong> Connect to an existing player profile if a match is found</li>
                                                <li><strong>Create New:</strong> Generate a new profile for first-time players</li>
                                                <li><strong>Review Details:</strong> Update player information and upload photos</li>
                                            </ul>
                                        </div>
                                    </DocSubSection>

                                    <DocSubSection title="Step 3: Tournament Configuration">
                                        <p>Configure the tournament structure and pairing settings:</p>
                                        
                                        <h4 className="text-lg font-heading font-semibold text-foreground mt-6 mb-3">Rounds Configuration</h4>
                                        <ul className="list-disc pl-5 space-y-2">
                                            <li><strong>Number of Rounds:</strong> Set the total rounds (system provides recommendations based on player count)</li>
                                            <li><strong>Time Controls:</strong> Configure game time limits and overtime rules</li>
                                            <li><strong>Scoring System:</strong> Choose between traditional scoring or custom point systems</li>
                                        </ul>

                                        <h4 className="text-lg font-heading font-semibold text-foreground mt-6 mb-3">Pairing Strategy</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                            <div className="bg-muted/20 rounded-lg p-4">
                                                <h5 className="font-semibold text-foreground mb-2">Basic Mode</h5>
                                                <p className="text-sm">Single pairing system for the entire tournament (e.g., Swiss for all rounds)</p>
                                            </div>
                                            <div className="bg-muted/20 rounded-lg p-4">
                                                <h5 className="font-semibold text-foreground mb-2">Advanced Mode</h5>
                                                <p className="text-sm">Configure different pairing systems for each round with custom rules</p>
                                            </div>
                                        </div>
                                    </DocSubSection>

                                    <DocSubSection title="Step 4: Final Review & Launch">
                                        <p>Before launching your tournament, review all settings:</p>
                                        <div className="bg-muted/20 rounded-lg p-6 mt-4">
                                            <h4 className="font-semibold text-foreground mb-4">Pre-Launch Checklist</h4>
                                            <ul className="space-y-2 text-sm">
                                                <li>✓ Tournament details are complete and accurate</li>
                                                <li>✓ All players have been added and reconciled</li>
                                                <li>✓ Round configuration matches your tournament format</li>
                                                <li>✓ Pairing strategy is configured correctly</li>
                                                <li>✓ Scoring parameters are set appropriately</li>
                                                <li>✓ Public tournament page settings are configured (if needed)</li>
                                            </ul>
                                        </div>
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
                                        Comprehensive player management tools to handle tournament participants efficiently and maintain accurate player data.
                                    </p>

                                    <DocSubSection title="Master Player Library">
                                        <p>The Master Player Library is the foundation of Direktor's player management system:</p>
                                        <ul className="list-disc pl-5 space-y-2">
                                            <li><strong>Centralized Database:</strong> All player information stored in one location</li>
                                            <li><strong>Duplicate Prevention:</strong> Automatic detection and merging of duplicate profiles</li>
                                            <li><strong>Historical Data:</strong> Complete tournament history and performance tracking</li>
                                            <li><strong>Cross-Tournament Access:</strong> Players available across all your tournaments</li>
                                        </ul>
                                    </DocSubSection>

                                    <DocSubSection title="Adding Players to Tournaments">
                                        <h4 className="text-lg font-heading font-semibold text-foreground mt-6 mb-3">Methods of Player Addition</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                                            <div className="glass-card p-6 rounded-xl">
                                                <h5 className="font-semibold text-foreground mb-3">Individual Addition</h5>
                                                <ul className="space-y-2 text-sm">
                                                    <li>• Manual entry with full details</li>
                                                    <li>• Photo upload capability</li>
                                                    <li>• Rating and location information</li>
                                                    <li>• Contact details (optional)</li>
                                                </ul>
                                            </div>
                                            <div className="glass-card p-6 rounded-xl">
                                                <h5 className="font-semibold text-foreground mb-3">Bulk Import</h5>
                                                <ul className="space-y-2 text-sm">
                                                    <li>• CSV file upload</li>
                                                    <li>• Text area paste functionality</li>
                                                    <li>• Automatic format detection</li>
                                                    <li>• Batch reconciliation process</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </DocSubSection>

                                    <DocSubSection title="Player Profiles & Data">
                                        <h4 className="text-lg font-heading font-semibold text-foreground mt-6 mb-3">Profile Information</h4>
                                        <div className="bg-muted/20 rounded-lg p-6 mt-4">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div>
                                                    <h5 className="font-semibold text-foreground mb-3">Basic Information</h5>
                                                    <ul className="space-y-2 text-sm">
                                                        <li>• Full name and display name</li>
                                                        <li>• Profile photo</li>
                                                        <li>• Current rating</li>
                                                        <li>• Location/country</li>
                                                    </ul>
                                                </div>
                                                <div>
                                                    <h5 className="font-semibold text-foreground mb-3">Tournament Data</h5>
                                                    <ul className="space-y-2 text-sm">
                                                        <li>• Tournament participation history</li>
                                                        <li>• Performance statistics</li>
                                                        <li>• Win/loss records</li>
                                                        <li>• Rating progression</li>
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>
                                    </DocSubSection>

                                    <DocSubSection title="Player Management Tools">
                                        <h4 className="text-lg font-heading font-semibold text-foreground mt-6 mb-3">Available Actions</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                                            <div className="bg-muted/20 rounded-lg p-4">
                                                <h5 className="font-semibold text-foreground mb-2">Edit Player</h5>
                                                <p className="text-sm">Update player information, photos, and tournament-specific details</p>
                                            </div>
                                            <div className="bg-muted/20 rounded-lg p-4">
                                                <h5 className="font-semibold text-foreground mb-2">Remove Player</h5>
                                                <p className="text-sm">Remove players from current tournament (doesn't delete from Master Library)</p>
                                            </div>
                                            <div className="bg-muted/20 rounded-lg p-4">
                                                <h5 className="font-semibold text-foreground mb-2">Player Statistics</h5>
                                                <p className="text-sm">View detailed performance data and tournament history</p>
                                            </div>
                                        </div>
                                    </DocSubSection>
                                </DocSection>
                            </motion.div>
                        )}

                        {/* Continue with other sections... */}
                        {!['overview', 'getting-started', 'tournament-setup', 'player-management'].includes(activeSection) && (
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