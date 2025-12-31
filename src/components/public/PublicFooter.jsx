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
        <footer className="bg-[#020617] text-white pt-24 pb-12 border-t border-slate-800/50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-2 md:grid-cols-12 gap-8 mb-16">
                    {/* Brand Column */}
                    <div className="col-span-2 md:col-span-4 lg:col-span-5 pr-8">
                        <div className="flex items-center space-x-2 mb-6">
                            <span className="text-2xl font-bold font-heading text-white tracking-tight">Direktor</span>
                        </div>
                        <p className="text-slate-500 text-sm leading-relaxed mb-6 max-w-sm">
                            The world's most advanced tournament management platform. Built for directors who demand precision, speed, and reliability.
                        </p>
                        <div className="flex space-x-4">
                            <a href="#" className="text-slate-400 hover:text-white transition-colors">
                                <Icon name="Twitter" size={20} />
                            </a>
                            <a href="#" className="text-slate-400 hover:text-white transition-colors">
                                <Icon name="Github" size={20} />
                            </a>
                            <a href="#" className="text-slate-400 hover:text-white transition-colors">
                                <Icon name="Linkedin" size={20} />
                            </a>
                        </div>
                    </div>

                    {/* Links Columns */}
                    <div className="col-span-1 md:col-span-2 lg:col-span-2">
                        <h4 className="font-bold text-white mb-6">Product</h4>
                        <ul className="space-y-4">
                            <FooterLink href="#features">Features</FooterLink>
                            <FooterLink href="/pricing">Pricing</FooterLink>
                            <FooterLink href="/changelog">Changelog</FooterLink>
                            <FooterLink href="/docs">Documentation</FooterLink>
                        </ul>
                    </div>

                    <div className="col-span-1 md:col-span-2 lg:col-span-2">
                        <h4 className="font-bold text-white mb-6">Company</h4>
                        <ul className="space-y-4">
                            <FooterLink href="/about">About</FooterLink>
                            <FooterLink href="/careers">Careers</FooterLink>
                            <FooterLink href="/blog">Blog</FooterLink>
                            <FooterLink href="/contact">Contact</FooterLink>
                        </ul>
                    </div>

                    <div className="col-span-1 md:col-span-2 lg:col-span-2">
                        <h4 className="font-bold text-white mb-6">Legal</h4>
                        <ul className="space-y-4">
                            <FooterLink href="/privacy">Privacy</FooterLink>
                            <FooterLink href="/terms">Terms</FooterLink>
                            <FooterLink href="/security">Security</FooterLink>
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="pt-8 border-t border-slate-800/50 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <p className="text-slate-600 text-sm">
                        © {new Date().getFullYear()} Direktor Inc. All rights reserved.
                    </p>
                    <div className="flex items-center space-x-2 text-sm text-slate-600">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span>All systems operational</span>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default PublicFooter;
