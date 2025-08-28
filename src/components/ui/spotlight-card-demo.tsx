import { GlowCard } from "./spotlight-card";

export function SpotlightCardDemo() {
  return (
    <div className="w-screen h-screen flex flex-row items-center justify-center gap-10 custom-cursor bg-gradient-to-br from-zinc-50 via-white to-zinc-100 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
      <GlowCard glowColor="blue" size="md">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Blue Glow</h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Interactive spotlight effect</p>
        </div>
      </GlowCard>
      
      <GlowCard glowColor="purple" size="md">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Purple Glow</h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Perfect for your theme</p>
        </div>
      </GlowCard>
      
      <GlowCard glowColor="green" size="md">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Green Glow</h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Nature-inspired design</p>
        </div>
      </GlowCard>
    </div>
  );
}
