"use client";

import * as React from "react";
import {
  HTMLMotionProps,
  MotionValue,
  Variants,
  motion,
  useMotionTemplate,
  useScroll,
  useTransform,
} from "motion/react";

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface ContainerScrollContextValue {
  scrollYProgress: MotionValue<number>;
}

const ContainerScrollContext = React.createContext<
  ContainerScrollContextValue | undefined
>(undefined);

function useContainerScrollContext(): ContainerScrollContextValue {
  const context = React.useContext(ContainerScrollContext);
  if (!context) {
    throw new Error(
      'useContainerScrollContext must be used within a ContainerScroll'
    );
  }
  return context;
}

// ---------------------------------------------------------------------------
// Shared animation config
// ---------------------------------------------------------------------------

const SPRING_TRANSITION_CONFIG = {
  type: 'spring' as const,
  stiffness: 100,
  damping: 16,
  mass: 0.75,
  restDelta: 0.005,
};

const variants: Variants = {
  hidden: { filter: 'blur(10px)', opacity: 0 },
  visible: { filter: 'blur(0px)', opacity: 1 },
};

// ---------------------------------------------------------------------------
// ContainerScroll
// ---------------------------------------------------------------------------

export const ContainerScroll: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className,
  ...props
}) => {
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: scrollRef,
    offset: ['start center', 'end end'],
  });

  return (
    <ContainerScrollContext.Provider value={{ scrollYProgress }}>
      <div
        ref={scrollRef}
        className={cn('relative min-h-svh w-full', className)}
        {...props}
      >
        {children}
      </div>
    </ContainerScrollContext.Provider>
  );
};
ContainerScroll.displayName = 'ContainerScroll';

// ---------------------------------------------------------------------------
// ContainerAnimated
// ---------------------------------------------------------------------------

interface ContainerAnimatedProps extends HTMLMotionProps<'div'> {
  inputRange?: number[];
  outputRange?: number[];
}

export const ContainerAnimated = React.forwardRef<
  HTMLDivElement,
  ContainerAnimatedProps
>(
  (
    {
      className,
      transition,
      style,
      inputRange = [0.2, 0.8],
      outputRange = [80, 0],
      ...props
    },
    ref
  ) => {
    const { scrollYProgress } = useContainerScrollContext();
    const y = useTransform(scrollYProgress, inputRange, outputRange);

    return (
      <motion.div
        ref={ref}
        className={cn('', className)}
        variants={variants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        style={{ y, ...style }}
        transition={{ ...SPRING_TRANSITION_CONFIG, ...transition }}
        {...props}
      />
    );
  }
);
ContainerAnimated.displayName = 'ContainerAnimated';

// ---------------------------------------------------------------------------
// ContainerSticky
// ---------------------------------------------------------------------------

export const ContainerSticky = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('sticky left-0 top-0 min-h-svh w-full', className)}
    {...props}
  />
));
ContainerSticky.displayName = 'ContainerSticky';

// ---------------------------------------------------------------------------
// ContainerInset
// ---------------------------------------------------------------------------

interface ContainerInsetProps extends HTMLMotionProps<'div'> {
  insetYRange?: [number, number];
  insetXRange?: [number, number];
  roundednessRange?: [number, number];
}

export const ContainerInset = React.forwardRef<
  HTMLDivElement,
  ContainerInsetProps
>(
  (
    {
      className,
      style,
      insetYRange = [45, 0],
      insetXRange = [45, 0],
      roundednessRange = [1000, 16],
      transition,
      ...props
    },
    ref
  ) => {
    const { scrollYProgress } = useContainerScrollContext();
    const insetY = useTransform(scrollYProgress, [0, 0.8], insetYRange);
    const insetX = useTransform(scrollYProgress, [0, 0.8], insetXRange);
    const roundedness = useTransform(scrollYProgress, [0, 1], roundednessRange);
    const clipPath = useMotionTemplate`inset(${insetY}% ${insetX}% ${insetY}% ${insetX}% round ${roundedness}px)`;

    return (
      <motion.div
        ref={ref}
        className={cn('relative overflow-hidden', className)}
        style={{ clipPath, ...style }}
        {...props}
      />
    );
  }
);
ContainerInset.displayName = 'ContainerInset';
