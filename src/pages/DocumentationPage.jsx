import React, { useState, useEffect } from 'react';
import Header from '../components/ui/Header';
import Icon from '../components/AppIcon';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ChevronRight, Book, Zap, Wrench, Terminal, HelpCircle, Database, Shield } from 'lucide-react';

// --- DATA SOURCE: THE ENCYCLOPEDIA ---
const DOCS_DATA = [
    {
        id: 'intro',
        title: 'Introduction & Architecture',
        icon: 'Book',
        content: (
            <div className="space-y-6">
                <p className="text-lg leading-relaxed text-slate-300">
                    <strong>The Direktor Encyclopedia (v2026.3)</strong> is the comprehensive technical and operational manual for the Direktor Tournament Management System.
                </p>
                <div className="bg-slate-900/50 border border-emerald-500/20 rounded-xl p-6">
                    <h3 className="text-emerald-400 font-bold text-xl mb-2 flex items-center gap-2">
                        <Database size={20} /> The "Single Truth" Philosophy
                    </h3>
                    <p className="text-slate-400 text-sm leading-relaxed">
                        Unlike legacy desktop pairing software (prone to file corruption), Direktor operates on a <strong>Local-First, Cloud-Synced</strong> model.
                        A real-time PostgreSQL database acts as the single source of truth. Score entry on the "Admin Console" triggers immediate websocket updates to all connected devices (Wall Charts, Player Phones).
                    </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-800/50 rounded-lg border border-white/5">
                        <h4 className="font-semibold text-white mb-1 flex items-center gap-2"><Shield size={16} className="text-blue-400" /> Player Identity</h4>
                        <p className="text-xs text-slate-400">Strict statuses: <strong>Active</strong>, <strong>Withdrawn</strong>, <strong>Paused</strong>.</p>
                    </div>
                    <div className="p-4 bg-slate-800/50 rounded-lg border border-white/5">
                        <h4 className="font-semibold text-white mb-1 flex items-center gap-2"><Zap size={16} className="text-yellow-400" /> Idempotency</h4>
                        <p className="text-xs text-slate-400">Operations like `ratings 1-5` are non-destructive and self-correcting.</p>
                    </div>
                </div>
            </div>
        )
    },
    {
        id: 'tutorials',
        title: 'Tutorials: Zero to Hero',
        icon: 'Zap',
        content: (
            <div className="space-y-8">
                <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-8">
                    <h3 className="text-2xl font-bold text-white mb-4">Running Your First Tournament</h3>
                    <div className="text-sm font-mono text-emerald-400 mb-6">Estimated Time: 10 Minutes</div>

                    <div className="space-y-6 relative">
                        {[
                            { title: "1. Create Event", desc: "Dashboard > (+) Card. Name: 'Summer Open'. Rounds: 5. System: Swiss." },
                            { title: "2. Add Players", desc: "Go to Roster. Add manually or import CSV." },
                            { title: "3. Start Round 1", desc: "Go to Command Center. Type `sw 1 0 0` in the CLI." },
                            { title: "4. Enter Results", desc: "Type `scores 1`. Enter `John 400 Jane 350`." },
                            { title: "5. Next Round", desc: "Type `miss` to check completion. Then `sw 2 1 0`." }
                        ].map((step, idx) => (
                            <div key={idx} className="flex gap-4">
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm">
                                    {idx + 1}
                                </div>
                                <div>
                                    <h4 className="font-bold text-white mb-1">{step.title}</h4>
                                    <p className="text-slate-400 text-sm">{step.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )
    },
    {
        id: 'how-to',
        title: 'How-To Guides',
        icon: 'Wrench',
        content: (
            <div className="grid grid-cols-1 gap-6">
                {[
                    {
                        title: "Correct a Wrong Score",
                        steps: ["If active: Re-enter `John 450 Jane 350`.", "If closed: `scores [rnd]` -> re-enter.", "CRITICAL: Run `stats` and `ratings` to fix history."]
                    },
                    {
                        title: "Handle Withdrawal",
                        steps: ["Go to Roster.", "Click 'Withdraw' icon.", "System skips them in next pairing automatically."]
                    },
                    {
                        title: "Manual Pairing",
                        steps: ["Type `man [rnd]`.", "Drag & Drop players on the board.", "Click Save."]
                    },
                    {
                        title: "Import Photos",
                        steps: ["Zip photos as `Name.jpg`.", "Type `pix import` in CLI.", "Upload Zip."]
                    }
                ].map((guide, idx) => (
                    <div key={idx} className="bg-slate-900/50 border border-white/5 p-6 rounded-xl hover:border-white/10 transition-colors">
                        <h3 className="font-bold text-white text-lg mb-4">{guide.title}</h3>
                        <ol className="list-decimal pl-4 space-y-2 text-slate-400 text-sm">
                            {guide.steps.map((s, i) => <li key={i} dangerouslySetInnerHTML={{ __html: s.replace(/`([^`]+)`/g, '<code class="bg-slate-800 px-1 rounded text-orange-300">$1</code>') }} />)}
                        </ol>
                    </div>
                ))}
            </div>
        )
    },
    {
        id: 'reference',
        title: 'Technical Reference',
        icon: 'Terminal',
        content: (
            <div className="space-y-12">

                {/* CONFIGURATION REFERENCE */}
                <div>
                    <h3 className="text-2xl font-bold text-white mb-6 border-b border-white/10 pb-4">Configuration Reference</h3>
                    <p className="text-slate-400 mb-4">Core parameters adjustable in the <strong>Settings</strong> dashboard.</p>
                    <div className="overflow-x-auto rounded-xl border border-white/10 bg-slate-950">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-white/5 text-emerald-400 font-bold border-b border-white/10">
                                <tr><th className="p-4">Parameter</th><th className="p-4">Options</th><th className="p-4">Description</th></tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 text-slate-300 font-mono">
                                {[
                                    ['rounds', '1-50', 'Total number of rounds in the event.'],
                                    ['pairing_system', 'Swiss, Round Robin, Random', 'Algorithm used for `sw`, `rr` commands.'],
                                    ['scoring_system', 'Standard, Handicap', 'Determines valid score inputs.'],
                                    ['is_public', 'True/False', 'Toggle visibility of the public landing page.'],
                                    ['remote_submission_enabled', 'True/False', 'Allow players to enter their own scores via mobile.']
                                ].map(([param, def, desc], i) => (
                                    <tr key={i} className="hover:bg-white/5 transition-colors">
                                        <td className="p-4 text-orange-400 font-bold">{param}</td>
                                        <td className="p-4 text-blue-400">{def}</td>
                                        <td className="p-4 text-slate-300 font-sans">{desc}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* EXTENDED COMMAND REFERENCE */}
                <div>
                    <h3 className="text-2xl font-bold text-white mb-6 border-b border-white/10 pb-4">Command Reference</h3>
                    <div className="overflow-x-auto rounded-xl border border-white/10 bg-slate-950 mb-6">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-white/5 text-emerald-400 font-bold border-b border-white/10">
                                <tr><th className="p-3">Cmd</th><th className="p-3">Args</th><th className="p-3">Description</th></tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 text-slate-300 font-mono">
                                {[
                                    ['sw', 'Rnd Base Rep', 'Swiss Pair (`sw 4 3 0`)'],
                                    ['koth', 'Rep Base', 'King of the Hill (Strict Rank)'],
                                    ['rr', 'Rep', 'Round Robin Schedule'],

                                    ['q', 'Type Rep Src', 'Quartile Pairing'],
                                    ['scores', 'Rnd', 'Enter Score Mode'],
                                    ['miss', '-', 'Show Missing Slips'],
                                    ['rs', 'Range', 'Round Standings (`rs 1-5`)'],
                                    ['sp', 'Range', 'Show Pairings (`sp 1-5`)'],
                                    ['ratings', 'Range', 'Recalculate Glicko (`ratings 1-5`)'],
                                    ['pix', 'import', 'Bulk Photo Import']
                                ].map(([cmd, args, desc], i) => (
                                    <tr key={i} className="hover:bg-white/5">
                                        <td className="p-3 text-orange-400">{cmd}</td>
                                        <td className="p-3 text-slate-500">{args}</td>
                                        <td className="p-3" dangerouslySetInnerHTML={{ __html: desc.replace(/`([^`]+)`/g, '<span class="text-white">$1</span>') }} />
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                        <div className="bg-slate-900/50 border border-white/5 p-6 rounded-xl">
                            <h4 className="text-lg font-bold text-white mb-2 font-mono">sw &lt;Rnd&gt; &lt;Base&gt; &lt;Rep&gt;</h4>
                            <p className="text-sm text-emerald-400 mb-4 font-mono">Example: sw 4 3 0 (Pair Rd 4, using Rd 3 ranks, 0 repeats)</p>
                            <ul className="list-disc pl-5 space-y-1 text-slate-400 text-sm">
                                <li><strong>Base:</strong> Set to 0 to use current ratings. Set to Rnd-1 for standard Swiss. Set to Rnd-2 to simulate "Lagged" Swiss.</li>
                                <li><strong>Repeats:</strong> Number of times players can meet (Usually 0).</li>
                            </ul>
                        </div>
                        <div className="bg-slate-900/50 border border-white/5 p-6 rounded-xl">
                            <h4 className="text-lg font-bold text-white mb-2 font-mono">q &lt;Type&gt; &lt;Rep&gt; &lt;Src&gt;</h4>
                            <p className="text-sm text-emerald-400 mb-4 font-mono">Quartile Pairing (Divides field into 4 groups)</p>
                            <ul className="list-disc pl-5 space-y-1 text-slate-400 text-sm">
                                <li><strong>Type 1:</strong> Q1vQ2, Q3vQ4 (Clash)</li>
                                <li><strong>Type 2:</strong> Q1vQ4, Q2vQ3 (Cross)</li>
                                <li><strong>Type 3:</strong> Q1vQ3, Q2vQ4 (Slide)</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* GLOSSARY */}
                <div>
                    <h3 className="text-2xl font-bold text-white mb-6 border-b border-white/10 pb-4">Glossary of Concepts</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                            ['Gibsonization', 'Automatic detection of a "Lock" scenario. The winner is paired against a "Spoiler" (non-prize winner) to preserve the race for 2nd place.'],
                            ['Spread', 'Cumulative margin of victory (Points For - Points Against). Primary tie-breaker.'],
                            ['Volatility (σ)', 'Glicko-2 metric measuring performance consistency. High σ = Erratic play.'],
                            ['Start Balancing', 'Algorithm attempts to equalize the number of "First Starts" (White/Black) for each player.']
                        ].map(([term, def], i) => (
                            <div key={i} className="p-4 bg-white/5 rounded-lg border border-white/5">
                                <h5 className="font-bold text-emerald-400 mb-1">{term}</h5>
                                <p className="text-sm text-slate-400">{def}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )
    },
    {
        id: 'faq',
        title: 'FAQ',
        icon: 'HelpCircle',
        content: (
            <div className="space-y-4">
                {[
                    { q: "Why can't I pair the next round?", a: "You have **Missing Games**. Run `miss`. You cannot pair until the base round is complete." },
                    { q: "What about odd numbers?", a: "The system assigns a **BYE** to the lowest-ranked eligible player. A Bye = Win (+0 Spread)." },
                    { q: "Can players enter scores?", a: "Yes, via **Remote Submission**. You see them populate live." },
                    { q: "Why did rating drop after a win?", a: "High Deviation (RD) collapse or beating a much lower rated player by a small margin. Run `ratings 1-X` to verify." }
                ].map((item, i) => (
                    <div key={i} className="bg-slate-900/50 border border-white/5 p-4 rounded-xl">
                        <h5 className="font-bold text-white mb-2 flex items-start gap-2">
                            <span className="text-emerald-500">Q:</span> {item.q}
                        </h5>
                        <p className="text-sm text-slate-300 pl-6 leading-relaxed" dangerouslySetInnerHTML={{ __html: item.a.replace(/\*\*([^\*]+)\*\*/g, '<strong class="text-white">$1</strong>').replace(/`([^`]+)`/g, '<code class="bg-slate-800 px-1 rounded text-orange-300">$1</code>') }} />
                    </div>
                ))}
            </div>
        )
    }
];

const DocumentationPage = () => {
    const [activeId, setActiveId] = useState('intro');
    const [searchQuery, setSearchQuery] = useState('');

    const filteredDocs = DOCS_DATA.filter(doc =>
        doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (typeof doc.content === 'string' && doc.content.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className="min-h-screen bg-[#020617] text-slate-200 font-sans selection:bg-emerald-500/30">
            <Header />

            <div className="max-w-7xl mx-auto pt-20 flex flex-col lg:flex-row min-h-[calc(100vh-80px)]">

                {/* SIDEBAR */}
                <aside className="w-full lg:w-72 flex-shrink-0 lg:border-r border-white/5 bg-[#020617]/95 backdrop-blur lg:sticky lg:top-20 lg:h-[calc(100vh-5rem)] overflow-y-auto z-10">
                    <div className="p-6">
                        <div className="relative mb-6">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                            <input
                                type="text"
                                placeholder="Search Encyclopedia..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-slate-900/50 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-colors"
                            />
                        </div>

                        <nav className="space-y-1">
                            {DOCS_DATA.map((section) => (
                                <button
                                    key={section.id}
                                    onClick={() => setActiveId(section.id)}
                                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group ${activeId === section.id
                                        ? 'bg-emerald-500/10 text-white shadow-[0_0_20px_rgba(16,185,129,0.1)] border border-emerald-500/20'
                                        : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <Icon name={section.icon} size={18} className={activeId === section.id ? "text-emerald-400" : "text-slate-500 group-hover:text-slate-400"} />
                                        <span className="font-medium text-sm">{section.title.split(':')[0]}</span>
                                    </div>
                                    {activeId === section.id && <ChevronRight size={14} className="text-emerald-500/50" />}
                                </button>
                            ))}
                        </nav>

                        <div className="mt-8 pt-6 border-t border-white/5">
                            <div className="bg-gradient-to-br from-emerald-500/10 to-blue-500/10 rounded-xl p-4 border border-white/5">
                                <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2">Need Help?</h4>
                                <p className="text-xs text-slate-400 mb-3">Join our Discord for real-time support from other directors.</p>
                                <button className="w-full py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-medium text-white transition-colors border border-white/5">
                                    Join Community
                                </button>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* MAIN CONTENT */}
                <main className="flex-1 min-w-0">
                    <div className="max-w-4xl mx-auto px-6 py-8 lg:px-12 lg:py-12">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeId}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                            >
                                <div className="mb-8">
                                    <div className="flex items-center gap-2 text-emerald-500 mb-2 text-sm font-medium uppercase tracking-widest">
                                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                        Documentation
                                    </div>
                                    <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-4">
                                        {DOCS_DATA.find(d => d.id === activeId)?.title}
                                    </h1>
                                    <div className="h-1 w-20 bg-emerald-500 rounded-full"></div>
                                </div>

                                <div className="prose prose-invert prose-emerald max-w-none">
                                    {DOCS_DATA.find(d => d.id === activeId)?.content}
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </main>

                <footer className="py-8 text-center text-xs text-slate-600 font-mono border-t border-white/5 mt-auto bg-[#020617]">
                    <div className="flex items-center justify-center gap-2">
                        <span>Architected by <strong className="text-slate-400">Emmanuel Enyi</strong></span>
                        <img src="https://flagcdn.com/w20/ng.png" alt="Nigeria" className="w-4 h-auto opacity-80" />
                    </div>
                    <p className="mt-1 opacity-50">Lagos, Nigeria</p>
                </footer>
            </div>
        </div>
    );
};

export default DocumentationPage;