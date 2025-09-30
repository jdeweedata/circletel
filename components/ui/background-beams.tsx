"use client";
import React, { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils/aceternity";

export const BackgroundBeams = ({ className }: { className?: string }) => {
  const beams = Array.from({ length: 6 }, (_, i) => ({
    id: i,
    initialX: Math.random() * 400,
    delay: Math.random() * 2,
    duration: Math.random() * 2 + 3,
  }));

  return (
    <div
      className={cn(
        "absolute inset-0 flex items-center justify-center bg-white dark:bg-black [mask-image:radial-gradient(350px_200px_at_top,transparent_20%,white)]",
        className
      )}
    >
      {beams.map((beam) => (
        <motion.div
          key={beam.id}
          className="absolute inset-x-0 top-0 bg-gradient-to-r from-transparent via-circleTel-orange/40 to-transparent h-[2px] w-1/4 blur-sm"
          style={{
            left: `${beam.initialX}px`,
          }}
          animate={{
            x: [-200, 1200],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: beam.duration,
            repeat: Infinity,
            delay: beam.delay,
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
};

export default BackgroundBeams;