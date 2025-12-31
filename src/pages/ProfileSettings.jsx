import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/ui/Header';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { supabase } from '../supabaseClient';
import { toast, Toaster } from 'sonner';
import { motion } from 'framer-motion';
import { useOnboarding } from '../components/onboarding/OnboardingProvider';

const ProfileSettings = () => {
    const navigate = useNavigate();
    const { resetOnboarding } = useOnboarding();
    const [user, setUser] = useState(null);
    const [fullName, setFullName] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                setUser(session.user);
                setFullName(session?.user?.user_metadata?.full_name || '');
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

    const handleResetOnboarding = async () => {
        try {
            // Call the database function to reset onboarding
            const { error } = await supabase.rpc('reset_user_onboarding', {
                user_uuid: user.id
            });

            if (error) throw error;

            // Reset the local onboarding state
            resetOnboarding();

            toast.success("Onboarding has been reset. You can now go through it again!");
        } catch (error) {
            toast.error("Failed to reset onboarding: " + error.message);
        }
    };

    return (
        <div className="dark min-h-screen bg-[#020617]">
            <Toaster position="top-center" richColors />
            <Header />
            <main className="pt-24 pb-12">
                <div className="max-w-2xl mx-auto px-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-8"
                    >
                        <div className="text-center md:text-left">
                            <h1 className="text-3xl md:text-4xl font-heading font-bold text-white mb-2">Profile Settings</h1>
                            <p className="text-slate-400">Manage your account information and preferences.</p>
                        </div>

                        {/* Profile Card */}
                        <div className="bg-slate-900/50 backdrop-blur-md border border-white/10 rounded-2xl p-8 shadow-xl">
                            <form onSubmit={handleUpdateProfile} className="space-y-6">
                                <Input
                                    label="Email Address"
                                    name="email"
                                    type="email"
                                    value={user?.email || ''}
                                    disabled
                                    className="bg-slate-800/50 border-slate-700 text-slate-400"
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
                                    className="bg-slate-900/50 border-slate-700 text-white focus:border-emerald-500"
                                />
                                <div className="pt-4 flex flex-col sm:flex-row justify-end gap-4">
                                    <Button
                                        variant="outline"
                                        type="button"
                                        onClick={() => navigate('/lobby')}
                                        className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
                                    >
                                        Back to Lobby
                                    </Button>
                                    <Button
                                        type="submit"
                                        loading={loading}
                                        className="bg-emerald-600 hover:bg-emerald-500 text-white border-0"
                                    >
                                        Save Changes
                                    </Button>
                                </div>
                            </form>
                        </div>

                        {/* Onboarding Reset Section */}
                        <div className="bg-slate-900/50 backdrop-blur-md border border-white/10 rounded-2xl p-8 shadow-xl">
                            <h3 className="text-xl font-semibold text-white mb-2">Reset Onboarding</h3>
                            <p className="text-slate-400 mb-6">
                                Want to go through the guided setup tour again? This will reset your progress indicators.
                            </p>
                            <Button
                                variant="outline"
                                onClick={handleResetOnboarding}
                                className="w-full sm:w-auto border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                            >
                                Reset Onboarding Tour
                            </Button>
                        </div>
                    </motion.div>
                </div>
            </main>
        </div>
    );
};

export default ProfileSettings;