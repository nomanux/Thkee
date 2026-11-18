"use client";

/**
 * AuthCard, from https://motion-brew.com/components/auth-card
 *
 * One self contained file: the component, its animated icons and the cn()
 * helper. Needs React 18 or 19 and Tailwind CSS v4.
 *
 * The animated icons are adapted from lucide-animated (https://lucide-animated.com),
 * MIT License, Copyright (c) 2024-2026 pqoqubbw. Icon shapes from Lucide
 * (https://lucide.dev), ISC License. Permission is hereby granted, free of
 * charge, to any person obtaining a copy of this software, to deal in it
 * without restriction, provided the above copyright notice and this
 * permission notice are included in all copies or substantial portions.
 */

import * as React from "react";
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { type ClassValue, clsx } from "clsx";
import { AnimatePresence, motion, type Transition, useAnimation, useAnimationControls, useInView, useReducedMotion, type Variants } from "motion/react";
import { twMerge } from "tailwind-merge";

// cn(): merges Tailwind classes, later ones win.
/** Merge Tailwind classes, letting later classes win conflicts. */
function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

// Animated icon: arrow-right
const ArrowRightIcon = (() => {
interface ArrowRightIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface ArrowRightIconProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Size in px; by default it follows className, like a lucide icon. */
  size?: number;
  /** Play while true; when set, hover no longer drives it. */
  active?: boolean;
  /** Line weight, like a lucide icon's. Default `2`. */
  strokeWidth?: number | string;
}

const PATH_VARIANTS: Variants = {
  normal: { d: "M5 12h14" },
  animate: {
    d: ["M5 12h14", "M5 12h9", "M5 12h14"],
    transition: {
      duration: 0.4,
    },
  },
};

const SECONDARY_PATH_VARIANTS: Variants = {
  normal: { d: "m12 5 7 7-7 7", translateX: 0 },
  animate: {
    d: "m12 5 7 7-7 7",
    translateX: [0, -3, 0],
    transition: {
      duration: 0.4,
    },
  },
};

const ArrowRightIcon = forwardRef<ArrowRightIconHandle, ArrowRightIconProps>(
  ({ onMouseEnter, onMouseLeave, className, size, active, style, strokeWidth, ...props }, ref) => {
    const controls = useAnimation();
    const isControlledRef = useRef(false);

    useImperativeHandle(ref, () => {
      isControlledRef.current = true;

      return {
        startAnimation: () => controls.start("animate"),
        stopAnimation: () => controls.start("normal"),
      };
    });

    const handleMouseEnter = useCallback(
      (e: React.MouseEvent<HTMLSpanElement>) => {
        if (isControlledRef.current) {
          onMouseEnter?.(e);
        } else {
          controls.start("animate");
        }
      },
      [controls, onMouseEnter]
    );

    const handleMouseLeave = useCallback(
      (e: React.MouseEvent<HTMLSpanElement>) => {
        if (isControlledRef.current) {
          onMouseLeave?.(e);
        } else {
          controls.start("normal");
        }
      },
      [controls, onMouseLeave]
    );
    // Play with the nearest interactive parent, or whenever `active` is set.
    // Reduced motion keeps the icon still.
    const wrap = useRef<HTMLSpanElement>(null);
    const reduced = useReducedMotion();
    const [hosted, setHosted] = useState(false);
    useEffect(() => {
      const fake = {} as React.MouseEvent<HTMLSpanElement>;
      if (reduced) {
        setHosted(true);
        return;
      }
      if (active !== undefined) {
        setHosted(true);
        (active ? handleMouseEnter : handleMouseLeave)(fake);
        return;
      }
      const host = wrap.current?.parentElement?.closest<HTMLElement>("button, a, [role=button], [role=menuitem], [role=tab], [role=switch], [role=radio], label");
      setHosted(!!host);
      if (!host) return;
      const on = () => handleMouseEnter(fake);
      const off = () => handleMouseLeave(fake);
      host.addEventListener("pointerenter", on);
      host.addEventListener("pointerleave", off);
      return () => {
        host.removeEventListener("pointerenter", on);
        host.removeEventListener("pointerleave", off);
      };
    }, [active, reduced, handleMouseEnter, handleMouseLeave]);

    return (
      <span
        ref={wrap}
        className={cn("inline-grid size-6 shrink-0 place-items-center align-middle [&>svg]:size-full", className)}
        style={size ? { width: size, height: size, ...style } : style}
        onMouseEnter={hosted ? undefined : handleMouseEnter}
        onMouseLeave={hosted ? undefined : handleMouseLeave}
        {...props}
      >
        <svg
          fill="none"
          height={size}
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokeWidth ?? 2}
          viewBox="0 0 24 24"
          width={size}
          xmlns="http://www.w3.org/2000/svg"
        >
          <motion.path
            animate={controls}
            d="M5 12h14"
            variants={PATH_VARIANTS}
          />
          <motion.path
            animate={controls}
            d="m12 5 7 7-7 7"
            variants={SECONDARY_PATH_VARIANTS}
          />
        </svg>
      </span>
    );
  }
);

ArrowRightIcon.displayName = "ArrowRightIcon";
  return ArrowRightIcon;
})();

// Animated icon: at-sign
const AtSignIcon = (() => {
interface AtSignIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface AtSignIconProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Size in px; by default it follows className, like a lucide icon. */
  size?: number;
  /** Play while true; when set, hover no longer drives it. */
  active?: boolean;
  /** Line weight, like a lucide icon's. Default `2`. */
  strokeWidth?: number | string;
}

const CIRCLE_VARIANTS: Variants = {
  normal: {
    opacity: 1,
    pathLength: 1,
    pathOffset: 0,
    transition: {
      duration: 0.4,
      opacity: { duration: 0.1 },
    },
  },
  animate: {
    opacity: [0, 1],
    pathLength: [0, 1],
    pathOffset: [1, 0],
    transition: {
      duration: 0.3,
      opacity: { duration: 0.1 },
    },
  },
};

const PATH_VARIANTS: Variants = {
  normal: {
    opacity: 1,
    pathLength: 1,
    transition: {
      delay: 0.3,
      duration: 0.3,
      opacity: { duration: 0.1, delay: 0.3 },
    },
  },
  animate: {
    opacity: [0, 1],
    pathLength: [0, 1],
    transition: {
      delay: 0.3,
      duration: 0.3,
      opacity: { duration: 0.1, delay: 0.3 },
    },
  },
};

const AtSignIcon = forwardRef<AtSignIconHandle, AtSignIconProps>(
  ({ onMouseEnter, onMouseLeave, className, size, active, style, strokeWidth, ...props }, ref) => {
    const controls = useAnimation();
    const isControlledRef = useRef(false);

    useImperativeHandle(ref, () => {
      isControlledRef.current = true;

      return {
        startAnimation: () => controls.start("animate"),
        stopAnimation: () => controls.start("normal"),
      };
    });

    const handleMouseEnter = useCallback(
      (e: React.MouseEvent<HTMLSpanElement>) => {
        if (isControlledRef.current) {
          onMouseEnter?.(e);
        } else {
          controls.start("animate");
        }
      },
      [controls, onMouseEnter]
    );

    const handleMouseLeave = useCallback(
      (e: React.MouseEvent<HTMLSpanElement>) => {
        if (isControlledRef.current) {
          onMouseLeave?.(e);
        } else {
          controls.start("normal");
        }
      },
      [controls, onMouseLeave]
    );
    // Play with the nearest interactive parent, or whenever `active` is set.
    // Reduced motion keeps the icon still.
    const wrap = useRef<HTMLSpanElement>(null);
    const reduced = useReducedMotion();
    const [hosted, setHosted] = useState(false);
    useEffect(() => {
      const fake = {} as React.MouseEvent<HTMLSpanElement>;
      if (reduced) {
        setHosted(true);
        return;
      }
      if (active !== undefined) {
        setHosted(true);
        (active ? handleMouseEnter : handleMouseLeave)(fake);
        return;
      }
      const host = wrap.current?.parentElement?.closest<HTMLElement>("button, a, [role=button], [role=menuitem], [role=tab], [role=switch], [role=radio], label");
      setHosted(!!host);
      if (!host) return;
      const on = () => handleMouseEnter(fake);
      const off = () => handleMouseLeave(fake);
      host.addEventListener("pointerenter", on);
      host.addEventListener("pointerleave", off);
      return () => {
        host.removeEventListener("pointerenter", on);
        host.removeEventListener("pointerleave", off);
      };
    }, [active, reduced, handleMouseEnter, handleMouseLeave]);

    return (
      <span
        ref={wrap}
        className={cn("inline-grid size-6 shrink-0 place-items-center align-middle [&>svg]:size-full", className)}
        style={size ? { width: size, height: size, ...style } : style}
        onMouseEnter={hosted ? undefined : handleMouseEnter}
        onMouseLeave={hosted ? undefined : handleMouseLeave}
        {...props}
      >
        <svg
          fill="none"
          height={size}
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokeWidth ?? 2}
          viewBox="0 0 24 24"
          width={size}
          xmlns="http://www.w3.org/2000/svg"
        >
          <motion.circle
            animate={controls}
            cx="12"
            cy="12"
            r="4"
            variants={CIRCLE_VARIANTS}
          />
          <motion.path
            animate={controls}
            d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8"
            variants={PATH_VARIANTS}
          />
        </svg>
      </span>
    );
  }
);

AtSignIcon.displayName = "AtSignIcon";
  return AtSignIcon;
})();

// Animated icon: badge-alert
const BadgeAlertIcon = (() => {
interface BadgeAlertIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface BadgeAlertIconProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Size in px; by default it follows className, like a lucide icon. */
  size?: number;
  /** Play while true; when set, hover no longer drives it. */
  active?: boolean;
  /** Line weight, like a lucide icon's. Default `2`. */
  strokeWidth?: number | string;
}

const ICON_VARIANTS: Variants = {
  normal: { scale: 1, rotate: 0 },
  animate: {
    scale: [1, 1.1, 1.1, 1.1, 1],
    rotate: [0, -3, 3, -2, 2, 0],
    transition: {
      duration: 0.5,
      times: [0, 0.2, 0.4, 0.6, 1],
      ease: "easeInOut",
    },
  },
};
const BadgeAlertIcon = forwardRef<BadgeAlertIconHandle, BadgeAlertIconProps>(
  ({ onMouseEnter, onMouseLeave, className, size, active, style, strokeWidth, ...props }, ref) => {
    const controls = useAnimation();
    const isControlledRef = useRef(false);

    useImperativeHandle(ref, () => {
      isControlledRef.current = true;

      return {
        startAnimation: () => controls.start("animate"),
        stopAnimation: () => controls.start("normal"),
      };
    });

    const handleMouseEnter = useCallback(
      (e: React.MouseEvent<HTMLSpanElement>) => {
        if (isControlledRef.current) {
          onMouseEnter?.(e);
        } else {
          controls.start("animate");
        }
      },
      [controls, onMouseEnter]
    );

    const handleMouseLeave = useCallback(
      (e: React.MouseEvent<HTMLSpanElement>) => {
        if (isControlledRef.current) {
          onMouseLeave?.(e);
        } else {
          controls.start("normal");
        }
      },
      [controls, onMouseLeave]
    );
    // Play with the nearest interactive parent, or whenever `active` is set.
    // Reduced motion keeps the icon still.
    const wrap = useRef<HTMLSpanElement>(null);
    const reduced = useReducedMotion();
    const [hosted, setHosted] = useState(false);
    useEffect(() => {
      const fake = {} as React.MouseEvent<HTMLSpanElement>;
      if (reduced) {
        setHosted(true);
        return;
      }
      if (active !== undefined) {
        setHosted(true);
        (active ? handleMouseEnter : handleMouseLeave)(fake);
        return;
      }
      const host = wrap.current?.parentElement?.closest<HTMLElement>("button, a, [role=button], [role=menuitem], [role=tab], [role=switch], [role=radio], label");
      setHosted(!!host);
      if (!host) return;
      const on = () => handleMouseEnter(fake);
      const off = () => handleMouseLeave(fake);
      host.addEventListener("pointerenter", on);
      host.addEventListener("pointerleave", off);
      return () => {
        host.removeEventListener("pointerenter", on);
        host.removeEventListener("pointerleave", off);
      };
    }, [active, reduced, handleMouseEnter, handleMouseLeave]);

    return (
      <span
        ref={wrap}
        className={cn("inline-grid size-6 shrink-0 place-items-center align-middle [&>svg]:size-full", className)}
        style={size ? { width: size, height: size, ...style } : style}
        onMouseEnter={hosted ? undefined : handleMouseEnter}
        onMouseLeave={hosted ? undefined : handleMouseLeave}
        {...props}
      >
        <motion.svg
          animate={controls}
          fill="none"
          height={size}
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokeWidth ?? 2}
          variants={ICON_VARIANTS}
          viewBox="0 0 24 24"
          width={size}
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" />
          <line x1="12" x2="12" y1="8" y2="12" />
          <line x1="12" x2="12.01" y1="16" y2="16" />
        </motion.svg>
      </span>
    );
  }
);

BadgeAlertIcon.displayName = "BadgeAlertIcon";
  return BadgeAlertIcon;
})();

// Animated icon: circle-check
const CircleCheckIcon = (() => {
interface CircleCheckIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface CircleCheckIconProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Size in px; by default it follows className, like a lucide icon. */
  size?: number;
  /** Play while true; when set, hover no longer drives it. */
  active?: boolean;
  /** Line weight, like a lucide icon's. Default `2`. */
  strokeWidth?: number | string;
}

const PATH_VARIANTS: Variants = {
  normal: {
    opacity: 1,
    pathLength: 1,
    transition: {
      duration: 0.3,
      opacity: { duration: 0.1 },
    },
  },
  animate: {
    opacity: [0, 1],
    pathLength: [0, 1],
    transition: {
      duration: 0.4,
      opacity: { duration: 0.1 },
    },
  },
};

const CircleCheckIcon = forwardRef<CircleCheckIconHandle, CircleCheckIconProps>(
  ({ onMouseEnter, onMouseLeave, className, size, active, style, strokeWidth, ...props }, ref) => {
    const controls = useAnimation();
    const isControlledRef = useRef(false);

    useImperativeHandle(ref, () => {
      isControlledRef.current = true;

      return {
        startAnimation: () => controls.start("animate"),
        stopAnimation: () => controls.start("normal"),
      };
    });

    const handleMouseEnter = useCallback(
      (e: React.MouseEvent<HTMLSpanElement>) => {
        if (isControlledRef.current) {
          onMouseEnter?.(e);
        } else {
          controls.start("animate");
        }
      },
      [controls, onMouseEnter]
    );

    const handleMouseLeave = useCallback(
      (e: React.MouseEvent<HTMLSpanElement>) => {
        if (isControlledRef.current) {
          onMouseLeave?.(e);
        } else {
          controls.start("normal");
        }
      },
      [controls, onMouseLeave]
    );
    // Play with the nearest interactive parent, or whenever `active` is set.
    // Reduced motion keeps the icon still.
    const wrap = useRef<HTMLSpanElement>(null);
    const reduced = useReducedMotion();
    const [hosted, setHosted] = useState(false);
    useEffect(() => {
      const fake = {} as React.MouseEvent<HTMLSpanElement>;
      if (reduced) {
        setHosted(true);
        return;
      }
      if (active !== undefined) {
        setHosted(true);
        (active ? handleMouseEnter : handleMouseLeave)(fake);
        return;
      }
      const host = wrap.current?.parentElement?.closest<HTMLElement>("button, a, [role=button], [role=menuitem], [role=tab], [role=switch], [role=radio], label");
      setHosted(!!host);
      if (!host) return;
      const on = () => handleMouseEnter(fake);
      const off = () => handleMouseLeave(fake);
      host.addEventListener("pointerenter", on);
      host.addEventListener("pointerleave", off);
      return () => {
        host.removeEventListener("pointerenter", on);
        host.removeEventListener("pointerleave", off);
      };
    }, [active, reduced, handleMouseEnter, handleMouseLeave]);

    return (
      <span
        ref={wrap}
        className={cn("inline-grid size-6 shrink-0 place-items-center align-middle [&>svg]:size-full", className)}
        style={size ? { width: size, height: size, ...style } : style}
        onMouseEnter={hosted ? undefined : handleMouseEnter}
        onMouseLeave={hosted ? undefined : handleMouseLeave}
        {...props}
      >
        <svg
          fill="none"
          height={size}
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokeWidth ?? 2}
          viewBox="0 0 24 24"
          width={size}
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="12" cy="12" r="10" />
          <motion.path
            animate={controls}
            d="m9 12 2 2 4-4"
            initial="normal"
            variants={PATH_VARIANTS}
          />
        </svg>
      </span>
    );
  }
);

CircleCheckIcon.displayName = "CircleCheckIcon";
  return CircleCheckIcon;
})();

// Animated icon: loader-circle
const LoaderCircleIcon = (() => {
interface LoaderCircleIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface LoaderCircleIconProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Size in px; by default it follows className, like a lucide icon. */
  size?: number;
  /** Play while true; when set, hover no longer drives it. */
  active?: boolean;
  /** Line weight, like a lucide icon's. Default `2`. */
  strokeWidth?: number | string;
}

const G_VARIANTS: Variants = {
  normal: { rotate: 0 },
  animate: {
    rotate: 360,
    transition: {
      repeat: Number.POSITIVE_INFINITY,
      duration: 0.8,
      ease: "linear",
    },
  },
};

const DEFAULT_TRANSITION: Transition = {
  type: "spring",
  stiffness: 50,
  damping: 10,
};

const LoaderCircleIcon = forwardRef<
  LoaderCircleIconHandle,
  LoaderCircleIconProps
>(({ onMouseEnter, onMouseLeave, className, size, active, style, strokeWidth, ...props }, ref) => {
  const controls = useAnimation();
  const isControlledRef = useRef(false);

  useImperativeHandle(ref, () => {
    isControlledRef.current = true;

    return {
      startAnimation: () => controls.start("animate"),
      stopAnimation: () => controls.start("normal"),
    };
  });

  const handleMouseEnter = useCallback(
    (e: React.MouseEvent<HTMLSpanElement>) => {
      if (isControlledRef.current) {
        onMouseEnter?.(e);
      } else {
        controls.start("animate");
      }
    },
    [controls, onMouseEnter]
  );

  const handleMouseLeave = useCallback(
    (e: React.MouseEvent<HTMLSpanElement>) => {
      if (isControlledRef.current) {
        onMouseLeave?.(e);
      } else {
        controls.start("normal");
      }
    },
    [controls, onMouseLeave]
  );
    // Play with the nearest interactive parent, or whenever `active` is set.
    // Reduced motion keeps the icon still.
    const wrap = useRef<HTMLSpanElement>(null);
    const reduced = useReducedMotion();
    const [hosted, setHosted] = useState(false);
    useEffect(() => {
      const fake = {} as React.MouseEvent<HTMLSpanElement>;
      if (reduced) {
        setHosted(true);
        return;
      }
      if (active !== undefined) {
        setHosted(true);
        (active ? handleMouseEnter : handleMouseLeave)(fake);
        return;
      }
      const host = wrap.current?.parentElement?.closest<HTMLElement>("button, a, [role=button], [role=menuitem], [role=tab], [role=switch], [role=radio], label");
      setHosted(!!host);
      if (!host) return;
      const on = () => handleMouseEnter(fake);
      const off = () => handleMouseLeave(fake);
      host.addEventListener("pointerenter", on);
      host.addEventListener("pointerleave", off);
      return () => {
        host.removeEventListener("pointerenter", on);
        host.removeEventListener("pointerleave", off);
      };
    }, [active, reduced, handleMouseEnter, handleMouseLeave]);

  return (
    <span
      ref={wrap}
      className={cn("inline-grid size-6 shrink-0 place-items-center align-middle [&>svg]:size-full", className)}
      style={size ? { width: size, height: size, ...style } : style}
      onMouseEnter={hosted ? undefined : handleMouseEnter}
      onMouseLeave={hosted ? undefined : handleMouseLeave}
      {...props}
    >
      <svg
        fill="none"
        height={size}
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={strokeWidth ?? 2}
        viewBox="0 0 24 24"
        width={size}
        xmlns="http://www.w3.org/2000/svg"
      >
        <motion.path
          animate={controls}
          d="M21 12a9 9 0 1 1-6.219-8.56"
          style={{ transformOrigin: "12px 12px" }}
          transition={DEFAULT_TRANSITION}
          variants={G_VARIANTS}
        />
      </svg>
    </span>
  );
});

LoaderCircleIcon.displayName = "LoaderCircleIcon";
  return LoaderCircleIcon;
})();

// Animated icon: user
const UserIcon = (() => {
interface UserIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface UserIconProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Size in px; by default it follows className, like a lucide icon. */
  size?: number;
  /** Play while true; when set, hover no longer drives it. */
  active?: boolean;
  /** Line weight, like a lucide icon's. Default `2`. */
  strokeWidth?: number | string;
}

const PATH_VARIANT: Variants = {
  normal: { pathLength: 1, opacity: 1, pathOffset: 0 },
  animate: {
    pathLength: [0, 1],
    opacity: [0, 1],
    pathOffset: [1, 0],
  },
};

const CIRCLE_VARIANT: Variants = {
  normal: {
    pathLength: 1,
    pathOffset: 0,
    scale: 1,
  },
  animate: {
    pathLength: [0, 1],
    pathOffset: [1, 0],
    scale: [0.5, 1],
  },
};

const UserIcon = forwardRef<UserIconHandle, UserIconProps>(
  ({ onMouseEnter, onMouseLeave, className, size, active, style, strokeWidth, ...props }, ref) => {
    const controls = useAnimation();
    const isControlledRef = useRef(false);

    useImperativeHandle(ref, () => {
      isControlledRef.current = true;

      return {
        startAnimation: () => controls.start("animate"),
        stopAnimation: () => controls.start("normal"),
      };
    });

    const handleMouseEnter = useCallback(
      (e: React.MouseEvent<HTMLSpanElement>) => {
        if (isControlledRef.current) {
          onMouseEnter?.(e);
        } else {
          controls.start("animate");
        }
      },
      [controls, onMouseEnter]
    );

    const handleMouseLeave = useCallback(
      (e: React.MouseEvent<HTMLSpanElement>) => {
        if (isControlledRef.current) {
          onMouseLeave?.(e);
        } else {
          controls.start("normal");
        }
      },
      [controls, onMouseLeave]
    );
    // Play with the nearest interactive parent, or whenever `active` is set.
    // Reduced motion keeps the icon still.
    const wrap = useRef<HTMLSpanElement>(null);
    const reduced = useReducedMotion();
    const [hosted, setHosted] = useState(false);
    useEffect(() => {
      const fake = {} as React.MouseEvent<HTMLSpanElement>;
      if (reduced) {
        setHosted(true);
        return;
      }
      if (active !== undefined) {
        setHosted(true);
        (active ? handleMouseEnter : handleMouseLeave)(fake);
        return;
      }
      const host = wrap.current?.parentElement?.closest<HTMLElement>("button, a, [role=button], [role=menuitem], [role=tab], [role=switch], [role=radio], label");
      setHosted(!!host);
      if (!host) return;
      const on = () => handleMouseEnter(fake);
      const off = () => handleMouseLeave(fake);
      host.addEventListener("pointerenter", on);
      host.addEventListener("pointerleave", off);
      return () => {
        host.removeEventListener("pointerenter", on);
        host.removeEventListener("pointerleave", off);
      };
    }, [active, reduced, handleMouseEnter, handleMouseLeave]);

    return (
      <span
        ref={wrap}
        className={cn("inline-grid size-6 shrink-0 place-items-center align-middle [&>svg]:size-full", className)}
        style={size ? { width: size, height: size, ...style } : style}
        onMouseEnter={hosted ? undefined : handleMouseEnter}
        onMouseLeave={hosted ? undefined : handleMouseLeave}
        {...props}
      >
        <svg
          fill="none"
          height={size}
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokeWidth ?? 2}
          viewBox="0 0 24 24"
          width={size}
          xmlns="http://www.w3.org/2000/svg"
        >
          <motion.circle
            animate={controls}
            cx="12"
            cy="8"
            r="5"
            variants={CIRCLE_VARIANT}
          />

          <motion.path
            animate={controls}
            d="M20 21a8 8 0 0 0-16 0"
            transition={{
              delay: 0.2,
              duration: 0.4,
            }}
            variants={PATH_VARIANT}
          />
        </svg>
      </span>
    );
  }
);

UserIcon.displayName = "UserIcon";
  return UserIcon;
})();

// AuthCard

/**
 * AuthCard
 *
 * Trigger: press and type (plus focus, hover and in view). One white card
 * for signing in and signing up without a password. It asks for an email,
 * a Send code button sends a one time code, and Google, Apple and GitHub sit
 * below. The line at the bottom switches modes, and the card changes in
 * place instead of swapping pages: a name field grows in above the email,
 * and the title, the button and the bottom line roll to their new words
 * while the logo turns once. The email keeps what was typed. Fields are full pills that wake on focus: the surface turns white,
 * a soft ring grows and the field's icon plays, and once filled they stay
 * white with a thin stroke to show they are done; a valid email earns a green check, the eye
 * shows or hides the password, and fields that need fixing shake and explain
 * why. Get started presses in; while it works a light sweeps across it, an
 * arc spins and dots wave; when done it turns green with a ripple and the
 * lock opens (sign in) or a check lands (sign up). Social buttons lift, wiggle their logo and show a spinner
 * when pressed. Reduced motion keeps every state without movement.
 *
 * Engine: motion/react (height reveals with AnimatePresence, rolling text,
 * keyframe shakes, springs) with animated icons from lucide-animated (MIT),
 * vendored in src/icons.
 */

export type AuthMode = "signin" | "signup";
export type AuthProvider = "google" | "apple" | "github";

export interface AuthDetails {
  mode: AuthMode;
  email: string;
  /** Only when signing up. */
  name?: string;
}

export interface AuthCardProps {
  /** Mode shown first. Default `"signin"`. */
  defaultMode?: AuthMode;
  /** Mode (controlled). */
  mode?: AuthMode;
  onModeChange?: (mode: AuthMode) => void;
  /** Sends the sign-in code. Called with the details once they pass the checks; throw to show an error. */
  onSubmit?: (details: AuthDetails) => void | Promise<void>;
  /** Called by the Google, Apple and GitHub buttons. */
  onSocial?: (provider: AuthProvider) => void | Promise<void>;
  /** Your logo for the top of the card. Default a placeholder gradient mark. */
  logo?: React.ReactNode;
  className?: string;
}

const GLIDE = [0.22, 1, 0.36, 1] as const;
const INK = "#242423";
const GOOD = "#269a5a";
const BAD = "#d64545";

const COPY = {
  signin: {
    title: "Welcome back",
    sub: "We'll email you a code to sign in.",
    cta: "Send code",
    busy: "Sending code",
    done: "Code sent",
    ask: "Don't have an account?",
    flip: "Sign up",
  },
  signup: {
    title: "Create your account",
    sub: "No password needed. We'll email you a code.",
    cta: "Send code",
    busy: "Sending code",
    done: "Code sent",
    ask: "Already have an account?",
    flip: "Sign in",
  },
} as const;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;


/** Words that roll up or down when they change, through a soft blur. */
function Roll({
  children,
  dir,
  className,
}: {
  children: string;
  dir: number;
  className?: string;
}) {
  const still = !!useReducedMotion();
  return (
    <span className={cn("relative inline-grid overflow-hidden", className)}>
      <AnimatePresence mode="popLayout" initial={false} custom={dir}>
        <motion.span
          key={children}
          custom={dir}
          variants={{
            in: (d: number) => ({
              y: d > 0 ? "60%" : "-60%",
              opacity: 0,
              filter: "blur(4px)",
            }),
            on: { y: "0%", opacity: 1, filter: "blur(0px)" },
            out: (d: number) => ({
              y: d > 0 ? "-60%" : "60%",
              opacity: 0,
              filter: "blur(4px)",
            }),
          }}
          initial={still ? false : "in"}
          animate="on"
          exit={still ? undefined : "out"}
          transition={{ duration: 0.35, ease: GLIDE }}
          className="col-start-1 row-start-1 whitespace-nowrap"
        >
          {children}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

/**
 * A placeholder brand mark: a neutral gray app icon tile holding a six petal
 * bloom. It turns a sixth of a circle each time `turn` changes. Pass your own
 * mark through the `logo` prop.
 */
function BrandMark({ turn, still }: { turn: number; still: boolean }) {
  const gid = React.useId();
  return (
    <span className="relative grid size-12 place-items-center overflow-hidden rounded-[14px] shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_10px_24px_-10px_rgba(0,0,0,0.45)]">
      <svg
        viewBox="0 0 48 48"
        className="absolute inset-0 size-full"
        aria-hidden
      >
        <defs>
          <linearGradient id={`${gid}-bg`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#71717a" />
            <stop offset="0.55" stopColor="#3f3f46" />
            <stop offset="1" stopColor="#1c1c1e" />
          </linearGradient>
          <radialGradient id={`${gid}-shine`} cx="0.3" cy="0.15" r="0.8">
            <stop offset="0" stopColor="#fff" stopOpacity="0.35" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="48" height="48" fill={`url(#${gid}-bg)`} />
        <rect width="48" height="48" fill={`url(#${gid}-shine)`} />
      </svg>
      <motion.svg
        viewBox="0 0 24 24"
        className="relative size-8 text-white"
        aria-hidden
        animate={{ rotate: turn * 60 }}
        transition={
          still
            ? { duration: 0 }
            : { type: "spring", stiffness: 160, damping: 14 }
        }
      >
        {[0, 60, 120, 180, 240, 300].map((deg) => (
          <ellipse
            key={deg}
            cx="12"
            cy="6.4"
            rx="2.9"
            ry="4.9"
            fill="currentColor"
            opacity={deg % 120 ? 0.62 : 0.95}
            transform={`rotate(${deg} 12 12)`}
          />
        ))}
        <circle cx="12" cy="12" r="2.4" fill="#fff" />
      </motion.svg>
    </span>
  );
}

/** A block that grows in and folds away. */
function Reveal({
  show,
  children,
  delay = 0,
}: {
  show: boolean;
  children: React.ReactNode;
  delay?: number;
}) {
  const still = !!useReducedMotion();
  return (
    <AnimatePresence initial={false}>
      {show && (
        <motion.div
          initial={
            still
              ? false
              : {
                  height: 0,
                  opacity: 0,
                  filter: "blur(4px)",
                  overflow: "hidden",
                }
          }
          animate={{
            height: "auto",
            opacity: 1,
            filter: "blur(0px)",
            // Once open, let rings and strokes drawn outside the fields show.
            transitionEnd: { overflow: "visible" },
            transition: {
              duration: still ? 0 : 0.42,
              ease: GLIDE,
              delay: still ? 0 : delay,
            },
          }}
          exit={{
            height: 0,
            opacity: 0,
            filter: "blur(4px)",
            overflow: "hidden",
            transition: { duration: still ? 0 : 0.3, ease: GLIDE },
          }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Field({
  id,
  label,
  type,
  value,
  onChange,
  icon: Icon,
  autoComplete,
  error,
  valid,
  shake,
  invalid,
  invalidHint,
  end,
  inputRef,
}: {
  id: string;
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  icon: React.ComponentType<{ active?: boolean; className?: string }>;
  autoComplete: string;
  error?: string;
  valid?: boolean;
  shake: number;
  /** A live format problem (like a malformed email): a red shimmer runs round the edge and an alert shows. */
  invalid?: boolean;
  /** What the warning's tooltip says. */
  invalidHint?: string;
  end?: React.ReactNode;
  inputRef?: React.Ref<HTMLInputElement>;
}) {
  const still = !!useReducedMotion();
  const [focus, setFocus] = React.useState(false);
  const filled = value.trim().length > 0;
  const [tip, setTip] = React.useState(false);
  React.useEffect(() => {
    if (!invalid) setTip(false);
  }, [invalid]);
  const hint =
    invalidHint ?? "Use a full email address, like name@example.com.";
  // Shake on each failed submit without re-creating the input (which would drop focus).
  const box = useAnimationControls();
  React.useEffect(() => {
    if (error && shake && !still)
      void box.start({
        x: [0, -7, 7, -5, 5, -2, 0],
        transition: { duration: 0.45 },
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shake]);
  return (
    <div className="pt-5">
      <label
        htmlFor={id}
        className="mb-2 block text-sm font-medium text-zinc-700"
      >
        {label}
      </label>
      <motion.div
        animate={box}
        className={cn(
          "relative flex h-11 items-center gap-2.5 rounded-xl pl-3.5 pr-3 transition-[background-color,box-shadow] duration-300",
          focus
            ? "bg-white shadow-[0_0_0_4px_rgba(36,36,35,0.08),0_1px_2px_rgba(0,0,0,0.06)]"
            : filled
              ? // Done: pure white with a thin stroke, so a filled field reads as complete.
                "bg-white shadow-[0_0_0_1.5px_rgba(36,36,35,0.3)]"
              : "bg-[#242423]/[0.045] hover:bg-[#242423]/[0.07]",
          error && !invalid && "shadow-[0_0_0_2px_rgba(214,69,69,0.55)]",
          invalid && "shadow-[0_0_0_1px_rgba(214,69,69,0.3)]",
        )}
      >
        {/* While the format is wrong: a faint red edge with one light shimmer gliding round it, like the prompt input's working state. */}
        <AnimatePresence>
          {invalid && (
            <motion.span
              aria-hidden
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="pointer-events-none absolute inset-0 overflow-hidden rounded-xl p-px"
              style={{
                WebkitMask:
                  "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
                WebkitMaskComposite: "xor",
                mask: "linear-gradient(#000 0 0) content-box exclude, linear-gradient(#000 0 0)",
              }}
            >
              <motion.span
                className="absolute left-1/2 top-1/2 aspect-square w-[160%] -translate-x-1/2 -translate-y-1/2"
                style={{
                  background:
                    "conic-gradient(from 0deg, transparent 0deg, transparent 250deg, rgba(214,69,69,0.12) 290deg, rgba(214,69,69,0.75) 335deg, rgba(255,214,214,0.95) 350deg, transparent 360deg)",
                }}
                animate={still ? undefined : { rotate: 360 }}
                transition={{ duration: 2.4, repeat: Infinity, ease: "linear" }}
              />
            </motion.span>
          )}
        </AnimatePresence>
        <span
          className={cn(
            "grid shrink-0 transition-colors duration-200",
            focus ? "text-[#242423]" : "text-zinc-400",
          )}
        >
          <Icon className="size-[18px]" active={focus} />
        </span>
        <input
          ref={inputRef}
          id={id}
          type={type}
          value={value}
          autoComplete={autoComplete}
          spellCheck={false}
          aria-invalid={!!error || !!invalid || undefined}
          aria-describedby={
            error ? `${id}-error` : invalid ? `${id}-hint` : undefined
          }
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          className="h-full min-w-0 flex-1 bg-transparent text-sm text-[#242423] outline-none placeholder:text-zinc-400"
        />
        {invalid && !error && (
          <span id={`${id}-hint`} className="sr-only">
            {hint}
          </span>
        )}
        <AnimatePresence initial={false} mode="popLayout">
          {invalid && (
            <motion.span
              key="bad"
              initial={still ? false : { scale: 0, opacity: 0, rotate: -30 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 600, damping: 18 }}
              className="relative grid"
              style={{ color: BAD }}
            >
              {/* The warning explains itself on hover or focus. */}
              <span
                tabIndex={0}
                role="img"
                aria-label={hint}
                aria-describedby={tip ? `${id}-tip` : undefined}
                onPointerEnter={() => setTip(true)}
                onPointerLeave={() => setTip(false)}
                onFocus={() => setTip(true)}
                onBlur={() => setTip(false)}
                className="grid cursor-help rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[#d64545]/40"
              >
                <BadgeAlertIcon
                  className="size-[18px]"
                  active={tip || undefined}
                />
              </span>
              <AnimatePresence>
                {tip && (
                  <motion.span
                    id={`${id}-tip`}
                    role="tooltip"
                    initial={{
                      opacity: 0,
                      y: 6,
                      scale: 0.96,
                      filter: "blur(4px)",
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                      scale: 1,
                      filter: "blur(0px)",
                    }}
                    exit={{
                      opacity: 0,
                      y: 4,
                      scale: 0.97,
                      filter: "blur(4px)",
                    }}
                    transition={{ duration: still ? 0 : 0.2, ease: GLIDE }}
                    className="pointer-events-none absolute bottom-[calc(100%+12px)] right-[-10px] z-20 w-56 origin-bottom-right rounded-xl bg-[#242423] px-3 py-2 text-left text-xs leading-relaxed text-white shadow-[0_8px_24px_-8px_rgba(0,0,0,0.35)]"
                  >
                    <span className="flex items-start gap-1.5">
                      <span
                        className="mt-[5px] size-1.5 shrink-0 rounded-full"
                        style={{ background: BAD }}
                      />
                      {hint}
                    </span>
                    {/* A small pointer down to the icon. */}
                    <span className="absolute -bottom-1 right-[14px] size-2.5 rotate-45 rounded-[2px] bg-[#242423]" />
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.span>
          )}
          {valid && !error && !invalid && (
            <motion.span
              key="ok"
              initial={still ? false : { scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 600, damping: 20 }}
              className="grid text-[#269a5a]"
            >
              <CircleCheckIcon className="size-[18px]" active />
            </motion.span>
          )}
        </AnimatePresence>
        {end}
      </motion.div>
      <AnimatePresence initial={false}>
        {error && (
          <motion.p
            id={`${id}-error`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: still ? 0 : 0.25, ease: GLIDE }}
            className="overflow-hidden text-xs"
            style={{ color: BAD }}
          >
            <span className="block pt-1.5">{error}</span>
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

// Brand marks for the social buttons.
const LOGOS: Record<AuthProvider, React.ReactNode> = {
  github: (
    <svg viewBox="0 0 24 24" className="size-[18px]" aria-hidden>
      <path
        fill="currentColor"
        d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"
      />
    </svg>
  ),
  google: (
    <svg viewBox="0 0 24 24" className="size-[18px]" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.1V7.06H2.18A11 11 0 0 0 1 12c0 1.77.43 3.45 1.18 4.94l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"
      />
    </svg>
  ),
  apple: (
    <svg viewBox="0 0 24 24" className="size-[18px]" aria-hidden>
      <path
        fill="currentColor"
        d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"
      />
    </svg>
  ),
};
const PROVIDERS: { id: AuthProvider; label: string }[] = [
  { id: "google", label: "Google" },
  { id: "apple", label: "Apple" },
  { id: "github", label: "GitHub" },
];

function SocialButton({
  provider,
  label,
  onPress,
  disabled,
}: {
  provider: AuthProvider;
  label: string;
  onPress: () => Promise<void>;
  disabled: boolean;
}) {
  const still = !!useReducedMotion();
  const [hover, setHover] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  return (
    <motion.button
      type="button"
      aria-label={`Continue with ${label}`}
      disabled={disabled || busy}
      onPointerEnter={() => setHover(true)}
      onPointerLeave={() => setHover(false)}
      onClick={async () => {
        setBusy(true);
        try {
          await onPress();
        } finally {
          setBusy(false);
        }
      }}
      whileHover={still ? undefined : { y: -2 }}
      whileTap={still ? undefined : { scale: 0.95, y: 0 }}
      transition={{ type: "spring", stiffness: 500, damping: 28 }}
      className="flex h-11 flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#242423]/[0.045] text-sm font-medium text-[#242423] outline-none transition-[background-color,box-shadow] duration-200 hover:bg-white hover:shadow-[0_0_0_1px_rgba(36,36,35,0.08),0_6px_16px_-8px_rgba(0,0,0,0.25)] disabled:cursor-default focus-visible:ring-2 focus-visible:ring-zinc-400"
    >
      <AnimatePresence mode="popLayout" initial={false}>
        {busy ? (
          <motion.span
            key="busy"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            className="grid text-zinc-500"
          >
            <LoaderCircleIcon className="size-[18px]" active />
          </motion.span>
        ) : (
          <motion.span
            key="logo"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{
              scale: 1,
              opacity: 1,
              rotate: hover && !still ? [0, -12, 10, -6, 0] : 0,
            }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{
              rotate: { duration: 0.5 },
              default: { duration: 0.2 },
            }}
            className="grid"
          >
            {LOGOS[provider]}
          </motion.span>
        )}
      </AnimatePresence>
      {label}
    </motion.button>
  );
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const AuthCard = React.forwardRef<HTMLDivElement, AuthCardProps>(
  function AuthCard(
    {
      defaultMode = "signin",
      mode: modeProp,
      onModeChange,
      onSubmit,
      onSocial,
      logo,
      className,
    },
    ref,
  ) {
    const still = !!useReducedMotion();
    const id = React.useId();
    const root = React.useRef<HTMLDivElement>(null);
    React.useImperativeHandle(ref, () => root.current!);
    const seen = useInView(root, { once: true, amount: 0.3 });

    const [own, setOwn] = React.useState<AuthMode>(defaultMode);
    const mode = modeProp ?? own;
    const signup = mode === "signup";
    const dir = signup ? 1 : -1;
    const copy = COPY[mode];

    const [name, setName] = React.useState("");
    const [email, setEmail] = React.useState("");
    const [errors, setErrors] = React.useState<{
      name?: string;
      email?: string;
      form?: string;
    }>({});
    const [shake, setShake] = React.useState(0);
    const [status, setStatus] = React.useState<"idle" | "busy" | "done">(
      "idle",
    );
    const [ctaHover, setCtaHover] = React.useState(false);
    const [turns, setTurns] = React.useState(0);
    const [logoHover, setLogoHover] = React.useState(false);
    const nameRef = React.useRef<HTMLInputElement>(null);

    const switchMode = () => {
      const next: AuthMode = signup ? "signin" : "signup";
      setOwn(next);
      onModeChange?.(next);
      setErrors({});
      setStatus("idle");
      // The logo turns once as the card changes.
      setTurns((t) => t + 1);
    };

    // Clear a field's error as soon as it is edited.
    const edit =
      (key: "name" | "email", set: (v: string) => void) =>
      (v: string) => {
        set(v);
        if (errors[key] || errors.form)
          setErrors((e) => ({ ...e, [key]: undefined, form: undefined }));
      };

    // Judge the email format once typing pauses, so it does not flash red mid word:
    // only the exact text that has sat unchanged for a moment can be called wrong.
    const [settled, setSettled] = React.useState("");
    React.useEffect(() => {
      const t = window.setTimeout(() => setSettled(email), 800);
      return () => window.clearTimeout(t);
    }, [email]);
    const emailOk = EMAIL.test(email.trim());
    const emailBad = email.trim().length > 0 && !emailOk && settled === email;

    const submit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (status !== "idle") return;
      const next: typeof errors = {};
      if (signup && !name.trim()) next.name = "Tell us what to call you.";
      if (!emailOk)
        next.email = email
          ? "That email doesn't look right."
          : "Enter your email.";
      if (Object.keys(next).length) {
        setErrors(next);
        setShake((n) => n + 1);
        return;
      }
      setStatus("busy");
      try {
        const details: AuthDetails = {
          mode,
          email: email.trim(),
          ...(signup ? { name: name.trim() } : {}),
        };
        if (onSubmit) await onSubmit(details);
        else await wait(1200);
        setStatus("done");
        if (!onSubmit) window.setTimeout(() => setStatus("idle"), 1800);
      } catch (err) {
        setStatus("idle");
        setErrors({
          form:
            err instanceof Error
              ? err.message
              : "Something went wrong. Try again.",
        });
        setShake((n) => n + 1);
      }
    };

    const social = async (p: AuthProvider) => {
      if (onSocial) await onSocial(p);
      else await wait(1000);
    };

    return (
      <motion.div
        ref={root}
        initial={still ? false : { opacity: 0, y: 16 }}
        animate={seen || still ? { opacity: 1, y: 0 } : undefined}
        transition={{ duration: 0.55, ease: GLIDE }}
        className={cn(
          "w-110 max-w-full rounded-2xl bg-white p-6 sm:p-10 text-[#242423] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_12px_32px_-16px_rgba(0,0,0,0.18)]",
          className,
        )}
      >
        {/* Header */}
        <div className="flex flex-col items-center text-center">
          {/* The brand mark: turns once when the mode changes, tilts on hover. */}
          <motion.span
            onPointerEnter={() => setLogoHover(true)}
            onPointerLeave={() => setLogoHover(false)}
            initial={still ? false : { scale: 0.6, opacity: 0 }}
            animate={{
              scale: seen || still ? 1 : 0.6,
              opacity: seen || still ? 1 : 0,
              rotate: logoHover && !still ? -6 : 0,
              y: logoHover && !still ? -2 : 0,
            }}
            transition={{ type: "spring", stiffness: 420, damping: 22 }}
            className="grid"
          >
            {logo ?? <BrandMark turn={turns} still={still} />}
          </motion.span>
          <h3 className="mt-6 text-2xl font-semibold tracking-tight">
            <Roll dir={dir}>{copy.title}</Roll>
          </h3>
          <p className="mt-2 text-sm text-zinc-500">
            <Roll dir={dir}>{copy.sub}</Roll>
          </p>
        </div>

        {/* Form */}
        <form
          noValidate
          onSubmit={submit}
          className="mt-4"
          aria-label={copy.title}
        >
          <Reveal show={signup}>
            <Field
              id={`${id}-name`}
              label="Name"
              type="text"
              value={name}
              onChange={edit("name", setName)}
              icon={UserIcon}
              autoComplete="name"
              error={errors.name}
              valid={name.trim().length > 1}
              shake={shake}
              inputRef={nameRef}
            />
          </Reveal>
          <Field
            id={`${id}-email`}
            label="Email"
            type="email"
            value={email}
            onChange={edit("email", setEmail)}
            icon={AtSignIcon}
            autoComplete="email"
            error={errors.email}
            valid={emailOk}
            invalid={emailBad || (!!errors.email && !!email)}
            shake={shake}
          />
          <AnimatePresence initial={false}>
            {errors.form && (
              <motion.p
                role="alert"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden px-1 text-xs"
                style={{ color: BAD }}
              >
                <span className="block pt-3">{errors.form}</span>
              </motion.p>
            )}
          </AnimatePresence>

          {/* Get started */}
          <motion.button
            type="submit"
            onPointerEnter={() => setCtaHover(true)}
            onPointerLeave={() => setCtaHover(false)}
            whileTap={still || status !== "idle" ? undefined : { scale: 0.97 }}
            animate={{ backgroundColor: status === "done" ? GOOD : INK }}
            transition={{ duration: 0.3 }}
            aria-busy={status === "busy"}
            className="relative mt-7 flex h-11 w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg text-sm font-medium text-white outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2"
          >
            {/* While it works: a soft light sweeps across the button again and again. */}
            <AnimatePresence>
              {status === "busy" && !still && (
                <motion.span
                  key="sheen"
                  aria-hidden
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]"
                >
                  <motion.span
                    className="absolute inset-y-0 left-0 w-2/3"
                    style={{
                      background:
                        "linear-gradient(100deg, transparent 0%, rgba(255,255,255,0.16) 50%, transparent 100%)",
                    }}
                    initial={{ x: "-100%" }}
                    animate={{ x: "160%" }}
                    transition={{
                      duration: 1.4,
                      ease: "easeInOut",
                      repeat: Infinity,
                      repeatDelay: 0.15,
                    }}
                  />
                </motion.span>
              )}
            </AnimatePresence>
            {/* Done: a soft ring ripples out as the button turns green. */}
            <AnimatePresence>
              {status === "done" && !still && (
                <motion.span
                  key="ripple"
                  aria-hidden
                  className="pointer-events-none absolute left-1/2 top-1/2 size-24 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/25"
                  initial={{ scale: 0.2, opacity: 0.8 }}
                  animate={{ scale: 5, opacity: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.8, ease: GLIDE }}
                />
              )}
            </AnimatePresence>
            <span className="sr-only" aria-live="polite">
              {status === "busy"
                ? copy.busy
                : status === "done"
                  ? copy.done
                  : ""}
            </span>
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={status}
                initial={
                  still ? false : { y: 18, opacity: 0, filter: "blur(4px)" }
                }
                animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
                exit={
                  still
                    ? undefined
                    : { y: -18, opacity: 0, filter: "blur(4px)" }
                }
                transition={{ duration: 0.3, ease: GLIDE }}
                className="flex items-center gap-2"
                aria-hidden
              >
                {status === "idle" && (
                  <>
                    <Roll dir={dir}>{copy.cta}</Roll>
                    <motion.span
                      className="grid"
                      animate={{ x: ctaHover && !still ? 3 : 0 }}
                      transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 24,
                      }}
                    >
                      <ArrowRightIcon className="size-4" active={ctaHover} />
                    </motion.span>
                  </>
                )}
                {status === "busy" && (
                  <>
                    <LoaderCircleIcon className="size-4" active />
                    <span className="relative">{copy.busy}</span>
                    {/* Three dots wave after the words. */}
                    <span className="-ml-1.5 flex items-end gap-[3px] pb-[3px]">
                      {[0, 1, 2].map((i) => (
                        <motion.span
                          key={i}
                          className="size-[3px] rounded-full bg-white"
                          animate={
                            still
                              ? undefined
                              : { y: [0, -3, 0], opacity: [0.4, 1, 0.4] }
                          }
                          transition={{
                            duration: 0.9,
                            repeat: Infinity,
                            delay: i * 0.15,
                            ease: "easeInOut",
                          }}
                        />
                      ))}
                    </span>
                  </>
                )}
                {status === "done" && (
                  <>
                    <motion.span
                      className="grid"
                      initial={still ? false : { scale: 0.4, rotate: -20 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 16,
                      }}
                    >
                      <CircleCheckIcon className="size-4" active />
                    </motion.span>
                    {copy.done}
                  </>
                )}
              </motion.span>
            </AnimatePresence>
          </motion.button>
        </form>

        {/* Or */}
        <div className="mt-8 flex items-center gap-3 text-xs text-zinc-400">
          <motion.span
            className="h-px flex-1 origin-right bg-[#242423]/[0.08]"
            initial={still ? false : { scaleX: 0 }}
            animate={seen || still ? { scaleX: 1 } : undefined}
            transition={{ duration: 0.6, ease: GLIDE, delay: 0.3 }}
          />
          or continue with
          <motion.span
            className="h-px flex-1 origin-left bg-[#242423]/[0.08]"
            initial={still ? false : { scaleX: 0 }}
            animate={seen || still ? { scaleX: 1 } : undefined}
            transition={{ duration: 0.6, ease: GLIDE, delay: 0.3 }}
          />
        </div>
        <div className="mt-6 flex gap-3">
          {PROVIDERS.map((p) => (
            <SocialButton
              key={p.id}
              provider={p.id}
              label={p.label}
              onPress={() => social(p.id)}
              disabled={status === "busy"}
            />
          ))}
        </div>

        {/* Switch modes */}
        <p className="mt-8 flex items-center justify-center gap-1.5 text-sm text-zinc-500">
          <Roll dir={dir}>{copy.ask}</Roll>
          <button
            type="button"
            onClick={switchMode}
            className="cursor-pointer rounded-md font-medium text-[#242423] outline-none transition-opacity hover:opacity-60 focus-visible:ring-2 focus-visible:ring-zinc-400"
          >
            <Roll dir={dir}>{copy.flip}</Roll>
          </button>
        </p>
      </motion.div>
    );
  },
);
