import React from 'react';

const HeroColorDemo = () => {
  return (
    <div className="p-8 space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-hero-primary mb-4">
          Hero Color System Demo
        </h1>
        <p className="text-hero-secondary text-lg max-w-2xl mx-auto">
          This component demonstrates the new color system extracted from the hero section. 
          All colors are now available as CSS variables and utility classes for consistent use throughout the app.
        </p>
      </div>

      {/* Text Colors */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-hero-primary">Text Colors</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border border-hero-purple/20 rounded-lg">
            <h3 className="text-hero-primary font-semibold mb-2">Primary Text</h3>
            <p className="text-hero-secondary">Secondary text for descriptions and subtitles</p>
            <p className="text-hero-muted">Muted text for less important information</p>
            <p className="text-hero-light">Light text for subtle elements</p>
          </div>
          <div className="p-4 border border-hero-purple/20 rounded-lg">
            <h3 className="text-hero-gradient text-2xl font-bold mb-2">Gradient Text</h3>
            <p className="text-hero-secondary">This heading uses the hero gradient effect</p>
          </div>
        </div>
      </section>

      {/* Background Colors */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-hero-primary">Background Colors</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-hero-zinc/20 rounded-lg border border-hero-purple/20">
            <h3 className="text-hero-primary font-semibold mb-2">Zinc Background</h3>
            <p className="text-hero-secondary">Subtle zinc background with purple border</p>
          </div>
          <div className="p-4 bg-hero-gray/20 rounded-lg border border-hero-purple/20">
            <h3 className="text-hero-primary font-semibold mb-2">Gray Background</h3>
            <p className="text-hero-secondary">Subtle gray background with purple border</p>
          </div>
          <div className="p-4 bg-hero-purple/10 rounded-lg border border-hero-purple/20">
            <h3 className="text-hero-primary font-semibold mb-2">Purple Background</h3>
            <p className="text-hero-secondary">Purple accent background</p>
          </div>
        </div>
      </section>

      {/* Gradients */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-hero-primary">Gradients</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-8 bg-hero-gradient rounded-lg text-white text-center">
            <h3 className="text-2xl font-bold mb-2">Hero Gradient</h3>
            <p>Purple to pink gradient background</p>
          </div>
          <div className="p-8 bg-hero-bg-gradient rounded-lg border border-hero-purple/20 text-center">
            <h3 className="text-hero-primary text-2xl font-bold mb-2">Background Gradient</h3>
            <p className="text-hero-secondary">Subtle background gradient</p>
          </div>
        </div>
      </section>

      {/* Component Classes */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-hero-primary">Component Classes</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="hero-card p-6">
            <h3 className="text-hero-primary font-semibold mb-2">Hero Card</h3>
            <p className="text-hero-secondary mb-4">This card uses the hero-card class with automatic styling</p>
            <button className="hero-button-primary px-4 py-2 rounded-lg">
              Primary Button
            </button>
          </div>
          <div className="space-y-4">
            <button className="hero-button-primary w-full py-3 rounded-lg">
              Primary Button
            </button>
            <button className="hero-button-secondary w-full py-3 rounded-lg">
              Secondary Button
            </button>
            <input 
              type="text" 
              placeholder="Hero Input" 
              className="hero-input w-full px-4 py-3 rounded-lg"
            />
          </div>
        </div>
      </section>

      {/* Border Examples */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-hero-primary">Border Colors</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 border-2 border-hero-light/20 rounded-lg">
            <h3 className="text-hero-primary font-semibold mb-2">Light Border</h3>
            <p className="text-hero-secondary">Uses border-hero-light with opacity</p>
          </div>
          <div className="p-4 border-2 border-hero-dark/20 rounded-lg">
            <h3 className="text-hero-primary font-semibold mb-2">Dark Border</h3>
            <p className="text-hero-secondary">Uses border-hero-dark with opacity</p>
          </div>
          <div className="p-4 border-2 border-hero-purple/30 rounded-lg">
            <h3 className="text-hero-primary font-semibold mb-2">Purple Border</h3>
            <p className="text-hero-secondary">Uses border-hero-purple with opacity</p>
          </div>
        </div>
      </section>

      {/* Usage Instructions */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-hero-primary">How to Use</h2>
        <div className="hero-card p-6">
          <h3 className="text-hero-primary font-semibold mb-4">Available Classes</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="text-hero-secondary font-semibold mb-2">Text Colors:</h4>
              <ul className="space-y-1 text-hero-muted">
                <li>• .text-hero-primary</li>
                <li>• .text-hero-secondary</li>
                <li>• .text-hero-muted</li>
                <li>• .text-hero-light</li>
                <li>• .text-hero-gradient</li>
              </ul>
            </div>
            <div>
              <h4 className="text-hero-secondary font-semibold mb-2">Backgrounds:</h4>
              <ul className="space-y-1 text-hero-muted">
                <li>• .bg-hero-gradient</li>
                <li>• .bg-hero-bg-gradient</li>
                <li>• .bg-hero-purple</li>
                <li>• .bg-hero-zinc</li>
                <li>• .bg-hero-gray</li>
              </ul>
            </div>
          </div>
          <div className="mt-4 p-4 bg-hero-purple/5 rounded-lg">
            <p className="text-hero-secondary text-sm">
              <strong>Note:</strong> All colors automatically adapt to light/dark mode. 
              The CSS variables are defined in <code className="text-hero-purple">src/styles/hero-colors.css</code>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HeroColorDemo;
