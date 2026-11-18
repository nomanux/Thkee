"use client";

/**
 * OtpCode, from https://motion-brew.com/components/otp-code
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

// Animated icon: mail-check
const MailCheckIcon = (() => {
interface MailCheckIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface MailCheckIconProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Size in px; by default it follows className, like a lucide icon. */
  size?: number;
  /** Play while true; when set, hover no longer drives it. */
  active?: boolean;
  /** Line weight, like a lucide icon's. Default `2`. */
  strokeWidth?: number | string;
}

const CHECK_VARIANTS: Variants = {
  normal: {
    pathLength: 1,
    opacity: 1,
    transition: {
      duration: 0.3,
    },
  },
  animate: {
    pathLength: [0, 1],
    opacity: [0, 1],
    transition: {
      pathLength: { duration: 0.4, ease: "easeInOut" },
      opacity: { duration: 0.4, ease: "easeInOut" },
    },
  },
};

const MailCheckIcon = forwardRef<MailCheckIconHandle, MailCheckIconProps>(
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
          <path d="M22 13V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12c0 1.1.9 2 2 2h8" />
          <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
          <motion.path
            animate={controls}
            d="m16 19 2 2 4-4"
            initial="normal"
            style={{ transformOrigin: "center" }}
            variants={CHECK_VARIANTS}
          />
        </svg>
      </span>
    );
  }
);

MailCheckIcon.displayName = "MailCheckIcon";
  return MailCheckIcon;
})();

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

// Animated icon: history
const HistoryIcon = (() => {
interface HistoryIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface HistoryIconProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Size in px; by default it follows className, like a lucide icon. */
  size?: number;
  /** Play while true; when set, hover no longer drives it. */
  active?: boolean;
  /** Line weight, like a lucide icon's. Default `2`. */
  strokeWidth?: number | string;
}

const ARROW_TRANSITION: Transition = {
  type: "spring",
  stiffness: 250,
  damping: 25,
};

const ARROW_VARIANTS: Variants = {
  normal: {
    rotate: "0deg",
  },
  animate: {
    rotate: "-50deg",
  },
};

const HAND_TRANSITION: Transition = {
  duration: 0.6,
  ease: [0.4, 0, 0.2, 1],
};

const HAND_VARIANTS: Variants = {
  normal: {
    rotate: 0,
    originX: "0%",
    originY: "100%",
  },
  animate: {
    rotate: -360,
    originX: "0%",
    originY: "100%",
  },
};

const MINUTE_HAND_TRANSITION: Transition = {
  duration: 0.5,
  ease: "easeInOut",
};

const MINUTE_HAND_VARIANTS: Variants = {
  normal: {
    rotate: 0,
    originX: "0%",
    originY: "0%",
  },
  animate: {
    rotate: -45,
    originX: "0%",
    originY: "0%",
  },
};

const HistoryIcon = forwardRef<HistoryIconHandle, HistoryIconProps>(
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
          <motion.g
            animate={controls}
            transition={ARROW_TRANSITION}
            variants={ARROW_VARIANTS}
          >
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
          </motion.g>
          <motion.line
            animate={controls}
            initial="normal"
            transition={HAND_TRANSITION}
            variants={HAND_VARIANTS}
            x1="12"
            x2="12"
            y1="12"
            y2="7"
          />
          <motion.line
            animate={controls}
            initial="normal"
            transition={MINUTE_HAND_TRANSITION}
            variants={MINUTE_HAND_VARIANTS}
            x1="12"
            x2="16"
            y1="12"
            y2="14"
          />
        </svg>
      </span>
    );
  }
);

HistoryIcon.displayName = "HistoryIcon";
  return HistoryIcon;
})();

// Animated icon: refresh-cw
const RefreshCWIcon = (() => {
interface RefreshCCWIconWIcon {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface RefreshCCWIcoWIcon extends React.HTMLAttributes<HTMLSpanElement> {
  /** Size in px; by default it follows className, like a lucide icon. */
  size?: number;
  /** Play while true; when set, hover no longer drives it. */
  active?: boolean;
  /** Line weight, like a lucide icon's. Default `2`. */
  strokeWidth?: number | string;
}

const RefreshCWIcon = forwardRef<RefreshCCWIconWIcon, RefreshCCWIcoWIcon>(
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
        if (isControlledRef.current) onMouseEnter?.(e);
        else controls.start("animate");
      },
      [controls, onMouseEnter]
    );

    const handleMouseLeave = useCallback(
      (e: React.MouseEvent<HTMLSpanElement>) => {
        if (isControlledRef.current) onMouseLeave?.(e);
        else controls.start("normal");
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
          transition={{ type: "spring", stiffness: 250, damping: 25 }}
          variants={{
            normal: { rotate: "0deg" },
            animate: { rotate: "50deg" },
          }}
          viewBox="0 0 24 24"
          width={size}
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
          <path d="M21 3v5h-5" />
          <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
          <path d="M8 16H3v5" />
        </motion.svg>
      </span>
    );
  }
);

RefreshCWIcon.displayName = "RefreshCWIcon";
  return RefreshCWIcon;
})();

// Animated icon: shield-check
const ShieldCheckIcon = (() => {
interface ShieldCheckIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface ShieldCheckIconProps extends React.HTMLAttributes<HTMLSpanElement> {
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
    scale: 1,
    transition: {
      duration: 0.3,
      opacity: { duration: 0.1 },
    },
  },
  animate: {
    opacity: [0, 1],
    pathLength: [0, 1],
    scale: [0.5, 1],
    transition: {
      duration: 0.4,
      opacity: { duration: 0.1 },
    },
  },
};

const ShieldCheckIcon = forwardRef<ShieldCheckIconHandle, ShieldCheckIconProps>(
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
          <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
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

ShieldCheckIcon.displayName = "ShieldCheckIcon";
  return ShieldCheckIcon;
})();

// Animated icon: smartphone-nfc
const SmartphoneNfcIcon = (() => {
interface SmartphoneNfcIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface SmartphoneNfcIconProps extends React.HTMLAttributes<HTMLSpanElement> {
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
    transition: {
      duration: 0.4,
    },
  },
  fadeOut: {
    opacity: 0,
    transition: { duration: 0.3 },
  },
  fadeIn: (i: number) => ({
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 20,
      delay: i * 0.1,
    },
  }),
};

const SmartphoneNfcIcon = forwardRef<
  SmartphoneNfcIconHandle,
  SmartphoneNfcIconProps
>(({ onMouseEnter, onMouseLeave, className, size, active, style, strokeWidth, ...props }, ref) => {
  const controls = useAnimation();
  const isControlledRef = useRef(false);

  useImperativeHandle(ref, () => {
    isControlledRef.current = true;
    return {
      startAnimation: async () => {
        await controls.start("fadeOut");
        controls.start("fadeIn");
      },
      stopAnimation: () => controls.start("normal"),
    };
  });

  const handleMouseEnter = useCallback(
    async (e: React.MouseEvent<HTMLSpanElement>) => {
      if (isControlledRef.current) {
        onMouseEnter?.(e);
      } else {
        await controls.start("fadeOut");
        controls.start("fadeIn");
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
        <rect height="12" rx="1" width="7" x="2" y="6" />
        <motion.path
          animate={controls}
          custom={0}
          d="M13 8.32a7.43 7.43 0 0 1 0 7.36"
          initial={{ opacity: 1 }}
          variants={PATH_VARIANTS}
        />
        <motion.path
          animate={controls}
          custom={1}
          d="M16.46 6.21a11.76 11.76 0 0 1 0 11.58"
          initial={{ opacity: 1 }}
          variants={PATH_VARIANTS}
        />
        <motion.path
          animate={controls}
          custom={2}
          d="M19.91 4.1a15.91 15.91 0 0 1 .01 15.8"
          initial={{ opacity: 1 }}
          variants={PATH_VARIANTS}
        />
      </svg>
    </span>
  );
});

SmartphoneNfcIcon.displayName = "SmartphoneNfcIcon";
  return SmartphoneNfcIcon;
})();

// OtpCode

/**
 * OtpCode
 *
 * Trigger: type (plus paste, focus and a timeline). A white card that asks
 * for a one time code sent to an email address or a phone. It rises in out of
 * a soft blur and its pieces follow one after another. The code boxes
 * sit in two groups (3 and 3 for six digits) with a small gap between them.
 * Each digit pops into its box, the box waiting for the next digit shows a
 * blinking caret, and filled boxes turn white with a stroke. There is no
 * confirm button: the last digit starts the check, the boxes ripple in a
 * wave while a spinner says it is checking, and then either the boxes turn
 * green for a beat and the card glides into a confirmation (a green badge
 * whose shield draws a check while rings ripple out, You're verified, a panel
 * with the verified address and a Remember this device switch, then
 * Continue), or they shake red, a message slides in, and the digits drop away
 * from the right so the next try can start. A resend line counts down and
 * then turns into a button whose icon spins when pressed. It is one real
 * input underneath, so paste, autofill of SMS codes, backspace and arrow
 * keys all work. Reduced motion keeps every state without movement.
 *
 * Engine: motion/react (pops, waves, staggered colour changes, a keyframe
 * shake and rolling text) with animated icons from lucide-animated (MIT),
 * vendored in src/icons.
 */

export type OtpChannel = "email" | "phone";
type Status = "idle" | "checking" | "success" | "error";

export interface OtpCodeProps {
  /** Number of digits, 3 to 8. Default `6`. */
  length?: number;
  /** Where the code was sent. Default `"email"`. */
  channel?: OtpChannel;
  /** The email address or phone number the code went to. */
  destination?: string;
  /** Hide most of the destination, like jo•••@lumen.app. Default true. */
  maskDestination?: boolean;
  /** Split the boxes into two groups. Default true (3 and 3 for six digits). */
  split?: boolean;
  /** Show dots instead of the digits. Default false. */
  mask?: boolean;
  /** Seconds before the code can be sent again. Default `30`. */
  resendAfter?: number;
  /**
   * Checks a complete code. Return true when it is right. Default: a short
   * wait, then every code passes (a demo).
   */
  verify?: (code: string) => boolean | Promise<boolean>;
  /** Called once a code passes. */
  onVerified?: (code: string) => void;
  /** Called when the person asks for a new code. */
  onResend?: () => void | Promise<void>;
  /** Called by the confirmation's main button. */
  onContinue?: () => void;
  /** Label of the confirmation's main button. Default `"Continue"`. */
  continueLabel?: string;
  /** Called when the confirmation's Remember this device switch changes. */
  onRememberDevice?: (remember: boolean) => void;
  /** Focus the boxes when the card scrolls into view. Default false; turn it on for a page that is only this step. */
  autoFocus?: boolean;
  className?: string;
}

const GLIDE = [0.22, 1, 0.36, 1] as const;
const INK = "#242423";
const GOOD = "#269a5a";
const BAD = "#d64545";

function maskEmail(v: string) {
  const [user = "", domain = ""] = v.split("@");
  return `${user.slice(0, 2)}•••@${domain}`;
}
function maskPhone(v: string) {
  const digits = v.replace(/\D/g, "");
  const tail = digits.slice(-4);
  const head = v.trim().startsWith("+")
    ? `+${digits.slice(0, digits.length > 10 ? digits.length - 10 : 1)} `
    : "";
  return `${head}••• ••• ${tail}`;
}

/** Words that roll up when they change, through a soft blur. */
function Roll({
  children,
  className,
}: {
  children: string;
  className?: string;
}) {
  const still = !!useReducedMotion();
  return (
    <span className={cn("relative inline-grid", className)}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={children}
          initial={
            still ? false : { y: "60%", opacity: 0, filter: "blur(4px)" }
          }
          animate={{ y: "0%", opacity: 1, filter: "blur(0px)" }}
          exit={
            still ? undefined : { y: "-60%", opacity: 0, filter: "blur(4px)" }
          }
          transition={{ duration: 0.35, ease: GLIDE }}
          className="col-start-1 row-start-1"
        >
          {children}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

function Box({
  index,
  char,
  active,
  status,
  mask,
  still,
  count,
  shown,
}: {
  index: number;
  char: string;
  active: boolean;
  status: Status;
  mask: boolean;
  still: boolean;
  count: number;
  /** The card has scrolled into view: boxes drop in one after another. */
  shown: boolean;
}) {
  const filled = char !== "";
  const tone = status === "success" ? GOOD : status === "error" ? BAD : INK;
  return (
    <motion.div
      // The wave while checking, then a stagger of colour for the result.
      initial={still ? false : { opacity: 0, scale: 0.8 }}
      animate={{
        y: status === "checking" && !still ? [0, -5, 0] : 0,
        opacity: shown ? 1 : 0,
        scale: shown ? 1 : 0.8,
      }}
      transition={{
        y:
          status === "checking"
            ? {
                duration: 0.6,
                repeat: Infinity,
                repeatDelay: 0.25,
                delay: index * 0.07,
                ease: "easeInOut",
              }
            : { type: "spring", stiffness: 500, damping: 26 },
        opacity: { duration: 0.35, delay: still ? 0 : 0.35 + index * 0.05 },
        scale: {
          type: "spring",
          stiffness: 420,
          damping: 22,
          delay: still ? 0 : 0.35 + index * 0.05,
        },
      }}
      className={cn(
        "relative grid h-14 min-w-0 max-w-[52px] flex-1 place-items-center rounded-2xl text-2xl font-semibold tabular-nums transition-[background-color,box-shadow] duration-300",
        active
          ? "bg-white shadow-[0_0_0_4px_rgba(36,36,35,0.08),0_0_0_1.5px_rgba(36,36,35,0.35)]"
          : filled
            ? "bg-white shadow-[0_0_0_1.5px_rgba(36,36,35,0.3)]"
            : "bg-[#242423]/[0.045]",
      )}
      style={
        status === "success" || status === "error"
          ? {
              boxShadow: `0 0 0 1.5px ${tone}`,
              backgroundColor:
                status === "success"
                  ? "rgba(38,154,90,0.06)"
                  : "rgba(214,69,69,0.05)",
              transitionDelay: `${index * (still ? 0 : 0.05)}s`,
            }
          : undefined
      }
    >
      <AnimatePresence mode="popLayout" initial={false}>
        {filled && (
          <motion.span
            key={`${index}-${char}`}
            initial={
              still
                ? false
                : { y: 12, scale: 0.6, opacity: 0, filter: "blur(4px)" }
            }
            animate={{
              y: 0,
              scale: 1,
              opacity: 1,
              filter: "blur(0px)",
              color: tone,
            }}
            exit={
              still
                ? undefined
                : {
                    y: 14,
                    opacity: 0,
                    filter: "blur(4px)",
                    transition: {
                      duration: 0.25,
                      delay: (count - 1 - index) * 0.04,
                    },
                  }
            }
            transition={{
              type: "spring",
              stiffness: 520,
              damping: 24,
              color: { duration: 0.3, delay: index * (still ? 0 : 0.05) },
            }}
            className="leading-none"
          >
            {mask ? (
              <span className="block size-2.5 rounded-full bg-current" />
            ) : (
              char
            )}
          </motion.span>
        )}
      </AnimatePresence>
      {active && !still && (
        <motion.span
          aria-hidden
          className="absolute h-6 w-[2px] rounded-full bg-[#242423]"
          animate={{ opacity: [1, 1, 0, 0] }}
          transition={{
            duration: 1,
            repeat: Infinity,
            times: [0, 0.5, 0.5, 1],
          }}
        />
      )}
    </motion.div>
  );
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

const RISE = {
  hidden: { opacity: 0, y: 12, filter: "blur(4px)" },
  shown: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.45, ease: GLIDE },
  },
};

/** The verified badge: a green disc that springs in, rings that ripple out twice, and a shield that draws its check. */
function Badge({ still }: { still: boolean }) {
  return (
    <span className="relative grid size-20 place-items-center">
      {!still &&
        [0, 1, 2].map((i) => (
          <motion.span
            key={i}
            aria-hidden
            className="absolute inset-0 rounded-full"
            style={{ boxShadow: `0 0 0 1.5px ${GOOD}` }}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: [0.8, 1.55], opacity: [0.55, 0] }}
            transition={{
              duration: 1.6,
              ease: "easeOut",
              delay: 0.75 + i * 0.35,
              repeat: 1,
              repeatDelay: 0.6,
            }}
          />
        ))}
      <motion.span
        aria-hidden
        className="absolute inset-2 rounded-full bg-[#269a5a]/15"
        initial={still ? false : { scale: 0 }}
        animate={{ scale: 1 }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 18,
          delay: still ? 0 : 0.55,
        }}
      />
      <motion.span
        className="relative grid size-14 place-items-center rounded-full text-white shadow-[0_8px_20px_-8px_rgba(38,154,90,0.7)]"
        style={{ background: `linear-gradient(160deg, #34b06c, ${GOOD})` }}
        initial={still ? false : { scale: 0, rotate: -40 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{
          type: "spring",
          stiffness: 380,
          damping: 15,
          delay: still ? 0 : 0.6,
        }}
      >
        <ShieldCheckIcon className="size-7" active={!still} />
      </motion.span>
    </span>
  );
}

/** A small spring switch. */
function Toggle({
  on,
  onChange,
  label,
}: {
  on: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onChange}
      className={cn(
        "relative h-6 w-10 shrink-0 cursor-pointer rounded-full outline-none transition-colors duration-300 focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2",
        on ? "bg-[#269a5a]" : "bg-[#242423]/15",
      )}
    >
      <motion.span
        className="absolute left-0.5 top-0.5 size-5 rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.2)]"
        animate={{ x: on ? 16 : 0 }}
        whileTap={{ scaleX: 1.2 }}
        transition={{ type: "spring", stiffness: 600, damping: 30 }}
      />
    </button>
  );
}

/** What the card shows once the code passes. */
function Confirmation({
  channel,
  where,
  at,
  continueLabel,
  onContinue,
  onRemember,
  still,
}: {
  channel: OtpChannel;
  where: string;
  at: Date | null;
  continueLabel: string;
  onContinue?: () => void;
  onRemember?: (remember: boolean) => void;
  still: boolean;
}) {
  const id = React.useId();
  const heading = React.useRef<HTMLHeadingElement>(null);
  React.useEffect(() => {
    const t = window.setTimeout(
      () => heading.current?.focus({ preventScroll: true }),
      still ? 0 : 500,
    );
    return () => window.clearTimeout(t);
  }, [still]);
  const [hover, setHover] = React.useState<string | null>(null);
  const [remember, setRemember] = React.useState(true);
  const [going, setGoing] = React.useState(false);
  const Channel = channel === "email" ? MailCheckIcon : SmartphoneNfcIcon;
  const time = (at ?? new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  const row =
    "relative flex items-center gap-3 rounded-[20px] px-3 py-3 outline-none";
  const pill = (key: string) =>
    hover === key && (
      <motion.span
        layoutId={`${id}-row`}
        className="absolute inset-0 rounded-[20px] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
        transition={
          still
            ? { duration: 0 }
            : { type: "spring", stiffness: 500, damping: 40 }
        }
      />
    );

  return (
    <motion.div
      className="col-start-1 row-start-1 flex flex-col p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.2 } }}
      transition={{ duration: 0.3, delay: still ? 0 : 0.5 }}
    >
      <motion.div
        variants={
          still
            ? undefined
            : {
                hidden: {},
                shown: {
                  transition: { staggerChildren: 0.07, delayChildren: 0.85 },
                },
              }
        }
        initial="hidden"
        animate="shown"
        className="flex flex-col items-center text-center"
      >
        <Badge still={still} />
        <motion.h3
          ref={heading}
          tabIndex={-1}
          variants={still ? undefined : RISE}
          className="mt-4 text-2xl font-semibold tracking-tight outline-none"
        >
          You're verified
        </motion.h3>
        <motion.p
          variants={still ? undefined : RISE}
          className="mt-1.5 text-sm text-zinc-500"
        >
          {channel === "email" ? "Your email" : "Your number"} is confirmed.
          You're all set.
        </motion.p>

        {/* One grouped panel: what was verified, and whether to remember this device. */}
        <motion.div
          variants={still ? undefined : RISE}
          onPointerLeave={() => setHover(null)}
          className="mt-6 w-full rounded-3xl bg-[#242423]/[0.045] p-1.5 text-left"
        >
          <div className={row} onPointerEnter={() => setHover("dest")}>
            {pill("dest")}
            <span className="relative grid size-9 shrink-0 place-items-center rounded-full bg-white text-[#242423] shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
              <Channel className="size-[18px]" active={hover === "dest"} />
            </span>
            <span className="relative min-w-0 flex-1 leading-tight">
              <span className="block truncate text-sm font-medium">
                {where}
              </span>
              <span className="mt-0.5 block text-xs text-zinc-500">
                Verified at {time}
              </span>
            </span>
            <motion.span
              className="relative flex shrink-0 items-center gap-1 rounded-full bg-[#269a5a]/10 px-2 py-1 text-xs font-medium text-[#269a5a]"
              initial={still ? false : { scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                type: "spring",
                stiffness: 500,
                damping: 20,
                delay: still ? 0 : 1.25,
              }}
            >
              <CircleCheckIcon className="size-3.5" active={hover === "dest"} />
              Verified
            </motion.span>
          </div>
          <div className="mx-3 h-px bg-[#242423]/[0.07]" aria-hidden />
          <div className={row} onPointerEnter={() => setHover("trust")}>
            {pill("trust")}
            <span className="relative grid size-9 shrink-0 place-items-center rounded-full bg-white text-[#242423] shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
              <HistoryIcon className="size-[18px]" active={hover === "trust"} />
            </span>
            <span className="relative min-w-0 flex-1 leading-tight">
              <span id={`${id}-trust`} className="block text-sm font-medium">
                Remember this device
              </span>
              <span className="mt-0.5 block text-xs text-zinc-500">
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.span
                    key={remember ? "on" : "off"}
                    className="inline-block"
                    initial={still ? false : { y: 6, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={still ? undefined : { y: -6, opacity: 0 }}
                    transition={{ duration: 0.22, ease: GLIDE }}
                  >
                    {remember
                      ? "No codes here for 30 days"
                      : "Ask for a code every time"}
                  </motion.span>
                </AnimatePresence>
              </span>
            </span>
            <span className="relative">
              <Toggle
                on={remember}
                label="Remember this device"
                onChange={() => {
                  setRemember((r) => !r);
                  onRemember?.(!remember);
                }}
              />
            </span>
          </div>
        </motion.div>

        <motion.button
          type="button"
          variants={still ? undefined : RISE}
          onPointerEnter={() => setHover("go")}
          onPointerLeave={() => setHover(null)}
          onClick={() => {
            setGoing(true);
            onContinue?.();
            window.setTimeout(() => setGoing(false), 900);
          }}
          whileTap={still ? undefined : { scale: 0.98 }}
          className="mt-5 flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-[#242423] text-sm font-medium text-white outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2"
        >
          {continueLabel}
          <motion.span
            className="grid"
            animate={
              going && !still
                ? { x: [0, 14, -14, 0], opacity: [1, 0, 0, 1] }
                : { x: hover === "go" && !still ? 3 : 0 }
            }
            transition={
              going
                ? { duration: 0.6, times: [0, 0.45, 0.46, 1] }
                : { type: "spring", stiffness: 500, damping: 24 }
            }
          >
            <ArrowRightIcon className="size-4" active={hover === "go"} />
          </motion.span>
        </motion.button>
      </motion.div>
    </motion.div>
  );
}

export const OtpCode = React.forwardRef<HTMLDivElement, OtpCodeProps>(
  function OtpCode(
    {
      length: lengthProp = 6,
      channel = "email",
      destination,
      maskDestination = true,
      split = true,
      mask = false,
      resendAfter = 30,
      verify,
      onVerified,
      onResend,
      onContinue,
      continueLabel = "Continue",
      onRememberDevice,
      autoFocus = false,
      className,
    },
    ref,
  ) {
    const length = Math.max(3, Math.min(8, Math.round(lengthProp)));
    const still = !!useReducedMotion();
    const id = React.useId();
    const root = React.useRef<HTMLDivElement>(null);
    React.useImperativeHandle(ref, () => root.current!);
    const input = React.useRef<HTMLInputElement>(null);
    const seen = useInView(root, { once: true, amount: 0.4 });

    const [value, setValue] = React.useState("");
    const [focused, setFocused] = React.useState(false);
    const [status, setStatus] = React.useState<Status>("idle");
    const [error, setError] = React.useState<string | null>(null);
    const shake = useAnimationControls();
    // Appearance: the card rises in, then its pieces follow one after another.
    const appear = seen || still;
    const enter = (delay: number) => ({
      initial: still
        ? (false as const)
        : { opacity: 0, y: 10, filter: "blur(4px)" },
      animate: appear ? { opacity: 1, y: 0, filter: "blur(0px)" } : undefined,
      transition: { duration: 0.45, ease: GLIDE, delay: still ? 0 : delay },
    });
    // The card's height follows its content, so the switch to the taller confirmation glides.
    const stack = React.useRef<HTMLDivElement>(null);
    const [height, setHeight] = React.useState<number | "auto">("auto");
    React.useEffect(() => {
      const el = stack.current;
      if (!el || typeof ResizeObserver === "undefined") return;
      const ro = new ResizeObserver(() => setHeight(el.offsetHeight));
      ro.observe(el);
      return () => ro.disconnect();
    }, []);
    const entry = React.useRef<HTMLDivElement>(null);
    const [verifiedAt, setVerifiedAt] = React.useState<Date | null>(null);
    React.useEffect(() => {
      if (entry.current) entry.current.inert = status === "success";
    }, [status]);

    // A new length starts over.
    React.useEffect(() => {
      setValue("");
      setStatus("idle");
      setError(null);
    }, [length]);

    React.useEffect(() => {
      if (seen && autoFocus) input.current?.focus({ preventScroll: true });
    }, [seen, autoFocus]);

    const check = React.useCallback(
      async (code: string) => {
        setStatus("checking");
        setError(null);
        let ok = false;
        try {
          if (verify) {
            const [res] = await Promise.all([
              verify(code),
              wait(still ? 0 : 600),
            ]);
            ok = res;
          } else {
            await wait(900);
            ok = true;
          }
        } catch {
          ok = false;
        }
        if (ok) {
          setStatus("success");
          input.current?.blur();
          onVerified?.(code);
          return;
        }
        setStatus("error");
        setError("That code didn't match. Try again.");
        if (!still)
          void shake.start({
            x: [0, -9, 9, -6, 6, -3, 0],
            transition: { duration: 0.5 },
          });
        // Let the red read, then clear for the next try.
        await wait(still ? 300 : 1100);
        setValue("");
        setStatus("idle");
        input.current?.focus({ preventScroll: true });
      },
      [verify, onVerified, still, shake],
    );

    const onChange = (raw: string) => {
      if (status === "checking" || status === "success") return;
      const next = raw.replace(/\D/g, "").slice(0, length);
      setValue(next);
      if (status === "error") setStatus("idle");
      if (next.length === length) void check(next);
    };

    // Resend countdown.
    const [left, setLeft] = React.useState(resendAfter);
    const [spin, setSpin] = React.useState(false);
    const [sent, setSent] = React.useState(false);
    React.useEffect(() => setLeft(resendAfter), [resendAfter]);
    React.useEffect(() => {
      if (!seen || left <= 0 || status === "success") return;
      const t = window.setTimeout(() => setLeft((s) => s - 1), 1000);
      return () => window.clearTimeout(t);
    }, [left, seen, status]);
    const resend = async () => {
      setSpin(true);
      try {
        if (onResend) await onResend();
        else await wait(700);
        setSent(true);
        setValue("");
        setError(null);
        setStatus("idle");
        setLeft(resendAfter);
        input.current?.focus({ preventScroll: true });
        window.setTimeout(() => setSent(false), 2200);
      } finally {
        setSpin(false);
      }
    };

    const shown =
      destination ??
      (channel === "email" ? "jordan@lumen.app" : "+1 415 555 0182");
    const where = maskDestination
      ? channel === "email"
        ? maskEmail(shown)
        : maskPhone(shown)
      : shown;

    const first = split && length >= 4 ? Math.ceil(length / 2) : length;
    const chars = Array.from({ length }, (_, i) => value[i] ?? "");
    const activeIndex =
      focused && status === "idle" ? Math.min(value.length, length - 1) : -1;

    const title = channel === "email" ? "Check your email" : "Check your phone";
    const sub = `We sent ${length === 8 ? "an" : "a"} ${length} digit code to`;
    const done = status === "success";
    const HeadIcon = channel === "email" ? MailCheckIcon : SmartphoneNfcIcon;
    const mm = Math.floor(Math.max(0, left) / 60);
    const ss = String(Math.max(0, left) % 60).padStart(2, "0");

    return (
      <motion.div
        ref={root}
        initial={
          still
            ? false
            : { opacity: 0, y: 20, scale: 0.98, filter: "blur(6px)" }
        }
        animate={
          seen || still
            ? { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }
            : undefined
        }
        transition={{ duration: 0.6, ease: GLIDE }}
        className={cn(
          "relative w-[380px] max-w-full overflow-hidden rounded-[32px] bg-white text-[#242423] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_12px_32px_-16px_rgba(0,0,0,0.18)]",
          className,
        )}
      >
        {/* Both views share one grid cell; the card eases to whichever is taller. */}
        <motion.div
          initial={false}
          animate={{ height }}
          transition={still ? { duration: 0 } : { duration: 0.45, ease: GLIDE }}
        >
          <div ref={stack} className="grid">
            {/* Code entry. Once the code passes, the boxes go green for a beat and
            this whole view softens away for the confirmation. */}
            <motion.div
              ref={entry}
              aria-hidden={done || undefined}
              animate={
                done
                  ? {
                      opacity: 0,
                      scale: still ? 1 : 0.97,
                      filter: still ? "blur(0px)" : "blur(6px)",
                    }
                  : { opacity: 1, scale: 1, filter: "blur(0px)" }
              }
              transition={{
                duration: still ? 0 : 0.35,
                ease: GLIDE,
                delay: done && !still ? 0.45 : 0,
              }}
              className="col-start-1 row-start-1 p-6"
            >
              {/* Header */}
              <div className="flex flex-col items-center text-center">
                <motion.span
                  initial={
                    still ? false : { scale: 0.5, opacity: 0, rotate: -12 }
                  }
                  animate={
                    appear ? { scale: 1, opacity: 1, rotate: 0 } : undefined
                  }
                  transition={{
                    type: "spring",
                    stiffness: 420,
                    damping: 18,
                    delay: still ? 0 : 0.1,
                  }}
                  className="grid size-14 place-items-center rounded-2xl bg-[#242423]/[0.05] text-[#242423]"
                >
                  <HeadIcon
                    className="size-6"
                    active={seen && status === "idle" && value.length === 0}
                  />
                </motion.span>
                <motion.h3
                  {...enter(0.18)}
                  className="mt-5 text-2xl font-semibold tracking-tight"
                >
                  <Roll>{title}</Roll>
                </motion.h3>
                <motion.p
                  {...enter(0.25)}
                  id={`${id}-sub`}
                  className="mt-1.5 text-sm leading-relaxed text-zinc-500"
                >
                  <Roll>{sub}</Roll>
                  <br />
                  <span className="font-medium text-[#242423]">{where}</span>
                </motion.p>
              </div>

              {/* Code boxes: one real input under them handles typing, paste and autofill. */}
              <motion.div
                animate={shake}
                className="relative mt-7"
                onPointerDown={(e) => {
                  e.preventDefault();
                  input.current?.focus();
                }}
              >
                <input
                  ref={input}
                  id={`${id}-code`}
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]*"
                  maxLength={length}
                  disabled={status === "success"}
                  aria-label={`${length} digit verification code`}
                  aria-describedby={`${id}-sub${error ? ` ${id}-error` : ""}`}
                  aria-invalid={status === "error" || undefined}
                  className="absolute inset-0 z-10 size-full cursor-text opacity-0"
                  style={{ caretColor: "transparent" }}
                />
                <div
                  className="flex items-center justify-center gap-2"
                  aria-hidden
                >
                  {chars.slice(0, first).map((c, i) => (
                    <Box
                      key={i}
                      index={i}
                      char={c}
                      active={activeIndex === i}
                      status={status}
                      mask={mask}
                      still={still}
                      count={length}
                      shown={appear}
                    />
                  ))}
                  {first < length && (
                    <span className="mx-1 h-[2px] w-3 shrink-0 rounded-full bg-[#242423]/20" />
                  )}
                  {chars.slice(first).map((c, j) => {
                    const i = first + j;
                    return (
                      <Box
                        key={i}
                        index={i}
                        char={c}
                        active={activeIndex === i}
                        status={status}
                        mask={mask}
                        still={still}
                        count={length}
                        shown={appear}
                      />
                    );
                  })}
                </div>
              </motion.div>

              {/* Status line */}
              <div
                className="mt-4 flex h-5 items-center justify-center text-sm"
                aria-live="polite"
              >
                <AnimatePresence mode="popLayout" initial={false}>
                  {status === "checking" && (
                    <motion.span
                      key="checking"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      className="flex items-center gap-2 text-zinc-500"
                    >
                      <LoaderCircleIcon className="size-4" active />
                      Checking code
                    </motion.span>
                  )}
                  {error && status !== "checking" && (
                    <motion.span
                      key="error"
                      id={`${id}-error`}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      className="flex items-center gap-2"
                      style={{ color: BAD }}
                    >
                      <BadgeAlertIcon className="size-4" active />
                      {error}
                    </motion.span>
                  )}
                  {status === "success" && (
                    <motion.span
                      key="ok"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2 font-medium"
                      style={{ color: GOOD }}
                    >
                      Code accepted
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>

              {/* Resend */}
              <motion.div
                {...enter(0.35 + length * 0.05)}
                className="-mx-6 mt-5 flex items-center justify-center border-t border-[#242423]/[0.07] px-6 pt-5 text-sm text-zinc-500"
              >
                <AnimatePresence mode="popLayout" initial={false}>
                  {sent ? (
                    <motion.span
                      key="sent"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      className="flex items-center gap-1.5 font-medium"
                      style={{ color: GOOD }}
                    >
                      <CircleCheckIcon className="size-4" active />
                      New code sent
                    </motion.span>
                  ) : left > 0 ? (
                    <motion.span
                      key="wait"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                    >
                      Didn't get it? Resend in{" "}
                      <span className="font-medium tabular-nums text-[#242423]">
                        {mm}:{ss}
                      </span>
                    </motion.span>
                  ) : (
                    <motion.span
                      key="resend"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      className="flex items-center gap-1"
                    >
                      Didn't get it?
                      <motion.button
                        type="button"
                        onClick={resend}
                        disabled={spin}
                        whileTap={still ? undefined : { scale: 0.95 }}
                        className="flex cursor-pointer items-center gap-1.5 rounded-full px-2 py-1 font-medium text-[#242423] outline-none transition-colors hover:bg-[#242423]/[0.05] disabled:cursor-wait focus-visible:ring-2 focus-visible:ring-zinc-400"
                      >
                        <RefreshCWIcon
                          className="size-3.5"
                          active={spin || undefined}
                        />
                        Resend code
                      </motion.button>
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>
            </motion.div>

            <AnimatePresence>
              {done && (
                <Confirmation
                  key="done"
                  channel={channel}
                  where={where}
                  at={verifiedAt}
                  continueLabel={continueLabel}
                  onContinue={onContinue}
                  onRemember={onRememberDevice}
                  still={still}
                />
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    );
  },
);

