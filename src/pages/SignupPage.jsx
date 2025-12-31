import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { motion } from 'framer-motion';
import { supabase } from '../supabaseClient';
import { toast, Toaster } from 'sonner';

// Reusing the Refactored Google Sign In Button for Consistency
const GoogleSignUpButton = ({ onClick }) => (
    <button
        type="button"
        onClick={onClick}
        className="w-full flex items-center justify-center py-3 px-4 text-sm font-medium text-foreground bg-background border border-border rounded-lg hover:bg-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200"
    >
        <svg className="w-5 h-5 mr-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        </svg>
        Sign up with Google
    </button>
);


const SignupPage = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ fullName: '', email: '', password: '' });
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { error } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        full_name: formData.fullName,
                    }
                }
            });

            if (error) throw error;

            toast.success("Account created successfully! Check your email to verify.");
            setTimeout(() => {
                navigate('/login');
            }, 3000);

        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/lobby`,
            },
        });
        if (error) {
            toast.error(error.message);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center p-6 bg-background text-foreground transition-colors duration-300">
            <Toaster position="top-center" theme="system" />

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="w-full max-w-[400px] space-y-8"
            >
                {/* Minimal Header */}
                <div className="text-center space-y-2">
                    <h1
                        onClick={() => navigate('/')}
                        className="font-heading font-bold text-4xl tracking-tighter cursor-pointer hover:opacity-80 transition-opacity"
                    >
                        Direktor.
                    </h1>
                    <p className="text-sm text-muted-foreground tracking-wide uppercase font-medium">Create Account</p>
                </div>

                {/* Main Card Area */}
                <div className="space-y-6">
                    <GoogleSignUpButton onClick={handleGoogleLogin} />

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-border" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase bg-background px-2 text-muted-foreground font-medium">
                            Or
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Input
                            name="fullName"
                            type="text"
                            placeholder="Full Name"
                            required
                            onChange={handleChange}
                            value={formData.fullName}
                            className="h-12 bg-transparent border-border focus:border-primary rounded-lg transition-all"
                        />
                        <Input
                            name="email"
                            type="email"
                            placeholder="Email Address"
                            required
                            onChange={handleChange}
                            value={formData.email}
                            className="h-12 bg-transparent border-border focus:border-primary rounded-lg transition-all"
                        />
                        <Input
                            name="password"
                            type="password"
                            placeholder="Data-encapsulated Password"
                            required
                            onChange={handleChange}
                            value={formData.password}
                            className="h-12 bg-transparent border-border focus:border-primary rounded-lg transition-all"
                        />
                        <div className="pt-2">
                            <Button
                                type="submit"
                                className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg text-sm font-medium tracking-wide shadow-none transition-all"
                                size="lg"
                                loading={loading}
                            >
                                Create Account
                            </Button>
                        </div>
                    </form>
                </div>

                {/* Footer */}
                <div className="text-center text-sm text-muted-foreground">
                    Already have an account?{' '}
                    <button
                        onClick={() => navigate('/login')}
                        className="text-foreground font-medium hover:underline transition-all"
                    >
                        Sign in
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default SignupPage;