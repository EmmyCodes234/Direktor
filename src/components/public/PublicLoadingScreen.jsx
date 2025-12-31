import React from 'react';
import { motion } from 'framer-motion';

const PublicLoadingScreen = ({ fullScreen = true }) => {
    return (
        <div className={`${fullScreen ? 'fixed inset-0' : 'w-full py-24'} flex flex-col items-center justify-center bg-background z-50`}>
            <motion.div
                initial={{ opacity: 0.3, scale: 0.95 }}
                animate={{
                    opacity: [0.3, 1, 0.3],
                    scale: [0.95, 1, 0.95]
                }}
                transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
                className="flex flex-col items-center"
            >
                <span className="text-3xl md:text-4xl font-heading font-extrabold tracking-tight text-foreground">
                    Direktor
                </span>
                <div className="mt-4 flex space-x-1.5">
                    {[0, 1, 2].map((i) => (
                        <motion.div
                            key={i}
                            className="h-1.5 w-1.5 rounded-full bg-primary/40"
                            animate={{
                                opacity: [0.2, 1, 0.2],
                                scale: [0.8, 1.2, 0.8]
                            }}
                            transition={{
                                duration: 1,
                                repeat: Infinity,
                                delay: i * 0.2,
                                ease: "easeInOut"
                            }}
                        />
                    ))}
                </div>
            </motion.div>
        </div>
    );
};

export default PublicLoadingScreen;
