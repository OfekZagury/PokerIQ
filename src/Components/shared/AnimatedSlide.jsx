import React from "react";
import { motion, AnimatePresence } from "framer-motion";

const slideVariants = {
  enter: (direction) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
    scale: 0.95
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1
  },
  exit: (direction) => ({
    x: direction < 0 ? 300 : -300,
    opacity: 0,
    scale: 0.95
  })
};

const textVariants = {
  hidden: {
    opacity: 0,
    y: 20
  },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.6,
      ease: "easeOut"
    }
  })
};

const containerVariants = {
  hidden: {
    opacity: 0
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2
    }
  }
};

export default function AnimatedSlide({
  children,
  direction = 0,
  className = "",
  staggerChildren = true
}) {
  return (
    <motion.div
      key={direction}
      custom={direction}
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{
        x: { type: "spring", stiffness: 300, damping: 30 },
        opacity: { duration: 0.6 },
        scale: { duration: 0.6 }
      }}
      className={className}
    >
      {staggerChildren ? (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {React.Children.map(children, (child, i) => (
            <motion.div
              key={i}
              variants={textVariants}
              custom={i}
            >
              {child}
            </motion.div>
          ))}
        </motion.div>
      ) : (
        children
      )}
    </motion.div>
  );
}

export { textVariants, containerVariants };