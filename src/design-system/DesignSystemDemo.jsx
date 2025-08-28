import React from 'react';
import { motion } from 'framer-motion';
import { 
  buttonVariants, 
  cardVariants, 
  badgeVariants,
  statusBadgeVariants,
  animationPatterns,
  LAYOUT_TEMPLATES,
  FORM_TEMPLATES,
  DESIGN_SYSTEM 
} from './index';

const DesignSystemDemo = () => {
  return (
    <div className={LAYOUT_TEMPLATES.page.withHeader}>
      <div className={LAYOUT_TEMPLATES.container.lg}>
        <motion.div
          {...animationPatterns.pageEnter}
          className={LAYOUT_TEMPLATES.spacing.section}
        >
          <h1 className="text-4xl font-bold text-neutral-900 dark:text-neutral-100 mb-8">
            {DESIGN_SYSTEM.name} Demo
          </h1>
          
          {/* Design Tokens Section */}
          <section className={LAYOUT_TEMPLATES.spacing.content}>
            <h2 className="text-2xl font-semibold text-neutral-800 dark:text-neutral-200 mb-4">
              Design Tokens
            </h2>
            
            <div className={LAYOUT_TEMPLATES.grid['3']}>
              {/* Color Tokens */}
              <div className={cardVariants({ variant: 'elevated', padding: 'lg' })}>
                <h3 className="text-lg font-medium mb-3">Colors</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-primary-500"></div>
                    <span className="text-sm">Primary 500</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-secondary-500"></div>
                    <span className="text-sm">Secondary 500</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-accent-500"></div>
                    <span className="text-sm">Accent 500</span>
                  </div>
                </div>
              </div>
              
              {/* Typography Tokens */}
              <div className={cardVariants({ variant: 'elevated', padding: 'lg' })}>
                <h3 className="text-lg font-medium mb-3">Typography</h3>
                <div className="space-y-2">
                  <p className="text-xs">Text XS - 0.75rem</p>
                  <p className="text-sm">Text SM - 0.875rem</p>
                  <p className="text-base">Text Base - 1rem</p>
                  <p className="text-lg">Text LG - 1.125rem</p>
                </div>
              </div>
              
              {/* Spacing Tokens */}
              <div className={cardVariants({ variant: 'elevated', padding: 'lg' })}>
                <h3 className="text-lg font-medium mb-3">Spacing</h3>
                <div className="space-y-2">
                  <div className="bg-neutral-200 dark:bg-neutral-700 h-1 w-4"></div>
                  <span className="text-sm">4 (1rem)</span>
                  <div className="bg-neutral-200 dark:bg-neutral-700 h-2 w-8"></div>
                  <span className="text-sm">8 (2rem)</span>
                  <div className="bg-neutral-200 dark:bg-neutral-700 h-4 w-16"></div>
                  <span className="text-sm">16 (4rem)</span>
                </div>
              </div>
            </div>
          </section>
          
          {/* Component Patterns Section */}
          <section className={LAYOUT_TEMPLATES.spacing.content}>
            <h2 className="text-2xl font-semibold text-neutral-800 dark:text-neutral-200 mb-4">
              Component Patterns
            </h2>
            
            {/* Button Variants */}
            <div className="mb-8">
              <h3 className="text-lg font-medium mb-3">Button Variants</h3>
              <div className="flex flex-wrap gap-3">
                <button className={buttonVariants({ variant: 'default', size: 'md' })}>
                  Default
                </button>
                <button className={buttonVariants({ variant: 'primary', size: 'md' })}>
                  Primary
                </button>
                <button className={buttonVariants({ variant: 'secondary', size: 'md' })}>
                  Secondary
                </button>
                <button className={buttonVariants({ variant: 'outline', size: 'md' })}>
                  Outline
                </button>
                <button className={buttonVariants({ variant: 'success', size: 'md' })}>
                  Success
                </button>
                <button className={buttonVariants({ variant: 'warning', size: 'md' })}>
                  Warning
                </button>
                <button className={buttonVariants({ variant: 'error', size: 'md' })}>
                  Error
                </button>
                <button className={buttonVariants({ variant: 'ghost', size: 'md' })}>
                  Ghost
                </button>
                <button className={buttonVariants({ variant: 'link', size: 'md' })}>
                  Link
                </button>
                <button className={buttonVariants({ variant: 'glass', size: 'md' })}>
                  Glass
                </button>
                <button className={buttonVariants({ variant: 'glow', size: 'md' })}>
                  Glow
                </button>
              </div>
            </div>
            
            {/* Button Sizes */}
            <div className="mb-8">
              <h3 className="text-lg font-medium mb-3">Button Sizes</h3>
              <div className="flex flex-wrap items-center gap-3">
                <button className={buttonVariants({ variant: 'primary', size: 'xs' })}>
                  XS
                </button>
                <button className={buttonVariants({ variant: 'primary', size: 'sm' })}>
                  SM
                </button>
                <button className={buttonVariants({ variant: 'primary', size: 'md' })}>
                  MD
                </button>
                <button className={buttonVariants({ variant: 'primary', size: 'lg' })}>
                  LG
                </button>
                <button className={buttonVariants({ variant: 'primary', size: 'xl' })}>
                  XL
                </button>
                <button className={buttonVariants({ variant: 'primary', size: '2xl' })}>
                  2XL
                </button>
              </div>
            </div>
            
            {/* Badge Variants */}
            <div className="mb-8">
              <h3 className="text-lg font-medium mb-3">Badge Variants</h3>
              <div className="flex flex-wrap gap-3">
                <span className={badgeVariants({ variant: 'default', size: 'md' })}>
                  Default
                </span>
                <span className={badgeVariants({ variant: 'primary', size: 'md' })}>
                  Primary
                </span>
                <span className={badgeVariants({ variant: 'success', size: 'md' })}>
                  Success
                </span>
                <span className={badgeVariants({ variant: 'warning', size: 'md' })}>
                  Warning
                </span>
                <span className={badgeVariants({ variant: 'error', size: 'md' })}>
                  Error
                </span>
                <span className={badgeVariants({ variant: 'outline', size: 'md' })}>
                  Outline
                </span>
              </div>
            </div>
            
            {/* Status Badges */}
            <div className="mb-8">
              <h3 className="text-lg font-medium mb-3">Status Badges</h3>
              <div className="flex flex-wrap gap-3">
                <span className={statusBadgeVariants({ status: 'setup', size: 'md' })}>
                  Setup
                </span>
                <span className={statusBadgeVariants({ status: 'draft', size: 'md' })}>
                  Draft
                </span>
                <span className={statusBadgeVariants({ status: 'active', size: 'md' })}>
                  Active
                </span>
                <span className={statusBadgeVariants({ status: 'paused', size: 'md' })}>
                  Paused
                </span>
                <span className={statusBadgeVariants({ status: 'completed', size: 'md' })}>
                  Completed
                </span>
                <span className={statusBadgeVariants({ status: 'cancelled', size: 'md' })}>
                  Cancelled
                </span>
              </div>
            </div>
          </section>
          
          {/* Layout Templates Section */}
          <section className={LAYOUT_TEMPLATES.spacing.content}>
            <h2 className="text-2xl font-semibold text-neutral-800 dark:text-neutral-200 mb-4">
              Layout Templates
            </h2>
            
            {/* Grid Layouts */}
            <div className="mb-8">
              <h3 className="text-lg font-medium mb-3">Grid Layouts</h3>
              
              <div className="mb-4">
                <h4 className="text-md font-medium mb-2">2 Column Grid</h4>
                <div className={LAYOUT_TEMPLATES.grid['2']}>
                  <div className={cardVariants({ variant: 'default', padding: 'md' })}>
                    <p className="text-sm">Grid Item 1</p>
                  </div>
                  <div className={cardVariants({ variant: 'default', padding: 'md' })}>
                    <p className="text-sm">Grid Item 2</p>
                  </div>
                </div>
              </div>
              
              <div className="mb-4">
                <h4 className="text-md font-medium mb-2">3 Column Grid</h4>
                <div className={LAYOUT_TEMPLATES.grid['3']}>
                  <div className={cardVariants({ variant: 'default', padding: 'md' })}>
                    <p className="text-sm">Grid Item 1</p>
                  </div>
                  <div className={cardVariants({ variant: 'default', padding: 'md' })}>
                    <p className="text-sm">Grid Item 2</p>
                  </div>
                  <div className={cardVariants({ variant: 'default', padding: 'md' })}>
                    <p className="text-sm">Grid Item 3</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Flexbox Layouts */}
            <div className="mb-8">
              <h3 className="text-lg font-medium mb-3">Flexbox Layouts</h3>
              
              <div className="mb-4">
                <h4 className="text-md font-medium mb-2">Center Layout</h4>
                <div className={LAYOUT_TEMPLATES.flex.center}>
                  <div className={cardVariants({ variant: 'default', padding: 'md' })}>
                    <p className="text-sm">Centered Content</p>
                  </div>
                </div>
              </div>
              
              <div className="mb-4">
                <h4 className="text-md font-medium mb-2">Between Layout</h4>
                <div className={LAYOUT_TEMPLATES.flex.between}>
                  <span className="text-sm">Left Content</span>
                  <span className="text-sm">Right Content</span>
                </div>
              </div>
            </div>
          </section>
          
          {/* Animation Patterns Section */}
          <section className={LAYOUT_TEMPLATES.spacing.content}>
            <h2 className="text-2xl font-semibold text-neutral-800 dark:text-neutral-200 mb-4">
              Animation Patterns
            </h2>
            
            <div className={LAYOUT_TEMPLATES.grid['2']}>
              <motion.div
                {...animationPatterns.cardEnter}
                className={cardVariants({ variant: 'interactive', padding: 'lg' })}
              >
                <h3 className="text-lg font-medium mb-2">Card Enter Animation</h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  This card uses the cardEnter animation pattern with staggered children.
                </p>
              </motion.div>
              
              <motion.div
                {...animationPatterns.hoverLift}
                className={cardVariants({ variant: 'interactive', padding: 'lg' })}
              >
                <h3 className="text-lg font-medium mb-2">Hover Lift Animation</h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Hover over this card to see the lift effect.
                </p>
              </motion.div>
            </div>
          </section>
          
          {/* Form Templates Section */}
          <section className={LAYOUT_TEMPLATES.spacing.content}>
            <h2 className="text-2xl font-semibold text-neutral-800 dark:text-neutral-200 mb-4">
              Form Templates
            </h2>
            
            <div className={cardVariants({ variant: 'default', padding: 'lg' })}>
              <form className={FORM_TEMPLATES.layout.vertical}>
                <div className={FORM_TEMPLATES.group}>
                  <label className={FORM_TEMPLATES.field.label}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className={FORM_TEMPLATES.field.input}
                  />
                </div>
                
                <div className={FORM_TEMPLATES.group}>
                  <label className={FORM_TEMPLATES.field.label}>
                    Password
                  </label>
                  <input
                    type="password"
                    placeholder="Enter your password"
                    className={FORM_TEMPLATES.field.input}
                  />
                </div>
                
                <div className={FORM_TEMPLATES.actions}>
                  <button
                    type="button"
                    className={buttonVariants({ variant: 'outline', size: 'md' })}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={buttonVariants({ variant: 'primary', size: 'md' })}
                  >
                    Submit
                  </button>
                </div>
              </form>
            </div>
          </section>
        </motion.div>
      </div>
    </div>
  );
};

export default DesignSystemDemo;
