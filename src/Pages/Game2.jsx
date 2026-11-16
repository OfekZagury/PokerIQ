
import React, { useState, useEffect, useCallback } from "react";
import { UserService as User } from "@/services/user";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, ArrowRight, Trophy, CheckCircle, DollarSign, Users, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import PlayingCard from "../components/shared/PlayingCard";
import PokerTable from "../components/game2/PokerTable";
import { motion, AnimatePresence } from "framer-motion";
import { track } from "@/lib/analytics";
import useActiveStopwatch from "@/hooks/useActiveStopwatch";

// Animation variants
const slideVariants = {
  enter: (direction) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
    scale: 0.95
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.6,
      ease: "easeOut"
    }
  },
  exit: (direction) => ({
    x: direction < 0 ? 300 : -300,
    opacity: 0,
    scale: 0.95,
    transition: {
      duration: 0.4,
      ease: "easeIn"
    }
  })
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut"
    }
  }
};

const explanationSlides = [
  {
    title: "Part A: Pot Seeding (Blinds & Antes)",
    content: "In poker, a pot is formed by bets made during a hand. To initiate action and seed the pot, most games require ante or blind bets before any cards are dealt. An ante is a token sum contributed by each player."
  },
  {
    title: "Part A: Pot Seeding - Blindes",
    content: "Blind bets, common in games like Texas Hold'em, are forced bets placed by two players to the dealer's left, rotating each hand. These initial contributions ensure there's always a monetary target for players. One player will play the Small blind, and a different player, the one sitting next to him (from his left) will be the Big blind",
    example: "If the game has a big blind of $5, the pot begins with at least $7.5, since small blind pays half the Big Blind"
  },
  {
    title: "Part B: Betting Actions",
    content: "During each betting round, players decide what to do. If no one has bet, a player can check (bet zero dollars), which allows them to stay in the hand and act later, or make the opening bet. If a bet has already been made, subsequent players must fold (fold their hand), call (match the current bet), or raise (increase the bet). Checkraising involves checking first and then raising a subsequent bet.",
    example: "If an opponent bets $10, you can call for $10, or raise to $20, or Fold. However, you can not check (since a bet has been made)"
  },
  {
    title: "Part C: Hand Progression & Pot Growth",
    content: "A poker hand progresses through successive rounds of cards being dealt and players making betting actions. The pot grows steadily with each bet. Winning a hand occurs in one of two ways: either all opponents fold (giving up their hands), making the pot the property of the last remaining player, or by revealing the best hand (five cards) at showdown after all betting rounds have been completed. Saving money by folding a bad hand is just as important as winning money.",
    example: "If three players each bet $5 during a round, the pot grows by $15."
  }
];

const stage1DemoSteps = [
  {
    narration: "Before any cards are dealt, initial contributions are made to 'seed' the pot. Here, the small blind of $1 and the big blind of $2 are posted.",
    players: [
      { position: 'SB', stack: 99, bet: 1, status: 'Posts SB $1' },
      { position: 'BB', stack: 98, bet: 2, status: 'Posts BB $2' },
      { position: 'UTG', stack: 100, bet: 0 },
      { position: 'MP', stack: 100, bet: 0 },
      { position: 'CO', stack: 100, bet: 0 },
      { position: 'BTN', stack: 100, bet: 0, isHero: true },
    ],
    pot: 3,
    communityCards: []
  },
  {
    narration: "Two private cards are dealt face down to each player.",
    players: [
      { position: 'SB', stack: 99, bet: 1, cards: ['',''] },
      { position: 'BB', stack: 98, bet: 2, cards: ['',''] },
      { position: 'UTG', stack: 100, bet: 0, cards: ['',''], isCurrent: true },
      { position: 'MP', stack: 100, bet: 0, cards: ['',''] },
      { position: 'CO', stack: 100, bet: 0, cards: ['',''] },
      { position: 'BTN', stack: 100, cards: ['A♠', 'K♠'], isHero: true },
    ],
    pot: 3,
    communityCards: []
  },
  {
    narration: "Player A (UTG) matches the big blind, so $2 is added to the pot. The pot is now $5.",
    players: [
      { position: 'SB', stack: 99, bet: 1, cards: ['',''] },
      { position: 'BB', stack: 98, bet: 2, cards: ['',''] },
      { position: 'UTG', stack: 98, bet: 2, status: 'Calls $2', cards: ['',''] },
      { position: 'MP', stack: 100, bet: 0, cards: ['',''], isCurrent: true },
      { position: 'CO', stack: 100, bet: 0, cards: ['',''] },
      { position: 'BTN', stack: 100, cards: ['A♠', 'K♠'], isHero: true },
    ],
    pot: 5,
    communityCards: []
  },
  {
    narration: "Player B (MP) not only matches the previous bet but increases the wager to $4. The pot is now $9.",
    players: [
      { position: 'SB', stack: 99, bet: 1, cards: ['',''] },
      { position: 'BB', stack: 98, bet: 2, cards: ['',''] },
      { position: 'UTG', stack: 98, bet: 2, cards: ['',''] },
      { position: 'MP', stack: 96, bet: 4, status: 'Raises to $4', cards: ['',''] },
      { position: 'CO', stack: 100, bet: 0, cards: ['',''], isCurrent: true },
      { position: 'BTN', stack: 100, bet: 0, cards: ['A♠', 'K♠'], isHero: true },
    ],
    pot: 9,
    communityCards: []
  },
  {
    narration: "Player C (CO) gives up their hand and adds no more money to the pot.",
    players: [
      { position: 'SB', stack: 99, bet: 1, cards: ['',''] },
      { position: 'BB', stack: 98, bet: 2, cards: ['',''] },
      { position: 'UTG', stack: 98, bet: 2, cards: ['',''] },
      { position: 'MP', stack: 96, bet: 4, cards: ['',''] },
      { position: 'CO', stack: 100, bet: 0, status: 'Folds', cards: ['',''] },
      { position: 'BTN', stack: 100, bet: 0, cards: ['A♠', 'K♠'], isHero: true, isCurrent: true },
    ],
    pot: 9,
    communityCards: []
  },
  {
    narration: "The flop reveals three communal cards, available to all players. Note: SB, BB, CO folded in the pre-flop round.",
    players: [
      // Reset bets for new round, but keep stacks
      { position: 'SB', stack: 99, bet: 0, status: 'Folded' },
      { position: 'BB', stack: 98, bet: 0, status: 'Folded' },
      { position: 'UTG', stack: 98, bet: 0, isCurrent: true },
      { position: 'MP', stack: 96, bet: 0 },
      { position: 'CO', stack: 100, bet: 0, status: 'Folded' },
      { position: 'BTN', stack: 100, bet: 0, cards: ['A♠', 'K♠'], isHero: true },
    ],
    pot: 9,
    communityCards: ['Q♠', 'J♥', '2♦']
  },
  {
    narration: "Player A (UTG) checks, remaining in the hand without wagering.",
    players: [
        { position: 'SB', stack: 99, bet: 0, status: 'Folded' },
        { position: 'BB', stack: 98, bet: 0, status: 'Folded' },
        { position: 'UTG', stack: 98, bet: 0, status: 'Checks' },
        { position: 'MP', stack: 96, bet: 0, isCurrent: true },
        { position: 'CO', stack: 100, bet: 0, status: 'Folded' },
        { position: 'BTN', stack: 100, bet: 0, cards: ['A♠', 'K♠'], isHero: true },
    ],
    pot: 9,
    communityCards: ['Q♠', 'J♥', '2♦']
  },
  {
    narration: "Player B (MP) makes the opening bet for this round, adding $5 to the pot. The pot is now $14.",
    players: [
        { position: 'SB', stack: 99, bet: 0, status: 'Folded' },
        { position: 'BB', stack: 98, bet: 0, status: 'Folded' },
        { position: 'UTG', stack: 98, bet: 0, status: 'Checks' },
        { position: 'MP', stack: 91, bet: 5, status: 'Bets $5' },
        { position: 'CO', stack: 100, bet: 0, status: 'Folded' },
        { position: 'BTN', stack: 100, bet: 0, cards: ['A♠', 'K♠'], isHero: true, isCurrent: true },
    ],
    pot: 14,
    communityCards: ['Q♠', 'J♥', '2♦']
  },
  {
    narration: "Player A (UTG) calls, matching Player B's bet. Another $5 is added. The pot is now $19.",
    players: [
        { position: 'SB', stack: 99, bet: 0, status: 'Folded' },
        { position: 'BB', stack: 98, bet: 0, status: 'Folded' },
        { position: 'UTG', stack: 93, bet: 5, status: 'Calls $5' },
        { position: 'MP', stack: 91, bet: 5 },
        { position: 'CO', stack: 100, bet: 0, status: 'Folded' },
        { position: 'BTN', stack: 100, bet: 0, cards: ['A♠', 'K♠'], isHero: true, isCurrent: true },
    ],
    pot: 19,
    communityCards: ['Q♠', 'J♥', '2♦']
  },
  {
    narration: "The hand progresses to the next round with a pot of $19. Now the action would be on the small blind, if they were still in the hand.",
    players: [
        { position: 'SB', stack: 99, status: 'Folded' },
        { position: 'BB', stack: 98, status: 'Folded' },
        { position: 'UTG', stack: 93 },
        { position: 'MP', stack: 91 },
        { position: 'CO', stack: 100, status: 'Folded' },
        { position: 'BTN', stack: 100, cards: ['A♠', 'K♠'], isHero: true },
    ],
    pot: 19,
    communityCards: ['Q♠', 'J♥', '2♦']
  }
];

const stage2Scenarios = [
  {
    title: "Scenario 1: Betting Actions",
    question: "Given that a bet has already been made, which of the following actions are you unable to perform? (choose all the correct answers)",
    options: ["Fold", "Call", "Raise", "Check", "Bet"],
    correct: [3, 4], // Check and Bet
    isMultiple: true,
    hint: "If a bet has already been made, you cannot 'check' or make an 'opening bet'. You must match, raise, or fold.",
    feedback: "If a bet has been made, you can only Fold, Call, or Raise. You cannot Check or make a new opening Bet."
  },
  {
    title: "Scenario 2: Pot Growth",
    question: "The pot currently contains $20. Two players each bet $5, and one player then raises by an additional $5. The remaining two players call the total bet of $10. What is the new total size of the pot after all these actions?",
    options: ["$20", "$50", "$45", "$66", "$80"],
    correct: [1], // Index of $50
    isMultiple: false,
    hint: "Carefully sum all the money added to the pot. An initial bet of $5, then a raise of $5 more (so $10 total for that player's action), and then two players matching that $10. Calculate each contribution and add it to the starting pot.",
    feedback: "The pot is $50 (Initial $20 + $5 (player 1 bet) + $5 (player 2 bet) + $5 (player 3 raise, already $5 bet, total $10) + $5 (player 1 call) + $5 (player 2 call) = $50)."
  }
];

const independentPracticeScenarios = [
  {
    title: "1. Pre-Flop",
    question: "It's pre-flop. The blinds are $2/$4. You are the big blind. Player A raises to $10. Which of the following actions can you NOT execute?",
    options: ["Fold", "Call $6", "Raise to $16", "Check"],
    correct: 3,
    feedback: "You cannot check when facing a raise. You must either fold, call the $10 bet (which costs you $6 more since you already have $4 in), or re-raise."
  },
  {
    title: "2. Flop",
    question: "The flop is dealt. The pot is now $25. It's your turn, and no one has bet yet. Which of the following actions can you NOT execute?",
    options: ["Check", "Bet $5", "Fold", "Bet $10"],
    correct: 2,
    feedback: "You cannot fold when there is no bet to you. Since you can check for free to see the next card, folding has no strategic benefit."
  },
  {
    title: "3. Turn",
    question: "The turn card is dealt. The pot is now $40. Player X bets $10. Which of the following actions can you NOT execute?",
    options: ["Fold", "Call $10", "Raise to $20", "Check"],
    correct: 3,
    feedback: "Just like pre-flop, you cannot check when facing a bet. Your options are to fold, call, or raise."
  }
];

const finalChallengeScenarios = [
  {
    title: "1. Pre-Flop",
    question: "The blinds are $3/$6. You are the big blind. Player A raises to $20. Which of the following actions can you NOT execute?",
    options: ["Fold", "Call $14", "Raise to $40", "Check"],
    correct: 3,
    feedback: "Facing a raise, checking is not an option.",
    table: {
      players: [
        { position: 'SB', stack: 397, bet: 3, status: 'Posts SB $3' },
        { position: 'BB', stack: 394, bet: 6, isHero: true, isCurrent: true, cards: ['A♦', 'K♥'] },
        { position: 'UTG', stack: 400, status: 'Folds' },
        { position: 'MP', stack: 400, status: 'Folds' },
        { position: 'CO', stack: 400, status: 'Folds' },
        { position: 'BTN', stack: 380, bet: 20, status: 'Raises to $20' },
      ],
      pot: 29,
      communityCards: []
    }
  },
  {
    title: "2. Flop",
    question: "The flop is dealt. The pot is now $43. It's your turn, and no one has bet yet. Which of the following actions can you NOT execute?",
    options: ["Check", "Bet $5", "Fold", "Bet $15"],
    correct: 2,
    feedback: "When no one has bet, you can check for free. Folding is not a valid or logical action.",
    table: {
      players: [
        { position: 'SB', stack: 397, status: 'Folded' },
        { position: 'BB', stack: 380, isHero: true, isCurrent: true, cards: ['A♦', 'K♥'] },
        { position: 'UTG', stack: 400, status: 'Folds' },
        { position: 'MP', stack: 400, status: 'Folds' },
        { position: 'CO', stack: 400, status: 'Folds' },
        { position: 'BTN', stack: 380, },
      ],
      pot: 43,
      communityCards: ['A♠', '10♦', '2♣']
    }
  },
  {
    title: "3. Turn",
    question: "The turn card is dealt. The pot is now $93. Player A bets $30. Which of the following actions can you NOT execute?",
    options: ["Fold", "Call $30", "Raise to $70", "Check"],
    correct: 3,
    feedback: "Facing a $30 bet, you cannot check.",
    table: {
       players: [
        { position: 'SB', stack: 397, status: 'Folded' },
        { position: 'BB', stack: 350, isHero: true, isCurrent: true, cards: ['A♦', 'K♥'] },
        { position: 'UTG', stack: 400, status: 'Folds' },
        { position: 'MP', stack: 400, status: 'Folds' },
        { position: 'CO', stack: 400, status: 'Folds' },
        { position: 'BTN', stack: 350, bet: 30, status: 'Bets $30'},
      ],
      pot: 123,
      communityCards: ['A♠', '10♦', '2♣', '7♠']
    }
  },
  {
    title: "4. River",
    question: "The river card is dealt. The pot is now $153. You are first to act. Which of the following actions can you NOT execute?",
    options: ["Check", "Bet $30", "Bet $60", "Call $30"],
    correct: 3,
    feedback: "You are first to act, so there is no bet to 'call'.",
    table: {
      players: [
        { position: 'SB', stack: 397, status: 'Folded' },
        { position: 'BB', stack: 320, isHero: true, isCurrent: true, cards: ['A♦', 'K♥'] },
        { position: 'UTG', stack: 400, status: 'Folds' },
        { position: 'MP', stack: 400, status: 'Folds' },
        { position: 'CO', stack: 400, status: 'Folds' },
        { position: 'BTN', stack: 320 },
      ],
      pot: 153,
      communityCards: ['A♠', '10♦', '2♣', '7♠', 'K♣']
    }
  },
  {
    title: "5. All-In Scenario",
    question: "After your river bet of $60, Player A shoves all-in for $200 total. The pot is now $353 before your decision. Which of the following actions can you NOT execute?",
    options: ["Fold", "Call $140", "Raise all-in for $260", "Call $200"],
    correct: 3,
    feedback: "You only need to call $140 to match the all-in. You cannot call for more than the effective raise amount.",
    table: {
      players: [
        { position: 'SB', stack: 397, status: 'Folded' },
        { position: 'BB', stack: 260, bet: 60, isHero: true, isCurrent: true, cards: ['A♦', 'K♥'] },
        { position: 'UTG', stack: 400, status: 'Folds' },
        { position: 'MP', stack: 400, status: 'Folds' },
        { position: 'CO', stack: 400, status: 'Folds' },
        { position: 'BTN', stack: 120, bet: 200, status: 'All-in $200' },
      ],
      pot: 413,
      communityCards: ['A♠', '10♦', '2♣', '7♠', 'K♣']
    }
  }
];

const takeawaysSlides = [
    {
        title: "Key Takeaways – Action Rules in Poker",
        content: (
            <ul className="space-y-4 text-left text-green-200 text-lg">
                <li>
                    <strong className="text-yellow-400 block">1. Facing a Raise:</strong>
                    <span className="text-red-400 font-bold">❌ You cannot check.</span><br />
                    <span className="text-green-300 font-bold">✅ You must choose: fold, call, or re-raise.</span>
                </li>
                <li>
                    <strong className="text-yellow-400 block">2. When No One Has Bet:</strong>
                     <span className="text-red-400 font-bold">❌ You cannot fold or call.</span><br />
                    <span className="text-green-300 font-bold">✅ You may check or bet.</span>
                </li>
                <li>
                    <strong className="text-yellow-400 block">3. Facing a Bet:</strong>
                     <span className="text-red-400 font-bold">❌ You cannot check.</span><br />
                    <span className="text-green-300 font-bold">✅ You may fold, call, or raise.</span>
                </li>
                <li>
                    <strong className="text-yellow-400 block">4. Opponent is All-In:</strong>
                    <span className="text-red-400 font-bold">❌ You cannot re-raise beyond their all-in.</span><br />
                    <span className="text-green-300 font-bold">✅ You may fold or call the all-in amount.</span>
                </li>
            </ul>
        )
    },
    {
        title: "Learning Tip: Always ask yourself:",
        content: (
            <div className="bg-blue-900/30 rounded-xl p-6 border border-blue-400/30 text-left space-y-4">
                 <h3 className="text-2xl font-bold text-white text-center mb-4">"Has someone bet already?"</h3>
                 <div className="text-blue-200 text-xl space-y-3">
                    <p><strong className="text-yellow-300">If no one has bet</strong> → Check or Bet.</p>
                    <p><strong className="text-yellow-300">If someone has bet</strong> → Fold, Call, or Raise.</p>
                    <p><strong className="text-yellow-300">If opponent is all-in</strong> → Fold or Call only.</p>
                 </div>
            </div>
        )
    }
];

const gameIntroSlides = [
  {
    title: "Short Intro",
    jsx: (
      <div className="bg-green-950/30 rounded-xl p-6 text-left w-full">
        <h3 className="text-xl font-bold text-white mb-4">Short Intro:</h3>
        <p className="text-green-200">
          Poker isn't just about good cards; it's about understanding the rhythm of the game and how money moves.
          In this mini-game, you'll learn the crucial stages of a poker hand, how to execute essential betting actions,
          and how the pot grows with every chip wagered.
        </p>
      </div>
    )
  },
  {
    title: "Learning Objectives",
    jsx: (
      <div className="bg-yellow-400/10 rounded-xl p-6 text-left w-full">
        <h3 className="text-xl font-bold text-white mb-4">By the end of this mini-game, you will be able to:</h3>
        <ul className="text-green-200 space-y-2">
          <li>1. Accurately identify and apply appropriate poker betting actions (check, bet, call, raise, fold) at each stage of a poker hand</li>
          <li>2. Calculate the current pot size based on initial blinds/antes and subsequent betting actions in a poker hand</li>
        </ul>
      </div>
    )
  },
  {
    title: "How to Play",
    jsx: (
      <div className="bg-blue-900/30 rounded-xl p-6 text-left w-full">
        <h3 className="text-xl font-bold text-white mb-4">How to Play:</h3>
        <p className="text-green-200">
          You will be guided through a simulated poker hand, progressing through its different stages.
          At key moments, you will be prompted to choose a betting action. The game will then show the consequences
          of your decision on the pot size and the hand's flow. Your goal is to apply your knowledge of hand progression
          and betting to make the correct choices and track the pot's growth.
        </p>
      </div>
    )
  }
];

const StageDivider = ({ title, onContinue }) => (
  <div className="max-w-4xl mx-auto text-center flex flex-col items-center justify-center h-[60vh]">
    <div className="bg-black/20 backdrop-blur-md rounded-2xl p-8 border-2 border-yellow-700/50 shadow-2xl">
      <h2 className="text-4xl font-bold text-yellow-400 mb-6 font-heading">{title}</h2>
      <Button onClick={onContinue} className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold">
        Continue <ArrowRight className="ml-2 w-5 h-5" />
      </Button>
    </div>
  </div>
);

export default function Game2() {
  const [currentStage, setCurrentStage] = useState('intro');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0); // Used for Stage 3 and Stage 4 scenarios
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [user, setUser] = useState(null);
  const gameId = 2;
  const navigate = useNavigate();
  const timer = useActiveStopwatch();
  const completedRef = React.useRef(false);
  const [timeLeft, setTimeLeft] = useState(20);
  const [timerActive, setTimerActive] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  const startedSentRef = React.useRef(false);
  const ignoreFirstCleanupRef = React.useRef(import.meta.env.DEV);

  React.useEffect(() => {
    // שליחת "Game Started" פעם אחת בלבד
    if (!startedSentRef.current) {
      track("Game Started", { gameId });
      startedSentRef.current = true;
    }

    return () => {
      // ב-React StrictMode (Dev) יש cleanup "מדומה" מיד אחרי mount — נדלג עליו
      if (ignoreFirstCleanupRef.current) {
        ignoreFirstCleanupRef.current = false; // הפעם הבאה תהיה אמיתית
        return;
      }

      if (!completedRef.current) {
        const spentSec = timer.readSeconds();
        track("Game Abandoned", { gameId, spentSec, reason: "unmount" });
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleNextFinalChallenge = useCallback(() => {
    setTimerActive(false); // Stop timer immediately when called
    setShowExplanation(false);
    setSelectedAnswer(null);
    if (currentQuestion < finalChallengeScenarios.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setTimeLeft(20); // Reset timer for next question
      setTimerActive(true); // Start timer for next question
    } else {
      setTimerActive(false); // Ensure timer is off when moving to takeaways
      setCurrentStage('takeaways');
      setCurrentSlide(0); // Reset slide for takeaways
    }
  }, [currentQuestion, setCurrentQuestion, setTimeLeft, setShowExplanation, setSelectedAnswer, setTimerActive, setCurrentStage, setCurrentSlide]);

  useEffect(() => {
    let interval;
    if (timerActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prevTime => prevTime - 1);
      }, 1000);
    } else if (timerActive && timeLeft === 0) {
      setShowExplanation(true); // Show feedback on timeout
      // Automatically advance after a short delay for feedback visibility
      const timeoutId = setTimeout(() => handleNextFinalChallenge(), 2000);
      return () => clearTimeout(timeoutId); // Cleanup timeout
    }
    return () => clearInterval(interval); // Cleanup interval
  }, [timerActive, timeLeft, handleNextFinalChallenge]);


  const loadUser = async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);
    } catch (error) {
      console.error("Error loading user:", error);
    }
  };

  const completeGame = async () => {
    if (!user) return;

    const today = new Date().toISOString().split('T')[0];
    completedRef.current = true;
    const spentSec = timer.readSeconds();
    track("Game Completed", { gameId, spentSec });
    await User.completeGame(2);

    navigate(createPageUrl("Home"));
  };

  const renderIntro = () => (
    <div className="max-w-4xl mx-auto text-center">
      <div className="bg-black/20 backdrop-blur-md rounded-2xl p-8 border border-green-700/30">
        <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-6" />
        <h1 className="text-4xl font-bold text-white mb-4">
          Game 2: Hand Flow + Betting Actions
        </h1>
        <h2 className="text-2xl font-semibold text-green-300 mb-6">
          Blinds/Antes & Pot Growth - Explanation
        </h2>
        <p className="text-green-200 text-lg mb-8">
          Master the flow of poker hands, betting actions, and how pots grow.
          Learn the rhythm of the game and how money moves!
        </p>
        <Button
          onClick={() => {
            setCurrentStage('explanation');
            setCurrentSlide(0); // Reset slide for explanation
          }}
          className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-8 py-3 text-lg"
        >
          Start Learning
          <ArrowRight className="ml-2 w-5 h-5" />
        </Button>
      </div>
    </div>
  );

  const renderExplanation = () => {
    const slide = explanationSlides[currentSlide];

    return (
      <div className="max-w-5xl mx-auto">
        <div className="bg-black/20 backdrop-blur-md rounded-2xl p-8 border border-green-700/30">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              custom={1} // Used to indicate direction, though framer-motion typically infers based on key changes
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
            >
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="text-center mb-8"
              >
                <motion.h2 variants={itemVariants} className="text-3xl font-bold text-white mb-2">
                  {slide.title}
                </motion.h2>
              </motion.div>

              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="bg-white/10 rounded-xl p-6 mb-6 min-h-[300px] flex flex-col justify-center"
              >
                <motion.p variants={itemVariants} className="text-green-200 text-lg leading-relaxed mb-4">
                  {slide.content}
                </motion.p>

                {slide.example && (
                  <motion.div variants={itemVariants} className="bg-yellow-400/10 rounded-lg p-4 border border-yellow-400/30">
                    <p className="text-yellow-200">
                      <strong>Example:</strong> {slide.example}
                    </p>
                  </motion.div>
                )}
              </motion.div>
            </motion.div>
          </AnimatePresence>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.4 }}
            className="flex justify-between items-center"
          >
            <Button
              onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))}
              disabled={currentSlide === 0}
              variant="outline"
              className="border-green-700 text-green-300 hover:bg-green-700/20"
            >
              <ArrowLeft className="mr-2 w-4 h-4" />
              Previous
            </Button>

            <span className="text-green-300">
              {currentSlide + 1} of {explanationSlides.length}
            </span>

            {currentSlide < explanationSlides.length - 1 ? (
              <Button
                onClick={() => setCurrentSlide(currentSlide + 1)}
                className="bg-green-700 hover:bg-green-800 text-white"
              >
                Next
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            ) : (
              <Button
                onClick={() => {
                  setCurrentStage('gameIntro');
                  setCurrentSlide(0); // Reset slide for game intro
                }}
                className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold"
              >
                Start Game
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            )}
          </motion.div>
        </div>
      </div>
    );
  };

  const renderGameIntro = () => {
    const slide = gameIntroSlides[currentSlide];

    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-black/20 backdrop-blur-md rounded-2xl p-8 border border-green-700/30">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              custom={1}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
            >
              <motion.h2
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                className="text-3xl font-bold text-white mb-6 text-center"
              >
                Pot Master: Navigate the Hand Flow!
              </motion.h2>

              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="mb-6 min-h-[260px] flex items-center justify-center"
              >
                <motion.div variants={itemVariants}>
                  {slide.jsx}
                </motion.div>
              </motion.div>
            </motion.div>
          </AnimatePresence>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.4 }}
            className="flex justify-between items-center"
          >
            <Button
              onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))}
              disabled={currentSlide === 0}
              variant="outline"
              className="border-green-700 text-green-300 hover:bg-green-700/20"
            >
              <ArrowLeft className="mr-2 w-4 h-4" />
              Previous
            </Button>

            <span className="text-green-300">
              {currentSlide + 1} of {gameIntroSlides.length}
            </span>

            {currentSlide < gameIntroSlides.length - 1 ? (
              <Button
                onClick={() => setCurrentSlide(currentSlide + 1)}
                className="bg-green-700 hover:bg-green-800 text-white"
              >
                Next
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            ) : (
              <Button
                onClick={() => {
                  setCurrentStage('stage1');
                  setCurrentSlide(0); // Reset slide for stage 1
                }}
                className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold"
              >
                Begin Game
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            )}
          </motion.div>
        </div>
      </div>
    );
  };

  const renderStage1 = () => {
    const step = stage1DemoSteps[currentSlide];

    return (
      <div className="max-w-7xl mx-auto flex flex-col items-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="w-full flex flex-col items-center"
          >
            <motion.h2
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-3xl font-bold text-white text-center mb-4"
            >
              Stage 1: Live Demo
            </motion.h2>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="w-full max-w-4xl bg-black/40 backdrop-blur-md p-4 rounded-xl border border-yellow-400/30 text-center mb-6"
            >
              <p className="text-yellow-200 text-base">{step.narration}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="w-full h-[500px] relative"
            >
                <PokerTable
                    key={currentSlide}
                    players={step.players}
                    pot={step.pot}
                    communityCards={step.communityCards}
                    dealerPosition="BTN"
                />
            </motion.div>
          </motion.div>
        </AnimatePresence>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.4 }}
          className="flex justify-between items-center mt-8 w-full max-w-lg"
        >
            <Button
                onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))}
                disabled={currentSlide === 0}
                variant="outline" className="border-green-700 text-green-300 hover:bg-green-700/20"
            >
                <ArrowLeft className="mr-2 w-4 h-4" /> Previous Step
            </Button>
            <span className="text-green-300">{currentSlide + 1} / {stage1DemoSteps.length}</span>
            {currentSlide < stage1DemoSteps.length - 1 ? (
                <Button onClick={() => setCurrentSlide(currentSlide + 1)} className="bg-green-700 hover:bg-green-800 text-white">
                    Next Step <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
            ) : (
                <Button onClick={() => setCurrentStage('stage-divider')} className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold">
                    Go to Practice <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
            )}
        </motion.div>
      </div>
    );
  };

  const renderStage2 = () => {
    const scenario = stage2Scenarios[currentSlide];
    const { isMultiple } = scenario;

    const handleSelect = (index) => {
        if (isMultiple) {
            const current = selectedAnswer || [];
            if (current.includes(index)) {
                setSelectedAnswer(current.filter(i => i !== index));
            } else {
                setSelectedAnswer([...current, index]);
            }
        } else {
            setSelectedAnswer(index);
        }
    };

    let isCorrect = false;
    if(showExplanation) {
      if(isMultiple) {
        // Check if selectedAnswer is an array and contains all correct answers and only correct answers
        isCorrect = Array.isArray(selectedAnswer) &&
                    selectedAnswer.length === scenario.correct.length &&
                    selectedAnswer.every(val => scenario.correct.includes(val));
      } else {
        // scenario.correct is now always an array (e.g., [1])
        isCorrect = selectedAnswer !== null && scenario.correct.includes(selectedAnswer);
      }
    }

    return (
      <div className="max-w-5xl mx-auto">
        <div className="bg-black/20 backdrop-blur-md rounded-2xl p-8 border border-green-700/30">
          <h2 className="text-3xl font-bold text-white text-center mb-2">{scenario.title}</h2>
          <p className="text-center text-green-300 mb-8">Question {currentSlide + 1} of {stage2Scenarios.length}</p>

          {scenario.demo && (
            <div className="h-[200px] w-full mb-8 flex items-center justify-center bg-green-950/30 rounded-lg p-4 border border-green-800">
                <p className="text-green-300 text-center">Interactive pot growth demonstration would be here.</p>
            </div>
          )}

          <div className="bg-white/5 rounded-xl p-6 mb-6">
            <h3 className="text-xl font-bold text-white mb-4">Question:</h3>
            <p className="text-green-200 text-lg">{scenario.question}</p>
          </div>

          <div className="grid gap-3 mb-6">
            {scenario.options.map((option, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg cursor-pointer transition-all duration-300 border-2
                  ${!showExplanation && (isMultiple ? (selectedAnswer && selectedAnswer.includes(index) ? 'border-yellow-400 bg-yellow-400/10' : 'border-transparent bg-white/5 hover:border-green-400/50') : (selectedAnswer === index ? 'border-yellow-400 bg-yellow-400/10' : 'border-transparent bg-white/5 hover:border-green-400/50'))}
                  ${showExplanation && scenario.correct.includes(index) ? 'border-green-400 bg-green-400/10' : ''}
                  ${showExplanation && !scenario.correct.includes(index) && (isMultiple ? (selectedAnswer && selectedAnswer.includes(index)) : selectedAnswer === index) ? 'border-red-400 bg-red-400/10' : ''}
                `}
                onClick={() => !showExplanation && handleSelect(index)}
              >
                <div className="flex items-center gap-3">
                  <div className="text-white font-bold">{String.fromCharCode(65 + index)})</div>
                  <div className="text-green-200">{option}</div>
                  {showExplanation && scenario.correct.includes(index) && <CheckCircle className="ml-auto w-5 h-5 text-green-400" />}
                </div>
              </div>
            ))}
          </div>

          {!showExplanation && <div className="bg-blue-900/30 rounded-xl p-4 mb-6"><p className="text-blue-200"><strong>Hint:</strong> {scenario.hint}</p></div>}

          {showExplanation && (
            <div className={`rounded-xl p-6 mb-6 ${isCorrect ? 'bg-green-950/30' : 'bg-red-900/30'}`}>
              <h3 className="text-xl font-bold text-white mb-2">{isCorrect ? 'Correct!' : 'Incorrect'}</h3>
              <p className="text-green-200">{scenario.feedback}</p>
            </div>
          )}

          <div className="flex justify-between items-center">
             <Button onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))} disabled={currentSlide === 0} variant="outline" className="border-green-700 text-green-300 hover:bg-green-700/20"><ArrowLeft className="mr-2 w-4 h-4" /> Previous</Button>
            {!showExplanation ? (
              <Button onClick={() => setShowExplanation(true)} className="bg-green-700 hover:bg-green-800 text-white" disabled={selectedAnswer === null || (isMultiple && selectedAnswer.length === 0)}>Submit</Button>
            ) : (
              currentSlide < stage2Scenarios.length - 1 ? (
                <Button onClick={() => { setCurrentSlide(currentSlide + 1); setSelectedAnswer(null); setShowExplanation(false); }} className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold">Next Question <ArrowRight className="ml-2 w-4 h-4" /></Button>
              ) : (
                <Button onClick={() => {
                  setCurrentStage('stage-divider-3');
                  setCurrentQuestion(0); // Reset currentQuestion for stage 3
                  setSelectedAnswer(null);
                  setShowExplanation(false);
                }} className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold">Independent Practice <ArrowRight className="ml-2 w-5 h-5" /></Button>
              )
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderStage3 = () => {
    const scenario = independentPracticeScenarios[currentQuestion];

    return (
      <div className="max-w-5xl mx-auto">
        <div className="bg-black/20 backdrop-blur-md rounded-2xl p-8 border border-green-700/30">
          <h2 className="text-3xl font-bold text-white text-center mb-2">Stage 3: Independent Practice</h2>
          <p className="text-center text-green-300 mb-8">Scenario {currentQuestion + 1} of {independentPracticeScenarios.length}</p>

          <div className="bg-white/5 rounded-xl p-6 mb-6">
            <h3 className="text-xl font-bold text-white mb-4">Situation:</h3>
            <p className="text-green-200 text-lg mb-4">{scenario.question}</p>
          </div>

          <div className="grid gap-3 mb-6">
            {scenario.options.map((option, index) => (
              <div
                key={index}
                className={`
                  p-4 rounded-lg cursor-pointer transition-all duration-300 border-2
                  ${selectedAnswer === index && !showExplanation ? 'border-yellow-400 bg-yellow-400/10' : 'border-transparent bg-white/5 hover:border-green-400/50'}
                   ${showExplanation && index === scenario.correct ? 'border-green-400 bg-green-400/10' : ''}
                   ${showExplanation && selectedAnswer === index && index !== scenario.correct ? 'border-red-400 bg-red-400/10' : ''}
                `}
                onClick={() => !showExplanation && setSelectedAnswer(index)}
              >
                <div className="flex items-center gap-3">
                  <div className="text-white font-bold">{String.fromCharCode(65 + index)})</div>
                  <div className="text-green-200">{option}</div>
                   {showExplanation && index === scenario.correct && <CheckCircle className="ml-auto w-5 h-5 text-green-400" />}
                </div>
              </div>
            ))}
          </div>

          {showExplanation && (
            <div className={`rounded-xl p-6 mb-6 ${selectedAnswer === scenario.correct ? 'bg-green-950/30' : 'bg-red-900/30'}`}>
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-xl font-bold text-white">{selectedAnswer === scenario.correct ? 'Correct!' : 'Incorrect'}</h3>
              </div>
              <p className="text-green-200">{scenario.feedback}</p>
            </div>
          )}

          <div className="flex justify-end items-center"> {/* Aligned right */}
            {!showExplanation ? (
              <>
                {selectedAnswer !== null && (
                  <Button
                    onClick={() => setShowExplanation(true)}
                    className="bg-green-700 hover:bg-green-800 text-white"
                  >
                    Submit Decision
                  </Button>
                )}
              </>
            ) : (
              <Button
                onClick={() => {
                  if (currentQuestion < independentPracticeScenarios.length - 1) {
                    setCurrentQuestion(currentQuestion + 1);
                    setSelectedAnswer(null);
                    setShowExplanation(false);
                  } else {
                    setCurrentStage('stage-divider-4');
                    setSelectedAnswer(null);
                    setShowExplanation(false);
                  }
                }}
                className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold"
              >
                {currentQuestion < independentPracticeScenarios.length - 1 ? 'Next Scenario' : 'Go to Final Challenge'}
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderStage4 = () => {
    const scenario = finalChallengeScenarios[currentQuestion];
    const isTimedOut = timeLeft === 0 && timerActive; // Check timerActive to ensure it's not just 0 after being disabled

    return (
        <div className="max-w-7xl mx-auto flex flex-col items-center">
            <h2 className="text-3xl font-bold text-white text-center mb-2">Stage 4: The Final Challenge!</h2>
            <p className="text-center text-green-300 mb-4">{scenario.title}</p>

            <div className="relative w-full max-w-sm mx-auto mb-4">
                <div className="h-2 bg-gray-700 rounded-full"></div>
                <div
                    className="absolute top-0 left-0 h-2 bg-yellow-400 rounded-full transition-all duration-1000 linear"
                    style={{ width: `${(timeLeft / 20) * 100}%` }}
                ></div>
                <div className="absolute -top-5 right-0 text-white font-bold flex items-center gap-1">
                    <Clock className="w-4 h-4" /> {timeLeft}s
                </div>
            </div>

            <div className="w-full h-[550px] relative">
                <PokerTable
                    key={currentQuestion}
                    players={scenario.table.players}
                    pot={scenario.table.pot}
                    communityCards={scenario.table.communityCards}
                    dealerPosition="BTN"
                />
            </div>

            <div className="bg-black/40 backdrop-blur-md rounded-2xl p-6 border border-green-700/30 w-full max-w-4xl mt-4">
                <p className="text-green-200 text-lg mb-4 text-center">{scenario.question}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                    {scenario.options.map((option, index) => (
                         <Button
                            key={index}
                            variant="outline"
                            className={`
                                justify-start p-4 h-auto text-left transition-all duration-300
                                ${selectedAnswer === index && !showExplanation ? 'border-yellow-400 bg-yellow-400/10 text-white' : 'border-gray-600 text-gray-300 hover:bg-gray-700/50'}
                                ${showExplanation && index === scenario.correct ? 'border-green-500 bg-green-500/10 !text-white' : ''}
                                ${showExplanation && selectedAnswer === index && index !== scenario.correct ? 'border-red-500 bg-red-500/10 !text-white' : ''}
                            `}
                            onClick={() => {
                                if (!showExplanation) {
                                    setSelectedAnswer(index);
                                    setShowExplanation(true);
                                    setTimerActive(false); // Stop the timer immediately on selection
                                    setTimeout(() => handleNextFinalChallenge(), 2000); // Auto-advance after 2 seconds
                                }
                            }}
                            disabled={showExplanation}
                        >
                            <span className="font-bold mr-3">{String.fromCharCode(65 + index)})</span>
                            {option}
                        </Button>
                    ))}
                </div>
                {showExplanation && (
                    <div className={`text-center p-3 rounded-lg ${isTimedOut ? 'bg-gray-700' : (selectedAnswer === scenario.correct ? 'bg-green-900/50' : 'bg-red-900/50')}`}>
                        <p className="font-bold text-white">
                            {isTimedOut ? "Time's Up!" : (selectedAnswer === scenario.correct ? "Correct!" : "Incorrect!")}
                        </p>
                        <p className="text-green-200 text-sm">{scenario.feedback}</p>
                    </div>
                )}
            </div>
        </div>
    );
  };

  const renderTakeaways = () => {
    const slide = takeawaysSlides[currentSlide];
    return (
      <div className="max-w-4xl mx-auto text-center">
        <div className="bg-black/20 backdrop-blur-md rounded-2xl p-8 border border-green-700/30">
          <h2 className="text-3xl font-bold text-white mb-6 font-heading">{slide.title}</h2>
          <div className="min-h-[250px] flex items-center justify-center mb-8">
            {slide.content}
          </div>
          <div className="flex justify-between items-center">
            <Button onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))} disabled={currentSlide === 0} variant="outline" className="border-green-700 text-green-300 hover:bg-green-700/20">
              <ArrowLeft className="mr-2 w-4 h-4" /> Previous
            </Button>
            <span className="text-green-300">{currentSlide + 1} / {takeawaysSlides.length}</span>
            {currentSlide < takeawaysSlides.length - 1 ? (
              <Button onClick={() => setCurrentSlide(currentSlide + 1)} className="bg-green-700 hover:bg-green-800 text-white">
                Next <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            ) : (
              <Button onClick={() => setCurrentStage('completion')} className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold">
                Finish Game <Trophy className="ml-2 w-5 h-5" />
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderCompletion = () => (
    <div className="max-w-4xl mx-auto text-center">
      <div className="bg-black/20 backdrop-blur-md rounded-2xl p-8 border border-green-700/30">
        <Trophy className="w-20 h-20 text-yellow-400 mx-auto mb-6" />
        <h2 className="text-4xl font-bold text-white mb-4">Congratulations!</h2>
        <div className="bg-green-950/30 rounded-xl p-6 mb-8">
          <p className="text-green-200 text-lg">
            You have successfully completed the 'Pot Master: Navigate the Hand Flow!' mini-game.
            You now master the Hand flow of poker, including pot seeding, betting actions and hand progression.
            This knowledge will give you a good start moving forward at the poker tables and will provide a solid foundation
            for your further studies in poker game. Keep practicing and applying what you have learned!
          </p>
        </div>
        <Button
          onClick={completeGame}
          className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-8 py-3 text-lg"
        >
          Return to Home
          <ArrowRight className="ml-2 w-5 h-5" />
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-7xl mx-auto mb-6">
        <Button
          onClick={() => navigate(createPageUrl("Home"))}
          variant="outline"
          className="border-green-700 text-green-300 hover:bg-green-700/20"
        >
          <ArrowLeft className="mr-2 w-4 h-4" />
          Back to Home
        </Button>
      </div>

      {currentStage === 'intro' && renderIntro()}
      {currentStage === 'explanation' && renderExplanation()}
      {currentStage === 'gameIntro' && renderGameIntro()}
      {currentStage === 'stage1' && renderStage1()}
      {currentStage === 'stage-divider' && <StageDivider title="Stage 2: Guided Practice" onContinue={() => { setCurrentStage('stage2'); setCurrentSlide(0); setSelectedAnswer(null); setShowExplanation(false); }} />}
      {currentStage === 'stage2' && renderStage2()}
      {currentStage === 'stage-divider-3' && <StageDivider title="Stage 3: Independent Practice" onContinue={() => { setCurrentStage('stage3'); setCurrentQuestion(0); setSelectedAnswer(null); setShowExplanation(false); }} />}
      {currentStage === 'stage3' && renderStage3()}
      {currentStage === 'stage-divider-4' && <StageDivider title="Stage 4: Final Challenge!" onContinue={() => { setCurrentStage('stage4'); setCurrentQuestion(0); setSelectedAnswer(null); setShowExplanation(false); setTimeLeft(20); setTimerActive(true); }} />}
      {currentStage === 'stage4' && renderStage4()}
      {currentStage === 'takeaways' && renderTakeaways()}
      {currentStage === 'completion' && renderCompletion()}
    </div>
  );
}
