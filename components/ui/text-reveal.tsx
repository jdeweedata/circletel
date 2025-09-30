"use client";
import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils/aceternity";

export const TextReveal = ({
  text,
  className,
}: {
  text: string;
  className?: string;
}) => {
  const words = text.split(" ");

  return (
    <div className={cn("font-bold", className)}>
      {words.map((word, idx) => (
        <motion.span
          key={idx}
          className="inline-block mr-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.5,
            delay: idx * 0.1,
            ease: "easeOut",
          }}
        >
          {word}
        </motion.span>
      ))}
    </div>
  );
};

export const TypewriterEffect = ({
  words,
  className,
  cursorClassName,
}: {
  words: Array<{
    text: string;
    className?: string;
  }>;
  className?: string;
  cursorClassName?: string;
}) => {
  return (
    <div className={cn("text-base sm:text-xl md:text-3xl lg:text-5xl font-bold text-center", className)}>
      {words.map((word, idx) => (
        <div key={`word-${idx}`} className="inline">
          {word.text.split("").map((char, index) => (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{
                duration: 0.25,
                delay: idx * 1 + index * 0.05,
              }}
              className={cn("dark:text-white text-black", word.className)}
              key={`char-${index}`}
            >
              {char}
            </motion.span>
          ))}
          &nbsp;
        </div>
      ))}
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{
          duration: 0.8,
          repeat: Infinity,
          repeatType: "reverse",
        }}
        className={cn("block rounded-sm w-[4px] h-4 md:h-6 lg:h-10 bg-blue-500", cursorClassName)}
      />
    </div>
  );
};

export default TextReveal;