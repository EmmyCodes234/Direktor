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
            <div className="absolute inset-0 [transform:rotateX(var(--grid-angle))]">
                <div className="animate-grid [background-image:linear-gradient(to_right,var(--light-line)_1px,transparent_0),linear-gradient(to_bottom,var(--light-line)_1px,transparent_0)] [background-repeat:repeat] [background-size:var(--cell-size)_var(--cell-size)] [height:300vh] [inset:0%_0px] [margin-left:-200%] [transform-origin:100%_0_0] [width:600vw] dark:[background-image:linear-gradient(to_right,var(--dark-line)_1px,transparent_0),linear-gradient(to_bottom,var(--dark-line)_1px,transparent_0)]" />
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
            <div className="absolute top-0 z-[0] h-screen w-screen bg-hero-purple/10 dark:bg-hero-purple/10 bg-[radial-gradient(ellipse_20%_80%_at_50%_-20%,rgba(120,119,198,0.15),rgba(255,255,255,0))] dark:bg-[radial-gradient(ellipse_20%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]" />
            <section className="relative max-w-full mx-auto z-1">
                <RetroGrid {...gridOptions} />
                <div className="max-w-screen-xl z-10 mx-auto px-4 py-28 gap-12 md:px-8">
                    <div className="space-y-5 max-w-3xl leading-0 lg:leading-5 mx-auto text-center">
                        <h1 className="text-sm text-hero-secondary group font-geist mx-auto px-5 py-2 bg-hero-bg-gradient border-[2px] border-hero-light/5 dark:border-hero-dark/5 rounded-3xl w-fit">
                            {title}
                            <ChevronRight className="inline w-4 h-4 ml-2 group-hover:translate-x-1 duration-300" />
                        </h1>
                        <h2 className="text-4xl tracking-tighter font-geist text-hero-primary mx-auto md:text-6xl">
                            {subtitle.regular}
                            <span className="text-hero-gradient">
                                {subtitle.gradient}
                            </span>
                        </h2>
                        <p className="max-w-2xl mx-auto text-hero-secondary">
                            {description}
                        </p>
                        <div className="items-center justify-center gap-x-3 space-y-3 sm:flex sm:space-y-0">
                            <span className="relative inline-block overflow-hidden rounded-full p-[1.5px]">
                                <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)]" />
                                <div className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-white dark:bg-gray-950 text-xs font-medium backdrop-blur-3xl">
                                    <button
                                        onClick={onCtaClick}
                                        className="hero-button-primary inline-flex rounded-full text-center group items-center w-full justify-center transition-all sm:w-auto py-4 px-10"
                                    >
                                        {ctaText}
                                    </button>
                                </div>
                            </span>
                            {secondaryCtaText && (
                                <button
                                    onClick={onSecondaryCtaClick}
                                    className="hero-button-secondary inline-flex rounded-full text-center group items-center w-full justify-center transition-all sm:w-auto py-4 px-10"
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