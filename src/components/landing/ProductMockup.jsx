import React from 'react';
import { motion } from 'framer-motion';

export const ProductMockup = () => {
    return (
        <div className="flex items-center justify-center py-20 w-full perspective-[1000px]">
            <motion.div
                initial={{ rotateX: 20, rotateY: -10, opacity: 0, y: 50 }}
                whileInView={{ rotateX: 0, rotateY: 0, opacity: 1, y: 0 }}
                transition={{
                    type: "spring",
                    stiffness: 60,
                    damping: 20,
                    duration: 1
                }}
                viewport={{ once: true, margin: "-100px" }}
                className="relative rounded-xl border border-border bg-card shadow-2xl overflow-hidden max-w-5xl mx-auto w-full aspect-[16/10]"
            >
                {/* Mockup Header */}
                <div className="absolute top-0 left-0 right-0 h-8 bg-muted/30 border-b border-border flex items-center px-4 space-x-2">
                    <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                </div>

                {/* Mock Playful Content - Abstract representation of the dashboard */}
                <div className="mt-8 p-6 grid grid-cols-12 gap-6 h-full bg-background">
                    {/* Sidebar */}
                    <div className="col-span-2 space-y-4 hidden md:block">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="h-2 w-3/4 bg-muted/40 rounded-full animate-pulse" style={{ animationDelay: `${i * 0.1}s` }}></div>
                        ))}
                    </div>

                    {/* Main Content */}
                    <div className="col-span-12 md:col-span-10 space-y-6">
                        {/* Header Stats */}
                        <div className="grid grid-cols-3 gap-4">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="h-24 rounded-lg bg-secondary/10 border border-border/50"></div>
                            ))}
                        </div>
                        {/* Main Chart/Table Area */}
                        <div className="h-64 rounded-lg bg-secondary/5 border border-border/50 w-full"></div>
                        <div className="h-32 rounded-lg bg-secondary/5 border border-border/50 w-full"></div>
                    </div>
                </div>

                {/* Glow Effect underneath */}
                <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-secondary/20 blur-2xl opacity-10 -z-10 group-hover:opacity-20 transition-opacity"></div>
            </motion.div>
        </div>
    );
};
