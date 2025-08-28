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
        "--light-line": lightLineColor,
        "--dark-line": darkLineColor,
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
            <div className="absolute top-0 z-[0] h-screen w-screen bg-hero-purple/5 dark:bg-hero-purple/10" />
            <section className="relative max-w-full mx-auto z-1">
                <RetroGrid {...gridOptions} />
                <div className="max-w-screen-xl z-10 mx-auto px-4 py-20 sm:py-28 gap-8 sm:gap-12 md:px-8">
                    <div className="space-y-4 sm:space-y-5 max-w-3xl leading-tight lg:leading-normal mx-auto text-center">
                        <h1 className="text-xs sm:text-sm text-hero-secondary group font-geist mx-auto px-3 sm:px-5 py-2 bg-hero-bg-gradient border-[1px] sm:border-[2px] border-hero-light/5 dark:border-hero-dark/5 rounded-2xl sm:rounded-3xl w-fit">
                            {title}
                            <ChevronRight className="inline w-3 h-3 sm:w-4 sm:h-4 ml-1 sm:ml-2 group-hover:translate-x-1 duration-300" />
                        </h1>
                        <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl tracking-tighter font-geist text-hero-primary mx-auto px-4">
                            {subtitle.regular}
                            <span className="text-hero-gradient">
                                {subtitle.gradient}
                            </span>
                        </h2>
                        <p className="max-w-2xl mx-auto text-hero-secondary text-sm sm:text-base px-4">
                            {description}
                        </p>
                        <div className="items-center justify-center gap-x-3 space-y-3 sm:flex sm:space-y-0 px-4">
                            <span className="relative inline-block overflow-hidden rounded-full p-[1px] sm:p-[1.5px]">
                                <span className="absolute inset-[-500%] sm:inset-[-1000%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)]" />
                                <div className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-white dark:bg-gray-950 text-xs font-medium backdrop-blur-3xl">
                                    <button
                                        onClick={onCtaClick}
                                        className="hero-button-primary inline-flex rounded-full text-center group items-center w-full justify-center transition-all sm:w-auto py-3 sm:py-4 px-6 sm:px-10 min-h-[44px] text-sm sm:text-base"
                                    >
                                        {ctaText}
                                    </button>
                                </div>
                            </span>
                            {secondaryCtaText && (
                                <button
                                    onClick={onSecondaryCtaClick}
                                    className="hero-button-secondary inline-flex rounded-full text-center group items-center w-full justify-center transition-all sm:w-auto py-3 sm:py-4 px-6 sm:px-10 min-h-[44px] text-sm sm:text-base"
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