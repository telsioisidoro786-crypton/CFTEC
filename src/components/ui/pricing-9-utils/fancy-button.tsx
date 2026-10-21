"use client"

import * as React from "react"
import { motion } from "motion/react"

import { cn } from "../../../lib/utils"

/**
 * FancyButton — CTA animado do módulo de pricing (brilho que passa + micro-escala).
 * Comportamento de button nativo; herda todos os atributos de botão.
 */
export function FancyButton({
  className,
  children,
  size = "default",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { size?: "sm" | "default" | "lg" }) {
  const sizeCls = size === "lg" ? "h-12 px-8 text-base" : size === "sm" ? "h-8 px-4 text-xs" : "h-11 px-6"
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      className={cn(
        "group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60",
        sizeCls,
        className,
      )}
      {...(props as React.ComponentProps<typeof motion.button>)}
    >
      <span className="relative z-10 inline-flex items-center gap-2">{children}</span>
      <motion.span
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(110deg,transparent_35%,rgba(255,255,255,0.35)_50%,transparent_65%)]"
        style={{ mixBlendMode: "overlay" }}
        initial={{ x: "-130%" }}
        animate={{ x: ["-130%", "130%"] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut", repeatDelay: 1.4 }}
      />
    </motion.button>
  )
}
export default FancyButton
