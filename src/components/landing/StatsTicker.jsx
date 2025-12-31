import React from 'react';
import { motion } from 'framer-motion';

const stats = [
    "10k+ Matches Played",
    "500+ Tournaments Run",
    "99.9% Uptime",
    "Global Player Ratings",
    "Instant Pairings",
    "Real-time Standings"
];

export const StatsTicker = () => {
    return (
        <div className="w-full overflow-hidden bg-background border-y border-border py-4">
            <motion.div
                animate={{ x: [0, -1000] }}
                transition={{
                    x: {
                        repeat: Infinity,
                        repeatType: "loop",
                        duration: 30,
                        ease: "linear",
                    },
                }}
                className="flex whitespace-nowrap"
            >
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex items-center">
                        {stats.map((stat, index) => (
                            <React.Fragment key={index}>
                                <span className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-foreground/5 to-foreground/20 mx-8 uppercase tracking-tighter">
                                    {stat}
                                </span>
                                <span className="text-2xl text-border">
                                    •
                                </span>
                            </React.Fragment>
                        ))}
                    </div>
                ))}
            </motion.div>
        </div>
    );
};
