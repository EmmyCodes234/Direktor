import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/ui/Header';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { supabase } from '../supabaseClient';
import { toast, Toaster } from 'sonner';
import { motion } from 'framer-motion';

const ProfileSettings = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [fullName, setFullName] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                setUser(session.user);
                setFullName(session.user.user_metadata.full_name || '');
            } else {
                navigate('/login');
            }
        };
        fetchUser();
    }, [navigate]);

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { data, error } = await supabase.auth.updateUser({
                data: { full_name: fullName }
            });

            if (error) throw error;
            
            toast.success("Profile updated successfully!");
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <Toaster position="top-center" richColors />
            <Header />
            <main className="pt-20 pb-8">
                <div className="max-w-xl mx-auto px-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <div className="mb-8">
                            <h1 className="text-3xl font-heading font-bold text-gradient">Profile Settings</h1>
                            <p className="text-muted-foreground">Update your personal information.</p>
                        </div>

                        <div className="glass-card p-8">
                            <form onSubmit={handleUpdateProfile} className="space-y-6">
                                <Input
                                    label="Email Address"
                                    name="email"
                                    type="email"
                                    value={user?.email || ''}
                                    disabled
                                    description="You cannot change your email address."
                                />
                                <Input
                                    label="Full Name"
                                    name="fullName"
                                    type="text"
                                    placeholder="Enter your full name"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    required
                                />
                                <div className="pt-2 flex justify-end space-x-2">
                                    <Button variant="outline" type="button" onClick={() => navigate('/lobby')}>
                                        Back to Lobby
                                    </Button>
                                    <Button type="submit" loading={loading}>
                                        Save Changes
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                </div>
            </main>
        </div>
    );
};

export default ProfileSettings;