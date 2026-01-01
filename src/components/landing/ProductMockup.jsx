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
                {/* Product Screenshot */}
                <div className="relative w-full h-full bg-slate-900 group">
                    <img
                        src="https://i.ibb.co/3nF7FFg/image.png"
                        alt="Direktor Dashboard"
                        className="w-full h-full object-cover object-top"
                        onError={(e) => {
                            // Fallback
                            e.target.src = "https://placehold.co/1200x800/0f172a/cbd5e1?text=Image+Load+Failed";
                        }}
                    />

                    {/* Glow Effect Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/50 to-transparent pointer-events-none" />
                </div>
            </motion.div>
        </div>
    );
};
