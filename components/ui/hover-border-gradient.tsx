"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils/aceternity";

export interface HoverBorderGradientProps {
  children: React.ReactNode;
  containerClassName?: string;
  className?: string;
  as?: React.ElementType;
  duration?: number;
  clockwise?: boolean;
}

export function HoverBorderGradient({
  children,
  containerClassName,
  className,
  as: Tag = "div",
  duration = 1,
  clockwise = true,
  ...props
}: HoverBorderGradientProps) {
  const [hovered, setHovered] = useState<boolean>(false);

  return (
    <Tag
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={cn(
        "relative flex rounded-full border content-center bg-black/20 hover:bg-black/10 transition duration-500 dark:bg-white/20 items-center flex-col flex-shrink-0 overflow-hidden",
        containerClassName
      )}
      {...props}
    >
      <div
        className={cn(
          "w-auto text-white z-10 bg-black px-4 py-2 rounded-[inherit]",
          className
        )}
      >
        {children}
      </div>
      <motion.div
        className={cn(
          "flex-shrink-0 rounded-full absolute inset-0 z-0 opacity-0",
          {
            "opacity-100": hovered,
          }
        )}
        style={{
          background: `conic-gradient(from 0deg, transparent, #F5831F, transparent 120deg)`,
        }}
        animate={{
          rotate: hovered ? (clockwise ? 360 : -360) : 0,
        }}
        transition={{
          duration: duration,
          ease: "linear",
          repeat: hovered ? Infinity : 0,
        }}
      />
      <div className="bg-black absolute z-1 flex-shrink-0 rounded-[inherit] inset-[2px]" />
    </Tag>
  );
}

export default HoverBorderGradient;