import { motion } from "framer-motion";
import { type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface GlowButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg" | "xl";
  active?: boolean;
}

export function GlowButton({ 
  children, 
  className, 
  variant = "primary", 
  size = "md", 
  active = false,
  disabled,
  ...props 
}: GlowButtonProps) {
  
  const variants = {
    primary: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_20px_-5px_hsl(var(--primary)/0.5)]",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-[0_0_20px_-5px_hsl(var(--secondary)/0.5)]",
    danger: "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-[0_0_20px_-5px_hsl(var(--destructive)/0.5)]",
    ghost: "bg-white/5 text-white hover:bg-white/10 backdrop-blur-sm border border-white/10",
  };

  const sizes = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg",
    xl: "px-10 py-6 text-xl font-black tracking-wide",
  };

  return (
    <motion.button
      whileHover={!disabled ? { scale: 1.02, y: -2 } : {}}
      whileTap={!disabled ? { scale: 0.96 } : {}}
      className={cn(
        "rounded-xl font-bold transition-all duration-200 relative overflow-hidden",
        variants[variant],
        sizes[size],
        active && "ring-2 ring-white ring-offset-2 ring-offset-background",
        disabled && "opacity-50 cursor-not-allowed transform-none shadow-none",
        className
      )}
      disabled={disabled}
      {...props}
    >
      {active && (
        <motion.div 
          layoutId={`active-glow-${variant}`}
          className="absolute inset-0 bg-white/20" 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        />
      )}
      <span className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </span>
    </motion.button>
  );
}
