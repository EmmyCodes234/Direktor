# Direktor Design System

A comprehensive design system ensuring consistency across the Direktor tournament management application.

## 🚀 Quick Start

```javascript
import * as DesignSystem from '../design-system';
import { buttonVariants, cardVariants } from '../design-system';
```

## 🎨 Design Tokens

### Colors
```javascript
import { colors } from '../design-system';

colors.primary[500]    // Main brand (Purple)
colors.secondary[500]  // Secondary (Blue)
colors.accent[500]     // Accent (Cyan)
colors.success[500]    // Success states
colors.warning[500]    // Warning states
colors.error[500]      // Error states
```

### Typography
```javascript
import { typography } from '../design-system';

typography.fontFamily.sans      // Inter (default)
typography.fontSize.base        // 1rem (16px)
typography.fontSize['2xl']      // 1.5rem (24px)
```

### Spacing
```javascript
import { spacing } from '../design-system';

spacing[4]    // 1rem (16px)
spacing[8]    // 2rem (32px)
spacing[16]   // 4rem (64px)
```

## 🧩 Component Patterns

### Button Variants
```javascript
import { buttonVariants } from '../design-system';

const buttonClasses = buttonVariants({
  variant: 'primary',    // default, primary, secondary, outline, success, warning, error, ghost, link, glass, glow
  size: 'md',            // xs, sm, md, lg, xl, 2xl, icon-*
  rounded: 'lg'          // none, sm, md, lg, xl, 2xl, full
});
```

### Status Badges
```javascript
import { statusBadgeVariants } from '../design-system';

const statusClasses = statusBadgeVariants({
  status: 'active',      // setup, draft, active, in_progress, paused, completed, cancelled
  size: 'md'             // sm, md, lg
});
```

## 🏗️ Layout Templates

```javascript
import { LAYOUT_TEMPLATES } from '../design-system';

// Page layouts
LAYOUT_TEMPLATES.page.withHeader   // Page with header spacing
LAYOUT_TEMPLATES.page.withSidebar  // Page with sidebar layout

// Container layouts
LAYOUT_TEMPLATES.container.lg      // max-w-5xl
LAYOUT_TEMPLATES.container.xl      // max-w-6xl

// Grid layouts
LAYOUT_TEMPLATES.grid['3']         // 1 col mobile, 2 md+, 3 lg+
LAYOUT_TEMPLATES.grid['auto-fit']  // Auto-fit responsive grid

// Spacing patterns
LAYOUT_TEMPLATES.spacing.section   // py-8 sm:py-12 lg:py-16
LAYOUT_TEMPLATES.spacing.content   // space-y-4 sm:space-y-6 lg:space-y-8
```

## 🎭 Animation Patterns

```javascript
import { animationPatterns } from '../design-system';

const pageAnimation = animationPatterns.pageEnter;
const cardAnimation = animationPatterns.cardEnter;
const staggerAnimation = animationPatterns.staggerContainer;
const hoverEffect = animationPatterns.hoverLift;
```

## 📝 Form Templates

```javascript
import { FORM_TEMPLATES } from '../design-system';

FORM_TEMPLATES.layout.vertical     // Vertical form layout
FORM_TEMPLATES.layout.horizontal   // Horizontal form layout
FORM_TEMPLATES.section             // Form section with border
FORM_TEMPLATES.actions             // Form action buttons
```

## 🛠️ Utilities

```javascript
import { 
  generateCSSVariables, 
  responsiveClasses,
  debounce,
  throttle 
} from '../design-system';

// Generate CSS variables
const cssVars = generateCSSVariables(designTokens);

// Responsive classes
const classes = responsiveClasses({
  xs: 'text-sm',
  md: 'text-base',
  lg: 'text-lg'
});

// Performance utilities
const debouncedSearch = debounce(searchFunction, 300);
const throttledScroll = throttle(scrollHandler, 100);
```

## 🎯 Best Practices

### 1. Use Design Tokens
```javascript
// ✅ Good
className="text-primary-500 bg-neutral-100 p-4"

// ❌ Bad
className="text-purple-600 bg-gray-100 p-4"
```

### 2. Use Layout Templates
```javascript
// ✅ Good
<div className={LAYOUT_TEMPLATES.container.lg}>
  <div className={LAYOUT_TEMPLATES.spacing.section}>
    <div className={LAYOUT_TEMPLATES.grid['3']}>
      {/* Content */}
    </div>
  </div>
</div>
```

### 3. Use Animation Patterns
```javascript
// ✅ Good
<motion.div {...animationPatterns.cardEnter}>
  {/* Content */}
</motion.div>
```

## 📱 Responsive Design

Mobile-first approach with consistent breakpoints:
- `xs`: 475px
- `sm`: 640px  
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px
- `3xl`: 1600px

## ♿ Accessibility

- Focus management and keyboard navigation
- ARIA labels and semantic markup
- WCAG 2.1 AA color contrast
- Touch-friendly targets (44px minimum)
- Proper heading hierarchy

## 🔧 Customization

```javascript
import { createVariantClasses } from '../design-system';

const customVariants = createVariantClasses(
  'base-classes',
  {
    theme: { light: 'bg-white', dark: 'bg-black' },
    size: { small: 'px-2 py-1', large: 'px-6 py-3' }
  },
  { theme: 'light', size: 'small' }
);
```

## 📚 Complete Example

```javascript
import React from 'react';
import { motion } from 'framer-motion';
import { 
  buttonVariants, 
  cardVariants, 
  animationPatterns,
  LAYOUT_TEMPLATES 
} from '../design-system';

const TournamentCard = ({ tournament }) => {
  return (
    <motion.div
      {...animationPatterns.cardEnter}
      className={cardVariants({ variant: 'interactive', padding: 'lg' })}
    >
      <div className={LAYOUT_TEMPLATES.spacing.content}>
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          {tournament.name}
        </h3>
        
        <button
          className={buttonVariants({ variant: 'primary', size: 'sm' })}
          onClick={() => handleJoin(tournament.id)}
        >
          Join Tournament
        </button>
      </div>
    </motion.div>
  );
};
```

---

**Version**: 1.0.0  
**Maintainer**: Direktor Development Team
