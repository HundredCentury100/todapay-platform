import { Transition, Variants } from 'framer-motion';

/**
 * Motion-safe animation presets for Framer Motion
 * Automatically disabled when user prefers reduced motion via CSS
 */

// Standard easing curves
export const easing = {
  // Apple-like smooth ease
  apple: [0.25, 0.1, 0.25, 1],
  // Spring-like bounce
  spring: [0.34, 1.56, 0.64, 1],
  // Smooth ease out
  smooth: [0.4, 0, 0.2, 1],
  // Quick snap
  snap: [0.4, 0, 0.6, 1],
} as const;

// Standard transitions
export const transitions = {
  fast: {
    duration: 0.15,
    ease: easing.smooth,
  },
  default: {
    duration: 0.2,
    ease: easing.apple,
  },
  slow: {
    duration: 0.3,
    ease: easing.smooth,
  },
  spring: {
    type: 'spring',
    stiffness: 400,
    damping: 25,
  },
  springBouncy: {
    type: 'spring',
    stiffness: 300,
    damping: 20,
  },
} as const satisfies Record<string, Transition>;

// Fade animations
export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export const fadeInUp: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 10 },
};

export const fadeInDown: Variants = {
  initial: { opacity: 0, y: -20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

export const fadeInScale: Variants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
};

// Slide animations
export const slideInRight: Variants = {
  initial: { x: '100%', opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: '100%', opacity: 0 },
};

export const slideInLeft: Variants = {
  initial: { x: '-100%', opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: '-100%', opacity: 0 },
};

export const slideInUp: Variants = {
  initial: { y: '100%', opacity: 0 },
  animate: { y: 0, opacity: 1 },
  exit: { y: '100%', opacity: 0 },
};

// Pop/scale animations
export const popIn: Variants = {
  initial: { opacity: 0, scale: 0.5 },
  animate: { 
    opacity: 1, 
    scale: 1,
    transition: transitions.spring,
  },
  exit: { opacity: 0, scale: 0.5 },
};

export const scaleIn: Variants = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.9 },
};

// Press/tap animation for interactive elements
export const tapScale = {
  whileTap: { scale: 0.97 },
  transition: transitions.fast,
};

export const tapScaleSmall = {
  whileTap: { scale: 0.98 },
  transition: transitions.fast,
};

// Stagger children helper
export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

export const staggerContainerFast: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.02,
      delayChildren: 0.05,
    },
  },
};

// Item for stagger (use with staggerContainer)
export const staggerItem: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
};

// List animations with stagger
export const listVariants = {
  container: staggerContainer,
  item: staggerItem,
};

/**
 * Helper to create staggered animation props
 */
export function getStaggerProps(index: number, baseDelay = 0.05) {
  return {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: {
      delay: index * baseDelay,
      duration: 0.2,
      ease: easing.smooth,
    },
  };
}

/**
 * Helper to create reduced delay for returning users
 */
export function getReturnUserStaggerProps(index: number, isReturning: boolean) {
  const delay = isReturning ? 0.02 : 0.05;
  return getStaggerProps(index, delay);
}
