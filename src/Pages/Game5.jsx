
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { UserService as User } from "@/services/user";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, ArrowRight, Trophy, CheckCircle, Percent, BarChart, Clock, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import PokerTable from "../components/game2/PokerTable";
import { motion, AnimatePresence } from "framer-motion";
import { track } from "@/lib/analytics";
import useActiveStopwatch from "@/hooks/useActiveStopwatch";

// Add animation variants at the top of component
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

export default function Game5() {
  const [currentStage, setCurrentStage] = useState('intro');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [user, setUser] = useState(null);
  const [timeLeft, setTimeLeft] = useState(30);
  const [timerActive, setTimerActive] = useState(false);
  const [stage3Results, setStage3Results] = useState([]);
  const [currentScenario, setCurrentScenario] = useState(0);
  const [direction, setDirection] = useState(0); // 0 for initial, 1 for forward, -1 for backward
  const gameId = 5;
  const navigate = useNavigate();
  const timer = useActiveStopwatch();
  const completedRef = React.useRef(false);

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
    await User.completeGame(5);

    navigate(createPageUrl("Home"));
  };

  const explanationSlides = [
    {
      title: "Part A: What are Pot Odds?",
      content: (
        <div className="bg-white/10 rounded-xl p-6 mb-6">
          <p className="text-green-200 text-lg leading-relaxed">
            Pot odds represent the immediate odds offered to a player when facing a bet. They are crucial for assessing the potential reward of winning the pot against the risk of your investment, helping you make informed decisions about whether to call, raise, or fold.
          </p>
        </div>
      )
    },
    {
      title: "Part A: What are Pot Odds?",
      content: (
        <div className="bg-white/10 rounded-xl p-6 mb-6">
          <p className="text-green-200 text-lg leading-relaxed mb-6">
            You calculate pot odds as a ratio of the total pot size to the amount you must call. For example, if the pot is $30 and your opponent bets $10, the total pot becomes $40. Your pot odds would be $40:$10, which simplifies to a 4:1 ratio.
          </p>
          <div className="bg-blue-900/30 rounded-lg p-4">
            <h4 className="text-blue-300 font-bold mb-3">Example:</h4>
            <div className="space-y-2 text-blue-200">
              <p>• Initial pot: $30</p>
              <p>• Opponent bets: $10</p>
              <p>• Total pot: $30 + $10 = $40</p>
              <p>• You must call: $10</p>
              <p><strong>• Pot odds ratio: $40:$10 = 4:1</strong></p>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Part B: Converting Pot Odds to Percentages",
      content: (
        <div className="bg-white/10 rounded-xl p-6 mb-6">
          <p className="text-green-200 text-lg leading-relaxed">
            While ratios are useful, many players find it easier to understand and interpret odds when expressed as percentages. To convert pot odds into a percentage, you express the amount to call as a fraction of the total pot size after your call. For instance, if you need to call $10 into a pot of $40 (meaning the total pot after your call will be $50), your pot odds in percentage terms would be $10 / ($40 + $10) = 10/50 = 20%.
          </p>
        </div>
      )
    },
    {
      title: "Part B: Converting Pot Odds to Percentages",
      content: (
        <div className="bg-white/10 rounded-xl p-6 mb-6">
          <p className="text-green-200 text-lg leading-relaxed">
            For quick decision-making in active play, it is sometimes advisable to round the pot odds to simpler numbers. This rounding allows for 'informed estimates that are close enough' to quickly decide whether to call or fold.
          </p>
          <div className="bg-yellow-400/10 rounded-lg p-4 border border-yellow-400/30 mt-4">
            <p className="text-yellow-200">
              <strong>Pro Tip:</strong> Quick mental math is key during live play. Practice these conversions until they become automatic!
            </p>
          </div>
        </div>
      )
    },
    {
      title: "Part C: Understanding the Break-Even Point",
      content: (
        <div className="bg-white/10 rounded-xl p-6 mb-6">
          <p className="text-green-200 text-lg leading-relaxed">
            The percentage derived from your pot odds calculation represents your break-even point. This means that if your hand's chance of winning (your equity) is greater than this calculated percentage, then calling the bet is a profitable decision in the long run.
          </p>
        </div>
      )
    },
    {
      title: "Part C: Understanding the Break-Even Point - Example",
      content: (
        <div className="bg-white/10 rounded-xl p-6 mb-6">
          <p className="text-green-200 text-lg leading-relaxed mb-6">
            For example, if you are offered 3:1 pot odds, which converts to 25%, you need to expect to win at least 25% of the time for your call to be profitable. This ensures that, over time, your potential gain outweighs the risk.
          </p>
          <div className="bg-green-900/30 rounded-lg p-4">
            <h4 className="text-green-300 font-bold mb-3">Break-Even Example:</h4>
            <div className="space-y-2 text-green-200">
              <p>• Pot odds: 3:1 (25%)</p>
              <p>• Your hand equity needed: over 25%</p>
              <p>• If equity = 30% → Profitable call ✓</p>
              <p>• If equity = 20% → Unprofitable call ✗</p>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Part D: Understanding Implied Pot Odds",
      content: (
        <div className="bg-white/10 rounded-xl p-6 mb-6">
          <p className="text-green-200 text-lg leading-relaxed">
            Implied pot odds are an extension of regular pot odds. While pot odds refer to possible immediate profits from your existing pot, implied pot odds take into account potential profits from future betting rounds after you hit a strong hand.
          </p>
        </div>
      )
    },
    {
      title: "Part D: Understanding Implied Pot Odds",
      content: (
        <div className="bg-white/10 rounded-xl p-6 mb-6">
          <p className="text-green-200 text-lg leading-relaxed">
            Implied odds allow you to justify calling now—even if the outright pot odds are unfavorable—if you believe you can recoup your investment in future betting rounds if you successfully complete your draw. You should especially consider them when you expect to win additional money from your opponent on later streets after you get your draw.
          </p>
        </div>
      )
    },
    {
      title: "Part D: Understanding Implied Pot Odds",
      content: (
        <div className="bg-white/10 rounded-xl p-6 mb-6">
          <p className="text-green-200 text-lg leading-relaxed">
            Understanding implied pot odds is critical to assessing the overall viability of calling with a drawing hand, based on future betting scenarios. It is important to remember that implied pot odds are less precisely quantifiable and rely more on experience and understanding of player behavior.
          </p>
          <div className="bg-purple-900/30 rounded-lg p-4 mt-4">
            <p className="text-purple-200">
              <strong>Remember:</strong> Implied odds require reading your opponents and predicting future action. They're more art than science!
            </p>
          </div>
        </div>
      )
    }
  ];

  const gameIntroSlides = [
    {
      title: "Pot Odds Power-Up: Can You Calculate Your Way to Profit?",
      content: (
        <div className="bg-green-900/30 rounded-xl p-6 mb-8 text-left">
          <p className="text-green-200 text-lg">
            In poker, every decision counts. This game will teach you how to quickly assess the immediate value of a call using pot odds, transforming complex situations into clear, profitable choices. Understand the numbers, and you'll always know when to push forward confidently.
          </p>
        </div>
      )
    },
    {
      title: "How to Play",
      content: (
        <div className="bg-blue-900/30 rounded-xl p-6 mb-8 text-left">
          <h3 className="text-xl font-bold text-white mb-4">Welcome to Pot Odds Power-Up!</h3>
          <p className="text-blue-200 mb-4">Your mission is to master calculating pot odds and understanding your break-even point.</p>
          <div className="space-y-2 text-blue-200">
            <p>1. You'll be presented with poker scenarios showing the current pot size and an opponent's bet.</p>
            <p>2. Your first task is to calculate the pot odds ratio.</p>
            <p>3. Next, convert that ratio into a percentage.</p>
            <p>4. Finally, determine the minimum equity percentage your hand needs to have to make calling profitable.</p>
            <p>5. Input your answers or select from the given choices. Let's make some +EV decisions!</p>
          </div>
        </div>
      )
    }
  ];

  const stage2Scenarios = useMemo(() => [
    {
      pot: 20,
      bet: 5,
      questions: [
        {
          question: "What are the pot odds ratio?",
          options: ["5:1", "4:1", "6:1", "3:1"],
          correct: 0,
          explanation: "The total pot after the bet is $20 (current pot) + $5 (opponent bet) = $25. You need to call $5. The ratio is $25:$5, which simplifies to 5:1.",
          hint: "To calculate the ratio, first add the current pot and the opponent's bet to get the total pot. Then, compare that total to the amount you need to call."
        },
        {
          question: "Convert these pot odds to a percentage.",
          options: ["20%", "25%", "16.67%", "40%"],
          correct: 2,
          explanation: "To convert the ratio to a percentage, divide the amount to be called ($5) by the total amount of the pot after the call ($25 + $5 = $30). Therefore, $5 / $30 = 0.1667, which is 16.67%.",
          hint: "Divide the amount you need to call by the total pot after your call to get the percentage."
        },
        {
          question: "What is the minimum equity needed to make this call profitable?",
          options: ["16.67%", "25%", "33.3%", "40%"],
          correct: 0,
          explanation: "The pot odds percentage you calculated represents your break-even point. This means that in order for the call to be profitable in the long run, your hand's chance of winning (your equity) must be greater than 16.67%.",
          hint: "The percentage you calculated for pot odds is your break-even point. Your hand's equity needs to be greater than this percentage for a profitable call."
        }
      ]
    },
    {
      pot: 60,
      bet: 30,
      questions: [
        {
          question: "What are the pot odds ratio?",
          options: ["2:1", "3:1", "4:1", "5:1"],
          correct: 1,
          explanation: "The total pot after the bet is $60 (current pot) + $30 (opponent bet) = $90. You need to call $30. Therefore, the ratio is $90:$30, which simplifies to 3:1.",
          hint: "To calculate the ratio, first add the current pot and the opponent's bet to get the total pot. Then, compare that total to the amount you need to call."
        },
        {
          question: "Convert these pot odds to a percentage.",
          options: ["25%", "30%", "33.3%", "40%"],
          correct: 0,
          explanation: "To convert the ratio to a percentage, divide the amount to be called ($30) by the total pot after the call ($90 + $30 = $120). Therefore, $30 / $120 = 0.25, which is 25%.",
          hint: "Divide the amount you need to call by the total pot after your call to get the percentage."
        },
        {
          question: "What is the minimum equity needed to make this call profitable?",
          options: ["25%", "30%", "33.3%", "40%"],
          correct: 0,
          explanation: "The break-even point, which is the minimum equity required, is equal to the percentage of the pot odds, i.e. 25%.",
          hint: "The percentage you calculated for pot odds is your break-even point. Your hand's equity needs to be greater than this percentage for a profitable call."
        }
      ]
    }
  ], []);

  const stage3Scenarios = useMemo(() => [
    {
      pot: 45,
      bet: 15,
      questions: [
        {
          question: "What are the pot odds ratio?",
          options: ["2:1", "3:1", "4:1", "5:1"],
          correct: 2,
          explanation: "The total pot after the bet is $45 + $15 = $60. You need to call $15. Therefore, the ratio is $60:$15, which simplifies to 4:1."
        },
        {
          question: "What percentage do these pot odds represent?",
          options: ["20%", "25%", "33.3%", "50%"],
          correct: 0,
          explanation: "The amount to call ($15) divided by the total pot amount after the call ($60 + $15 = $75) is $15/$75 = 0.20, which is 20%."
        },
        {
          question: "What is the break-even equity needed for a profitable call?",
          options: ["20%", "25%", "33.3%", "50%"],
          correct: 0,
          explanation: "The minimum equity required is the percentage of the pot odds, i.e. 20%."
        }
      ]
    },
    {
      pot: 80,
      bet: 20,
      questions: [
        {
          question: "What are the pot odds ratio?",
          options: ["2:1", "3:1", "4:1", "5:1"],
          correct: 3,
          explanation: "The total pot after the bet is $80 + $20 = $100. You need to call $20. Therefore, the ratio is $100:$20, which simplifies to 5:1."
        },
        {
          question: "What percentage do these pot odds represent?",
          options: ["10%", "16.67%", "20%", "25%"],
          correct: 1,
          explanation: "The amount to call ($20) divided by the total pot amount after the call ($100 + $20 = $120) is $20/$120 = 0.1667, which is 16.67%."
        },
        {
          question: "What is the break-even equity needed for a profitable call?",
          options: ["10%", "15%", "20%", "16.67%"],
          correct: 3,
          explanation: "The minimum equity required is the percentage of the pot odds, i.e. 16.67%."
        }
      ]
    },
    {
      pot: 100,
      bet: 50,
      questions: [
        {
          question: "What are the pot odds ratio?",
          options: ["2:1", "3:1", "4:1", "5:1"],
          correct: 1,
          explanation: "The total pot after the bet is $100 + $50 = $150. You need to call $50. Therefore, the ratio is $150:$50, which simplifies to 3:1."
        },
        {
          question: "What percentage do these pot odds represent?",
          options: ["25%", "33.3%", "40%", "50%"],
          correct: 0,
          explanation: "The amount to call ($50) divided by the total pot amount after the call ($150 + $50 = $200) is $50/$200 = 0.25, which is 25%."
        },
        {
          question: "What is the break-even equity needed for a profitable call?",
          options: ["25%", "33.3%", "40%", "50%"],
          correct: 0,
          explanation: "The minimum equity required is the percentage of the pot odds, i.e. 25%."
        }
      ]
    }
  ], []);

  const handleStage3Answer = useCallback((answerIndex) => {
    if (showExplanation) return;

    // Accessing scenario data from memoized array
    const currentScenarioData = stage3Scenarios[currentScenario];
    const currentQuestionData = currentScenarioData.questions[currentQuestion % 3];

    const isCorrect = answerIndex === currentQuestionData.correct;
    setSelectedAnswer(answerIndex);
    setShowExplanation(true);
    setTimerActive(false);

    setStage3Results(prev => [...prev, isCorrect]);

    setTimeout(() => {
      if (currentQuestion < 8) {
        if ((currentQuestion + 1) % 3 === 0) {
          setCurrentScenario(prev => prev + 1);
        }
        setCurrentQuestion(prev => prev + 1);
        setSelectedAnswer(null);
        setShowExplanation(false);
        setTimeLeft(30);
        setTimerActive(true);
      } else {
        setCurrentStage('results');
        setDirection(0); // Reset direction
      }
    }, 2000);
  }, [currentQuestion, currentScenario, showExplanation, stage3Scenarios, setSelectedAnswer, setShowExplanation, setTimerActive, setStage3Results, setCurrentScenario, setCurrentQuestion, setTimeLeft, setCurrentStage, setDirection]);


  useEffect(() => {
    let interval;
    if (timerActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prevTime => prevTime - 1);
      }, 1000);
    } else if (timerActive && timeLeft === 0) {
      // Time's up - treat as wrong answer
      setShowExplanation(true);
      setTimerActive(false);
      setStage3Results(prev => [...prev, false]);

      setTimeout(() => {
        if (currentQuestion < 8) {
          if ((currentQuestion + 1) % 3 === 0) {
            setCurrentScenario(prev => prev + 1);
          }
          setCurrentQuestion(prev => prev + 1);
          setSelectedAnswer(null);
          setShowExplanation(false);
          setTimeLeft(30);
          setTimerActive(true);
        } else {
          setCurrentStage('results');
          setDirection(0); // Reset direction
        }
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [timerActive, timeLeft, currentQuestion, setCurrentScenario, setCurrentQuestion, setSelectedAnswer, setShowExplanation, setTimeLeft, setTimerActive, setStage3Results, setCurrentStage, setDirection]); // Added setters and currentScenario for full dependency coverage

  const renderIntro = () => (
    <div className="max-w-4xl mx-auto text-center">
      <div className="bg-black/20 backdrop-blur-md rounded-2xl p-8 border border-green-600/30">
        <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-6" />
        <h1 className="text-4xl font-bold text-white mb-4">
          Game 5: Pot Odds → Percent
        </h1>
        <h2 className="text-2xl font-semibold text-green-300 mb-6">
          Ratio → Percent → Breakeven - Explanation
        </h2>
        <p className="text-green-200 text-lg mb-8">
          Master the crucial skill of calculating pot odds, converting them to percentages, and finding
          your break-even point. Turn complex situations into clear, profitable choices.
        </p>
        <Button
          onClick={() => { setCurrentStage('explanation'); setDirection(1); }}
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
        <div className="bg-black/20 backdrop-blur-md rounded-2xl p-8 border border-green-600/30">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              custom={direction}
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
                <motion.h2 variants={itemVariants} className="text-3xl font-bold text-white mb-8 text-center flex items-center justify-center gap-3">
                  <Percent className="w-8 h-8 text-yellow-400" />
                  {slide.title}
                </motion.h2>
              </motion.div>

              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                <motion.div variants={itemVariants}>
                  {slide.content}
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
              onClick={() => { setCurrentSlide(Math.max(0, currentSlide - 1)); setDirection(-1); }}
              disabled={currentSlide === 0}
              variant="outline"
              className="border-green-600 text-green-300 hover:bg-green-600/20"
            >
              <ArrowLeft className="mr-2 w-4 h-4" />
              Previous
            </Button>

            <span className="text-green-300">
              {currentSlide + 1} of {explanationSlides.length}
            </span>

            {currentSlide < explanationSlides.length - 1 ? (
              <Button
                onClick={() => { setCurrentSlide(currentSlide + 1); setDirection(1); }}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Next
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            ) : (
              <Button
                onClick={() => {
                  setCurrentStage('gameIntro');
                  setCurrentSlide(0);
                  setDirection(0); // Reset direction for the next stage
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
      <div className="max-w-4xl mx-auto text-center">
        <div className="bg-black/20 backdrop-blur-md rounded-2xl p-8 border border-green-600/30">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
            >
              <motion.h2
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                className="text-3xl font-bold text-white mb-6"
              >
                {slide.title}
              </motion.h2>

              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                <motion.div variants={itemVariants}>
                  {slide.content}
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
              onClick={() => { setCurrentSlide(Math.max(0, currentSlide - 1)); setDirection(-1); }}
              disabled={currentSlide === 0}
              variant="outline"
              className="border-green-600 text-green-300 hover:bg-green-600/20"
            >
              <ArrowLeft className="mr-2 w-4 h-4" />
              Previous
            </Button>

            <span className="text-green-300">
              {currentSlide + 1} of {gameIntroSlides.length}
            </span>

            {currentSlide < gameIntroSlides.length - 1 ? (
              <Button
                onClick={() => { setCurrentSlide(currentSlide + 1); setDirection(1); }}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Next
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            ) : (
              <Button
                onClick={() => { setCurrentStage('stage1'); setDirection(0); }}
                className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-8 py-3 text-lg"
              >
                Begin Game
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            )}
          </motion.div>
        </div>
      </div>
    );
  };

  const renderStage1 = () => (
    <div className="max-w-7xl mx-auto">
      <div className="bg-black/20 backdrop-blur-md rounded-2xl p-8 border border-green-600/30">
        <motion.h2
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-3xl font-bold text-white text-center mb-8"
        >
          Stage 1: Live Demo
        </motion.h2>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="w-full h-[500px] relative mb-8"
        >
          <PokerTable
            players={[
              { position: 'SB', stack: 485, status: 'Folded' },
              { position: 'BB', stack: 470, status: 'Folded' },
              { position: 'UTG', stack: 500, status: 'Folded' },
              { position: 'MP', stack: 470, bet: 10, status: 'Bets $10' },
              { position: 'CO', stack: 500, status: 'Folded' },
              { position: 'BTN', stack: 500, cards: ['A♥', 'K♥'], isHero: true, isCurrent: true }
            ]}
            pot= {40}
            communityCards={['Q♥', 'J♠', '7♦']}
            dealerPosition="BTN"
          />
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="bg-white/5 rounded-xl p-6"
        >
          <motion.div variants={itemVariants} className="space-y-6">
            <motion.div variants={itemVariants} className="bg-blue-900/20 rounded-xl p-4">
              <h4 className="text-blue-300 font-bold mb-3">Scenario Analysis:</h4>
              <div className="space-y-2 text-blue-200">
                <p>• Initial pot: $30</p>
                <p>• Opponent bets: $10</p>
                <p>• Total pot after bet: $30 + $10 = $40</p>
                <p>• You must call: $10</p>
              </div>
            </motion.div>

            <motion.div
              variants={containerVariants}
              className="grid md:grid-cols-3 gap-4"
            >
              <motion.div variants={itemVariants} className="bg-green-900/20 rounded-lg p-4">
                <h4 className="text-green-300 font-bold mb-3">1. Calculate Pot Odds Ratio</h4>
                <div className="space-y-2 text-green-200">
                  <p>Pot odds = Total pot : Amount to call</p>
                  <p>$40 : $10</p>
                  <p><strong>= 4:1</strong></p>
                </div>
              </motion.div>

              <motion.div variants={itemVariants} className="bg-purple-900/20 rounded-lg p-4">
                <h4 className="text-purple-300 font-bold mb-3">2. Convert to Percentage</h4>
                <div className="space-y-2 text-purple-200">
                  <p>Call amount ÷ (Total pot + Your call)</p>
                  <p>$10 ÷ ($40 + $10)</p>
                  <p>$10 ÷ $50 = <strong>20%</strong></p>
                </div>
              </motion.div>

              <motion.div variants={itemVariants} className="bg-yellow-900/20 rounded-lg p-4">
                <h4 className="text-yellow-300 font-bold mb-3">3. Find Break-Even Point</h4>
                <div className="space-y-2 text-yellow-200">
                  <p>Your break-even point is the pot odds percentage</p>
                  <p>You need <strong>over 20% equity</strong> to make calling profitable</p>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.4 }}
          className="text-center mt-8"
        >
          <Button
            onClick={() => {
              setCurrentStage('stage2');
              setCurrentQuestion(0);
              setSelectedAnswer(null);
              setShowExplanation(false);
              setShowHint(false);
              setDirection(0); // Reset direction for the next stage
            }}
            className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-8 py-3"
          >
            Continue to Practice
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </motion.div>
      </div>
    </div>
  );

  const renderStage2 = () => {
    const scenarioIndex = Math.floor(currentQuestion / 3);
    const questionIndex = currentQuestion % 3;
    const scenario = stage2Scenarios[scenarioIndex];
    const question = scenario.questions[questionIndex];

    return (
      <div className="max-w-5xl mx-auto">
        <div className="bg-black/20 backdrop-blur-md rounded-2xl p-8 border border-green-600/30">
          <h2 className="text-3xl font-bold text-white text-center mb-2">Stage 2: Guided Practice</h2>
          <p className="text-center text-green-300 mb-8">
            Scenario {scenarioIndex + 1} - Question {questionIndex + 1}
          </p>

          <div className="bg-white/5 rounded-xl p-6 mb-6">
            <h3 className="text-xl font-bold text-white mb-4">Situation:</h3>
            <div className="flex justify-center items-center gap-4 text-white text-lg mb-4">
              <div>Current Pot: <strong className="text-yellow-400">${scenario.pot}</strong></div>
              <div>Opponent Bets: <strong className="text-red-400">${scenario.bet}</strong></div>
            </div>
            <h4 className="text-xl font-bold text-white mb-2">{question.question}</h4>
          </div>

          <div className="grid gap-3 mb-6">
            {question.options.map((option, index) => (
              <div
                key={index}
                className={`
                  p-4 rounded-lg cursor-pointer transition-all duration-300 border-2
                  ${selectedAnswer === index ? 'border-yellow-400 bg-yellow-400/10' : 'border-transparent bg-white/5 hover:border-green-400/50'}
                  ${showExplanation && index === question.correct ? 'border-green-400 bg-green-400/10' : ''}
                  ${showExplanation && selectedAnswer === index && index !== question.correct ? 'border-red-400 bg-red-400/10' : ''}
                `}
                onClick={() => !showExplanation && setSelectedAnswer(index)}
              >
                <div className="flex items-center gap-3">
                  <div className="text-white font-bold">{String.fromCharCode(65 + index)})</div>
                  <div className="text-green-200">{option}</div>
                  {showExplanation && index === question.correct && (
                    <CheckCircle className="ml-auto w-5 h-5 text-green-400" />
                  )}
                </div>
              </div>
            ))}
          </div>

          {!showExplanation && showHint && (
            <div className="bg-blue-900/30 rounded-xl p-4 mb-6">
              <p className="text-blue-200">
                <strong>Hint:</strong> {question.hint}
              </p>
            </div>
          )}

          {showExplanation && (
            <div className={`rounded-xl p-6 mb-6 ${selectedAnswer === question.correct ? 'bg-green-900/30' : 'bg-red-900/30'}`}>
              <div className="flex items-center gap-2 mb-3">
                {selectedAnswer === question.correct ? (
                  <CheckCircle className="w-6 h-6 text-green-400" />
                ) : (
                  <div className="w-6 h-6 rounded-full border-2 border-red-400 flex items-center justify-center">
                    <span className="text-red-400 text-sm">✗</span>
                  </div>
                )}
                <h3 className="text-xl font-bold text-white">
                  {selectedAnswer === question.correct ? 'Correct!' : 'Incorrect'}
                </h3>
              </div>
              <p className="text-green-200">{question.explanation}</p>
            </div>
          )}

          <div className="flex justify-between items-center">
            {!showExplanation ? (
              <div className="flex justify-between w-full items-center">
                {selectedAnswer !== null ? (
                  <Button
                    onClick={() => setShowExplanation(true)}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    Submit Answer
                  </Button>
                ) : (
                  <div className="text-green-300">Select an answer to continue</div>
                )}

                {!showHint && question.hint && (
                  <Button
                    onClick={() => setShowHint(true)}
                    variant="outline"
                    className="border-yellow-600 text-yellow-300 hover:bg-yellow-600/20"
                  >
                    Need a Hint?
                  </Button>
                )}
              </div>
            ) : (
              <Button
                onClick={() => {
                  if (currentQuestion < 5) {
                    setCurrentQuestion(currentQuestion + 1);
                    setSelectedAnswer(null);
                    setShowExplanation(false);
                    setShowHint(false);
                  } else {
                    setCurrentStage('stageDivider');
                    setDirection(0); // Reset direction
                  }
                }}
                className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold"
              >
                {currentQuestion < 5 ? 'Next Question' : 'Final Challenge'}
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderStageDivider = () => (
    <div className="max-w-4xl mx-auto text-center">
      <div className="bg-gradient-to-br from-red-900/20 to-yellow-900/20 backdrop-blur-md rounded-2xl p-12 border border-yellow-600/30">
        <Target className="w-20 h-20 text-yellow-400 mx-auto mb-6" />
        <h2 className="text-4xl font-bold text-white mb-4">Get Ready!</h2>
        <h3 className="text-2xl font-semibold text-yellow-300 mb-6">Stage 3: The Final Challenge</h3>
        <div className="bg-yellow-400/10 rounded-xl p-6 mb-8 border border-yellow-400/30">
          <div className="space-y-4 text-yellow-200">
            <p className="text-lg font-semibold">Challenge Rules:</p>
            <div className="grid md:grid-cols-2 gap-4 text-left">
              <div>
                <p>• 3 scenarios with 3 questions each</p>
                <p>• 30 seconds per question</p>
                <p>• No hints available</p>
              </div>
              <div>
                <p>• Immediate feedback after each answer</p>
                <p>• Need 6/9 correct to pass</p>
                <p>• Auto-advance if time runs out</p>
              </div>
            </div>
          </div>
        </div>
        <Button
          onClick={() => {
            setCurrentStage('stage3');
            setCurrentQuestion(0);
            setCurrentScenario(0);
            setSelectedAnswer(null);
            setShowExplanation(false);
            setStage3Results([]);
            setTimeLeft(30);
            setTimerActive(true);
            setDirection(0); // Reset direction
          }}
          className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-12 py-4 text-xl"
        >
          Begin Final Challenge
          <ArrowRight className="ml-3 w-6 h-6" />
        </Button>
      </div>
    </div>
  );

  const renderStage3 = () => {
    // Ensuring scenario and question are derived from the memoized array
    const scenario = stage3Scenarios[currentScenario];
    const question = scenario.questions[currentQuestion % 3];
    const isTimedOut = timeLeft === 0 && selectedAnswer === null;

    return (
      <div className="max-w-6xl mx-auto">
        <div className="bg-black/20 backdrop-blur-md rounded-2xl p-8 border border-green-600/30">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold text-white mb-2">Stage 3: The Final Challenge!</h2>
            <p className="text-green-300">
              Scenario {currentScenario + 1} - Question {(currentQuestion % 3) + 1} of 3
            </p>
            <p className="text-yellow-300 text-sm">
              Progress: {currentQuestion + 1}/9 questions
            </p>
          </div>

          <div className="relative w-full max-w-md mx-auto mb-6">
            <div className="h-3 bg-gray-700 rounded-full">
              <div
                className={`h-3 rounded-full transition-all duration-1000 ${timeLeft <= 10 ? 'bg-red-500' : 'bg-yellow-400'}`}
                style={{ width: `${(timeLeft / 30) * 100}%` }}
              />
            </div>
            <div className="absolute -top-6 right-0 text-white font-bold flex items-center gap-1">
              <Clock className="w-4 h-4" /> {timeLeft}s
            </div>
          </div>

          <div className="bg-white/5 rounded-xl p-6 mb-6">
            <h3 className="text-xl font-bold text-white mb-4">Situation:</h3>
            <div className="flex justify-center items-center gap-4 text-white text-lg mb-4">
              <div>Current Pot: <strong className="text-yellow-400">${scenario.pot}</strong></div>
              <div>Opponent Bets: <strong className="text-red-400">${scenario.bet}</strong></div>
            </div>
            <h4 className="text-xl font-bold text-white mb-2">{question.question}</h4>
          </div>

          <div className="grid gap-3 mb-6">
            {question.options.map((option, index) => (
              <Button
                key={index}
                variant="outline"
                className={`
                  justify-start p-4 h-auto text-left transition-all duration-300
                  ${selectedAnswer === index && !showExplanation ? 'border-yellow-400 bg-yellow-400/10 text-white' : 'border-gray-600 text-black hover:bg-gray-700/50'}
                  ${showExplanation && index === question.correct ? 'border-green-500 bg-green-500/10 !text-white' : ''}
                  ${showExplanation && selectedAnswer === index && index !== question.correct ? 'border-red-500 bg-red-500/10 !text-white' : ''}
                  ${showExplanation ? 'pointer-events-none' : ''}
                `}
                onClick={() => handleStage3Answer(index)}
                disabled={showExplanation}
              >
                <span className="font-bold mr-3">{String.fromCharCode(65 + index)})</span>
                {option}
              </Button>
            ))}
          </div>

          {showExplanation && (
            <div className={`text-center p-4 rounded-lg ${
              isTimedOut ? 'bg-gray-700' : 
              selectedAnswer === question.correct ? 'bg-green-900/50' : 'bg-red-900/50'
            }`}>
              <p className="font-bold text-white mb-2">
                {isTimedOut ? "Time's Up!" :
                 selectedAnswer === question.correct ? "Correct!" : "Incorrect!"}
              </p>
              <p className="text-green-200 text-sm">{question.explanation}</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderResults = () => {
    const correctAnswers = stage3Results.filter(Boolean).length;
    const totalQuestions = stage3Results.length;
    const percentage = ((correctAnswers / totalQuestions) * 100).toFixed(1);
    const passed = correctAnswers >= 6;

    return (
      <div className="max-w-4xl mx-auto text-center">
        <div className="bg-black/20 backdrop-blur-md rounded-2xl p-8 border border-green-600/30">
          <h2 className="text-4xl font-bold text-white mb-4">Challenge Finished!</h2>

          <div className="bg-white/5 rounded-xl p-6 mb-8">
            <div className="text-6xl font-bold text-yellow-400 mb-4">{correctAnswers}/{totalQuestions}</div>
            <div className="text-2xl text-green-300 mb-4">{percentage}% Accuracy</div>

            <div className="w-full bg-gray-700 rounded-full h-4 mb-4">
              <div
                className={`h-4 rounded-full transition-all duration-1000 ${
                  passed ? 'bg-green-500' : 'bg-red-500'
                }`}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>

          {passed ? (
            <div className="bg-green-900/30 rounded-xl p-6 mb-8">
              <h3 className="text-2xl font-bold text-green-400 mb-4">Congratulations!!!</h3>
              <p className="text-green-200 text-lg">
                You have successfully completed the 'Pot Odds Power-Up: Can You Calculate Your Way to Profit?' mini-game.
                You now master the ability to calculate pot odds, convert them into percentages, and determine the break-even
                equity needed to make profitable calls. This knowledge is a key building block for strong poker decision-making
                and will sharpen your ability to judge situations at the table with confidence. Keep practicing these calculations
                until they become automatic, and you'll consistently find profitable spots against your opponents!
              </p>
            </div>
          ) : (
            <div className="bg-red-900/30 rounded-xl p-6 mb-8">
              <h3 className="text-2xl font-bold text-red-400 mb-4">Not Enough!</h3>
              <p className="text-red-200 text-lg">
                You did not have enough correct answers. Go and try again to complete this mini-game.
                You Can Do It!
              </p>
            </div>
          )}

          <div className="flex gap-4 justify-center">
            {!passed && (
              <Button
                onClick={() => {
                  setCurrentStage('stage3');
                  setCurrentQuestion(0);
                  setCurrentScenario(0);
                  setSelectedAnswer(null);
                  setShowExplanation(false);
                  setStage3Results([]);
                  setTimeLeft(30);
                  setTimerActive(true);
                  setDirection(0); // Reset direction
                }}
                className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-8 py-3"
              >
                Try Again
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            )}

            {passed && (
              <Button
                onClick={completeGame}
                className="bg-green-600 hover:bg-green-700 text-white font-bold px-8 py-3"
              >
                Continue to Next Game
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            )}

            <Button
              onClick={() => navigate(createPageUrl("Home"))}
              variant="outline"
              className="border-green-600 text-green-300 hover:bg-green-600/20 px-8 py-3"
            >
              Return to Home
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-6xl mx-auto mb-6">
        <Button
          onClick={() => navigate(createPageUrl("Home"))}
          variant="outline"
          className="border-green-600 text-green-300 hover:bg-green-600/20"
        >
          <ArrowLeft className="mr-2 w-4 h-4" />
          Back to Home
        </Button>
      </div>

      {currentStage === 'intro' && renderIntro()}
      {currentStage === 'explanation' && renderExplanation()}
      {currentStage === 'gameIntro' && renderGameIntro()}
      {currentStage === 'stage1' && renderStage1()}
      {currentStage === 'stage2' && renderStage2()}
      {currentStage === 'stageDivider' && renderStageDivider()}
      {currentStage === 'stage3' && renderStage3()}
      {currentStage === 'results' && renderResults()}
    </div>
  );
}
