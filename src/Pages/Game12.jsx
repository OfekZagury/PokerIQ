
import React, { useState, useEffect, useCallback } from "react";
import { UserService as User } from "@/services/user";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, ArrowRight, Trophy, CheckCircle, Calculator, Target, TrendingUp, Users, Activity, ThumbsDown, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import PlayingCard from "../components/shared/PlayingCard";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from 'framer-motion';
import { track } from "@/lib/analytics";
import useActiveStopwatch from "@/hooks/useActiveStopwatch";

const explanationSlides = [
  {
    title: "The Core Decision: +EV vs. -EV",
    content: "When facing a pre-flop all-in, your primary objective is to determine if calling is +EV (profitable in the long run) or –EV (unprofitable). You can profitably call when your equity (your chance of winning the pot) is greater than the percentage of the pot you must commit. Conversely, if your required investment is greater than your chance of making your hand, and you have poor implied odds, it should be a fold. Always aim for +EV plays to maximize your poker profits over time.",
    icon: Target
  },
  {
    title: "Pot Odds: The Immediate Price",
    content: "Pot odds are the ratio of the total pot size to the amount you must call. They tell you how much you stand to win immediately versus how much you are risking. To calculate pot odds as a percentage, divide the amount you need to call by the total pot after your call. For example, if the pot is $90 and your opponent goes all-in for $10 (making the total pot $100), you need to call $10. Your pot odds are $100:$10 or 10:1, which means you need to win 10% of the time ($10 / $100 = 0.10) to break even on the immediate call.",
    icon: Calculator
  },
  {
    title: "Our Equity vs. Opponent's Range",
    content: "Equity is your expected share of the pot if the hand goes to showdown, based on probabilities. In pre-flop all-in situations, it's crucial to assess your equity against your opponent's likely all-in jamming range, not just a specific hand. Opponents typically go all-in with strong hands like pocket Queens (QQ), Kings (KK), and Aces (AA). Estimating your equity requires understanding your hand's strength against this range. For instance, if you hold QQ and face an opponent's typical jamming range (e.g., TT+, AK), your equity might be around 70%.",
    icon: TrendingUp
  },
  {
    title: "Implied Odds in All-ins",
    content: "In most pre-flop all-in situations, especially in heads-up pots, implied odds are negligible because there are no future betting rounds to extract more value. Your decision should be based primarily on pot odds and equity. However, implied odds can be considered in specific multi-way scenarios: when there are three or more opponents in the hand, and at least two of those opponents are not all-in. In such rare cases, if you hit your hand, you might win additional chips from those who are not all-in.",
    icon: Users
  },
  {
    title: "The Declining Equity Concept",
    content: "A common mistake is overlooking how your equity declines as more players call a pre-flop all-in. Even with a premium hand like pocket Aces, your percentage chance of winning the pot decreases with each additional opponent who calls. For example, AA against one opponent might have 80%+ equity, but against three opponents, it could drop significantly, perhaps to 40-50%. This is a critical factor in multi-way all-in decisions.",
    icon: Activity
  }
];

const stage2Questions = [
  {
    playerHand: ['A♦', 'K♦'],
    board: [],
    scenario: "Blinds $0.50/$1. You have A♦K♦. Pot is currently $10. An opponent goes all-in for $5.",
    question: "What are your pot odds as a percentage if you call?",
    options: ["50%", "33.33%", "25%", "20%"],
    correct: 1,
    explanation: "Pot odds are calculated by dividing the amount you must call by the total pot after your call. $5 / ($10 + $5) = $5 / $15 = 0.3333 = 33.33%.",
    hint1: "Remember, pot odds are calculated by dividing the amount you must call by the total pot after your call.",
    hint2: "Don't forget to add the amount you're calling to the current pot to get the total pot size after your call."
  },
  {
    playerHand: ['J♥', 'J♣'],
    board: [],
    scenario: "Blinds $1/$2. You have J♥J♣. Pot is $20. An opponent goes all-in for $10. Your equity with J♥J♣ against their assumed strong all-in range (JJ+, AK) is 58%. Your calculated pot odds are 33.33%.",
    question: "Should you CALL or FOLD?",
    options: ["Call", "Fold"],
    correct: 0,
    explanation: "You can profitably call when your equity (your chance of winning) is greater than the percentage of the pot you must commit (your pot odds). Your 58% equity is higher than the 33.33% pot odds, making this a +EV call.",
    hint1: "You can profitably call when your equity (your chance of winning) is greater than the percentage of the pot you must commit (your pot odds).",
    hint2: "In this scenario, your 58% equity is higher than the 33.33% pot odds. What does that mean for your long-term profit?"
  },
  {
    playerHand: ['2♠', '2♣'],
    board: [],
    scenario: "Blinds $2/$4. You have 2♠2♣. An opponent in early position goes all-in for $40. The pot is currently $50. There are two players behind you, both with large stacks, who have not acted yet and are not all-in. Your equity against the all-in opponent's range is 20%. Your pot odds are 44.44%.",
    question: "Given the situation, are implied odds a relevant consideration for your decision?",
    options: ["Yes", "No"],
    correct: 0,
    explanation: "Implied odds are relevant here because there are multiple opponents and not all players are all-in. The two players behind you with large stacks could contribute additional chips if you hit your hand.",
    hint1: "When are implied odds typically negligible, and when can they be considered?",
    hint2: "Consider if there are multiple opponents and if all players are all-in. This affects future betting rounds."
  }
];

const stage3Questions = [
  {
    playerHand: ['A♣', 'K♣'],
    board: [],
    scenario: "You: A♣K♣. Blinds: $0.50/$1. Pot: $15. Villain (tight-aggressive): All-in for $7.50. Your equity vs. their assumed strong range (TT+, AK) is 42%.",
    question: "Calculate the pot odds and decide: CALL or FOLD?",
    potOdds: "33.33",
    decision: "CALL",
    explanation: "Pot odds: $7.50 / ($15 + $7.50) = 33.33%. Decision: CALL (42% equity > 33.33% pot odds)."
  },
  {
    playerHand: ['K♠', 'Q♠'],
    board: [],
    scenario: "You: K♠Q♠. Blinds: $1/$2. Pot: $25. Villain (loose-aggressive): All-in for $15. Your equity vs. their assumed wider range is 35%. Your pot odds are 37.5%.",
    question: "CALL or FOLD?",
    decision: "FOLD",
    explanation: "FOLD (35% equity < 37.5% pot odds). This is a -EV call."
  },
  {
    playerHand: ['A♥', 'A♦'],
    board: [],
    scenario: "You: A♥A♦. Multi-way all-in situation with 4 total players. Your equity against all three opponents' combined ranges is 50%. Your pot odds are 45%.",
    question: "CALL or FOLD?",
    decision: "CALL",
    explanation: "CALL (Even though equity declined due to multiple opponents, 50% equity > 45% pot odds. This is still a +EV call)."
  },
  {
    playerHand: ['T♣', '9♣'],
    board: [],
    scenario: "You: T♣9♣. Blinds: $0.50/$1. Pot: $12. Heads-up all-in for $6. Your equity is 28%. Your pot odds are 33.33%.",
    question: "CALL or FOLD? (Consider implied odds relevance)",
    decision: "FOLD",
    explanation: "FOLD (Implied odds are negligible in heads-up all-in. 28% equity < 33.33% pot odds)."
  },
  {
    playerHand: ['7♠', '7♦'],
    board: [],
    scenario: "You: 7♠7♦. Blinds: $1/$2. Pot: $30. Villain (NIT): All-in for $100. Your equity vs. their very tight range (KK+, AA) is 18%. Your pot odds are 25%.",
    question: "CALL or FOLD?",
    decision: "FOLD",
    explanation: "FOLD (18% equity < 25% pot odds. The villain's range is extremely strong)."
  }
];

const finalChallengeQuestions = [
  {
    playerHand: ['A♠', 'K♥'],
    board: [],
    scenario: "You: A♠K♥. Pot: $80. Villain All-in: $20. Your Equity: 55%. Pot Odds: 20%.",
    question: "Call or Fold?",
    options: ["CALL", "FOLD"],
    correct: 0,
    feedback: "CALL (55% equity > 20% pot odds). This is a clearly profitable decision."
  },
  {
    playerHand: ['6♣', '6♦'],
    board: [],
    scenario: "You: 6♣6♦. Pot: $30. Villain All-in: $15. Your Equity: 30%. Pot Odds: 33.33%.",
    question: "Call or Fold?",
    options: ["CALL", "FOLD"],
    correct: 1,
    feedback: "FOLD (30% equity < 33.33% pot odds). Your hand doesn't have enough equity to justify the call."
  },
  {
    playerHand: ['A♥', 'Q♥'],
    board: [],
    scenario: "You: A♥Q♥. Pot: $50. Villain All-in: $25. Your Equity: 48%. Pot Odds: 33.33%.",
    question: "Call or Fold?",
    options: ["CALL", "FOLD"],
    correct: 0,
    feedback: "CALL (48% equity > 33.33% pot odds). A solid +EV decision with suited big cards."
  },
  {
    playerHand: ['K♦', 'J♦'],
    board: [],
    scenario: "You: K♦J♦. Pot: $40. Villain All-in: $20. Two other players behind you not all-in. Your Equity (vs. all-in): 30%. Pot Odds: 33.33%.",
    question: "Are implied odds relevant here?",
    options: ["YES", "NO"],
    correct: 0,
    feedback: "YES - Multi-way pot with non-all-in players means potential for additional value if you hit your hand."
  },
  {
    playerHand: ['A♣', 'A♠'],
    board: [],
    scenario: "You: A♣A♠. Pot: $100. Villain All-in: $50. One player behind calls. Your Equity (vs. both): 60%. Pot Odds: 33.33%.",
    question: "Call or Fold?",
    options: ["CALL", "FOLD"],
    correct: 0,
    feedback: "CALL (60% equity > 33.33% pot odds). Despite declining equity from multi-way action, still profitable."
  }
];

export default function Game12() {
  const [currentStage, setCurrentStage] = useState('intro');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slideDirection, setSlideDirection] = useState(1);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [showHint, setShowHint] = useState(0);
  const [finalStageScore, setFinalStageScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15);
  const [user, setUser] = useState(null);
  const gameId = 12;
  const navigate = useNavigate();
  const timer = useActiveStopwatch();
  const completedRef = React.useRef(false);

  const resetQuestionState = useCallback(() => {
    setSelectedAnswer(null);
    setShowExplanation(false);
    setShowHint(0);
    setTimeLeft(15);
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
      await User.completeGame(12);
    }
    navigate(createPageUrl("Home"));
  };

  const handleNextQuestion = (questions, nextStage) => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(q => q + 1);
      resetQuestionState();
    } else {
      setCurrentStage(nextStage);
      setCurrentQuestion(0);
      resetQuestionState();
    }
  };

  const retryFinalChallenge = () => {
    setFinalStageScore(0);
    setCurrentQuestion(0);
    resetQuestionState();
    setCurrentStage('final');
  };

  const renderIntro = () => (
    <div className="max-w-4xl mx-auto text-center">
      <div className="bg-black/20 backdrop-blur-md rounded-2xl p-8 border border-green-600/30">
        <Calculator className="w-16 h-16 text-yellow-400 mx-auto mb-6" />
        <h1 className="text-4xl font-bold text-white mb-4">Game 12: Preflop All-ins</h1>
        <h2 className="text-2xl font-semibold text-green-300 mb-6">Common mistakes & what to do</h2>
        <p className="text-green-200 text-lg mb-8">
          Master the mathematics of preflop all-in decisions and avoid the costly mistakes that plague recreational players.
        </p>
        <Button onClick={() => setCurrentStage('explanation')} className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-8 py-3 text-lg">Start Learning <ArrowRight className="ml-2 w-5 h-5" /></Button>
      </div>
    </div>
  );

  const handleSlideChange = (newSlide) => {
    setSlideDirection(newSlide > currentSlide ? 1 : -1);
    setCurrentSlide(newSlide);
  };

  const renderExplanation = () => {
    const slide = explanationSlides[currentSlide];
    const IconComponent = slide.icon;

    return (
      <div className="max-w-5xl mx-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: slideDirection * 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -slideDirection * 300 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          >
            <div className="bg-black/20 backdrop-blur-md rounded-2xl p-8 border border-green-600/30">
              <div className="text-center mb-8">
                <IconComponent className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
                <h2 className="text-3xl font-bold text-white mb-2">{slide.title}</h2>
              </div>
              <div className="bg-white/10 rounded-xl p-6 min-h-[200px] flex items-center justify-center">
                <p className="text-green-200 text-lg leading-relaxed">{slide.content}</p>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
        <div className="flex justify-between items-center mt-8">
          <Button onClick={() => handleSlideChange(Math.max(0, currentSlide - 1))} disabled={currentSlide === 0} variant="outline" className="border-green-600 text-green-300 hover:bg-green-600/20"><ArrowLeft className="mr-2 w-4 h-4" /> Previous</Button>
          <span className="text-green-300">{currentSlide + 1} of {explanationSlides.length}</span>
          {currentSlide < explanationSlides.length - 1 ? (
            <Button onClick={() => handleSlideChange(currentSlide + 1)} className="bg-green-600 hover:bg-green-700 text-white">Next <ArrowRight className="ml-2 w-4 h-4" /></Button>
          ) : (
            <Button onClick={() => setCurrentStage('gameIntro')} className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold">Start Game <ArrowRight className="ml-2 w-4 h-4" /></Button>
          )}
        </div>
      </div>
    );
  };

  const renderGameIntro = () => (
    <div className="max-w-4xl mx-auto text-center">
      <div className="bg-black/20 backdrop-blur-md rounded-2xl p-8 border border-green-600/30">
        <h2 className="text-3xl font-bold text-white mb-6">Pre-flop All-ins: Can You Spot the Winning Call?</h2>
        <div className="bg-yellow-400/10 rounded-xl p-6 mb-6 text-left">
          <h3 className="text-xl font-bold text-white mb-4">Learning Objectives:</h3>
          <ul className="text-green-200 space-y-2 list-disc list-inside">
            <li>Determine pot odds and evaluate equity against opponent's pre-flop all-in range</li>
            <li>Make mathematically sound +EV decisions in single-way and multi-way all-in scenarios</li>
          </ul>
        </div>
        <div className="bg-green-900/30 rounded-xl p-6 mb-8 text-left">
          <h3 className="text-xl font-bold text-white mb-4">Game Introduction</h3>
          <p className="text-green-200">
            Pre-flop all-in situations are common in No-Limit Hold'em and often mishandled by recreational players, creating significant profit opportunities for those who understand the math. You'll learn to quickly assess these critical moments and make intelligent +EV decisions.
          </p>
        </div>
        <Button onClick={() => setCurrentStage('stage1')} className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-8 py-3 text-lg">Begin Game <ArrowRight className="ml-2 w-5 h-5" /></Button>
      </div>
    </div>
  );

  const renderStage1 = () => (
    <div className="max-w-5xl mx-auto">
      <div className="bg-black/20 backdrop-blur-md rounded-2xl p-8 border border-green-600/30">
        <h2 className="text-3xl font-bold text-white text-center mb-8">Stage 1: Live Demo - "The Foundational Call"</h2>

        <div className="bg-white/5 rounded-xl p-6 mb-6">
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="text-xl font-bold text-white mb-4">Scenario Setup</h3>
              <p className="text-green-200 mb-2"><strong>Blinds:</strong> $1/$2</p>
              <p className="text-green-200 mb-2"><strong>Your Hand:</strong></p>
              <div className="flex gap-2 mb-4">
                <PlayingCard card="Q♠" />
                <PlayingCard card="Q♦" />
              </div>
              <p className="text-green-200 mb-2"><strong>Villain (TAG, UTG):</strong> All-in for $40</p>
              <p className="text-green-200"><strong>Total Pot:</strong> $3 (blinds) + $40 = $43</p>
            </div>

            <div>
              <h3 className="text-xl font-bold text-white mb-4">Mathematical Analysis</h3>
              <div className="space-y-3">
                <div className="bg-blue-900/30 rounded-lg p-3">
                  <p className="text-blue-300 font-bold">1. Pot Odds:</p>
                  <p className="text-blue-200 text-sm">$40 / ($43 + $40) = 48.19%</p>
                </div>
                <div className="bg-purple-900/30 rounded-lg p-3">
                  <p className="text-purple-300 font-bold">2. Opponent Range:</p>
                  <p className="text-purple-200 text-sm">TAG UTG: TT+, AK</p>
                </div>
                <div className="bg-green-900/30 rounded-lg p-3">
                  <p className="text-green-300 font-bold">3. Our Equity:</p>
                  <p className="text-green-200 text-sm">QQ vs TT+, AK ≈ 69.55%</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-green-900/30 rounded-xl p-6 mb-8">
          <h3 className="text-xl font-bold text-white mb-4">🎯 Decision: CALL</h3>
          <p className="text-green-200">
            Our equity (69.55%) is significantly greater than the pot odds (48.19%) we are receiving.
            This indicates that calling is a +EV decision, meaning it will be profitable in the long run.
          </p>
        </div>

        <div className="text-center">
          <Button onClick={() => { setCurrentStage('stage2Intro'); }} className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-8 py-3">Continue to Practice <ArrowRight className="ml-2 w-5 h-5" /></Button>
        </div>
      </div>
    </div>
  );

  const StageIntro = ({ title, description, nextStage, buttonText, borderColor = "border-green-600/30" }) => (
    <div className="max-w-4xl mx-auto text-center">
      <div className={`bg-black/20 backdrop-blur-md rounded-2xl p-8 border ${borderColor}`}>
        <h2 className="text-3xl font-bold text-white mb-6">{title}</h2>
        <div className="bg-white/10 rounded-xl p-6 mb-8 text-left">
          <p className="text-green-200">{description}</p>
        </div>
        <Button
          onClick={() => { setCurrentStage(nextStage); resetQuestionState(); setCurrentQuestion(0); }}
          className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-8 py-3 text-lg"
        >
          {buttonText} <ArrowRight className="ml-2 w-5 h-5" />
        </Button>
      </div>
    </div>
  );

  const renderQuestionStage = (questions, stageTitle, nextStage) => {
    const question = questions[currentQuestion];
    const isCorrect = selectedAnswer === question.correct;

    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-black/20 backdrop-blur-md rounded-2xl p-8 border border-green-600/30">
          <h2 className="text-3xl font-bold text-white text-center mb-2">{stageTitle}</h2>
          <p className="text-center text-green-300 mb-8">Question {currentQuestion + 1} of {questions.length}</p>

          <div className="bg-white/5 rounded-xl p-6 mb-6">
            {question.playerHand && question.playerHand.length > 0 && (
              <div className="text-center mb-4">
                <p className="text-white font-semibold mb-2">Your Hand:</p>
                <div className="flex justify-center gap-2">
                  {question.playerHand.map(c => <PlayingCard key={c} card={c} />)}
                </div>
              </div>
            )}
            <p className="text-green-200 text-lg mb-4 text-center">{question.scenario}</p>
            <h4 className="text-xl font-bold text-white mb-2 text-center">{question.question}</h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {question.options.map((option, index) => (
              <Button key={index} variant={selectedAnswer === index ? (isCorrect ? "default" : "destructive") : "secondary"} className={`h-16 text-lg ${selectedAnswer === index ? '' : 'bg-white/10 hover:bg-white/20'}`} onClick={() => !showExplanation && setSelectedAnswer(index)} disabled={showExplanation}>
                {option}
              </Button>
            ))}
          </div>

          {!showExplanation && showHint > 0 && (
            <div className="bg-blue-900/30 rounded-xl p-4 mb-6 text-blue-200"><strong>Hint:</strong> {showHint === 1 ? question.hint1 : question.hint2}</div>
          )}

          {showExplanation && (
            <div className={`rounded-xl p-6 mb-6 ${isCorrect ? 'bg-green-900/30 border-green-500' : 'bg-green-900/30 border-green-500'} border`}>
              <div className="flex items-center gap-2 mb-3">
                {isCorrect ? <CheckCircle className="w-6 h-6 text-green-400" /> : <ThumbsDown className="w-6 h-6 text-red-400" />}
                <h3 className="text-xl font-bold text-white">{isCorrect ? 'Correct!' : 'Incorrect'}</h3>
              </div>
              <p className="text-green-200">{question.explanation}</p>
            </div>
          )}

          <div className="flex justify-between items-center mt-8">
            {!showExplanation && showHint < 2 && question.hint2 && stageTitle.includes("Guided") ? <Button onClick={() => setShowHint(h => h + 1)} variant="outline" className="border-yellow-600 text-yellow-300 hover:bg-yellow-600/20"><Lightbulb className="w-4 h-4 mr-2" /> Hint</Button> : <div></div>}
            {!showExplanation ? (
              <Button onClick={() => setShowExplanation(true)} disabled={selectedAnswer === null} className="bg-green-600 hover:bg-green-700 text-white ml-auto">Submit Answer</Button>
            ) : (
              <Button onClick={() => handleNextQuestion(questions, nextStage)} className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold ml-auto">Next <ArrowRight className="ml-2 w-5 h-5" /></Button>
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
          <h2 className="text-3xl font-bold text-white text-center mb-2">Stage 3: Independent Practice - "Solo Pre-flop Decisions"</h2>
          <p className="text-center text-green-300 mb-8">Question {currentQuestion + 1} of {stage3Questions.length}</p>

          <div className="bg-white/5 rounded-xl p-6 mb-6">
             {question.playerHand && question.playerHand.length > 0 && (
              <div className="text-center mb-4">
                <p className="text-white font-semibold mb-2">Your Hand:</p>
                <div className="flex justify-center gap-2">
                  {question.playerHand.map(c => <PlayingCard key={c} card={c} />)}
                </div>
              </div>
            )}
            <p className="text-green-200 text-lg mb-4 text-center">{question.scenario}</p>
            <h4 className="text-xl font-bold text-white mb-2 text-center">{question.question}</h4>
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

          <div className="flex justify-end items-center mt-8">
            {!showExplanation ? (
              <Button onClick={() => setShowExplanation(true)} disabled={selectedAnswer === null} className="bg-green-600 hover:bg-green-700 text-white">Submit Answer</Button>
            ) : (
              <Button onClick={() => handleNextQuestion(stage3Questions, "finalIntro")} className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold">
                {currentQuestion < stage3Questions.length - 1 ? 'Next Question' : 'Final Challenge'}
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderFinalChallenge = () => {
    if (!finalChallengeQuestions || currentQuestion >= finalChallengeQuestions.length) {
      return <div>Loading...</div>;
    }

    const question = finalChallengeQuestions[currentQuestion];
    const isCorrect = selectedAnswer === question.correct;

    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-black/20 backdrop-blur-md rounded-2xl p-8 border border-red-600/30">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-3xl font-bold text-white">Final Challenge: Rapid Fire Decision Maker</h2>
            <div className="text-red-400 font-bold text-lg">Time: {timeLeft}s</div>
          </div>
          <p className="text-center text-red-300 mb-4">Question {currentQuestion + 1} of {finalChallengeQuestions.length}</p>
          <div className="mb-4"><Progress value={(timeLeft / 15) * 100} className="w-full h-2 bg-red-400" /></div>

          <div className="bg-white/5 rounded-xl p-6 mb-6">
            {question.playerHand && question.playerHand.length > 0 && (
                <div className="text-center mb-4">
                  <p className="text-white font-semibold mb-2">Your Hand:</p>
                  <div className="flex justify-center gap-2">
                    {question.playerHand.map(c => <PlayingCard key={c} card={c} />)}
                  </div>
                </div>
              )}
            <p className="text-green-200 text-lg mb-4 text-center">{question.scenario}</p>
            <h4 className="text-xl font-bold text-white mb-2 text-center">{question.question}</h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {question.options.map((option, index) => (
              <Button key={index} variant="secondary" className={`h-16 text-lg ${showExplanation && selectedAnswer === index ? (isCorrect ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600') : 'bg-white/10 hover:bg-white/20'}`} onClick={() => !showExplanation && setSelectedAnswer(index)} disabled={showExplanation}>
                {option}
              </Button>
            ))}
          </div>

          {showExplanation && (
            <div className={`rounded-xl p-6 mb-6 ${isCorrect ? 'bg-green-900/30 border-green-500' : 'bg-red-900/30 border-red-500'} border`}>
              <div className="flex items-center gap-2 mb-3">
                {isCorrect ? <CheckCircle className="w-6 h-6 text-green-400" /> : <ThumbsDown className="w-6 h-6 text-red-400" />}
                <h3 className="text-xl font-bold text-white">{isCorrect ? 'Correct!' : 'Incorrect'}</h3>
              </div>
              <p className="text-green-200">{question.feedback}</p>
            </div>
          )}

          <div className="flex justify-end mt-8">
          {!showExplanation && (
              <Button onClick={() => {setShowExplanation(true); handleFinalStageNext();}} disabled={selectedAnswer === null} className="bg-red-600 hover:bg-red-700 text-white">Confirm Decision</Button>
          )}
          </div>
        </div>
      </div>
    );
  };

  const renderCompletion = () => {
    const totalQuestions = finalChallengeQuestions.length;
    const passed = finalStageScore >= 4; // Need at least 4 out of 5

    return (
      <div className="max-w-4xl mx-auto text-center">
        <div className="bg-black/20 backdrop-blur-md rounded-2xl p-8 border border-green-600/30">
          <Trophy className="w-20 h-20 text-yellow-400 mx-auto mb-6" />
          <h2 className="text-4xl font-bold text-white mb-4">Challenge Complete!</h2>
          <div className="bg-white/10 rounded-xl p-6 mb-8 text-center">
            <h3 className="text-2xl font-bold text-white mb-2">Your Score: {finalStageScore} / {totalQuestions}</h3>
            {passed ? (
              <p className="text-green-400 font-bold text-lg">You passed! You've mastered preflop all-in decisions.</p>
            ) : (
              <p className="text-red-400 font-bold text-lg">You didn't pass this time. Review the concepts and try again!</p>
            )}
          </div>
          {passed && (
            <p className="text-green-200 text-lg mb-8">Congratulations! You now master pot odds evaluation and can make mathematically sound +EV decisions in pre-flop all-in scenarios. This knowledge will greatly improve your decision-making and provide a strong foundation for advanced poker strategy. Keep practicing these calculations until they become second nature!</p>
          )}
          <p className="text-yellow-200 text-md mb-8">Important note: You saw in the questions the equity percentage examples - you will later learn how to calculate and master them yourself</p>

          <div className="flex justify-center gap-4">
            {passed ? (
              <Button onClick={() => completeGame(true)} className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-8 py-3 text-lg">
                Return to Home <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            ) : (
              <>
                <Button onClick={retryFinalChallenge} className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-8 py-3 text-lg">
                  Try Again
                </Button>
                <Button onClick={() => completeGame(false)} className="bg-gray-600 hover:bg-gray-700 text-white font-bold px-8 py-3 text-lg">
                  Return to Home
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  const getStageContent = () => {
    switch (currentStage) {
        case 'intro': return renderIntro();
        case 'explanation': return renderExplanation();
        case 'gameIntro': return renderGameIntro();
        case 'stage1': return renderStage1();
        case 'stage2Intro': return <StageIntro title="Stage 2: Guided Practice" description="Time to apply what you've learned. In this stage, you'll get hints to help you make the right call." nextStage="stage2" buttonText="Start Practice" />;
        case 'stage2': return renderQuestionStage(stage2Questions, "Stage 2: Guided Practice - Analyzing the Jam", "stage3Intro");
        case 'stage3Intro': return <StageIntro title="Stage 3: Independent Practice" description="Now, the training wheels come off. Analyze these scenarios and make the call on your own." nextStage="stage3" buttonText="Start Independent Practice" />;
        case 'stage3': return renderStage3();
        case 'finalIntro': return <StageIntro title="Final Challenge: Rapid Fire" description="This is the final test. You'll face a series of scenarios under time pressure. Make the right call, quickly!" nextStage="final" buttonText="Start Final Challenge" borderColor="border-red-600/30"/>;
        case 'final': return renderFinalChallenge();
        case 'completion': return renderCompletion();
        default: return renderIntro();
    }
  };

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
