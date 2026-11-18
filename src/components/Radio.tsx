import { AnimatePresence, motion, useReducedMotion } from "motion/react";

// primary-700 and slate-300, as hex so Motion can blend between them.
const ON = "#0d5c4b";
const OFF = "#cbd5e1";

// The visual part of a radio. Put it inside the element that has role="radio" or wraps the input.
export default function Radio({ checked, size = "md", className = "" }: { checked: boolean; size?: "sm" | "md"; className?: string }) {
  const still = useReducedMotion();
  const box = size === "sm" ? "size-4" : "size-5";
  const dot = size === "sm" ? "size-1.5" : "size-2";
  return (
    <span aria-hidden="true" className={`relative grid shrink-0 place-items-center ${box} ${className}`}>
      <AnimatePresence>
        {checked && !still && (
          <motion.span
            key="ripple"
            className="absolute inset-0 rounded-full bg-primary-700"
            initial={{ scale: 1, opacity: 0.35 }}
            animate={{ scale: 2.2, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        )}
      </AnimatePresence>
      <motion.span
        className="absolute inset-0 rounded-full border-2"
        initial={false}
        animate={{
          borderColor: checked ? ON : OFF,
          backgroundColor: checked ? ON : "#ffffff",
          scale: checked && !still ? [1, 0.85, 1] : 1,
        }}
        transition={{ duration: still ? 0 : 0.25, ease: "easeOut" }}
      />
      <motion.span
        className={`relative rounded-full bg-white ${dot}`}
        initial={false}
        animate={{ scale: checked ? 1 : 0, opacity: checked ? 1 : 0 }}
        transition={still ? { duration: 0 } : { type: "spring", stiffness: 600, damping: 18 }}
      />
    </span>
  );
}
