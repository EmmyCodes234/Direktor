import React from "react";
import { cn } from "../../utils/cn";
import { ChevronRight } from "lucide-react";

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
    subtitle = {
        regular: "Professional Scrabble tournament management with ",
        gradient: "powerful automation tools.",
    },
    description = "From player registration to final standings, Direktor handles every aspect of tournament organization with precision and ease.",
    ctaText = "Start Your Tournament",
    ctaHref = "/signup",
    secondaryCtaText = "View Demo",
    secondaryCtaHref = "/demo",
    bottomImage = {
        light: "https://images.unsplash.com/photo-1551434678-e076c223a692?w=1200&h=800&fit=crop&crop=entropy&auto=format&q=80",
        dark: "https://images.unsplash.com/photo-1551434678-e076c223a692?w=1200&h=800&fit=crop&crop=entropy&auto=format&q=80",
    },
    gridOptions,
    onCtaClick,
    onSecondaryCtaClick,
    ...props
}, ref) => {
    return (
        <div className={cn("relative", className)} ref={ref} {...props}>
            {/* Simplified background for mobile performance */}
            <div className="absolute top-0 z-[0] h-screen w-screen bg-background border-b border-border/40" />
            <section className="relative max-w-full mx-auto z-1">
                <RetroGrid {...gridOptions} />
                <div className="max-w-screen-xl z-20 mx-auto px-4 py-28 sm:py-32 md:px-8">
                    <div className="max-w-4xl mx-auto text-center space-y-8">
                        {/* Title */}
                        <h1 className="text-4xl sm:text-6xl md:text-8xl font-black tracking-tighter text-foreground leading-[0.9] text-balance">
                            {subtitle.regular}
                            <span className="text-foreground/40 block mt-2">
                                {subtitle.gradient}
                            </span>
                        </h1>

                        {/* Description */}
                        <p className="max-w-2xl mx-auto text-muted-foreground text-lg sm:text-xl md:text-2xl leading-relaxed font-light">
                            {description}
                        </p>

                        {/* CTAs */}
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
                            <button
                                onClick={onCtaClick}
                                className="group relative inline-flex h-14 items-center justify-center overflow-hidden rounded-full bg-foreground px-10 font-medium text-background transition-all duration-300 hover:w-full sm:hover:w-auto hover:scale-105 hover:bg-foreground/90 focus:outline-none focus:ring-2 focus:ring-foreground focus:ring-offset-2"
                            >
                                <span className="mr-2 text-lg">{ctaText}</span>
                                <ChevronRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                            </button>

                            {secondaryCtaText && onSecondaryCtaClick && (
                                <button
                                    onClick={onSecondaryCtaClick}
                                    className="inline-flex h-14 items-center justify-center rounded-full border border-border bg-transparent px-10 text-lg font-medium text-foreground transition-all duration-300 hover:bg-secondary/50"
                                >
                                    {secondaryCtaText}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
});

HeroSection.displayName = "HeroSection";

export { HeroSection };