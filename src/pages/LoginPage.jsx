import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { supabase } from '../supabaseClient';
import { Toaster } from 'sonner';
import { cn } from '../utils/cn';

// Refactored Google Sign In Button for Monochrome Theme
const GoogleSignInButton = ({ onClick }) => (
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
        Continue with Google
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
        if (!formData.email) newErrors.email = 'Email using required';
        else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Enter a valid email';
        if (!formData.password) newErrors.password = 'Password is required';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;
        setLoading(true);
        setErrors({});
        
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: formData.email.trim(),
                password: formData.password,
            });

            if (error) throw error;
            toast.success("Welcome back.");
            setTimeout(() => navigate('/lobby'), 800);
        } catch (error) {
            toast.error(error.message);
            document.getElementById('email')?.focus();
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: `${window.location.origin}/lobby` },
        });
        if (error) toast.error(error.message);
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
                    <p className="text-sm text-muted-foreground tracking-wide uppercase font-medium">Log In</p>
                </div>

                {/* Main Card Area */}
                <div className="space-y-6">
                    <GoogleSignInButton onClick={handleGoogleLogin} />
                    
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-border" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase bg-background px-2 text-muted-foreground font-medium">
                            Or
                        </div>
                    </div>
                    
                    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                        <div className="space-y-4">
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="Email"
                                required
                                onChange={handleChange}
                                value={formData.email}
                                error={errors.email}
                                className="h-12 bg-transparent border-border focus:border-primary rounded-lg transition-all"
                            />
                            
                            <div className="space-y-1">
                                <Input
                                    id="password"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Password"
                                    required
                                    onChange={handleChange}
                                    value={formData.password}
                                    error={errors.password}
                                    rightIcon={showPassword ? "EyeOff" : "Eye"}
                                    onRightIconClick={() => setShowPassword(!showPassword)}
                                    className="h-12 bg-transparent border-border focus:border-primary rounded-lg transition-all"
                                />
                                <div className="flex justify-end">
                                    <Button 
                                        variant="link" 
                                        className="text-xs text-muted-foreground hover:text-primary px-0 h-auto font-normal"
                                        onClick={() => navigate('/forgot-password')}
                                    >
                                        Forgot password?
                                    </Button>
                                </div>
                            </div>
                        </div>
                        
                        <Button 
                            type="submit" 
                            className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg text-sm font-medium tracking-wide shadow-none transition-all" 
                            loading={loading}
                            disabled={!formData.email || !formData.password}
                        >
                            {loading ? 'Entering...' : 'Enter'}
                        </Button>
                    </form>
                </div>
                
                {/* Footer */}
                <div className="text-center text-sm text-muted-foreground">
                    New here?{' '}
                    <button 
                        onClick={() => navigate('/signup')} 
                        className="text-foreground font-medium hover:underline transition-all"
                    >
                        Create an account
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default LoginPage;