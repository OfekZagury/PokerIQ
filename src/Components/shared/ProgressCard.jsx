import React from "react";
import { Check, Lock, Play } from "lucide-react";
import { motion } from "framer-motion";

export default function ProgressCard({
  gameNumber,
  title,
  description,
  isCompleted,
  isLocked,
  isCurrent,
  onClick
}) {
  return (
    <motion.div
      className={`
        relative p-4 rounded-lg border-2 transition-all duration-300 cursor-pointer
        ${isCurrent ? 'bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-400 shadow-lg' : ''}
        ${isCompleted ? 'bg-gradient-to-br from-green-50 to-green-100 border-green-400' : ''}
        ${isLocked ? 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-300 opacity-60' : ''}
        ${!isLocked && !isCompleted && !isCurrent ? 'bg-white border-gray-200 hover:border-green-400 hover:shadow-md' : ''}
      `}
      onClick={!isLocked ? onClick : undefined}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      whileHover={!isLocked ? {
        scale: 1.02,
        y: -3,
        boxShadow: "0 6px 15px rgba(0,0,0,0.1)"
      } : {}}
      whileTap={!isLocked ? { scale: 0.98 } : {}}
    >
      {/* Game Number Badge */}
      <motion.div
        className={`
          absolute -top-2 -left-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-lg
          ${isCompleted ? 'bg-green-600' : isCurrent ? 'bg-yellow-500' : isLocked ? 'bg-gray-400' : 'bg-green-700'}
        `}
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
      >
        {isCompleted ? <Check className="w-3 h-3" /> :
         isLocked ? <Lock className="w-3 h-3" /> :
         isCurrent ? <Play className="w-3 h-3" /> : gameNumber}
      </motion.div>

      <motion.div
        className="space-y-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.6 }}
      >
        <h3 className={`font-bold text-base ${isLocked ? 'text-gray-900' : 'text-black'}`}>
            <b>{title}</b>
        </h3>
        <p className={`text-xs ${isLocked ? 'text-gray-400' : 'text-gray-600'} line-clamp-2`}>
          {description}
        </p>

        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.7, duration: 0.5 }}
        >
          {isCurrent && (
            <div className="flex items-center gap-1 text-yellow-700 font-medium text-xs">
              <Play className="w-3 h-3" />
                <span><b>Ready to Play!</b></span>
            </div>
          )}

          {isCompleted && (
            <div className="flex items-center gap-1 text-green-700 font-medium text-xs">
              <Check className="w-3 h-3" />
              <span><b>Completed</b></span>
            </div>
          )}

          {isLocked && (
            <div className="flex items-center gap-1 text-gray-500 font-medium text-xs">
              <Lock className="w-3 h-3" />
              <span><b>Locked</b></span>
            </div>
          )}
        </motion.div>
      </motion.div>
    </motion.div>
  );
}