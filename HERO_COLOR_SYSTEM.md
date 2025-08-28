# Hero Color System - Extracted from Landing Page

## Overview

This document describes the unified color system extracted from the hero section of the landing page. All colors are now available as CSS variables and utility classes for consistent use throughout the application.

## Color Extraction

The colors were extracted from the following hero section elements:

- **Primary Gradient**: `from-purple-600 to-pink-500` (light mode) and `from-purple-300 to-orange-200` (dark mode)
- **Text Colors**: Various gray tones used for titles, descriptions, and secondary text
- **Background Colors**: Subtle zinc and gray backgrounds with purple accents
- **Border Colors**: Light/dark borders with purple accent options

## CSS Variables

### Primary Brand Colors
```css
--primary: 262.1 83.3% 57.8%;           /* Purple-600 */
--primary-light: 270 95% 75%;            /* Purple-300 */
--primary-dark: 262.1 83.3% 45%;        /* Purple-700 */
```

### Gradient Colors
```css
--gradient-purple: 262.1 83.3% 57.8%;   /* Purple-600 */
--gradient-pink: 330 81% 60%;            /* Pink-500 */
--gradient-orange: 25 95% 53%;           /* Orange-400 */
```

### Text Colors
```css
--text-primary: 224 71.4% 4.1%;         /* Dark text for light mode */
--text-secondary: 220 8.9% 46.1%;       /* Gray-600 for secondary text */
--text-muted: 220 8.9% 46.1%;           /* Gray-600 for muted text */
--text-light: 220 13% 91%;               /* Gray-300 for light text */
```

### Background Colors
```css
--bg-zinc-light: 220 8.9% 46.1%;        /* Zinc-400 */
--bg-gray-light: 220 8.9% 46.1%;        /* Gray-400 */
--bg-purple-accent: 262.1 83.3% 57.8%; /* Purple-600 */
```

### Border Colors
```css
--border-light: 0 0% 0%;                 /* Black for light mode */
--border-dark: 0 0% 100%;                /* White for dark mode */
--border-purple: 262.1 83.3% 57.8%;     /* Purple-600 */
```

### Pre-built Gradients
```css
--hero-gradient-light: linear-gradient(to right, hsl(262.1 83.3% 57.8%), hsl(330 81% 60%));
--hero-gradient-dark: linear-gradient(to right, hsl(270 95% 75%), hsl(25 95% 53%));
--hero-bg-gradient: linear-gradient(135deg, hsl(220 8.9% 46.1% / 0.2), hsl(220 8.9% 46.1% / 0.1), transparent);
```

## Utility Classes

### Text Colors
- `.text-hero-primary` - Main text color
- `.text-hero-secondary` - Secondary text color
- `.text-hero-muted` - Muted text color
- `.text-hero-light` - Light text color
- `.text-hero-gradient` - Gradient text effect

### Background Colors
- `.bg-hero-zinc` - Zinc background
- `.bg-hero-gray` - Gray background
- `.bg-hero-purple` - Purple accent background
- `.bg-hero-gradient` - Purple to pink gradient
- `.bg-hero-bg-gradient` - Subtle background gradient

### Border Colors
- `.border-hero-light` - Light border (black/white)
- `.border-hero-dark` - Dark border (white/black)
- `.border-hero-purple` - Purple border

### Component Classes
- `.hero-card` - Card with hero styling
- `.hero-button-primary` - Primary button with gradient
- `.hero-button-secondary` - Secondary button
- `.hero-input` - Input with hero focus states
- `.hero-link` - Link with hero hover states
- `.hero-badge` - Badge with hero colors

## Usage Examples

### Basic Text Styling
```jsx
<h1 className="text-hero-primary">Main Title</h1>
<p className="text-hero-secondary">Description text</p>
<span className="text-hero-gradient">Gradient Text</span>
```

### Component Styling
```jsx
<div className="hero-card">
  <h2 className="text-hero-primary">Card Title</h2>
  <p className="text-hero-secondary">Card content</p>
  <button className="hero-button-primary">Action</button>
</div>
```

### Custom Styling
```jsx
<div className="bg-hero-gradient p-6 rounded-lg">
  <h3 className="text-white">Gradient Background</h3>
</div>

<input 
  className="hero-input" 
  placeholder="Styled input"
/>
```

## Dark Mode Support

All colors automatically adapt to light/dark mode. The CSS variables are defined for both themes:

- **Light Mode**: Uses darker purples and grays
- **Dark Mode**: Uses lighter purples and grays

The system automatically switches between themes based on the `.dark` class.

## File Structure

```
src/
├── styles/
│   ├── index.css              # Main CSS file (imports hero colors)
│   ├── tailwind.css           # Tailwind CSS with hero utilities
│   └── hero-colors.css        # Hero color system definitions
├── components/
│   └── ui/
│       ├── HeroSection.jsx    # Updated to use new colors
│       └── HeroColorDemo.jsx  # Demo component
└── HERO_COLOR_SYSTEM.md       # This documentation
```

## Migration Guide

### Before (Hardcoded Colors)
```jsx
<h1 className="text-gray-600 dark:text-gray-400">
  Title
</h1>
<button className="bg-gradient-to-r from-purple-600 to-pink-500">
  Button
</button>
```

### After (Hero Color System)
```jsx
<h1 className="text-hero-secondary">
  Title
</h1>
<button className="bg-hero-gradient">
  Button
</button>
```

## Benefits

1. **Consistency**: All colors are unified and consistent across the app
2. **Maintainability**: Colors can be changed in one place
3. **Dark Mode**: Automatic dark mode support
4. **Accessibility**: Proper contrast ratios maintained
5. **Developer Experience**: Easy-to-use utility classes
6. **Performance**: CSS variables are optimized for performance

## Browser Support

The color system uses modern CSS features:
- CSS Custom Properties (CSS Variables)
- HSL color values
- Modern gradient syntax

Supported in all modern browsers (Chrome 49+, Firefox 31+, Safari 9.1+, Edge 16+).

## Contributing

When adding new colors to the system:

1. Add the color to the appropriate section in `hero-colors.css`
2. Create corresponding utility classes in `tailwind.css`
3. Update this documentation
4. Test in both light and dark modes

## Demo

See `HeroColorDemo.jsx` component for a complete demonstration of all available colors and utilities.
