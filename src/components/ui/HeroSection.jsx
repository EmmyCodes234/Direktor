import React from "react";
import { motion } from "framer-motion";
import { cn } from "../../utils/cn";
import { ChevronRight } from "lucide-react";
import Icon from "../AppIcon";

const RetroGrid = ({
    angle = 65,
    cellSize = 60,
    opacity = 0.5,
    lightLineColor = "gray",
    darkLineColor = "gray",
}) => {
    const gridStyles = {
        "--grid-angle": `${angle}deg`,
        "--cell-size": `${cellSize}px`,
        "--opacity": opacity,
        "--light-line": "#e5e7eb",
        "--dark-line": "#27272a",
    };

    return (
        <div
            className={cn(
                "pointer-events-none absolute size-full overflow-hidden [perspective:200px]",
                `opacity-[var(--opacity)]`,
            )}
            style={gridStyles}
        >
            {/* Simplified grid for mobile performance */}
            <div className="absolute inset-0 [transform:rotateX(var(--grid-angle))]">
                <div className="animate-grid [background-image:linear-gradient(to_right,var(--light-line)_1px,transparent_0),linear-gradient(to_bottom,var(--light-line)_1px,transparent_0)] [background-repeat:repeat] [background-size:var(--cell-size)_var(--cell-size)] [height:200vh] [inset:0%_0px] [margin-left:-100%] [transform-origin:100%_0_0] [width:300vw] dark:[background-image:linear-gradient(to_right,var(--dark-line)_1px,transparent_0),linear-gradient(to_bottom,var(--dark-line)_1px,transparent_0)]" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-white to-transparent to-90% dark:from-black" />
        </div>
    );
};

const HeroSection = React.forwardRef(({
    className,
    title = "Streamline Your Tournaments",
    badge = { text: "New: Remote Submissions", href: "/blog/remote-submissions" },
    subtitle = {
        regular: "The best way to manage ",
        gradient: "your tournaments.",
    },
    description = "Eliminate spreadsheets and email threads. Empower your organization with professional-grade tournament software.",
    ctaText = "Get Started",
    ctaHref = "/signup",
    secondaryCtaText = "Learn more",
    secondaryCtaHref = "/demo",
    ctaClassName,
    bottomImage,
    gridOptions,
    onCtaClick,
    onSecondaryCtaClick,
    ...props
}, ref) => {
    return (
        <div className={cn("relative", className)} ref={ref} {...props}>
            {/* Simplified background for mobile performance */}
            <div className="absolute top-0 z-[0] h-screen w-screen bg-[#020617]" />
            <section className="relative max-w-full mx-auto z-1 overflow-hidden">
                <RetroGrid {...gridOptions} />
                <div className="max-w-screen-xl z-20 mx-auto px-4 py-24 sm:py-32 md:px-8 relative">
                    <div className="max-w-5xl mx-auto text-center space-y-8 flex flex-col items-center">
                        {/* Badge */}
                        {badge && (
                            <motion.a
                                href={badge.href}
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5 }}
                                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs sm:text-sm font-medium hover:bg-emerald-500/20 transition-colors mb-4"
                            >
                                <span className="bg-emerald-500 text-[#020617] text-[10px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-wide">New</span>
                                {badge.text}
                                <ChevronRight className="w-3 h-3" />
                            </motion.a>
                        )}

                        {/* Title */}
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                            className="text-5xl sm:text-7xl md:text-8xl font-heading font-black tracking-tight text-white leading-[1.1] md:leading-[1.1] text-balance drop-shadow-2xl"
                        >
                            {subtitle.regular}
                            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 mt-2 pb-2">
                                {subtitle.gradient}
                            </span>
                        </motion.h1>

                        {/* Description */}
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="max-w-2xl mx-auto text-slate-400 text-lg sm:text-xl md:text-2xl leading-relaxed font-light mt-6"
                        >
                            {description}
                        </motion.p>

                        {/* CTAs */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.3 }}
                            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8 w-full sm:w-auto"
                        >
                            <button
                                onClick={onCtaClick}
                                className={cn(
                                    "group relative inline-flex h-14 items-center justify-center overflow-hidden rounded-full px-8 font-bold text-lg transition-all duration-300 hover:w-full sm:hover:w-auto hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#020617]",
                                    ctaClassName || "bg-white text-black hover:bg-slate-200"
                                )}
                            >
                                <span className="mr-2">{ctaText}</span>
                                <ChevronRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                            </button>

                            {secondaryCtaText && onSecondaryCtaClick && (
                                <button
                                    onClick={onSecondaryCtaClick}
                                    className="inline-flex h-14 items-center justify-center rounded-full px-8 text-lg font-medium text-slate-300 transition-all duration-300 hover:text-white group"
                                >
                                    {secondaryCtaText}
                                    <ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                                </button>
                            )}
                        </motion.div>

                        {/* Social Proof / Avatars */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5, duration: 1 }}
                            className="flex flex-col items-center gap-2 mt-8 pt-4"
                        >
                            <div className="flex -space-x-4 rtl:space-x-reverse">
                                {[
                                    "https://i.pravatar.cc/100?img=33",
                                    "https://i.pravatar.cc/100?img=47",
                                    "https://i.pravatar.cc/100?img=12",
                                    "https://i.pravatar.cc/100?img=5"
                                ].map((src, i) => (
                                    <img key={i} className="w-10 h-10 border-2 border-[#020617] rounded-full" src={src} alt="" />
                                ))}
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="flex text-emerald-500">
                                    {[1, 2, 3, 4, 5].map(i => <Icon key={i} name="Star" size={14} fill="currentColor" />)}
                                </div>
                                <span className="text-slate-400 text-sm font-medium">
                                    <strong className="text-slate-200">1,200+</strong> directors trust us
                                </span>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>
        </div>
    );
});

HeroSection.displayName = "HeroSection";

export { HeroSection };