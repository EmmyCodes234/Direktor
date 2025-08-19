import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { toast } from '../components/ui/Toast';
import { motion } from 'framer-motion';
import { supabase } from '../supabaseClient';
import { Toaster } from 'sonner';
import { cn } from '../utils/cn';
import Icon from '../components/AppIcon';

// A new, dedicated Google sign-in button component
const GoogleSignInButton = ({ onClick }) => (
    <button
        type="button"
        onClick={onClick}
        className="w-full flex items-center justify-center py-2.5 px-4 text-sm font-medium text-gray-900 focus:outline-none bg-white rounded-lg border border-gray-200 hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-4 focus:ring-gray-200 transition-smooth"
    >
        <svg className="w-4 h-4 mr-2" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 18 19">
            <path fillRule="evenodd" d="M8.842 18.083a8.8 8.8 0 0 1-8.65-8.948 8.841 8.841 0 0 1 8.8-8.652h.153a8.464 8.464 0 0 1 5.7 2.257l-2.193 2.038A5.27 5.27 0 0 0 9.09 3.4a5.882 5.882 0 0 0-.2 11.76h.124a5.091 5.091 0 0 0 5.248-4.057L14.3 11H9V8h8.34c.066.543.095 1.09.088 1.636-.086 5.053-3.463 8.449-8.4 8.449l-.186-.002Z" clipRule="evenodd"/>
        </svg>
        Sign In with Google
    </button>
);

const LoginPage = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState({});

    // Check if user is already logged in
    useEffect(() => {
        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                navigate('/lobby');
            }
        };
        checkUser();
    }, [navigate]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const validateForm = () => {
        const newErrors = {};
        
        if (!formData.email) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Please enter a valid email address';
        }
        
        if (!formData.password) {
            newErrors.password = 'Password is required';
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) return;
        
        setLoading(true);
        setErrors({});
        
        try {
            const { error } = await supabase.auth.signInWithPassword({
                email: formData.email.trim(),
                password: formData.password,
            });

            if (error) throw error;
            
            toast.success("Welcome back! Redirecting to your lobby...");
            // Small delay for better UX
            setTimeout(() => {
                navigate('/lobby');
            }, 1000);

        } catch (error) {
            toast.error(error.message);
            // Focus back to email field for retry
            document.getElementById('email')?.focus();
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
        <div className="min-h-screen bg-background flex items-center justify-center p-4 safe-area-inset-top safe-area-inset-bottom">
            <Toaster position="top-center" richColors />
            
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="w-full max-w-md"
            >
                {/* Header */}
                <div className="text-center mb-8">
                    <button 
                        className="text-3xl font-heading font-bold text-gradient hover:scale-105 transition-transform focus-ring rounded-lg p-2" 
                        onClick={() => navigate('/')}
                        aria-label="Go to home page"
                    >
                        Direktor
                    </button>
                    <h1 className="text-xl font-semibold text-foreground mt-4 mb-2">Welcome back</h1>
                    <p className="text-muted-foreground">Sign in to your account to continue</p>
                </div>

                {/* Login Form */}
                <div className="glass-card p-6 sm:p-8">
                    {/* Google Sign In */}
                    <GoogleSignInButton onClick={handleGoogleLogin} />
                    
                    {/* Divider */}
                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-border/50" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-card px-3 text-muted-foreground font-medium">Or continue with email</span>
                        </div>
                    </div>
                    
                    {/* Email Form */}
                    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                        <Input
                            id="email"
                            label="Email Address"
                            name="email"
                            type="email"
                            placeholder="Enter your email"
                            required
                            onChange={handleChange}
                            value={formData.email}
                            error={errors.email}
                            leftIcon="Mail"
                            autoComplete="email"
                            autoFocus
                        />
                        
                        <Input
                            id="password"
                            label="Password"
                            name="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your password"
                            required
                            onChange={handleChange}
                            value={formData.password}
                            error={errors.password}
                            leftIcon="Lock"
                            rightIcon={showPassword ? "EyeOff" : "Eye"}
                            onRightIconClick={() => setShowPassword(!showPassword)}
                            autoComplete="current-password"
                        />
                        
                        {/* Forgot Password Link */}
                        <div className="flex justify-end">
                            <Button 
                                variant="link" 
                                size="sm" 
                                className="text-xs p-0 h-auto"
                                onClick={() => navigate('/forgot-password')}
                            >
                                Forgot your password?
                            </Button>
                        </div>
                        
                        {/* Submit Button */}
                        <Button 
                            type="submit" 
                            className="w-full shadow-glow" 
                            size="lg" 
                            loading={loading}
                            disabled={!formData.email || !formData.password}
                        >
                            {loading ? 'Signing in...' : 'Sign In'}
                        </Button>
                    </form>
                </div>
                
                {/* Sign Up Link */}
                <div className="text-center mt-6">
                    <p className="text-sm text-muted-foreground">
                        Don't have an account?{' '}
                        <Button 
                            variant="link" 
                            className="text-sm p-0 h-auto font-medium text-primary hover:text-primary/80" 
                            onClick={() => navigate('/signup')}
                        >
                            Sign up for free
                        </Button>
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default LoginPage;