import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/ui/Header';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '../components/AppIcon';
import { toast, Toaster } from 'sonner';
import { TournamentKnowledgeBase } from '../lib/TournamentKnowledgeBase';

const TournamentPlannerPage = () => {
    const navigate = useNavigate();
    const [messages, setMessages] = useState([
        { from: 'ai', text: TournamentKnowledgeBase.getInitialGreeting() }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [plan, setPlan] = useState({});
    const [conversationState, setConversationState] = useState('awaiting_name');
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages, isLoading]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage = { from: 'user', text: input };
        const newMessages = [...messages, userMessage];
        setMessages(newMessages);
        setInput('');
        setIsLoading(true);

        // Simulate AI thinking time
        setTimeout(() => {
            const { aiResponse, newPlan, nextState } = TournamentKnowledgeBase.getResponse(conversationState, input.trim(), plan);

            setMessages(prev => [...prev, { from: 'ai', text: aiResponse }]);
            setPlan(newPlan);
            setConversationState(nextState);
            setIsLoading(false);

        }, 1200);
    };

    const handleCreateTournament = () => {
        if (!plan) return;
        toast.success(`Redirecting to setup wizard with your new plan!`);
        
        const params = new URLSearchParams({
            name: plan.name,
            rounds: plan.rounds,
            venue: plan.venue || '',
            type: plan.type || 'individual'
        });

        if (plan.date) {
            params.append('date', plan.date);
        }
        if (plan.start_date) {
            params.append('start_date', plan.start_date);
        }
        if (plan.end_date) {
            params.append('end_date', plan.end_date);
        }

        setTimeout(() => {
            navigate(`/tournament-setup-configuration?${params.toString()}`);
        }, 1500);
    };

    return (
        <div className="min-h-screen bg-background">
            <Toaster position="top-center" richColors />
            <Header />
            <main className="pt-16 pb-8">
                <div className="max-w-2xl mx-auto px-6">
                    <div className="text-center mb-8">
                        <Icon name="Bot" size={48} className="mx-auto text-primary mb-4" />
                        <h1 className="text-3xl font-heading font-bold text-gradient">Tournament Planner AI</h1>
                        <p className="text-muted-foreground">Chat with our AI to design your next event.</p>
                    </div>

                    <div className="glass-card h-[60vh] flex flex-col">
                        <div className="flex-1 p-6 space-y-4 overflow-y-auto">
                            <AnimatePresence>
                                {messages.map((msg, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={`flex items-start gap-3 ${msg.from === 'user' ? 'justify-end' : ''}`}
                                    >
                                        {msg.from === 'ai' && <Icon name="Bot" className="text-primary mt-1 shrink-0" />}
                                        <div className={`max-w-md p-3 rounded-lg ${msg.from === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted/30'}`}>
                                            {msg.text}
                                        </div>
                                    </motion.div>
                                ))}
                                {isLoading && (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-start gap-3">
                                        <Icon name="Bot" className="text-primary mt-1 shrink-0" />
                                        <div className="max-w-sm p-3 rounded-lg bg-muted/30 flex items-center space-x-2">
                                            <div className="w-2 h-2 bg-foreground rounded-full animate-pulse"></div>
                                            <div className="w-2 h-2 bg-foreground rounded-full animate-pulse"></div>
                                            <div className="w-2 h-2 bg-foreground rounded-full animate-pulse"></div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                            <div ref={messagesEndRef} />
                        </div>
                        <div className="p-4 border-t border-border">
                            <div className="flex items-center space-x-2">
                                <Input 
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                                    placeholder={conversationState === 'plan_complete' ? "Review your plan below." : "Type your message..."}
                                    className="flex-1"
                                    disabled={isLoading || conversationState === 'plan_complete'}
                                />
                                <Button onClick={handleSend} disabled={isLoading || conversationState === 'plan_complete'} loading={isLoading}>Send</Button>
                            </div>
                        </div>
                    </div>

                    {conversationState === 'plan_complete' && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                            <div className="glass-card p-6 mt-8">
                                <h3 className="font-semibold text-lg mb-4 text-foreground">Your Generated Plan</h3>
                                <div className="space-y-3 text-muted-foreground">
                                    <p><strong className="text-primary">Tournament Name:</strong> {plan.name}</p>
                                    <p><strong className="text-primary">Venue:</strong> {plan.venue}</p>
                                    <p><strong className="text-primary">Type:</strong> {plan.type}</p>
                                    <p><strong className="text-primary">Date(s):</strong> {plan.date || `${plan.start_date} to ${plan.end_date}`}</p>
                                    <p><strong className="text-primary">Expected Players:</strong> {plan.playerCount}</p>
                                    <p><strong className="text-primary">Number of Rounds:</strong> {plan.rounds}</p>
                                    {plan.divisionDetails && <p><strong className="text-primary">Division Details:</strong> {plan.divisionDetails}</p>}
                                </div>
                            </div>
                            <div className="mt-8 flex justify-end space-x-2">
                                 <Button variant="outline" onClick={() => { setPlan({}); setMessages(messages.slice(0,1)); setConversationState('awaiting_name'); }}>Start Over</Button>
                                 <Button className="shadow-glow" onClick={handleCreateTournament}>
                                    <Icon name="Wand2" className="mr-2"/>
                                    Create Tournament from this Plan
                                 </Button>
                            </div>
                        </motion.div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default TournamentPlannerPage;