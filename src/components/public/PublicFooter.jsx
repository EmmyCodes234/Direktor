import React from 'react';
import { motion } from 'framer-motion';
import Icon from '../AppIcon';

const FooterLink = ({ href, children }) => (
    <li>
        <a href={href} className="text-slate-400 hover:text-white transition-colors text-sm">
            {children}
        </a>
    </li>
);

const PublicFooter = () => {
    return (
        <footer className="bg-[#020617] text-white py-12 border-t border-slate-800/50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    {/* Brand & Copyright */}
                    <div className="flex flex-col items-center md:items-start gap-2">
                        <div className="flex items-center space-x-2">
                            <span className="text-xl font-bold font-heading text-white tracking-tight">Direktor</span>
                        </div>
                        <p className="text-slate-600 text-xs">
                            © {new Date().getFullYear()} Direktor Inc. All rights reserved.
                        </p>
                    </div>

                    {/* Status Indicator */}
                    <div className="flex items-center space-x-2 text-xs text-slate-500 bg-slate-900/50 px-3 py-1.5 rounded-full border border-slate-800">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <span>All systems operational</span>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default PublicFooter;
