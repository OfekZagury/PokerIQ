import React from 'react';
import { User, Bot } from 'lucide-react';
import PlayingCard from '../shared/PlayingCard';
import { motion } from 'framer-motion';

export default function PlayerAvatar({ player, isDealer, isHero }) {
  const { position, stack, bet, cards, status, isCurrent, isWinner } = player;

  const statusColors = {
    'Folds': 'text-red-400',
    'Checks': 'text-gray-400',
    'Calls': 'text-blue-300',
    'Bets': 'text-green-300',
    'Raises': 'text-yellow-300',
  };

  return (
    <motion.div
      className="absolute"
      style={{ top: player.y, left: player.x }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.2 }}
    >
      <div className={`relative w-28 h-32 flex flex-col items-center justify-center transition-all duration-300 rounded-xl ${isCurrent ? 'bg-yellow-500/20 border-2 border-yellow-400 shadow-lg' : 'bg-black/20 border border-gray-700'}`}>



        {isDealer && (
          <div className="absolute -top-3 -right-3 w-6 h-6 bg-white text-black rounded-full flex items-center justify-center font-bold text-sm shadow-md">D</div>
        )}

        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-950/50 mb-1 border border-green-700">
          {isHero ? <User className="w-6 h-6 text-yellow-400" /> : <Bot className="w-6 h-6 text-gray-400" />}
        </div>

        <div className="text-center">
          <p className="font-bold text-white text-sm">{position}</p>
          {status && (
          <motion.div
            className="absolute top-0 -translate-y-full w-full text-center pb-1"
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
          >
            <p className={`font-semibold text-sm ${statusColors[status.split(' ')[0]] || 'text-white'}`}>{status}</p>
          </motion.div>
        )}
          <p className="text-yellow-400 text-xs">${stack}</p>
        </div>

        {cards && cards.length > 0 && (
          <div className="absolute -bottom-4 flex gap-1">
            {cards.map((card, i) => <PlayingCard key={i} card={card} className="w-8 h-12" />)}
          </div>
        )}



        {bet > 0 && (
          <motion.div
            className="absolute -top-8 text-center"
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
          >
            <div className="text-white text-xs bg-black/50 px-2 py-1 rounded-full">${bet}</div>
          </motion.div>
        )}

      </div>
    </motion.div>
  );
}