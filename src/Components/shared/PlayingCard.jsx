import React from "react";
import { Heart, Diamond, Club, Spade } from "lucide-react";

const suitIcons = {
  '♠': Spade,
  '♣': Club,
  '♥': Heart,
  '♦': Diamond
};

const suitColors = {
  '♠': 'text-black',
  '♣': 'text-black',
  '♥': 'text-red-500',
  '♦': 'text-red-500'
};

export default function PlayingCard({ card, className = "", flipped = false, onClick }) {
  if (!card || flipped) {
    return (
      <div className={`w-5 h-9 bg-gradient-to-br from-red-800 to-red-900 rounded-md shadow-md border border-red-700 flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-70 ${className}`}
        onClick={onClick}>
        <div className="w-4 h-4 border border-white/30 rounded-full bg-white/10" />
      </div>
    );
  }

  // Parse card (e.g., "A♠", "K♥", "10♦")
  const suit = card.slice(-1);
  const rank = card.slice(0, -1);
  const SuitIcon = suitIcons[suit];
  const suitColor = suitColors[suit];

  return (
    <div
      className={`w-8 h-12 bg-white rounded-md shadow-lg border border-gray-200 flex flex-col items-center justify-between p-0.5 cursor-pointer transition-all duration-300 hover:scale-70 hover:shadow-xl ${className}`}
      onClick={onClick}>

      <div className={`text-[9px] font-bold ${suitColor} flex items-center gap-0.5 self-start`}>
        <span>{rank}</span>
        <SuitIcon className="w-2 h-2" fill="currentColor" />
      </div>

      <div className={`${suitColor} flex items-center justify-center`}>
        <SuitIcon className="w-4 h-4" fill="currentColor" />
      </div>

      <div className={`text-[9px] font-bold ${suitColor} flex items-center gap-0.5 rotate-180 self-start`}>
        <span>{rank}</span>
        <SuitIcon className="w-2 h-2" fill="currentColor" />
      </div>
    </div>);
}