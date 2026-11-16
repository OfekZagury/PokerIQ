
import React, { useState, useEffect, useCallback } from "react";
import { UserService as User } from "@/services/user";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, ArrowRight, Trophy, CheckCircle, Target, Users, Shield, ThumbsDown, GitCommit, Eye, Calculator, Clock, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import PlayingCard from "../components/shared/PlayingCard";
import PokerTable from "../components/game2/PokerTable";
import { motion, AnimatePresence } from 'framer-motion';
import { Progress } from "@/components/ui/progress";
import { track } from "@/lib/analytics";
import useActiveStopwatch from "@/hooks/useActiveStopwatch";

const explanationSlides = [
    {
        title: "Part A: Understanding Outs in Poker",
        content: "In poker, a drawing hand is one that is not yet complete but holds the potential to become a stronger hand, typically a flush or a straight. Your 'outs' are the specific cards remaining in the deck that, if dealt, will complete your drawing hand. For effective decision-making, it is essential to recognize not only your own potential draws and outs but also those your opponents might have.",
        icon: Target
    },
    {
        title: "Part A: Understanding Outs in Poker",
        content: "Understanding outs is fundamental because it directly informs your equity in a hand, which is your expected share of the pot based on your probability of winning. Knowing how many outs you have allows you to evaluate your chances of winning against opponents and helps in making informed decisions about whether to call, raise, or fold. Your goal is to identify these cards within a matter of seconds during gameplay.",
        icon: Calculator
    },
    {
        title: "Part B: The Necessity of Discounting Outs",
        content: "While identifying your outs is critical, it's equally important to consider whether those outs genuinely improve your winning chances. The 'Essential Poker Math' emphasizes that you should discount any outs that you believe are already held by one of your opponents, or if hitting that specific card would still lead to you losing the hand. Failing to discount these can lead to overestimating your hand's true strength and making incorrect decisions.",
        icon: Eye
    },
    {
        title: "Part B: The Necessity of Discounting Outs",
        content: "Therefore, for a more accurate assessment of your hand's equity, it is crucial to disregard any outs that do not ultimately lead to a winning hand for you. This disciplined approach ensures you are making decisions based on realistic probabilities rather than inflated ones.",
        icon: GitCommit
    },
    {
        title: "Part C: Defining 'Dirty Outs'",
        content: "A specific type of problematic out is known as a 'dirty out.' A dirty out is a card that, while completing your drawing hand, simultaneously completes a better or stronger draw for your opponent. This means that even if you hit your seemingly beneficial card, you might still end up losing the hand because your opponent's hand improved more significantly. When you identify a dirty out, the recommended approach is to err on the side of caution and discard that out from your calculations.",
        icon: ThumbsDown
    },
    {
        title: "Part C: Defining 'Dirty Outs'",
        content: "This prevents you from overestimating your hand's strength and helps you avoid making unprofitable decisions based on misleading equity estimations. Recognizing and removing dirty outs is a crucial step in advanced poker mathematics.",
        icon: Users
    }
];

const demoSteps = [
  {
    title: "Practical Application: Initial Assessment",
    narration: "Let's illustrate. Suppose you hold K♠ Q♠ on a flop of J♠ T♠ 2♣. Your hand has an open-ended straight draw; you need an Ace or a Nine to complete your straight. Initially, you count 8 outs.",
    players: [{ position: 'BTN', stack: 500, cards: ['K♠', 'Q♠'], isHero: true }],
    communityCards: ['J♠', 'T♠', '2♣'],
    outs: { initial: ["A♠", "A♣", "A♦", "A♥", "9♠", "9♣", "9♦", "9♥"], highlighted: ["A♠", "A♣", "A♦", "A♥", "9♠", "9♣", "9♦", "9♥"], dirty: [] },
    calculation: "4 Aces + 4 Nines = 8 Initial Outs"
  },
  {
    title: "Practical Application: Identifying the Threat",
    narration: "However, you must consider your opponent's potential hands. The board has two spades. If your opponent also has a flush draw, hitting a spade to complete your straight could be disastrous.",
    players: [{ position: 'BTN', stack: 500, cards: ['K♠', 'Q♠'], isHero: true }],
    communityCards: ['J♠', 'T♠', '2♣'],
    outs: { initial: ["A♠", "A♣", "A♦", "A♥", "9♠", "9♣", "9♦", "9♥"], highlighted: ["A♠", "9♠"], dirty: ["A♠", "9♠"] },
    calculation: "The A♠ and 9♠ would complete your straight, but they would also complete an opponent's flush, which beats a straight."
  },
  {
    title: "Practical Application: Discounting Dirty Outs",
    narration: "Therefore, the A♠ and 9♠ are 'dirty outs.' To find your true outs, you must discount them. This adjusted count gives a more accurate picture of your real chances to win.",
    players: [{ position: 'BTN', stack: 500, cards: ['K♠', 'Q♠'], isHero: true }],
    communityCards: ['J♠', 'T♠', '2♣'],
    outs: { initial: ["A♠", "A♣", "A♦", "A♥", "9♠", "9♣", "9♦", "9♥"], highlighted: ["A♣", "A♦", "A♥", "9♣", "9♦", "9♥"], dirty: ["A♠", "9♠"] },
    calculation: "8 Total Outs - 2 Dirty Outs = 6 True Outs"
  },
];

const stage2Questions = [
  {
    hand: ['8♦', '7♦'],
    board: ['9♥', 'T♥', '3♦'],
    opponent: "Suspect holding a flush draw of hearts",
    correct: 6,
    explanation: "Initial outs (straight): 4x J, 4x 6 (total 8 outs). Dirty outs: J♥, 6♥ (completes a stronger flush for your opponent).",
    hints: [
      "Remember to count all cards that complete your straight, regardless of suit.",
      "Think about what suits on the board could give your opponent a flush. If your straight is also of the same suit, it is a dirty out.",
      "Subtract all 'dirty outs' from your outs count to get your true outs."
    ]
  },
  {
    hand: ['Q♠', 'J♠'],
    board: ['T♦', '9♦', '2♠'],
    opponent: "Suspect holding a flush draw to diamonds",
    correct: 6,
    explanation: "Initial outs (straight): 4x K, 4x 8 (total 8 outs). Dirty outs: K♦, 8♦ (completes a stronger flush for your opponent).",
    hints: [
      "Remember to count all cards that complete your straight, regardless of suit.",
      "Think about what suits on the board could give your opponent a flush. If your straight is also of the same suit, it is a dirty out.",
      "Subtract all 'dirty outs' from your outs count to get your true outs."
    ]
  }
];

const stage3Questions = [
  {
    hand: ['7♠', '6♠'],
    board: ['5♥', '8♥', 'J♠'],
    opponent: "Suspect holding a flush draw to hearts",
    correct: 6,
    explanation: "Initial outs (straight): 4x 9, 4x 4 (8 outs). Dirty outs: 9♥, 4♥."
  },
  {
    hand: ['Q♦', 'T♦'],
    board: ['K♣', 'J♣', '2♦'],
    opponent: "Suspect holding a flush draw to clubs",
    correct: 6,
    explanation: "Initial outs (straight): 4x A, 4x 9 (8 outs). Dirty Outs: A♣, 9♣."
  },
  {
    hand: ['A♥', 'K♥'],
    board: ['Q♥', 'J♥', '2♠'],
    opponent: "Suspected to hold T♥ 9♥ (straight flush draw)",
    correct: 8,
    explanation: "You have A♥ K♥ and the board has Q♥ J♥. There are 4 hearts up, so out of 13 hearts in the deck, there are 9 initial outs left for your flush. The 8♥ is a 'dirty out'. Although it completes your flush (A♥ K♥ Q♥ J♥ 8♥), it simultaneously completes a stronger straight flush for your opponent (Q♥ J♥ T♥ 9♥ 8♥). Therefore, you must subtract the 8♥ from your outs calculations."
  },
  {
    hand: ['A♣', 'K♣'],
    board: ['Q♣', 'J♣', '8♦'],
    opponent: "Suspected to hold 8♠ 8♥ (a set of 8)",
    correct: 8,
    explanation: "You have A♣ K♣ and the board has Q♣ J♣. There are 4 clubs up, so out of 13 clubs in the pack, there are 9 initial outs left for your flush. The 8♣ is a 'dirty out.' Although it completes your flush (A♣ K♣ Q♣ J♣ 8♣), because your opponent already has a pair of 8s (8♠ 8♥) and an 8♦ is on the board, the appearance of the 8♣ will complete your opponent's four of 8s (8♠ 8♥ 8♦ 8♣), which is a much stronger hand than any flush. Therefore, you must subtract the 8♣ from your outs calculations."
  }
];

const finalQuestions = [
  {
    hand: ['9♠', '8♠'],
    board: ['7♣', '6♣', 'A♠'],
    opponent: "Suspect holding two clubs (for a flush draw)",
    correct: 6
  },
  {
    hand: ['A♣', 'Q♣'],
    board: ['K♣', 'J♣', '8♦'],
    opponent: "Suspected to hold 8♠ 8♥ (set of 8)",
    correct: 8
  },
  {
    hand: ['T♥', 'J♥'],
    board: ['Q♠', 'K♦', '2♥'],
    opponent: "Suspected of holding a spades flush draw",
    correct: 6
  },
  {
    hand: ['5♣', '6♣'],
    board: ['7♦', '8♦', 'K♠'],
    opponent: "Suspected of holding a flush draw of diamonds",
    correct: 6
  },
  {
    hand: ['6♠', '7♠'],
    board: ['4♥', '5♥', 'K♣'],
    opponent: "Suspected of holding a flush draw of hearts",
    correct: 6
  },
  {
    hand: ['A♦', 'K♦'],
    board: ['Q♦', 'J♦', '2♠'],
    opponent: "Suspected to hold T♦ 9♦ (straight flush draw)",
    correct: 8
  }
];

export default function Game20() {
  const [currentStage, setCurrentStage] = useState('intro');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slideDirection, setSlideDirection] = useState(1);
  const [demoStep, setDemoStep] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [sliderValue, setSliderValue] = useState([8]);
  const [showExplanation, setShowExplanation] = useState(false);
  const [showHint, setShowHint] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [finalScore, setFinalScore] = useState(0);
  const [finalAnswers, setFinalAnswers] = useState([]);
  const [user, setUser] = useState(null);
  const gameId = 20;
  const navigate = useNavigate();
  const timer = useActiveStopwatch();
  const completedRef = React.useRef(false);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await User.me();
        setUser(currentUser);
      } catch (error) {
        console.error("User not loaded.", error);
      }
    };
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


  const handleFinalSubmit = useCallback(() => {
    const question = finalQuestions[currentQuestion];
    const isCorrect = sliderValue[0] === question.correct;

    if (isCorrect) {
      setFinalScore(prev => prev + 1);
    }

    setFinalAnswers(prev => [...prev, {
      question: currentQuestion,
      userAnswer: sliderValue[0],
      correct: question.correct,
      isCorrect
    }]);

    setShowExplanation(true);
  }, [currentQuestion, sliderValue]);

  // Timer for final challenge
  useEffect(() => {
    if (currentStage === 'final' && timeLeft > 0 && !showExplanation) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (currentStage === 'final' && timeLeft === 0 && !showExplanation) {
      handleFinalSubmit();
    }
  }, [currentStage, timeLeft, showExplanation, handleFinalSubmit]);

  const completeGame = async (passed) => {
    if (!user) return;

    if (passed) {
      const today = new Date().toISOString().split('T')[0];
      completedRef.current = true;
      const spentSec = timer.readSeconds();
      track("Game Completed", { gameId, spentSec });
      await User.completeGame(20);
    }
    navigate(createPageUrl("Home"));
  };

  const resetForNextQuestion = () => {
    setSliderValue([8]);
    setShowExplanation(false);
    setShowHint(0);
    setTimeLeft(30);
  };

  const handleSlideChange = (newSlide) => {
    setSlideDirection(newSlide > currentSlide ? 1 : -1);
    setCurrentSlide(newSlide);
  };

  const renderIntro = () => (
    <div className="max-w-4xl mx-auto text-center">
        <div className="bg-black/20 backdrop-blur-md rounded-2xl p-8 border border-green-600/30">
            <Calculator className="w-16 h-16 text-yellow-400 mx-auto mb-6" />
            <h1 className="text-4xl font-bold text-white mb-4">Game 20: Outs Discount (Advanced)</h1>
            <h2 className="text-2xl font-semibold text-green-300 mb-6">Remove "Dirty Outs"</h2>
            <p className="text-green-200 text-lg mb-8">
                Master the art of accurately assessing your hand's potential by learning to identify and discount "dirty outs" that could lead to costly mistakes.
            </p>
            <Button onClick={() => setCurrentStage('explanation')} className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-8 py-3 text-lg">Start Learning <ArrowRight className="ml-2 w-5 h-5" /></Button>
        </div>
    </div>
  );

  const renderExplanation = () => {
    const slide = explanationSlides[currentSlide];
    const Icon = slide.icon;
    return (
        <div className="max-w-5xl mx-auto">
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentSlide}
                    initial={{ opacity: 0, x: slideDirection * 200 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -slideDirection * 200 }}
                    transition={{ duration: 0.4, ease: "easeInOut" }}
                >
                    <div className="bg-black/20 backdrop-blur-md rounded-2xl p-8 border border-green-600/30">
                        <div className="text-center mb-6">
                            <Icon className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
                            <h2 className="text-3xl font-bold text-white mb-2">{slide.title}</h2>
                        </div>
                        <div className="bg-white/10 rounded-xl p-6 min-h-[150px] flex items-center">
                            <p className="text-green-200 text-lg leading-relaxed">{slide.content}</p>
                        </div>
                    </div>
                </motion.div>
            </AnimatePresence>
            <div className="flex justify-between items-center mt-6">
                <Button onClick={() => handleSlideChange(Math.max(0, currentSlide - 1))} disabled={currentSlide === 0} variant="outline" className="border-green-600 text-green-300 hover:bg-green-600/20"><ArrowLeft className="mr-2 w-4 h-4" /> Previous</Button>
                <div className="flex gap-2">
                    {explanationSlides.map((_, index) => (
                        <button key={index} onClick={() => handleSlideChange(index)} className={`w-3 h-3 rounded-full ${currentSlide === index ? 'bg-yellow-400' : 'bg-green-700'}`}></button>
                    ))}
                </div>
                {currentSlide < explanationSlides.length - 1 ? (
                    <Button onClick={() => handleSlideChange(currentSlide + 1)} className="bg-green-600 hover:bg-green-700 text-white">Next <ArrowRight className="ml-2 w-4 h-4" /></Button>
                ) : (
                    <Button onClick={() => { setCurrentStage('gameIntro'); setCurrentSlide(0); setSlideDirection(1); }} className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold">Start Game <ArrowRight className="ml-2 w-4 h-4" /></Button>
                )}
            </div>
        </div>
    );
  };

  const renderGameIntro = () => {
    const slides = [
      {
        title: "Dirty Outs Detective: Can you spot the real winning hand?",
        content: (
          <div className="bg-yellow-400/10 rounded-xl p-6 mb-6 text-left">
            <h3 className="text-xl font-bold text-white mb-4">Brief Introduction:</h3>
            <p className="text-green-200">In poker, the ability to identify your "outs" is essential for assessing the strength of your hand. However, not all potential outs are truly beneficial. Certain cards, known as "dirty outs," can complement your hand but at the same time give your opponent a stronger hand. This mini-game will sharpen your ability to identify and remove these deceptive outs, ensuring that you make truly profitable decisions.</p>
          </div>
        )
      },
      {
        title: "How to Play",
        content: (
          <div className="bg-green-950/30 rounded-xl p-6 mb-8 text-left">
            <h3 className="text-xl font-bold text-white mb-4">How to Play:</h3>
            <ul className="text-green-200 space-y-2 list-disc list-inside">
              <li>You will be presented with a poker hand, a community board, and a description of your opponent's potential drawing hand.</li>
              <li>Your first task is to identify all potential outs for your hand.</li>
              <li>Next, estimate which of those outs, if any, would simultaneously complete a stronger hand for your opponent (these are the "dirty outs").</li>
              <li>Tap on the cards in the deck that represent "dirty outs" to remove them from your count.</li>
              <li>Finally, enter your true (discounted) outs count.</li>
            </ul>
          </div>
        )
      }
    ];

    const currentSlideContent = slides[currentSlide];

    return (
      <div className="max-w-4xl mx-auto text-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: slideDirection * 200 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -slideDirection * 200 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
          >
            <div className="bg-black/20 backdrop-blur-md rounded-2xl p-8 border border-green-600/30">
              <h2 className="text-3xl font-bold text-white mb-6">{currentSlideContent.title}</h2>
              {currentSlideContent.content}
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="flex justify-between items-center mt-6">
          <Button
            onClick={() => handleSlideChange(Math.max(0, currentSlide - 1))}
            disabled={currentSlide === 0}
            variant="outline"
            className="border-green-600 text-green-300 hover:bg-green-600/20"
          >
            <ArrowLeft className="mr-2 w-4 h-4" /> Previous
          </Button>
          <div className="flex gap-2">
            {slides.map((_, index) => (
              <button key={index} onClick={() => handleSlideChange(index)} className={`w-3 h-3 rounded-full ${currentSlide === index ? 'bg-yellow-400' : 'bg-green-700'}`}></button>
            ))}
          </div>
          {currentSlide < slides.length - 1 ? (
            <Button
              onClick={() => handleSlideChange(currentSlide + 1)}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Next <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={() => { setCurrentStage('stageDivider'); setCurrentSlide(0); setSlideDirection(1); }}
              className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-8 py-3 text-lg"
            >
              Begin Game <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          )}
        </div>
      </div>
    );
  };

  const renderStageDivider = () => (
    <div className="max-w-4xl mx-auto text-center">
      <div className="bg-black/20 backdrop-blur-md rounded-2xl p-8 border border-yellow-600/30">
        <h2 className="text-3xl font-bold text-white mb-6">Stage 1: Live Demo</h2>
        <p className="text-green-200 mb-8">The system will present a poker scenario with an opening hand and a community board and a verbal explanation.</p>
        <Button onClick={() => setCurrentStage('demo')} className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold">Start Demo <ArrowRight className="ml-2 w-4 h-4" /></Button>
      </div>
    </div>
  );

  const renderStage2Divider = () => (
    <div className="max-w-4xl mx-auto text-center">
      <div className="bg-black/20 backdrop-blur-md rounded-2xl p-8 border border-blue-600/30">
        <h2 className="text-3xl font-bold text-white mb-6">Stage 2: Guided Practice</h2>
        <p className="text-blue-200 mb-8">Scenarios with active clues will be presented.</p>
        <Button onClick={() => { setCurrentStage('stage2'); setCurrentQuestion(0); resetForNextQuestion(); }} className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold">Start Practice <ArrowRight className="ml-2 w-4 h-4" /></Button>
      </div>
    </div>
  );

  const renderStage3Divider = () => (
    <div className="max-w-4xl mx-auto text-center">
      <div className="bg-black/20 backdrop-blur-md rounded-2xl p-8 border border-purple-600/30">
        <h2 className="text-3xl font-bold text-white mb-6">Stage 3: Independent Practice</h2>
        <p className="text-purple-200 mb-8">New scenarios will be presented without clues. Immediate feedback will be given on correct/incorrect identification of dirty outs and final count.</p>
        <Button onClick={() => { setCurrentStage('stage3'); setCurrentQuestion(0); resetForNextQuestion(); }} className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold">Start Independent Practice <ArrowRight className="ml-2 w-4 h-4" /></Button>
      </div>
    </div>
  );

  const renderFinalDivider = () => (
    <div className="max-w-4xl mx-auto text-center">
      <div className="bg-black/20 backdrop-blur-md rounded-2xl p-8 border border-red-600/30">
        <h2 className="text-3xl font-bold text-white mb-6">Final Stage: The Main Challenge</h2>
        <div className="bg-red-900/30 rounded-xl p-6 mb-8 text-left">
          <p className="text-red-200 mb-4">• <strong>Format:</strong> Timed, multi-scenario quiz. Each scenario will present a hand, board, and an opponent's estimated drawing hand.</p>
          <p className="text-red-200 mb-4">• <strong>Timing:</strong> Time limit of 30 seconds for each scenario</p>
          <p className="text-red-200">• <strong>Passing:</strong> You need at least 4 out of 6 correct answers to pass</p>
        </div>
        <Button onClick={() => { setCurrentStage('final'); setCurrentQuestion(0); setFinalScore(0); setFinalAnswers([]); resetForNextQuestion(); }} className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold">Start Final Challenge <ArrowRight className="ml-2 w-4 h-4" /></Button>
      </div>
    </div>
  );

  const renderLiveDemo = () => {
    const step = demoSteps[demoStep];
    return (
      <div className="max-w-7xl mx-auto flex flex-col items-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={demoStep}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.6 }}
            className="w-full flex flex-col items-center"
          >
            <h2 className="text-3xl font-bold text-white text-center mb-4">{step.title}</h2>
            <div className="w-full max-w-4xl bg-black/40 p-4 rounded-xl border border-yellow-400/30 text-center mb-6">
              <p className="text-yellow-200">{step.narration}</p>
            </div>
            <div className="w-full h-[300px] md:h-[400px] relative">
              <PokerTable players={step.players} communityCards={step.communityCards} dealerPosition="BTN" />
            </div>
            <br /> <br />  <br /> <br /> <br /> <br />  <br />


            <div className="mt-20 md:mt-4 bg-white/5 p-4 rounded-lg w-full max-w-4xl">
              <h3 className="text-white font-bold text-center mb-4">Outs Analysis</h3>
              <div className="flex justify-center flex-wrap gap-2 mb-4">
                {step.outs.initial.map(card => {
                  const isDirty = step.outs.dirty.includes(card);
                  const isHighlighted = step.outs.highlighted.includes(card);
                  return (
                    <motion.div
                      key={card}
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.2 }}
                      className={`relative transition-all duration-300 ${isHighlighted ? 'opacity-100 scale-105' : 'opacity-40'}`}
                    >
                      <PlayingCard card={card} />
                      {isDirty && (
                        <div className="absolute inset-0 bg-red-500/50 rounded-md flex items-center justify-center">
                          <ThumbsDown className="w-6 h-6 text-white" />
                        </div>
                      )}
                    </motion.div>
                  )
                })}
              </div>
              <div className="bg-black/30 p-3 rounded-lg text-center">
                <p className="text-yellow-300 font-bold text-lg">{step.calculation}</p>
              </div>
            </div>

          </motion.div>
        </AnimatePresence>
        <div className="flex justify-between items-center mt-8 w-full max-w-lg">
          <Button onClick={() => setDemoStep(s => Math.max(0, s-1))} disabled={demoStep === 0} variant="outline" className="border-green-700 text-green-300 hover:bg-green-700/20"><ArrowLeft className="mr-2 w-4 h-4" /> Previous</Button>
          <span className="text-green-300">{demoStep + 1} / {demoSteps.length}</span>
          {demoStep < demoSteps.length - 1 ? (
            <Button onClick={() => setDemoStep(s => s + 1)} className="bg-green-700 hover:bg-green-800 text-white">Next <ArrowRight className="ml-2 w-4 h-4" /></Button>
          ) : (
            <Button onClick={() => setCurrentStage('stage2Divider')} className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold">Continue to Practice <ArrowRight className="ml-2 w-4 h-4" /></Button>
          )}
        </div>
      </div>
    );
  };

  const renderStage2 = () => {
    const question = stage2Questions[currentQuestion];
    const isCorrect = sliderValue[0] === question.correct;

    return (
      <div className="max-w-5xl mx-auto">
        <div className="bg-black/20 backdrop-blur-md rounded-2xl p-8 border border-blue-600/30">
          <h2 className="text-3xl font-bold text-white text-center mb-6">Stage 2: Guided Practice</h2>
          <p className="text-center text-blue-300 mb-4">Scenario {currentQuestion + 1} of {stage2Questions.length}</p>

          <div className="w-full h-[300px] md:h-[350px] relative mb-6">
            <PokerTable
              players={[{ position: 'BTN', stack: 500, cards: question.hand, isHero: true }]}
              communityCards={question.board}
              dealerPosition="BTN"
            />
          </div>

          <br /> <br /> <br /> <br /> <br /> <br /> <br /> <br />

          <div className="bg-white/5 rounded-xl p-6 mb-6">
            <div className="text-center mb-4">
              <p className="text-white text-lg mb-2"><strong>Opponent Information:</strong> {question.opponent}</p>
              <p className="text-yellow-300 text-lg font-bold">Task: Count your beneficial outs! Remove the Dirt</p>
            </div>

            <div className="bg-black/30 rounded-lg p-4 mb-4">
              <label className="block text-white font-bold mb-2">True Outs Count:</label>
              <Slider
                value={sliderValue}
                onValueChange={setSliderValue}
                max={15}
                min={1}
                step={1}
                className="w-full mb-2"
              />
              <div className="text-center text-yellow-300 font-bold text-xl">{sliderValue[0]}</div>
            </div>

            {!showExplanation && showHint > 0 && (
              <div className="bg-blue-900/30 rounded-xl p-4 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb className="w-5 h-5 text-blue-300" />
                  <span className="text-blue-300 font-bold">Hint {showHint}:</span>
                </div>
                <p className="text-blue-200">{question.hints[showHint - 1]}</p>
              </div>
            )}

            {showExplanation && (
              <div className={`rounded-xl p-6 mb-4 ${isCorrect ? 'bg-green-900/30 border-green-500' : 'bg-red-900/30 border-red-500'} border`}>
                <div className="flex items-center gap-2 mb-3">
                  {isCorrect ? <CheckCircle className="w-6 h-6 text-green-400" /> : <ThumbsDown className="w-6 h-6 text-red-400" />}
                  <h3 className="text-xl font-bold text-white">{isCorrect ? 'Correct!' : 'Incorrect'}</h3>
                </div>
                <p className="text-green-200">{question.explanation}</p>
                {!isCorrect && <p className="text-yellow-200 mt-2">The correct answer was {question.correct} outs.</p>}
              </div>
            )}
          </div>

          <div className="flex justify-between items-center">
            {!showExplanation ? (
              <div className="flex justify-between w-full">
                <Button onClick={() => setShowExplanation(true)} className="bg-blue-600 hover:bg-blue-700 text-white">Submit Answer</Button>
                {showHint < question.hints.length && (
                  <Button onClick={() => setShowHint(h => h + 1)} variant="outline" className="border-yellow-600 text-yellow-300 hover:bg-yellow-600/20">
                    <Lightbulb className="mr-2 w-4 h-4" />
                    Get Hint {showHint + 1}
                  </Button>
                )}
              </div>
            ) : (
              <Button
                onClick={() => {
                  if (currentQuestion < stage2Questions.length - 1) {
                    setCurrentQuestion(q => q + 1);
                    resetForNextQuestion();
                  } else {
                    setCurrentStage('stage3Divider');
                  }
                }}
                className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold ml-auto"
              >
                {currentQuestion < stage2Questions.length - 1 ? 'Next Scenario' : 'Continue to Stage 3'}
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderStage3 = () => {
    const question = stage3Questions[currentQuestion];
    const isCorrect = sliderValue[0] === question.correct;

    return (
      <div className="max-w-5xl mx-auto">
        <div className="bg-black/20 backdrop-blur-md rounded-2xl p-8 border border-purple-600/30">
          <h2 className="text-3xl font-bold text-white text-center mb-6">Stage 3: Independent Practice</h2>
          <p className="text-center text-purple-300 mb-4">Scenario {currentQuestion + 1} of {stage3Questions.length}</p>

          <div className="w-full h-[300px] md:h-[350px] relative mb-6">
            <PokerTable
              players={[{ position: 'BTN', stack: 500, cards: question.hand, isHero: true }]}
              communityCards={question.board}
              dealerPosition="BTN"
            />
          </div>

          <br /> <br /> <br /> <br /> <br /> <br /> <br /> <br />

          <div className="bg-white/5 rounded-xl p-6 mb-6">
            <div className="text-center mb-4">
              <p className="text-white text-lg mb-2"><strong>Opponent Information:</strong> {question.opponent}</p>
              <p className="text-yellow-300 text-lg font-bold">Task: Count your beneficial outs! Remove the Dirt</p>
            </div>

            <div className="bg-black/30 rounded-lg p-4 mb-4">
              <label className="block text-white font-bold mb-2">True Outs Count:</label>
              <Slider
                value={sliderValue}
                onValueChange={setSliderValue}
                max={15}
                min={1}
                step={1}
                className="w-full mb-2"
              />
              <div className="text-center text-yellow-300 font-bold text-xl">{sliderValue[0]}</div>
            </div>

            {showExplanation && (
              <div className={`rounded-xl p-6 mb-4 ${isCorrect ? 'bg-green-900/30 border-green-500' : 'bg-red-900/30 border-red-500'} border`}>
                <div className="flex items-center gap-2 mb-3">
                  {isCorrect ? <CheckCircle className="w-6 h-6 text-green-400" /> : <ThumbsDown className="w-6 h-6 text-red-400" />}
                  <h3 className="text-xl font-bold text-white">{isCorrect ? 'Correct!' : 'Incorrect'}</h3>
                </div>
                <p className="text-green-200">{question.explanation}</p>
                {!isCorrect && <p className="text-yellow-200 mt-2">The correct answer was {question.correct} outs.</p>}
              </div>
            )}
          </div>

          <div className="flex justify-center">
            {!showExplanation ? (
              <Button onClick={() => setShowExplanation(true)} className="bg-purple-600 hover:bg-purple-700 text-white">Submit Answer</Button>
            ) : (
              <Button
                onClick={() => {
                  if (currentQuestion < stage3Questions.length - 1) {
                    setCurrentQuestion(q => q + 1);
                    resetForNextQuestion();
                  } else {
                    setCurrentStage('finalDivider');
                  }
                }}
                className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold"
              >
                {currentQuestion < stage3Questions.length - 1 ? 'Next Scenario' : 'Continue to Final Challenge'}
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderFinal = () => {
    const question = finalQuestions[currentQuestion];
    const isCorrect = sliderValue[0] === question.correct;

    return (
      <div className="max-w-5xl mx-auto">
        <div className="bg-black/20 backdrop-blur-md rounded-2xl p-8 border border-red-600/30">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-3xl font-bold text-white">Final Challenge</h2>
            <div className="flex items-center gap-2 text-red-300">
              <Clock className="w-5 h-5" />
              <span className="font-bold text-xl">{timeLeft}s</span>
            </div>
          </div>
          <p className="text-center text-red-300 mb-4">Question {currentQuestion + 1} of {finalQuestions.length}</p>
          <div className="mb-4">
            <Progress value={(timeLeft / 30) * 100} className="w-full h-2" />
          </div>

          <div className="w-full h-[300px] md:h-[350px] relative mb-6">
            <PokerTable
              players={[{ position: 'BTN', stack: 500, cards: question.hand, isHero: true }]}
              communityCards={question.board}
              dealerPosition="BTN"
            />
          </div>

          <br /> <br /> <br /> <br /> <br /> <br /> <br /> <br />

          <div className="bg-white/5 rounded-xl p-6 mb-6">
            <div className="text-center mb-4">
              <p className="text-white text-lg mb-2"><strong>Opponent Information:</strong> {question.opponent}</p>
              <p className="text-yellow-300 text-lg font-bold">Task: Count your beneficial outs! Remove the Dirt</p>
            </div>

            <div className="bg-black/30 rounded-lg p-4 mb-4">
              <label className="block text-white font-bold mb-2">True Outs Count:</label>
              <Slider
                value={sliderValue}
                onValueChange={setSliderValue}
                max={15}
                min={1}
                step={1}
                className="w-full mb-2"
                disabled={showExplanation}
              />
              <div className="text-center text-yellow-300 font-bold text-xl">{sliderValue[0]}</div>
            </div>

            {showExplanation && (
              <div className={`rounded-xl p-6 mb-4 ${isCorrect ? 'bg-green-900/30 border-green-500' : 'bg-red-900/30 border-red-500'} border`}>
                <div className="flex items-center gap-2 mb-3">
                  {isCorrect ? <CheckCircle className="w-6 h-6 text-green-400" /> : <ThumbsDown className="w-6 h-6 text-red-400" />}
                  <h3 className="text-xl font-bold text-white">{isCorrect ? 'Correct!' : 'Incorrect'}</h3>
                </div>
                <p className="text-green-200">The correct answer was {question.correct} outs.</p>
              </div>
            )}
          </div>

          <div className="flex justify-center">
            {!showExplanation ? (
              <Button onClick={handleFinalSubmit} className="bg-red-600 hover:bg-red-700 text-white">Submit Answer</Button>
            ) : (
              <Button
                onClick={() => {
                  if (currentQuestion < finalQuestions.length - 1) {
                    setCurrentQuestion(q => q + 1);
                    resetForNextQuestion();
                  } else {
                    setCurrentStage('results');
                  }
                }}
                className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold"
              >
                {currentQuestion < finalQuestions.length - 1 ? 'Next Question' : 'View Results'}
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderResults = () => {
    const passed = finalScore >= 4;

    return (
      <div className="max-w-4xl mx-auto text-center">
        <div className="bg-black/20 backdrop-blur-md rounded-2xl p-8 border border-green-600/30">
          <Trophy className={`w-20 h-20 mx-auto mb-6 ${passed ? 'text-yellow-400' : 'text-gray-400'}`} />
          <h2 className="text-4xl font-bold text-white mb-4">
            {passed ? 'Congratulations!!!' : 'Not enough!!!'}
          </h2>

          <div className="bg-white/10 rounded-xl p-6 mb-8">
            <h3 className="text-2xl font-bold text-white mb-2">Final Score: {finalScore} / 6</h3>
            <p className={`font-bold text-lg ${passed ? 'text-green-400' : 'text-red-400'}`}>
              {passed ? 'You Passed!' : 'You need at least 4 correct answers to pass'}
            </p>
          </div>

          {passed ? (
            <p className="text-green-200 text-lg mb-8">
              You have successfully completed the Outs Discount (Advanced) — remove "dirty outs" mini-game.
              You now have the knowledge on how to identify and count true outs for a given drawing hand on the flop,
              by deducting "dirty outs" that complement a stronger hand for the opponent. This is a very Important ability
              that will help you to calculate and understand your real probability to win a hand, providing a solid knowledge
              for your further studies in poker decision making. Keep practicing and applying what you have learned!
            </p>
          ) : (
            <p className="text-red-200 text-lg mb-8">
              You did not have enough correct answers. Go and try again to complete this minigame. You Can Do It!
            </p>
          )}

          <Button
            onClick={() => completeGame(passed)}
            className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-8 py-3 text-lg"
          >
            {passed ? 'Return to Home' : 'Try Again'}
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (currentStage) {
        case 'intro': return renderIntro();
        case 'explanation': return renderExplanation();
        case 'gameIntro': return renderGameIntro();
        case 'stageDivider': return renderStageDivider();
        case 'demo': return renderLiveDemo();
        case 'stage2Divider': return renderStage2Divider();
        case 'stage2': return renderStage2();
        case 'stage3Divider': return renderStage3Divider();
        case 'stage3': return renderStage3();
        case 'finalDivider': return renderFinalDivider();
        case 'final': return renderFinal();
        case 'results': return renderResults();
        default: return renderIntro();
    }
  };

  return (
    <div className="min-h-screen py-8 px-4">
        <div className="max-w-7xl mx-auto mb-6">
            <Button onClick={() => navigate(createPageUrl("Home"))} variant="outline" className="border-green-600 text-green-300 hover:bg-green-600/20">
                <ArrowLeft className="mr-2 w-4 h-4" /> Back to Home
            </Button>
        </div>
        <AnimatePresence mode="wait">
            <motion.div
                key={currentStage + currentQuestion + demoStep + currentSlide}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
            >
                {renderContent()}
            </motion.div>
        </AnimatePresence>
    </div>
  );
}
