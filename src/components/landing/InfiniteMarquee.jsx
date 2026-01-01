import React from 'react';
import { motion } from 'framer-motion';

const MarqueeRow = ({ items, direction = "left", speed = 20 }) => {
    return (
        <div className="flex overflow-hidden relative w-full py-4 mask-fade-sides">
            <motion.div
                initial={{ x: direction === "left" ? "0%" : "-50%" }}
                animate={{ x: direction === "left" ? "-50%" : "0%" }}
                transition={{
                    duration: speed,
                    ease: "linear",
                    repeat: Infinity
                }}
                className="flex whitespace-nowrap gap-16"
            >
                {/* Duplicate items multiple times to ensure seamless loop on wide screens */}
                {[...items, ...items, ...items, ...items].map((item, idx) => (
                    <div key={idx} className="flex items-center gap-8 md:gap-16">
                        <span className="text-2xl md:text-6xl font-bold font-heading text-transparent bg-clip-text bg-gradient-to-r from-slate-500/20 to-slate-300/20 uppercase tracking-tighter select-none">
                            {item}
                        </span>
                        <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-slate-800/50" />
                    </div>
                ))}
            </motion.div>
        </div>
    );
};

export const InfiniteMarquee = () => {
    const row1 = [
        "Swiss Pairing", "Real-time Standings", "Live Ratings", "Gibson Rule", "Mobile Ready"
    ];

    const row2 = [
        "Global Scale", "Zero Latency", "Secure & Verified", "Team Events", "Instant Results"
    ];

    return (
        <div className="w-full py-12 md:py-20 bg-slate-950 flex flex-col gap-8 relative overflow-hidden">
            <div className="max-w-[100vw] overflow-hidden">
                {/* Background Glows (Responsive sizing) */}
                <div className="absolute top-1/2 left-1/4 w-48 h-48 md:w-96 md:h-96 bg-purple-900/10 rounded-full blur-[60px] md:blur-[100px] pointer-events-none" />
                <div className="absolute top-1/2 right-1/4 w-48 h-48 md:w-96 md:h-96 bg-emerald-900/10 rounded-full blur-[60px] md:blur-[100px] pointer-events-none" />

                <MarqueeRow items={row1} direction="left" speed={30} />
                <MarqueeRow items={row2} direction="right" speed={35} />
            </div>

            {/* Side Fade Gradients */}
            <div className="absolute inset-y-0 left-0 w-16 md:w-32 bg-gradient-to-r from-slate-950 to-transparent pointer-events-none" />
            <div className="absolute inset-y-0 right-0 w-16 md:w-32 bg-gradient-to-l from-slate-950 to-transparent pointer-events-none" />
        </div>
    );
};
