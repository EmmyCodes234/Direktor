import React from 'react';
import Header from '../components/ui/Header';
import Icon from '../components/AppIcon';
import { motion } from 'framer-motion';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '../components/ui/Accordion';

const DocSection = ({ title, id, children }) => (
    <section id={id} className="mb-12 scroll-mt-24">
        <h2 className="text-3xl font-heading font-bold text-gradient mb-6 pb-2 border-b border-border">{title}</h2>
        <div className="prose prose-invert max-w-none text-muted-foreground leading-relaxed space-y-4">
            {children}
        </div>
    </section>
);

const DocumentationPage = () => {
    return (
        <div className="min-h-screen bg-background">
            <Header />
            <main className="pt-24 pb-12">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="max-w-4xl mx-auto px-6"
                >
                    <div className="text-center mb-16">
                        <Icon name="BookOpenCheck" size={48} className="mx-auto text-primary mb-4" />
                        <h1 className="text-5xl font-heading font-bold text-foreground">Direktor Documentation</h1>
                        <p className="text-lg text-muted-foreground mt-4">Your complete guide to running world-class Scrabble tournaments.</p>
                    </div>

                    <DocSection title="1. Introduction" id="intro">
                        <p>Welcome to Direktor, a next-generation, web-based platform designed to make Scrabble tournament management intuitive, efficient, and stress-free. This application was built on the core principle of a <strong>Guided Workflow</strong>. Unlike older, command-line based tools, Direktor analyzes your tournament's current state and intelligently presents you with only the relevant information and actions you need for that specific moment. It guides you from one step to the next, transforming the director's role from a technical operator into a true manager.</p>
                    </DocSection>

                    <DocSection title="2. Account Management" id="accounts">
                        <h3 className="text-xl font-heading font-semibold text-foreground mt-8 mb-4">Creating an Account</h3>
                        <p>To begin, you'll need a Direktor account. You can sign up using your Google account for quick access, or by providing your full name, email address, and a secure password. After signing up with an email, you will receive a verification link to confirm your account.</p>
                        <h3 className="text-xl font-heading font-semibold text-foreground mt-8 mb-4">Profile Settings</h3>
                        <p>Once logged in, you can access your profile from the user menu in the Tournament Lobby. Here, you can update your display name at any time. Your email address is used for login and cannot be changed.</p>
                    </DocSection>

                    <DocSection title="3. The Tournament Setup Wizard" id="setup">
                        <p>Creating a tournament is a simple 3-step process. From the Tournament Lobby, click the "New Tournament" button to begin.</p>
                        <Accordion type="single" collapsible className="w-full mt-6">
                            <AccordionItem value="step1">
                                <AccordionTrigger>Step 1: Tournament Details</AccordionTrigger>
                                <AccordionContent>
                                    <p>Enter the essential information for your event:</p>
                                    <ul className="list-disc pl-5">
                                        <li><strong>Tournament Name:</strong> The official name of your event (e.g., "Lagos International Scrabble Open 2025").</li>
                                        <li><strong>Venue:</strong> The physical or online location of the tournament.</li>
                                        <li><strong>Tournament Date:</strong> The start date of the event.</li>
                                    </ul>
                                </AccordionContent>
                            </AccordionItem>
                            <AccordionItem value="step2">
                                <AccordionTrigger>Step 2: Player Roster & The Master Library</AccordionTrigger>
                                <AccordionContent>
                                    <p>Direktor features a powerful <strong>Master Player Library</strong>. You only need to enter a player's full details once; for all future tournaments, their data can be instantly recalled.</p>
                                    <p>To add players, you can either paste a list directly into the text area or upload a CSV file. The format is `Player Name, Rating` (e.g., `John Smith, 1500`). Use a rating of `0` for unrated players.</p>
                                    <h4 className="text-lg font-heading font-semibold text-foreground mt-6 mb-2">The Reconciliation System</h4>
                                    <p>After you import your list, you will be taken to the "Review and Reconcile" screen. This is a critical step to prevent duplicate player profiles. For each imported player, the system will search the Master Library for potential matches and you can choose to:</p>
                                    <ul className="list-disc pl-5">
                                        <li><strong>Link to Existing Player:</strong> If you see the correct player in the "Potential Matches" column (identified by their photo, rating, and location), select them to link them to your tournament.</li>
                                        <li><strong>Create New Player:</strong> If the player is new to the system, or if the suggested matches are incorrect, choose this option to create a new, unique profile in the Master Library.</li>
                                    </ul>
                                </AccordionContent>
                            </AccordionItem>
                            <AccordionItem value="step3">
                                <AccordionTrigger>Step 3: Rounds Configuration</AccordionTrigger>
                                <AccordionContent>
                                    <p>Specify the total number of rounds for your tournament. Direktor will provide a recommended number of rounds based on your player count to help guide your decision.</p>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </DocSection>

                    <DocSection title="4. Managing a Live Tournament" id="dashboard">
                        <p>The Dashboard is your command center. It is context-aware and will change based on the tournament's status.</p>
                        <h3 className="text-xl font-heading font-semibold text-foreground mt-8 mb-4">Pairing a Round</h3>
                        <p>When a round is ready to begin, the "Command Deck" will prominently display a "Pair & Start Round" button. Clicking this will generate pairings based on the rules you've configured in the settings.</p>

                        <h3 className="text-xl font-heading font-semibold text-foreground mt-8 mb-4">Score Entry</h3>
                        <p>Once a round is paired, the Command Deck will show the list of matchups. Next to each match, there will be an "Enter Score" button. This opens a modal where you can input the scores for both players. If a score is entered incorrectly, you can click "Edit Score" on the same matchup or find the result in a player's game history (by clicking their name in the standings) to correct it at any time.</p>
                        
                        <h3 className="text-xl font-heading font-semibold text-foreground mt-8 mb-4">Remote Score Submission</h3>
                        <p>If you enable "Remote Score Submission" in the settings, players can submit their own scores from the public tournament page. These will appear in the "Pending Results" section on your dashboard for you to approve or reject with a single click.</p>
                    </DocSection>

                    <DocSection title="5. Advanced Settings" id="settings">
                        <h3 className="text-xl font-heading font-semibold text-foreground mt-8 mb-4">Pairings Strategy</h3>
                        <p>In the tournament's "Settings" page, under "Pairings Strategy," you have deep control over your event's structure.</p>
                        <ul className="list-disc pl-5">
                            <li><strong>Default System:</strong> Choose a single system (e.g., Swiss) for the whole tournament.</li>
                            <li><strong>Advanced Mode:</strong> Enable this to configure each round individually. For every round, you can specify:</li>
                            <ul className="list-disc pl-8">
                                <li>The **Pairing System** to use (Swiss, KOTH, Round-Robin, etc.).</li>
                                <li>The **Base Standings** to use for the pairing calculation (e.g., you can pair the first three rounds based on initial seeding instead of game results).</li>
                                <li>Whether to **Allow Rematches**.</li>
                            </ul>
                            <li><strong>Gibson Rule:</strong> You can enable the Gibson Rule, which automatically handles pairings correctly when a player has mathematically clinched first place before the final round.</li>
                        </ul>
                        <h3 className="text-xl font-heading font-semibold text-foreground mt-8 mb-4">Player & Photo Management</h3>
                        <p>After a tournament is created, you can manage the roster from the "Player Roster" page. Here, you can add, remove, or edit players. Editing a player allows you to update their details and upload a photo, which is then saved to their permanent profile in the Master Player Library.</p>
                    </DocSection>
                </motion.div>
            </main>
        </div>
    );
};

export default DocumentationPage;