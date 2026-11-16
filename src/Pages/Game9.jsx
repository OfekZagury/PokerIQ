
import React, { useState, useEffect, useCallback } from "react";
import { UserService as User } from "@/services/user";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, ArrowRight, Trophy, CheckCircle, Calculator, Zap, TrendingUp, Target, Clock, ThumbsDown, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import PlayingCard from "../components/shared/PlayingCard";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { motion, AnimatePresence } from 'framer-motion';
import { track } from "@/lib/analytics";
import useActiveStopwatch from "@/hooks/useActiveStopwatch";

const explanationSlides = [
  {
    title: "Understanding Your Equity",
    content: "In poker, Equity represents your expected share of the pot if a hand reaches showdown. It quantifies your expected winnings and is directly linked to how often you anticipate winning in various scenarios. This concept focuses on long-term expectations, meaning it's about consistent profitability over many hands, rather than the outcome of a single hand. Understanding your equity is crucial for making informed decisions to bet, call, or fold, as it provides a clear picture of your rightful share of potential winnings.",
    example: "Imagine the pot is $100, and you have a flush draw on the turn with a 20% chance of hitting your flush on the river. Your equity in this pot is calculated as 20% of $100, which is $20. If the cost of calling is less than this expected return, it suggests a logical, long-term profitable decision.",
    icon: Target
  },
  {
    title: "Calculating Pot Odds",
    content: "Pot odds are a critical mathematical concept that allows you to assess the immediate profitability of calling a bet. They represent the ratio of the total money in the pot to the amount you must invest to call. Knowing your pot odds helps determine if a call is profitable, if you should raise, or if you should simply fold your hand.",
    example: "The pot is currently $30. Your opponent bets $10. If you call, the total pot will be $30 (current pot) + $10 (opponent's bet) = $40. The amount you need to call is $10. So, your pot odds are $40 : $10 or simply 4:1.",
    icon: Calculator
  },
  {
    title: "Converting Pot Odds to Percentages",
    content: "While ratios are helpful, many players find it easier to work with percentages for quick decision-making. To convert pot odds into a percentage, use this calculation: Percentage Needed = [Amount to Call] / ([Total Pot Size after your call]). Once you have this percentage, you compare it directly to your equity (your probability of winning). If your equity percentage is greater than the percentage you need to call, then the call is profitable (+EV) in the long run.",
    example: "Using the previous example, you need to call $10 into a pot that will total $50 ($40 current pot + $10 your call) after your call. The percentage you need is $10 / $50 = 0.20, or 20%. If your hand has a 25% chance of winning (your equity), then since 25% is greater than 20%, calling is a profitable decision.",
    icon: TrendingUp
  },
  {
    title: "The Role of Implied Odds",
    content: "Implied odds are an extension of pot odds. They allow you to consider potential future earnings from later betting rounds if you manage to hit your strong hand. Even if the direct pot odds are unfavorable in the current round, you might justify a call if you expect to win a significant amount of additional money after completing your draw. This is particularly relevant when you're in position (last to act) or in multi-way pots with several opponents, as these scenarios often yield good implied odds.",
    example: "You're on the flop with a flush draw, and the pot odds don't quite justify a call. However, your opponent has a deep stack and is known to be a 'calling station'. If you hit your flush, you anticipate they'll pay you off with multiple large bets on future streets. This potential future gain means you have good implied odds, making the call profitable despite the immediate odds.",
    icon: Zap
  },
  {
    title: "Conclusion",
    content: "Mastering equity, pot odds, and understanding implied odds is foundational for making mathematically sound, profitable decisions in No-Limit Hold'em. These concepts enable you to gain a significant edge over opponents who rely solely on intuition.",
    icon: Zap
  }
];

const stage2Questions = [
  {
    scenario: "The pot is $80. Your opponent bets $20. You have a 9-out flush draw on the turn. (Reminder: Use the Rule of 2 to estimate equity on the turn: 9 outs * 2 = 18%).",
    steps: [
      { question: "What is the amount you need to call?", correct: "20", hint: "This is the amount your opponent just bet.", feedback: "The bet of your opponent" },
      { question: "What will be the total pot size after your call?", correct: "120", hint: "Add the current pot, your opponent's bet, and your own call amount.", feedback: "The pot before your opponent bet + your opponent and your $40" },
      { question: "What is the ratio you need to call based on the pot odds? (Answer in the format of: 1:X)", correct: "1:6", hint: "Divide the total pot after your call by the amount to call.", feedback: "$20 bet : $120 pot size after call" },
      { question: "Your estimated equity is 18%. Is calling profitable in this situation?", options: ["Yes", "No"], correct: 0, hint: "Compare your estimated equity percentage to the percentage you need to call. If your equity is higher, it's a +EV call.", feedback: "1:6 ~ 16.67% < 18% equity. Since equity is higher than pot odds the right decision is a Call" }
    ]
  },
  {
    scenario: "The pot is $50. Your opponent bets $10. You have an 8-out open-ended straight draw on the flop. (Reminder: Use the Rule of 4 to estimate equity on the flop: 8 outs * 4 = 32%).",
    steps: [
      { question: "What is the amount you need to call?", correct: "10", hint: "This is the amount your opponent just bet.", feedback: "The bet of your opponent" },
      { question: "What will be the total pot size after your call?", correct: "70", hint: "Add the current pot, your opponent's bet, and your own call amount.", feedback: "The pot before your opponent bet + your opponent and you ($20)" },
      { question: "What is the ratio you need to call based on the pot odds? (Answer in the format of: 1:X)", correct: "1:7", hint: "Divide the total pot after your call by the amount to call.", feedback: "$10 bet : $70 pot size after call" },
      { question: "Your estimated equity is 32%. Is calling profitable in this situation?", options: ["Yes", "No"], correct: 0, hint: "Compare your estimated equity percentage to the percentage you need to call. If your equity is higher, it's a +EV call.", feedback: "1:7 ~ 14.28% < 32% equity. Since equity is higher than pot odds the right decision is a Call" }
    ]
  },
  {
    scenario: "The pot is $70. Your opponent bets $30. You have a 9-out flush draw on the flop (equity 9 * 4 = 36%). Your direct pot odds calculations show that calling is profitable. However, you know your opponent is a 'NIT' (a very tight player who only plays premium hands and avoids paying off big draws).",
    steps: [
      { question: "While calling is profitable based on direct pot odds, how might your opponent's playing style (NIT) affect your implied odds (potential future winnings)?", options: ["Makes them Good", "Makes them Bad", "Has No Effect"], correct: 1, hint: "Implied odds consider future earnings if you hit your hand. If a player is unlikely to pay you off on later streets, are your implied odds strong?", feedback: "While the direct pot odds justify a call, implied odds are poor against a NIT. They rarely pay off on future streets when you hit, so there's little extra money to win and sometimes risk of reverse implied odds if they hold stronger hands." }
    ]
  }
];

const stage3Questions = [
  {
    scenario: "Pot $60. Opponent bets $30. You have 7 outs on the turn.",
    equity: 14, // 7*2
    potAfterBet: 90, // 60+30
    callAmount: 30,
    totalPotAfterCall: 120, // 90+30
    percentageNeeded: 25, // 30/120
    decision: "FOLD", // 14% < 25%
    explanation: "Equity (7*2) = 14%. Percentage needed = $30/$120 = 25%. Decision: Fold (14% < 25%)."
  },
  {
    scenario: "Pot $120. Opponent bets $40. You have 10 outs on the flop.",
    equity: 40, // 10*4
    potAfterBet: 160, // 120+40
    callAmount: 40,
    totalPotAfterCall: 200, // 160+40
    percentageNeeded: 20, // 40/200
    decision: "CALL", // 40% > 20%
    explanation: "Equity (10*4) = 40%. Percentage needed = $40/$200 = 20%. Decision: Call (40% > 20%)."
  },
  {
    scenario: "Pot $40. Opponent bets $10. You have 6 outs on the turn.",
    equity: 12, // 6*2
    potAfterBet: 50, // 40+10
    callAmount: 10,
    totalPotAfterCall: 60, // 50+10
    percentageNeeded: 16.7, // 10/60
    decision: "FOLD", // 12% < 16.7%
    explanation: "Equity (6*2) = 12%. Percentage needed = $10/$60 = 16.7%. Decision: Fold (12% < 16.7%)."
  },
  {
    scenario: "Pot $150. Opponent bets $50. You have 11 outs on the flop.",
    equity: 44, // 11*4
    potAfterBet: 200, // 150+50
    callAmount: 50,
    totalPotAfterCall: 250, // 200+50
    percentageNeeded: 20, // 50/250
    decision: "CALL", // 44% > 20%
    explanation: "Equity (11*4) = 44%. Percentage needed = $50/$250 = 20%. Decision: Call (44% > 20%)."
  },
  {
    scenario: "Pot $75. Opponent bets $25. You have 9 outs on the turn.",
    equity: 18, // 9*2
    potAfterBet: 100, // 75+25
    callAmount: 25,
    totalPotAfterCall: 125, // 100+25
    percentageNeeded: 20, // 25/125
    decision: "FOLD", // 18% < 20%
    explanation: "Equity (9*2) = 18%. Percentage needed = $25/$125 = 20%. Decision: Fold (18% < 20%)."
  }
];

const finalChallengeQuestions = [
  {
    scenario: "Pot: $90. Opponent bets: $30. You have a 9-out flush draw on the turn.",
    correct: "FOLD",
    calculation: "Equity: 18% (9*2), Need: 25% ($30/$120). 18% < 25% = Fold"
  },
  {
    scenario: "Pot: $75. Opponent bets: $25. You have an 8-out open-ended straight draw on the flop.",
    correct: "CALL",
    calculation: "Equity: 32% (8*4), Need: 20% ($25/$125). 32% > 20% = Call"
  },
  {
    scenario: "Pot: $100. Opponent bets: $50. You have 5 outs on the turn.",
    correct: "FOLD",
    calculation: "Equity: 10% (5*2), Need: 25% ($50/$200). 10% < 25% = Fold"
  },
  {
    scenario: "Pot: $110. Opponent bets: $55. You have a 12-out combination draw on the flop.",
    correct: "CALL",
    calculation: "Equity: 48% (12*4), Need: 25% ($55/$220). 48% > 25% = Call"
  },
  {
    scenario: "Pot: $80. Opponent bets: $40. You have 6 outs on the flop.",
    correct: "FOLD",
    calculation: "Equity: 24% (6*4), Need: 25% ($40/$160). 24% < 25% = Fold"
  },
  {
    scenario: "Pot: $50. Opponent bets: $10. You have a 10-out straight draw on the turn.",
    correct: "CALL",
    calculation: "Equity: 20% (10*2), Need: 14.3% ($10/$70). 20% > 14.3% = Call"
  },
  {
    scenario: "Pot: $100. Opponent bets: $20. You have 9 outs on the flop, and the opponent is a known 'calling station' who will pay off big draws.",
    correct: "CALL",
    calculation: "Equity: 36% (9*4), Need: 14.3% ($20/$140). 36% > 14.3% = Call (plus good implied odds)"
  }
];

export default function Game9() {
  const [currentStage, setCurrentStage] = useState('intro');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [inputValue, setInputValue] = useState("");
  const [showExplanation, setShowExplanation] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [finalStageScore, setFinalStageScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [user, setUser] = useState(null);
  const gameId = 9;
  const navigate = useNavigate();
  const timer = useActiveStopwatch();
  const completedRef = React.useRef(false);

  const resetQuestionState = useCallback(() => {
    setSelectedAnswer(null);
    setInputValue("");
    setShowExplanation(false);
    setShowHint(false);
    setTimeLeft(30);
  }, []);

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

  const handleFinalStageNext = useCallback(() => {
    const question = finalChallengeQuestions[currentQuestion];
    const isCorrect = selectedAnswer === question.correct;

    if (isCorrect) {
      setFinalStageScore(s => s + 1);
    }

    setTimeout(() => {
      if (currentQuestion < finalChallengeQuestions.length - 1) {
        setCurrentQuestion(q => q + 1);
        resetQuestionState();
      } else {
        setCurrentStage('completion');
      }
    }, 2000);
  }, [selectedAnswer, currentQuestion, resetQuestionState]);

  useEffect(() => {
    if (currentStage !== 'final' || showExplanation) return;
    if (timeLeft <= 0) {
      handleFinalStageNext();
      return;
    }
    const timer = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [currentStage, timeLeft, showExplanation, handleFinalStageNext]);

  const loadUser = async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);
    } catch (error) {
      console.error("Error loading user:", error);
    }
  };

  const completeGame = async (passed) => {
    if (!user) return;
    if (passed) {
      const today = new Date().toISOString().split('T')[0];
      completedRef.current = true;
      const spentSec = timer.readSeconds();
      track("Game Completed", { gameId, spentSec });
      await User.completeGame(9);
    }
    navigate(createPageUrl("Home"));
  };

  const retryFinalChallenge = () => {
    setCurrentQuestion(0);
    setFinalStageScore(0);
    resetQuestionState();
    setCurrentStage('final');
  };

  const handleNextQuestion = (questions, nextStage) => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(q => q + 1);
      setCurrentStep(0);
      resetQuestionState();
    } else {
      setCurrentStage(nextStage);
      setCurrentQuestion(0);
      setCurrentStep(0);
      resetQuestionState();
    }
  };

  const renderIntro = () => (
    <div className="max-w-4xl mx-auto text-center">
      <div className="bg-black/20 backdrop-blur-md rounded-2xl p-8 border border-green-600/30">
        <Zap className="w-16 h-16 text-yellow-400 mx-auto mb-6" />
        <h1 className="text-4xl font-bold text-white mb-4">Game 9: Speed Math & Live Recalc</h1>
        <h2 className="text-2xl font-semibold text-green-300 mb-6">Quick Call or Clear Fold?</h2>
        <p className="text-green-200 text-lg mb-8">
          Master rapid pot odds calculations and equity assessments to make lightning-fast profitable decisions at the table.
        </p>
        <Button onClick={() => setCurrentStage('explanation')} className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-8 py-3 text-lg">Start Learning <ArrowRight className="ml-2 w-5 h-5" /></Button>
      </div>
    </div>
  );

  const renderExplanation = () => {
    const slide = explanationSlides[currentSlide];
    const IconComponent = slide.icon;

    return (
      <div className="max-w-5xl mx-auto">
        <div className="bg-black/20 backdrop-blur-md rounded-2xl p-8 border border-green-600/30">
          <div className="text-center mb-8">
            <IconComponent className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-white mb-2">{slide.title}</h2>
          </div>
          <div className="bg-white/10 rounded-xl p-6 mb-6">
            <p className="text-green-200 text-lg leading-relaxed mb-4">{slide.content}</p>
            {slide.example && (
              <div className="bg-yellow-400/10 rounded-lg p-4 border border-yellow-400/30">
                <p className="text-yellow-200">
                  <strong>Example:</strong> {slide.example}
                </p>
              </div>
            )}
          </div>
          <div className="flex justify-between items-center">
            <Button onClick={() => setCurrentSlide(s => Math.max(0, s - 1))} disabled={currentSlide === 0} variant="outline" className="border-green-600 text-green-300 hover:bg-green-600/20"><ArrowLeft className="mr-2 w-4 h-4" /> Previous</Button>
            <span className="text-green-300">{currentSlide + 1} of {explanationSlides.length}</span>
            {currentSlide < explanationSlides.length - 1 ? (
              <Button onClick={() => setCurrentSlide(s => s + 1)} className="bg-green-600 hover:bg-green-700 text-white">Next <ArrowRight className="ml-2 w-4 h-4" /></Button>
            ) : (
              <Button onClick={() => setCurrentStage('gameIntro')} className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold">Start Game <ArrowRight className="ml-2 w-4 h-4" /></Button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderGameIntro = () => (
    <div className="max-w-4xl mx-auto text-center">
      <div className="bg-black/20 backdrop-blur-md rounded-2xl p-8 border border-green-600/30">
        <h2 className="text-3xl font-bold text-white mb-6">Quick Call or Clear Fold? Can you spot the winning move with Speed Math?</h2>
        <div className="bg-yellow-400/10 rounded-xl p-6 mb-6 text-left">
          <h3 className="text-xl font-bold text-white mb-4">Learning Objectives:</h3>
          <ul className="text-green-200 space-y-2 list-disc list-inside">
            <li>Accurately calculate pot odds ratios and conversion to percentages in given poker scenarios</li>
            <li>Apply the concepts of equity and pot odds to determine if calling a bet is a profitable (+EV) decision in at least 80% of practice scenarios</li>
          </ul>
        </div>
        <div className="bg-green-900/30 rounded-xl p-6 mb-8 text-left">
          <h3 className="text-xl font-bold text-white mb-4">Short Intro:</h3>
          <p className="text-green-200">
            In poker, making fast, profitable decisions often comes down to quick math. This mini-game will sharpen your ability to calculate your rightful share of the pot (your equity) and the price you're getting to call (pot odds), so you can always make the smartest move and transform your game.
          </p>
        </div>
        <Button onClick={() => setCurrentStage('stage1Intro')} className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-8 py-3 text-lg">Begin Game <ArrowRight className="ml-2 w-5 h-5" /></Button>
      </div>
    </div>
  );

  const renderStageIntro = (title, description, nextStage) => (
    <div className="max-w-4xl mx-auto text-center">
      <div className="bg-black/20 backdrop-blur-md rounded-2xl p-8 border border-green-600/30">
        <h2 className="text-3xl font-bold text-white mb-6">{title}</h2>
        <div className="bg-green-950/30 rounded-xl p-6 mb-8 text-left">
            <p className="text-green-200 text-lg">{description}</p>
        </div>
        <Button
          onClick={() => {
            setCurrentStage(nextStage);
            resetQuestionState();
            setCurrentQuestion(0);
            setCurrentStep(0);
          }}
          className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-8 py-3 text-lg"
        >
          Start Stage
          <ArrowRight className="ml-2 w-5 h-5" />
        </Button>
      </div>
    </div>
  );

  const renderStage1 = () => (
    <div className="max-w-5xl mx-auto">
      <div className="bg-black/20 backdrop-blur-md rounded-2xl p-8 border border-green-600/30">
        <h2 className="text-3xl font-bold text-white text-center mb-8">Stage 1: Live Demo - "The Mathematical Foundation"</h2>

        <div className="bg-white/5 rounded-xl p-6 mb-6">
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="text-xl font-bold text-white mb-4">Scenario Setup</h3>
              <p className="text-green-200 mb-2"><strong>Position:</strong> Turn</p>
              <p className="text-green-200 mb-2"><strong>Current Pot:</strong> $100</p>
              <p className="text-green-200 mb-2"><strong>Opponent's Bet:</strong> $20</p>
              <p className="text-green-200 mb-4"><strong>Your Hand:</strong> Flush Draw (9 outs)</p>
              <p className="text-green-200"><strong>Estimated Equity:</strong> 20% (9 outs × 2 = 18%, rounded up)</p>
            </div>

            <div>
              <h3 className="text-xl font-bold text-white mb-4">Step-by-Step Calculation</h3>
              <div className="space-y-3">
                <div className="bg-blue-900/30 rounded-lg p-3">
                  <p className="text-blue-300 font-bold">1. Understanding Equity:</p>
                  <p className="text-blue-200 text-sm">Your expected share: 20% × $100 = $20</p>
                </div>
                <div className="bg-purple-900/30 rounded-lg p-3">
                  <p className="text-purple-300 font-bold">2. Pot Odds (Ratio):</p>
                  <p className="text-purple-200 text-sm">$120 : $20 = 6:1</p>
                </div>
                <div className="bg-green-900/30 rounded-lg p-3">
                  <p className="text-green-300 font-bold">3. Converting to %:</p>
                  <p className="text-green-200 text-sm">$20 / $140 = 14.3%</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-green-900/30 rounded-xl p-6 mb-8">
          <h3 className="text-xl font-bold text-white mb-4">🎯 Decision: CALL</h3>
          <p className="text-green-200">
            Your equity (20%) is greater than the percentage needed to call (14.3%).
            This makes calling a profitable (+EV) decision in the long run.
          </p>
        </div>

        <div className="text-center">
          <Button onClick={() => { setCurrentStage('stage2Intro'); resetQuestionState(); setCurrentQuestion(0); setCurrentStep(0); }} className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-8 py-3">Continue to Practice <ArrowRight className="ml-2 w-5 h-5" /></Button>
        </div>
      </div>
    </div>
  );

  const renderStage2 = () => {
    const question = stage2Questions[currentQuestion];
    const currentStepData = question.steps[currentStep];
    const isLastStep = currentStep === question.steps.length - 1;
    const isInputStep = !currentStepData.options;
    const isCorrect = isInputStep ? inputValue.trim().toLowerCase() === currentStepData.correct.toLowerCase() : selectedAnswer === currentStepData.correct;

    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-black/20 backdrop-blur-md rounded-2xl p-8 border border-green-600/30">
          <h2 className="text-3xl font-bold text-white text-center mb-2">Stage 2: Guided Practice</h2>
          <p className="text-center text-green-300 mb-8">Question {currentQuestion + 1} of {stage2Questions.length} - Step {currentStep + 1} of {question.steps.length}</p>

          <div className="bg-white/5 rounded-xl p-6 mb-6">
            <p className="text-green-200 text-lg mb-4">{question.scenario}</p>
            <h4 className="text-xl font-bold text-white mb-2">{currentStepData.question}</h4>
          </div>

          {currentStepData.options ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              {currentStepData.options.map((option, index) => (
                <Button key={index} variant={selectedAnswer === index ? "default" : "secondary"} className={`h-16 text-lg ${selectedAnswer === index ? 'bg-green-500 hover:bg-green-600' : 'bg-white/10 hover:bg-white/20'}`} onClick={() => !showExplanation && setSelectedAnswer(index)} disabled={showExplanation}>
                  {option}
                </Button>
              ))}
            </div>
          ) : (
            <div className="mb-6">
              <Input
                type="text"
                placeholder="Enter your answer..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                disabled={showExplanation}
                className="text-lg h-16 bg-white/10 border-green-600/30 text-white"
              />
            </div>
          )}

          {!showExplanation && showHint && (
            <div className="bg-blue-900/30 rounded-xl p-4 mb-6 text-blue-200"><strong>Hint:</strong> {currentStepData.hint}</div>
          )}

          {showExplanation && (
            <div className={`rounded-xl p-6 mb-6 ${isCorrect ? 'bg-green-900/30 border-green-500' : 'bg-red-900/30 border-red-500'} border`}>
              <div className="flex items-center gap-2 mb-3">
                {isCorrect ? <CheckCircle className="w-6 h-6 text-green-400" /> : <ThumbsDown className="w-6 h-6 text-red-400" />}
                <h3 className="text-xl font-bold text-white">{isCorrect ? 'Correct!' : 'Incorrect'}</h3>
              </div>
              <p className="text-green-200">{currentStepData.feedback}</p>
              {!isCorrect && <p className="text-yellow-300 mt-2">The correct answer is: {currentStepData.correct}</p>}
            </div>
          )}

          <div className="flex justify-between items-center">
            {!showExplanation && currentStepData.hint && !showHint ? <Button onClick={() => setShowHint(true)} variant="outline" className="border-yellow-600 text-yellow-300 hover:bg-yellow-600/20"><Lightbulb className="w-4 h-4 mr-2" /> Hint</Button> : <div></div>}
            {!showExplanation ? (
              <Button onClick={() => setShowExplanation(true)} disabled={currentStepData.options ? selectedAnswer === null : !inputValue.trim()} className="bg-green-600 hover:bg-green-700 text-white">Submit Answer</Button>
            ) : (
              <Button onClick={() => {
                if (isLastStep) {
                  handleNextQuestion(stage2Questions, "stage3Intro");
                } else {
                  setCurrentStep(s => s + 1);
                  resetQuestionState();
                }
              }} className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold">
                {isLastStep ? (currentQuestion < stage2Questions.length - 1 ? 'Next Question' : 'Independent Practice') : 'Next Step'}
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderStage3 = () => {
    const question = stage3Questions[currentQuestion];

    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-black/20 backdrop-blur-md rounded-2xl p-8 border border-green-600/30">
          <h2 className="text-3xl font-bold text-white text-center mb-2">Stage 3: Independent Practice - "Solo Math Challenge"</h2>
          <p className="text-center text-green-300 mb-8">Question {currentQuestion + 1} of {stage3Questions.length}</p>

          <div className="bg-white/5 rounded-xl p-6 mb-6">
            <p className="text-green-200 text-lg mb-4">{question.scenario}</p>
            <h4 className="text-xl font-bold text-white mb-2">Should you CALL or FOLD?</h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <Button variant={selectedAnswer === "CALL" ? "default" : "secondary"} className={`h-16 text-lg ${selectedAnswer === "CALL" ? 'bg-green-500 hover:bg-green-600' : 'bg-white/10 hover:bg-white/20'}`} onClick={() => !showExplanation && setSelectedAnswer("CALL")} disabled={showExplanation}>
              CALL
            </Button>
            <Button variant={selectedAnswer === "FOLD" ? "default" : "secondary"} className={`h-16 text-lg ${selectedAnswer === "FOLD" ? 'bg-red-500 hover:bg-red-600' : 'bg-white/10 hover:bg-white/20'}`} onClick={() => !showExplanation && setSelectedAnswer("FOLD")} disabled={showExplanation}>
              FOLD
            </Button>
          </div>

          {showExplanation && (
            <div className={`rounded-xl p-6 mb-6 ${selectedAnswer === question.decision ? 'bg-green-900/30 border-green-500' : 'bg-red-900/30 border-red-500'} border`}>
              <div className="flex items-center gap-2 mb-3">
                {selectedAnswer === question.decision ? <CheckCircle className="w-6 h-6 text-green-400" /> : <ThumbsDown className="w-6 h-6 text-red-400" />}
                <h3 className="text-xl font-bold text-white">{selectedAnswer === question.decision ? 'Correct!' : 'Incorrect'}</h3>
              </div>
              <p className="text-green-200">{question.explanation}</p>
            </div>
          )}

          <div className="flex justify-end items-center">
            {!showExplanation ? (
              <Button onClick={() => setShowExplanation(true)} disabled={selectedAnswer === null} className="bg-green-600 hover:bg-green-700 text-white">Submit Answer</Button>
            ) : (
              <Button onClick={() => handleNextQuestion(stage3Questions, "finalIntro")} className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold">
                {currentQuestion < stage3Questions.length - 1 ? 'Next Question' : 'Lightning Round'}
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderFinalChallenge = () => {
    const question = finalChallengeQuestions[currentQuestion];
    const isCorrect = selectedAnswer === question.correct;

    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-black/20 backdrop-blur-md rounded-2xl p-8 border border-red-600/30">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-3xl font-bold text-white">Final Challenge: The Lightning Round</h2>
            <div className="text-red-400 font-bold text-lg flex items-center gap-2">
              <Clock className="w-5 h-5" />
              {timeLeft}s
            </div>
          </div>
          <p className="text-center text-red-300 mb-4">Question {currentQuestion + 1} of {finalChallengeQuestions.length}</p>
          <div className="mb-4"><Progress value={(timeLeft / 30) * 100} className="w-full h-2 bg-red-400" /></div>

          <div className="bg-white/5 rounded-xl p-6 mb-6">
            <p className="text-green-200 text-lg mb-4">{question.scenario}</p>
            <h4 className="text-xl font-bold text-white mb-2">CALL or FOLD?</h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <Button variant="secondary" className={`h-16 text-lg ${showExplanation && selectedAnswer === "CALL" ? (isCorrect ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600') : 'bg-white/10 hover:bg-white/20'}`} onClick={() => !showExplanation && setSelectedAnswer("CALL")} disabled={showExplanation}>
              CALL
            </Button>
            <Button variant="secondary" className={`h-16 text-lg ${showExplanation && selectedAnswer === "FOLD" ? (isCorrect ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600') : 'bg-white/10 hover:bg-white/20'}`} onClick={() => !showExplanation && setSelectedAnswer("FOLD")} disabled={showExplanation}>
              FOLD
            </Button>
          </div>

          {showExplanation && (
            <div className={`rounded-xl p-6 mb-6 ${isCorrect ? 'bg-green-900/30 border-green-500' : 'bg-red-900/30 border-red-500'} border`}>
              <div className="flex items-center gap-2 mb-3">
                {isCorrect ? <CheckCircle className="w-6 h-6 text-green-400" /> : <ThumbsDown className="w-6 h-6 text-red-400" />}
                <h3 className="text-xl font-bold text-white">{isCorrect ? 'Correct!' : 'Incorrect'}</h3>
              </div>
              <p className="text-green-200 mb-2"><strong>Correct Answer:</strong> {question.correct}</p>
              <p className="text-green-200"><strong>Calculation:</strong> {question.calculation}</p>
            </div>
          )}

          <div className="flex justify-end">
          {!showExplanation && (
              <Button onClick={() => handleFinalStageNext()} disabled={selectedAnswer === null} className="bg-red-600 hover:bg-red-700 text-white">Lock In Decision</Button>
          )}
          </div>
        </div>
      </div>
    );
  };

  const renderCompletion = () => {
    const totalQuestions = finalChallengeQuestions.length;
    const passed = finalStageScore >= 5; // Need at least 5 out of 7

    return (
      <div className="max-w-4xl mx-auto text-center">
        <div className="bg-black/20 backdrop-blur-md rounded-2xl p-8 border border-green-600/30">
          <Trophy className="w-20 h-20 text-yellow-400 mx-auto mb-6" />
          <h2 className="text-4xl font-bold text-white mb-4">Lightning Round Complete!</h2>
          <div className="bg-white/10 rounded-xl p-6 mb-8 text-center">
            <h3 className="text-2xl font-bold text-white mb-2">Your Score: {finalStageScore} / {totalQuestions}</h3>
            {passed ? (
              <div>
                <p className="text-green-400 font-bold text-lg">You passed! You've mastered speed math and quick decision-making.</p>
              </div>
            ) : (
              <p className="text-red-400 font-bold text-lg">You didn't pass this time. Practice your calculations and try again!</p>
            )}
          </div>
          {passed ? (
            <div>
              <p className="text-green-200 text-lg mb-8">Congratulations! You now have lightning-fast calculation skills for pot odds, equity assessment, and profitable decision-making. This speed and accuracy will give you a significant advantage in real games where quick math can mean the difference between profit and loss. Keep practicing these rapid calculations!</p>
              <Button onClick={() => completeGame(true)} className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-8 py-3 text-lg">
                Complete & Return to Home <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </div>
          ) : (
             <div className="flex justify-center gap-4">
                <Button onClick={retryFinalChallenge} className="bg-yellow-500 hover:bg-gray-700 text-black font-bold px-8 py-3 text-lg">
                  Try Again
                </Button>
                <Button onClick={() => completeGame(false)} className="bg-yellow-500 hover:bg-gray-700 text-black font-bold px-8 py-3 text-lg">
                  Return to Home
                </Button>
              </div>
          )}
        </div>
      </div>
    );
  };

  const getStageContent = () => {
    switch (currentStage) {
        case 'intro': return renderIntro();
        case 'explanation': return renderExplanation();
        case 'gameIntro': return renderGameIntro();
        case 'stage1Intro': return renderStageIntro('Stage 1: Live Demo', 'First, we will walk through a live demonstration of how to perform these calculations step-by-step.', 'stage1');
        case 'stage1': return renderStage1();
        case 'stage2Intro': return renderStageIntro('Stage 2: Guided Practice', 'Now, you will practice the calculations with guidance and hints to help you master the process.', 'stage2');
        case 'stage2': return renderStage2();
        case 'stage3Intro': return renderStageIntro('Stage 3: Independent Practice', 'Next, you will test your skills independently by making the call or fold decision on your own.', 'stage3');
        case 'stage3': return renderStage3();
        case 'finalIntro': return renderStageIntro('Final Challenge: Lightning Round', 'Finally, put your speed and accuracy to the test in a fast-paced lightning round against the clock.', 'final');
        case 'final': return renderFinalChallenge();
        case 'completion': return renderCompletion();
        default: return renderIntro();
    }
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-6xl mx-auto mb-6">
        <Button onClick={() => navigate(createPageUrl("Home"))} variant="outline" className="border-green-600 text-green-300 hover:bg-green-600/20"><ArrowLeft className="mr-2 w-4 h-4" /> Back to Home</Button>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentStage}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5 }}
        >
         {getStageContent()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
