import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { motion } from 'framer-motion';
import { supabase } from '../supabaseClient';
import { toast, Toaster } from 'sonner';

const GoogleSignUpButton = ({ onClick }) => (
    <button
        type="button"
        onClick={onClick}
        className="w-full flex items-center justify-center py-2.5 px-4 text-sm font-medium text-gray-900 focus:outline-none bg-white rounded-lg border border-gray-200 hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-4 focus:ring-gray-200 transition-smooth"
    >
        <svg className="w-4 h-4 mr-2" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 18 19">
            <path fillRule="evenodd" d="M8.842 18.083a8.8 8.8 0 0 1-8.65-8.948 8.841 8.841 0 0 1 8.8-8.652h.153a8.464 8.464 0 0 1 5.7 2.257l-2.193 2.038A5.27 5.27 0 0 0 9.09 3.4a5.882 5.882 0 0 0-.2 11.76h.124a5.091 5.091 0 0 0 5.248-4.057L14.3 11H9V8h8.34c.066.543.095 1.09.088 1.636-.086 5.053-3.463 8.449-8.4 8.449l-.186-.002Z" clipRule="evenodd"/>
        </svg>
        Sign Up with Google
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
            
            toast.success("Account created successfully! Please check your email to verify your account and then log in.");
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
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <Toaster position="top-center" richColors />
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="w-full max-w-md"
            >
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-heading font-bold text-gradient cursor-pointer" onClick={() => navigate('/')}>
                        Direktor
                    </h1>
                    <p className="text-muted-foreground mt-2">Create an account to start managing tournaments.</p>
                </div>

                <div className="glass-card p-8">
                     <GoogleSignUpButton onClick={handleGoogleLogin} />

                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-border" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-card px-2 text-muted-foreground">Or continue with email</span>
                        </div>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <Input
                            label="Full Name"
                            name="fullName"
                            type="text"
                            placeholder="Enter your full name"
                            required
                            onChange={handleChange}
                            value={formData.fullName}
                        />
                        <Input
                            label="Email Address"
                            name="email"
                            type="email"
                            placeholder="you@example.com"
                            required
                            onChange={handleChange}
                            value={formData.email}
                        />
                        <Input
                            label="Password"
                            name="password"
                            type="password"
                            placeholder="Create a strong password (min. 6 characters)"
                            required
                            onChange={handleChange}
                            value={formData.password}
                        />
                        <div className="pt-2">
                            <Button type="submit" className="w-full" size="lg" loading={loading}>
                                Create Account
                            </Button>
                        </div>
                    </form>
                </div>
                <div className="text-center mt-6 text-sm">
                    <p className="text-muted-foreground">
                        Already have an account?{' '}
                        <Button variant="link" className="px-1" onClick={() => navigate('/login')}>
                            Sign in here
                        </Button>
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default SignupPage;