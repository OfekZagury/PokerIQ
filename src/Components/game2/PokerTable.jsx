
import React from 'react';
import PlayerAvatar from './PlayerAvatar';
import PlayingCard from '../shared/PlayingCard';
import { motion, AnimatePresence } from "framer-motion";

export default function PokerTable({ players, pot, communityCards, narration, dealerPosition }) {
  const tableWidth = 600;
  const tableHeight = 350;

  const playerPositions = [
    { position: 'BTN', x: tableWidth / 2 - 56, y: tableHeight }, // Bottom center
    { position: 'CO', x: tableWidth - 112, y: tableHeight / 2 + 30 }, // Right middle
    { position: 'MP', x: tableWidth - 112, y: tableHeight / 2 - 120 }, // Right top
    { position: 'UTG', x: tableWidth / 2 - 56, y: -90 }, // Top center
    { position: 'BB', x: 0, y: tableHeight / 2 - 120 }, // Left top
    { position: 'SB', x: 0, y: tableHeight / 2 + 30 }, // Left middle
  ];

  const getPositionCoords = (pos) => {
    const positionData = playerPositions.find(p => p.position === pos);
    return positionData || { x: 0, y: 0 };
  };

  return (
    <div className="relative flex justify-center items-center h-[500px] w-full">
      <div className="relative" style={{ width: `${tableWidth}px`, height: `${tableHeight}px` }}>
        {/* Table Ellipse */}
        <div className="absolute inset-0 bg-green-900 rounded-full border-8 border-yellow-800/50 shadow-2xl">
          <div className="absolute inset-2 border-2 border-green-700/50 rounded-full"></div>
        </div>

        {/* Players */}
        {players.map(player => (
          <PlayerAvatar
            key={player.position}
            player={{ ...player, ...getPositionCoords(player.position) }}
            isDealer={player.position === dealerPosition}
            isHero={player.isHero}
          />
        ))}

        {/* Pot */}
        <AnimatePresence>
          {pot > 0 && (
            <motion.div
              className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
            >
              <div className="text-sm font-bold text-yellow-300">Pot</div>
              <div className="text-lg font-bold text-white">${pot}</div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Community Cards */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex gap-2">
          {communityCards.map((card, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20, rotate: 10 }}
              animate={{ opacity: 1, y: 0, rotate: 0 }}
              transition={{ delay: 0.5 + i * 0.1 }}
            >
              <PlayingCard card={card} className="w-8 h-12" />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Narration */}
      <AnimatePresence>
        {narration && (
           <motion.div
            key={narration}
            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[90%] md:w-[70%] bg-black/60 backdrop-blur-sm p-4 rounded-xl border border-yellow-400/30 text-center"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ duration: 0.4 }}
           >
             <p className="text-yellow-200 text-base">{narration}</p>
           </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
