import React from "react";
import { Button } from "@/components/ui/button";
import { Spade, Heart, Diamond, Club, ArrowRight } from "lucide-react";
import PlayingCard from "../shared/PlayingCard";

export default function Welcome({ onLogin }) {
  return (
    <div className="relative min-h-[80vh] flex items-center justify-center overflow-hidden py-12 px-4">
      {/* Background Cards */}
      <div className="absolute inset-0 opacity-10">
        <PlayingCard card="A♠" className="absolute top-10 left-10 w-24 h-32 transform -rotate-12" />
        <PlayingCard card="K♥" className="absolute top-1/2 right-20 w-20 h-28 transform rotate-12" />
        <PlayingCard card="Q♦" className="absolute bottom-10 left-1/4 w-16 h-24 transform rotate-6" />
        <PlayingCard card="J♣" className="absolute bottom-1/2 left-1/2 w-28 h-40 transform -rotate-6" />
        <PlayingCard card="10♠" className="absolute top-20 right-1/4 w-24 h-32 transform rotate-20" />
      </div>

      <div className="relative z-10 text-center max-w-3xl mx-auto">
        <div className="bg-black/40 backdrop-blur-xl rounded-2xl p-8 md:p-12 border-2 border-yellow-400/30 shadow-2xl">
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center shadow-xl">
              <Spade className="w-8 h-8 text-black" />
            </div>
            <div>
              <h1 className="text-4xl md:text-6xl font-bold text-white mb-2 tracking-tight">
                Poker IQ
              </h1>
              <p className="text-xl text-green-300">
                Master poker through daily challenges.
              </p>
            </div>
          </div>

          <p className="text-lg text-green-200 mb-8 leading-relaxed">
            Welcome to your personal poker coach. Poker IQ is designed to elevate your game through a series of structured, daily mini-games. Each lesson builds on the last, solidifying your understanding of core concepts from hand rankings to advanced odds calculation.
          </p>

          <Button
            onClick={onLogin}
            className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-10 py-6 text-xl rounded-full shadow-lg transition-transform hover:scale-105"
          >
            Start Your Poker Journey
            <ArrowRight className="ml-3 w-6 h-6" />
          </Button>
        </div>

        <div className="mt-8 flex items-center justify-center gap-4 text-green-300">
          <Heart className="w-5 h-5" />
          <Diamond className="w-5 h-5" />
          <Club className="w-5 h-5" />
          <Spade className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}