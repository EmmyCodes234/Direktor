import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/ui/Header';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import FileUpload from '../components/ui/FileUpload';
import { countries } from '../utils/countries';
import { supabase } from '../supabaseClient';
import { toast, Toaster } from 'sonner';
import { motion } from 'framer-motion';
import { useOnboarding } from '../components/onboarding/OnboardingProvider';
import { useAppDispatch } from '../store/hooks';
import { setUser as setAuthUser } from '../store/slices/authSlice';

const ProfileSettings = () => {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const { resetOnboarding } = useOnboarding();
    const [user, setUser] = useState(null);
    const [fullName, setFullName] = useState('');
    const [countryCode, setCountryCode] = useState('');
    const [avatarFile, setAvatarFile] = useState(null);
    const [previewAvatar, setPreviewAvatar] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                setUser(session.user);
                setFullName(session?.user?.user_metadata?.full_name || '');
                setCountryCode(session?.user?.user_metadata?.country || '');
                setPreviewAvatar(session?.user?.user_metadata?.avatar_url || null);
            } else {
                navigate('/login');
            }
        };
        fetchUser();
    }, [navigate]);

    const handleAvatarChange = (file) => {
        if (file) {
            setAvatarFile(file);
            setPreviewAvatar(URL.createObjectURL(file));
        }
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            let avatarUrl = user.user_metadata?.avatar_url;

            if (avatarFile) {
                const fileExt = avatarFile.name.split('.').pop();
                const fileName = `${user.id}/${Date.now()}.${fileExt}`;
                const { error: uploadError } = await supabase.storage
                    .from('avatars')
                    .upload(fileName, avatarFile);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('avatars')
                    .getPublicUrl(fileName);

                avatarUrl = publicUrl;
            }

            const { data, error } = await supabase.auth.updateUser({
                data: {
                    full_name: fullName,
                    country: countryCode ? countryCode.toLowerCase() : null,
                    avatar_url: avatarUrl
                }
            });

            if (error) throw error;

            if (data?.user) {
                dispatch(setAuthUser(data.user));
            }

            toast.success("Profile updated successfully!");
        } catch (error) {
            toast.error(error.message);
            console.error(error);
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
                                <div className="space-y-2">
                                    <label className="text-sm font-medium leading-none text-slate-200">
                                        Profile Picture
                                    </label>
                                    <div className="flex items-center gap-6">
                                        <div className="relative">
                                            <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-slate-700 bg-slate-800">
                                                {previewAvatar ? (
                                                    <img
                                                        src={previewAvatar}
                                                        alt="Profile"
                                                        className="w-full h-full object-cover"
                                                        onError={() => setPreviewAvatar(null)}
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-slate-500 font-bold text-2xl">
                                                        {fullName ? fullName.charAt(0).toUpperCase() : '?'}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex-1">
                                            <FileUpload
                                                accept="image/*"
                                                maxSize={5 * 1024 * 1024} // 5MB
                                                maxFiles={1}
                                                onChange={(file) => handleAvatarChange(file)}
                                                showPreview={false}
                                                className="w-full"
                                                size="sm"
                                            />
                                            <p className="text-xs text-slate-500 mt-2">
                                                Recommended: Square JPG, PNG. Max 5MB.
                                            </p>
                                        </div>
                                    </div>
                                </div>

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
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Select
                                        label="Country"
                                        options={countries}
                                        value={countryCode}
                                        onChange={setCountryCode}
                                        searchable
                                        placeholder="Select your country"
                                        className="bg-slate-900/50 border-slate-700 text-white"
                                        description="Used for your flag badge."
                                    />
                                </div>
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