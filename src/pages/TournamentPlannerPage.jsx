import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/ui/Header';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '../components/AppIcon';
import { toast, Toaster } from 'sonner';
import { supabase } from '../supabaseClient';

const TournamentPlannerPage = () => {
    const navigate = useNavigate();
    const [messages, setMessages] = useState([
        { from: 'ai', text: "Welcome! I'm here to help you plan your tournament. To start, how many players are you expecting?" }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [plan, setPlan] = useState(null);
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

        const conversationHistory = newMessages.map(m => `${m.from === 'ai' ? 'AI' : 'User'}: ${m.text}`).join('\n');

        try {
            const { data, error } = await supabase.functions.invoke('tournament-planner', {
                body: { conversation: conversationHistory },
            });

            if (error) throw error;
            
            if (data.plan) {
                setPlan(data.plan);
                setMessages(prev => [...prev, { from: 'ai', text: "Great! I've finalized a plan for you based on our conversation. You can review it below." }]);
            } else if (data.question) {
                setMessages(prev => [...prev, { from: 'ai', text: data.question }]);
            } else {
                throw new Error("The AI returned an unexpected response format.");
            }

        } catch (error) {
            toast.error(`AI Planner Error: ${error.message}`);
            setMessages(prev => [...prev, { from: 'ai', text: "I'm sorry, I encountered an error. Could you try rephrasing your last message?"}]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateTournament = () => {
        if (!plan) return;
        toast.success(`Redirecting to setup wizard with your new plan!`);
        setTimeout(() => {
            navigate(`/tournament-setup-configuration?name=${encodeURIComponent(plan.name)}&rounds=${plan.rounds}`);
        }, 1500);
    };

    return (
        <div className="min-h-screen bg-background">
            <Toaster position="top-center" richColors />
            <Header />
            <main className="pt-20 pb-8">
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
                                            <span className="w-2 h-2 bg-foreground rounded-full animate-pulse delay-0"></span>
                                            <span className="w-2 h-2 bg-foreground rounded-full animate-pulse delay-150"></span>
                                            <span className="w-2 h-2 bg-foreground rounded-full animate-pulse delay-300"></span>
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
                                    placeholder={plan ? "Review your plan below." : "Type your message..."}
                                    className="flex-1"
                                    disabled={isLoading || !!plan}
                                />
                                <Button onClick={handleSend} disabled={isLoading || !!plan} loading={isLoading}>Send</Button>
                            </div>
                        </div>
                    </div>

                    {plan && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                            <div className="glass-card p-6 mt-8">
                                <h3 className="font-semibold text-lg mb-4 text-foreground">Your Generated Plan</h3>
                                <div className="space-y-3 text-muted-foreground">
                                    <p><strong className="text-primary">Tournament Name:</strong> {plan.name}</p>
                                    <p><strong className="text-primary">Number of Rounds:</strong> {plan.rounds}</p>
                                    <p><strong className="text-primary">Duration:</strong> {plan.days} day(s)</p>
                                    <p><strong className="text-primary">Suggested Schedule:</strong> {plan.suggestedSchedule}</p>
                                </div>
                            </div>
                            <div className="mt-8 flex justify-end space-x-2">
                                 <Button variant="outline" onClick={() => { setPlan(null); setMessages(messages.slice(0,1))}}>Start Over</Button>
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