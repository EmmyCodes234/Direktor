import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import Button from '../ui/Button';
import Icon from '../AppIcon';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/Avatar';
import { toast } from 'sonner';

const DirectorChatWidget = ({ tournamentId, currentUser }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [unreadCount, setUnreadCount] = useState(0);
    const scrollRef = useRef(null);

    // Initial Fetch
    useEffect(() => {
        if (!tournamentId) return;

        const fetchMessages = async () => {
            const { data, error } = await supabase
                .from('director_messages')
                .select('*')
                .eq('tournament_id', tournamentId)
                .order('created_at', { ascending: true });

            if (error) {
                console.error('Error loading chat:', error);
            } else {
                setMessages(data || []);
                scrollToBottom();
            }
            setLoading(false);
        };

        fetchMessages();

        // Realtime Subscription
        const channel = supabase
            .channel(`director_chat:${tournamentId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'director_messages',
                    filter: `tournament_id=eq.${tournamentId}`
                },
                (payload) => {
                    setMessages(prev => [...prev, payload.new]);
                    if (!isOpen && payload.new.user_id !== currentUser?.id) {
                        setUnreadCount(prev => prev + 1);
                    }
                    scrollToBottom();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [tournamentId, isOpen, currentUser?.id]);

    const scrollToBottom = () => {
        setTimeout(() => {
            if (scrollRef.current) {
                scrollRef.current.scrollIntoView({ behavior: 'smooth' });
            }
        }, 100);
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        try {
            const { error } = await supabase
                .from('director_messages')
                .insert([{
                    tournament_id: tournamentId,
                    user_id: currentUser?.id,
                    content: newMessage.trim(),
                    sender_name: currentUser?.user_metadata?.full_name || currentUser?.email
                }]);

            if (error) throw error;
            setNewMessage('');
        } catch (error) {
            console.error('Failed to send:', error);
            toast.error('Failed to send message');
        }
    };

    const toggleChat = () => {
        setIsOpen(!isOpen);
        if (!isOpen) {
            setUnreadCount(0);
            scrollToBottom();
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            {/* Expanded Window */}
            {isOpen && (
                <Card className="w-80 h-96 mb-4 shadow-2xl border-border bg-card flex flex-col animate-in slide-in-from-bottom-10 fade-in duration-200">
                    <CardHeader className="py-3 px-4 bg-muted/40 border-b flex flex-row items-center justify-between space-y-0">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Icon name="MessageSquare" size={16} className="text-emerald-500" />
                            Director Chat
                        </CardTitle>
                        <Button variant="ghost" size="sm" onClick={toggleChat} className="h-6 w-6 p-0">
                            <Icon name="X" size={14} />
                        </Button>
                    </CardHeader>

                    <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950/20">
                        {loading ? (
                            <div className="text-center text-xs text-muted-foreground py-4">Connecting...</div>
                        ) : messages.length === 0 ? (
                            <div className="text-center text-xs text-muted-foreground py-8">
                                No messages yet. <br /> Coordinate with your team here!
                            </div>
                        ) : (
                            messages.map((msg, idx) => {
                                const isMe = msg.user_id === currentUser?.id;
                                return (
                                    <div
                                        key={msg.id || idx}
                                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                                    >
                                        <div
                                            className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${isMe
                                                ? 'bg-emerald-600 text-white rounded-br-none'
                                                : 'bg-slate-800 text-slate-200 rounded-bl-none'
                                                }`}
                                        >
                                            {msg.content}
                                        </div>
                                        <div className="text-[10px] text-muted-foreground mt-1 px-1">
                                            {isMe ? 'You' : (msg.sender_name || 'Collaborator')} • {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                        <div ref={scrollRef} />
                    </CardContent>

                    <div className="p-3 border-t bg-card">
                        <form onSubmit={handleSend} className="flex gap-2">
                            <input
                                className="flex-1 bg-muted/50 border-0 rounded-full px-3 py-2 text-sm focus:ring-1 focus:ring-emerald-500 outline-none"
                                placeholder="Type a message..."
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                            />
                            <Button
                                type="submit"
                                size="sm"
                                className="rounded-full w-8 h-8 p-0 bg-emerald-600 hover:bg-emerald-500"
                                disabled={!newMessage.trim()}
                            >
                                <Icon name="Send" size={14} className="text-white" />
                            </Button>
                        </form>
                    </div>
                </Card>
            )}

            {/* Toggle Button */}
            <Button
                onClick={toggleChat}
                className={`rounded-full h-14 w-14 shadow-glow hover:shadow-glow-lg transition-all duration-300 ${isOpen ? 'bg-slate-800 hover:bg-slate-700' : 'bg-emerald-600 hover:bg-emerald-500'
                    }`}
            >
                <div className="relative">
                    <Icon name={isOpen ? "Minimize2" : "MessageSquare"} size={24} className="text-white" />
                    {unreadCount > 0 && !isOpen && (
                        <div className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center z-10">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-5 w-5 bg-red-600 items-center justify-center text-[10px] font-bold text-white border-2 border-slate-900 shadow-sm">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        </div>
                    )}
                </div>
            </Button>
        </div>
    );
};

export default DirectorChatWidget;
