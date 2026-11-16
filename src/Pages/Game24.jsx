
import React, { useState, useEffect, useCallback } from "react";
import { UserService as User } from "@/services/user";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, ArrowRight, Trophy, CheckCircle, Target, Users, Shield, Eye, Zap, HandMetal, Brain, Lightbulb, Timer, RefreshCw, ThumbsDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import PlayingCard from "../components/shared/PlayingCard";
import PokerTable from "../components/game2/PokerTable";
import { motion, AnimatePresence } from 'framer-motion';
import { track } from "@/lib/analytics";
import useActiveStopwatch from "@/hooks/useActiveStopwatch";

const explanationSlides = [
  {
    title: "Part A: The Strategy of Affecting Bluffs",
    content: "In poker, players can employ artificial techniques to influence their opponents' actions, specifically to either induce bluffs or stop bluffs. These are forms of strategic techniques aimed at changing an opponent's play. The goal of such plays is to manipulate the pot size and maximize your expected winnings.",
    icon: Brain
  },
  {
    title: "Part A: The Strategy of Affecting Bluffs",
    content: "When you have a very strong hand, you generally want to encourage your opponents to put more money into the pot, ideally by bluffing. Conversely, if your hand is good but vulnerable, you want to prevent bluffs that might either force you to fold the best hand or allow a weaker hand to improve for free.",
    icon: Target
  },
  {
    title: "Part B: Stopping Bluffs",
    content: "The objective of stopping bluffs is to prevent an opponent from betting, raising, or even checking behind you with the intention of later bluffing. You typically want to stop bluffs when your hand is strong enough to win if there's no further aggression, but not so strong that you can afford to give a free card or risk being bluffed off the hand later. The primary way to deter a bluff is to indicate strength. There are few main Techniques for Stopping Bluffs.",
    icon: Shield
  },
  {
    title: "Part B: Stopping Bluffs - Techniques for Stopping Bluffs",
    content: "1. Betting: If you have a decent hand and you initiate the bet, you are signaling strength, which can eliminate an opponent's opportunity to bluff. By betting, you force them to act immediately and put money into the pot if they want to continue.",
    icon: Zap
  },
  {
    title: "Part B: Stopping Bluffs - Techniques for Stopping Bluffs",
    content: "2. Raising: Raising an opponent's bet is an even stronger signal of power and is very effective at stopping bluffs. It makes it more expensive for them to bluff, often leading them to fold.",
    icon: ArrowRight
  },
  {
    title: "Part B: Stopping Bluffs - Techniques for Stopping Bluffs",
    content: "3. Calling: Calling an early bet, especially with a hand that has some value but isn't a monster, can also discourage bluffs on subsequent rounds. This makes it appear as though you have a hand that you're willing to commit to, reducing the likelihood that opponents will try to bluff you out later.",
    icon: CheckCircle
  },
  {
    title: "Part B: Stopping Bluffs - Example",
    content: "Example: You are in a situation where your hand is good but not unbeatable, and you suspect an opponent might try to bluff if you check. Instead, you bet. This active play removes their chance to bluff and asserts your hand's strength.",
    icon: Eye
  },
  {
    title: "Part C: Inducing Bluffs",
    content: "Inducing bluffs means playing your strong hand in a way that encourages an opponent to bluff into you, leading them to commit more money to the pot than they otherwise would. This strategy is most profitable when you have a very strong hand (like the nuts or near-nuts) and are facing an opponent who is prone to bluffing, or an opponent who is likely to interpret your passive play as weakness.",
    icon: HandMetal
  },
  {
    title: "Part C: Inducing Bluffs",
    content: "The goal of Inducing Bluffs is to get additional bets or raises from them that you wouldn't get if you played your hand more aggressively from the start. There are few main Techniques for Inducing Bluffs.",
    icon: Users
  },
  {
    title: "Part C: Inducing Bluffs - Techniques for Inducing Bluffs",
    content: "1. Checking: Checking a strong hand, also known as slowplaying, can invite an opponent to bet, believing your check signals weakness. You then have the option to check-raise, trapping them.",
    icon: CheckCircle
  },
  {
    title: "Part C: Inducing Bluffs - Techniques for Inducing Bluffs",
    content: "2. Calling: Similarly, just calling with a strong hand can give your opponent the impression that your hand is not as good as it is, prompting them to bet again on a later round, either for value or as a bluff.",
    icon: Target
  },
  {
    title: "Part C: Inducing Bluffs - Techniques for Inducing Bluffs",
    content: "3. Small Bet: In certain situations, making a small bet can appear as an attempt to 'buy the pot,' which might entice an aggressive opponent to bluff-raise you.",
    icon: Zap
  },
  {
    title: "Part C: Inducing Bluffs - Techniques for Inducing Bluffs",
    content: "4. Risks of Inducing Bluffs: The main risk is that your opponent does not bluff. This means you might miss out on bets you would have gotten by playing your hand directly. Another risk, particularly when checking or calling, is giving a free card to an opponent with a drawing hand, which could allow them to improve and beat you.",
    icon: Shield
  },
  {
    title: "Part C: Inducing Bluffs - Example",
    content: "Player's Hole Cards: A♠ K♦\nOpponent's Hole Cards: T♠ 9♠\nBoard (Flop): Q♥ 6♣ 2♦\nYou might check. If your opponent then bets (perhaps trying to bluff you off what they perceive as a weak hand), you can raise (check-raise), trapping them and building a larger pot. However, if they don't bet, you might not get extra money.",
    icon: Eye,
    showPokerTable: true,
    playerHand: ['A♠', 'K♦'],
    opponentHand: ['T♠', '9♠'],
    board: ['Q♥', '6♣', '2♦']
  }
];

const demoScenarios = [
  {
    title: "Demo 1: Stopping Bluffs",
    playerHand: ['A♣', 'K♠'],
    board: ['K♣', '7♠', '2♥'],
    pot: 100,
    opponentInfo: "Opponent is aggressive and often bluffs with drawing hands. They are first to act.",
    explanation: "Your hand is strong enough to win, but susceptible to bluffs or draws. By betting, you indicate strength and take control of the pot.",
    steps: [
      { narration: "You have top pair, top kicker on a relatively dry board. Your opponent is aggressive and first to act.", action: null, potSize: 100 },
      { narration: "You decide to BET to show strength and prevent opponent from bluffing or getting free cards.", action: "BET $50", potSize: 150 },
      { narration: "Your opponent folds, unable to continue against your show of strength. You win the pot!", action: "OPPONENT FOLDS", potSize: 150, result: "success" }
    ]
  },
  {
    title: "Demo 2: Inducing Bluffs",
    playerHand: ['A♥', '7♥'],
    board: ['J♥', '6♥', '2♥'],
    pot: 80,
    opponentInfo: "Opponent is loose and tends to overplay perceived weakness. You are first to act.",
    explanation: "You have the nut flush! You want to maximize value by appearing weak and inviting bluffs.",
    steps: [
      { narration: "You flopped the nut flush - an incredibly strong hand. Your opponent tends to bluff when they sense weakness.", action: null, potSize: 80 },
      { narration: "You CHECK to appear weak and invite your opponent to bluff into your monster hand.", action: "CHECK", potSize: 80 },
      { narration: "Your opponent takes the bait and BETS, thinking you're weak. Perfect!", action: "OPPONENT BETS $40", potSize: 120 },
      { narration: "You spring the trap with a CHECK-RAISE, building a much larger pot than if you had bet originally.", action: "CHECK-RAISE TO $100", potSize: 220 },
      { narration: "Your opponent calls, and you win a much larger pot thanks to inducing their bluff!", action: "OPPONENT CALLS", potSize: 220, result: "success" }
    ]
  }
];

const guidedPracticeQuestions = [
  {
    title: "Scenario 1",
    hand: ['A♠', 'A♦'],
    board: ['Q♥', 'Q♦', '7♠'],
    opponentInfo: "Your opponent is very aggressive and likes to bluff when checked to him. This is a heads-up pot. You are the first to act.",
    options: ["Check", "Bet", "Fold", "Raise", "Call"],
    correct: 0,
    hints: [
      "You have a very strong hand (overpair to the board, effectively threes with queens). What is the main goal with a monster hand against an aggressive bluffer?",
      "How can you make your strong hand look weaker to invite a bluff?",
      "Remember the risk of giving a free card, but in this case, the board is dry, which reduces that risk."
    ],
    explanation: "By checking with a strong hand (overpair on a board with a pair, effectively threes), you invite your aggressive opponent to bluff, believing that your check indicates weakness. This sets the stage for a potential check-raise, maximizing the value you get from their bluffs. A dry board (no flush or straight options) minimizes the risk of giving away a free card."
  },
  {
    title: "Scenario 2",
    hand: ['T♥', 'T♦'],
    board: ['J♠', 'T♣', '4♥'],
    opponentInfo: "Your opponent looks to be drawing to a straight. You are the first to act.",
    options: ["Check", "Bet", "Fold", "Raise", "Call"],
    correct: 1,
    hints: [
      "Completing a set, which is a very strong hand. However, the board also offers a draw option (e.g., Q9 for a straight). What is your goal with a strong but vulnerable hand?",
      "How do you signal strength and make your opponent pay dearly to continue drawing or bluffing?",
      "Giving a free card can allow your opponent to complete his draw. What action prevents this?"
    ],
    explanation: "Completing a set, which is a monster hand, but the board also offers a draw to a straight (J-T-4, potential for a straight with Q9 or 98). A bet signals strength and makes it more expensive for your opponent to continue their draw or try to bluff. It prevents them from getting a free card, protects your strong hand from being outdrawn, and prevents potential bluffs."
  },
  {
    title: "Scenario 3",
    hand: ['A♠', 'K♠'],
    board: ['Q♠', '8♠', '2♠'],
    opponentInfo: "You have made a royal flush, and your opponent checks passively. This is a heads-up pot. You are the first to act.",
    options: ["Check", "Bet", "Fold", "Raise", "Call"],
    correct: 0,
    hints: [
      "You have a royal flush, an unbeatable hand at this point. What is your main goal with the nuts?",
      "Your opponent is passive. How can you encourage him to bet more, perhaps by bluffing or mistakenly thinking he has the best hand?",
      "Consider how a check might be perceived by a passive opponent versus an aggressive opponent."
    ],
    explanation: "With a royal flush, your hand is unbeatable. Checking (slow play) encourages your opponent to bet, perhaps by bluffing or betting for value with a weaker hand, because he may interpret your passive play as weakness. This strategy aims to build a larger pot by provoking more action from a passive opponent, thereby maximizing your winnings."
  },
  {
    title: "Scenario 4",
    hand: ['K♠', 'Q♠'],
    board: ['K♦', '7♣', '2♥'],
    opponentInfo: "Your opponent is a loose player who often semi-bluffs on the flop with overcards or weak draws. You are in position (last to act). Your opponent has checked.",
    options: ["Check", "Bet", "Fold", "Raise", "Call"],
    correct: 1,
    hints: [
      "You have top pair, which is a good hand. Your opponent is known to bluff. What is the goal here?",
      "Since your opponent has checked, he is inviting a bet. How can you confirm your strength and prevent him from getting a free card?",
      "Will calling make your hand look weaker and invite a bluff later, or signal commitment?"
    ],
    explanation: "You have top pair with a high kicker, which is a strong hand. Your opponent has checked, and he is known to be a bluffer, especially with draws. Betting into his check signals strength and makes it harder for him to bluff later. This deprives him of a free card to complete a draw and forces him to commit immediately or fold, effectively stopping his potential bluff attempts."
  }
];

const independentPracticeQuestions = [
  {
    title: "Scenario 1",
    hand: ['Q♦', 'J♦'],
    board: ['Q♥', 'J♣', '7♠', '7♥'],
    opponentInfo: "You have two strong pairs on the turn, but the board is paired. Your opponent is very tight. You are the first to act.",
    options: ["Check", "Bet", "Fold", "Raise", "Call"],
    correct: 1,
    explanation: "You have two strong pairs, but the board is paired (a pair of 7s). A bet signals strength and makes it harder for a tight opponent to bluff you out of your hand on later streets. By acting first and betting, you protect your hand from bluffs, even against a tight player who may only continue with strong hands or very specific bluffs."
  },
  {
    title: "Scenario 2",
    hand: ['7♠', '7♦'],
    board: ['7♥', '7♣', 'A♠', 'K♦', 'J♥'],
    opponentInfo: "You have four 7s on the river. Your opponent has bet big on previous streets. He has checked to you. You are last to act.",
    options: ["Check", "Bet", "Fold", "Raise", "Call"],
    correct: 1,
    explanation: "You have four 7s, the absolute nuts. Your opponent has bet big on previous streets but has checked on the river, perhaps indicating a medium-sized hand that he is not willing to bet with, or an attempt to lure you into a bluff. A small to medium-sized bet can entice him to call, believing that his hand might be good enough, or even bluff-raise if he perceives your bet as an attempt to 'buy the pot'."
  },
  {
    title: "Scenario 3",
    hand: ['8♠', '8♥'],
    board: ['Q♣', 'J♣', '6♦', '2♠'],
    opponentInfo: "You have a mediocre pair on a scary board, facing a very aggressive opponent. You are the first to act.",
    options: ["Check", "Bet", "Fold", "Raise", "Call"],
    correct: 1,
    explanation: "You have a mediocre pair on a board that could easily give your aggressive opponent multiple draws or better pairs. Betting signals strength and reduces the chance that your aggressive opponent will bluff, especially if he has a draw. This action aims to stop bluffs by preventing a free card and forcing weaker hands to fold."
  },
  {
    title: "Scenario 4",
    hand: ['A♦', 'K♠'],
    board: ['K♣', '6♦', '2♠'],
    opponentInfo: "Your opponent is tight-aggressive, usually bets with strong hands, but will bluff if you show weakness. You are in position (last to act). Your opponent has checked.",
    options: ["Check", "Bet", "Fold", "Raise", "Call"],
    correct: 1,
    explanation: "You have top pair, top kicker (a strong hand). Your tight-aggressive opponent has checked, which may indicate a weaker hand that he is considering folding or an attempt to entice you to bet. Betting into his check confirms your strength and prevents him from bluffing on later streets if he has a marginal hand or a draw. This ensures that you win the pot now and prevents him from being able to bluff you later."
  }
];

const finalChallengeQuestions = [
  {
    title: "Question 1",
    hand: ['9♣', '9♦'],
    board: ['A♠', 'K♥', '2♦'],
    opponentInfo: "You have a medium pair on a dry board, and your opponent (who bluffs 60% of the time when you check) just checked. You are first to act.",
    options: ["Check", "Bet", "Fold", "Raise", "Call"],
    correct: 1
  },
  {
    title: "Question 2",
    hand: ['7♠', '8♦'],
    board: ['4♣', '5♥', '6♦', '6♠'],
    opponentInfo: "You have a nut straight on a board with a pair, your opponent has shown signs of weakness. You are in position (last to act). Your opponent has checked.",
    options: ["Check", "Bet", "Fold", "Raise", "Call"],
    correct: 0
  },
  {
    title: "Question 3",
    hand: ['Q♥', 'J♥'],
    board: ['Q♠', '8♣', '3♦', '7♠'],
    opponentInfo: "Your opponent is aggressive and likely has a flush draw. You are first to act.",
    options: ["Check", "Bet", "Fold", "Raise", "Call"],
    correct: 1
  },
  {
    title: "Question 4",
    hand: ['K♣', 'K♦'],
    board: ['K♠', 'T♥', '2♣'],
    opponentInfo: "Your opponent is a loose player who calls a lot of bets, but folds to big raises on the flop. You are in position (last to act). Your opponent has checked.",
    options: ["Check", "Bet", "Fold", "Raise", "Call"],
    correct: 0
  },
  {
    title: "Question 5",
    hand: ['A♠', 'A♣'],
    board: ['6♦', '7♦', '8♥'],
    opponentInfo: "Your opponent is an experienced player who will 'float' (call with weak hands to bluff later) if you check. You are the first to act.",
    options: ["Check", "Bet", "Fold", "Raise", "Call"],
    correct: 1
  }
];

export default function Game24() {
  const [currentStage, setCurrentStage] = useState('intro');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slideDirection, setSlideDirection] = useState(1);
  const [currentDemo, setCurrentDemo] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);

  // Practice stages state
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showHints, setShowHints] = useState(false);
  const [currentHint, setCurrentHint] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);

  // Final challenge state
  const [timer, setTimer] = useState(30);
  const [finalAnswers, setFinalAnswers] = useState([]);
  const [hasPassed, setHasPassed] = useState(false);

  const [user, setUser] = useState(null);
  const gameId = 24;
  const navigate = useNavigate();
  const tracktimer = useActiveStopwatch();
  const completedRef = React.useRef(false);

  const resetForNextQuestion = useCallback(() => {
    setSelectedAnswer(null);
    setShowHints(false);
    setCurrentHint(0);
    setShowExplanation(false);
    setTimer(30); // Reset timer for each question
  }, []);

  const handleNextQuestion = useCallback((timeout = false) => {
    let isCorrect = false;
    const questionsArray = currentStage === 'guidedPractice' ? guidedPracticeQuestions :
                          currentStage === 'independentPractice' ? independentPracticeQuestions :
                          finalChallengeQuestions;
    const question = questionsArray[questionIndex];

    if (!timeout && selectedAnswer !== null) {
      isCorrect = selectedAnswer === question.correct;
    }

    if (currentStage === 'finalChallenge') {
      const updatedAnswers = [...finalAnswers, isCorrect];
      setFinalAnswers(updatedAnswers);

      if (questionIndex < finalChallengeQuestions.length - 1) {
        setQuestionIndex(q => q + 1);
        resetForNextQuestion();
      } else {
        const score = updatedAnswers.filter(Boolean).length;
        setHasPassed(score >= 4);
        setCurrentStage('completion');
      }
    } else {
      setShowExplanation(true);
    }
  }, [currentStage, questionIndex, selectedAnswer, finalAnswers, resetForNextQuestion]);

  // Timer effect for final challenge
  useEffect(() => {
    let interval;
    if (currentStage === 'finalChallenge' && !showExplanation) {
      if (timer > 0) {
        interval = setInterval(() => {
          setTimer(t => t - 1);
        }, 1000);
      } else {
        handleNextQuestion(true); // Timeout
      }
    }
    return () => clearInterval(interval);
  }, [timer, currentStage, showExplanation, handleNextQuestion]);

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

  const completeGame = async (passed = true) => {
    if (!user) return;

    if (passed) {
      const today = new Date().toISOString().split('T')[0];
      completedRef.current = true;
      const spentSec = tracktimer.readSeconds();
      track("Game Completed", { gameId, spentSec });
      await User.completeGame(24);
    }
    navigate(createPageUrl("Home"));
  };

  const handleSlideChange = (newSlide) => {
    setSlideDirection(newSlide > currentSlide ? 1 : -1);
    setCurrentSlide(newSlide);
  };

  const handleDemoStep = (direction) => {
    const demo = demoScenarios[currentDemo];
    if (direction === 1) { // Next
      if (currentStep < demo.steps.length - 1) {
        setCurrentStep(s => s + 1);
      } else if (currentDemo < demoScenarios.length - 1) {
        setCurrentDemo(d => d + 1);
        setCurrentStep(0);
      } else {
        setCurrentStage('guidedPracticeIntro'); // Changed to next stage after demos
      }
    } else { // Previous
      if (currentStep > 0) {
        setCurrentStep(s => s - 1);
      } else if (currentDemo > 0) {
        const prevDemo = demoScenarios[currentDemo - 1];
        setCurrentDemo(d => d - 1);
        setCurrentStep(prevDemo.steps.length - 1);
      }
    }
  };

  const advanceAfterExplanation = () => {
    const questions = currentStage === 'guidedPractice' ? guidedPracticeQuestions : independentPracticeQuestions;
    if (questionIndex < questions.length - 1) {
      setQuestionIndex(q => q + 1);
      resetForNextQuestion();
    } else {
      const nextStage = currentStage === 'guidedPractice' ? 'independentPracticeIntro' : 'finalChallengeIntro';
      setCurrentStage(nextStage);
      setQuestionIndex(0);
      resetForNextQuestion();
    }
  };

  const renderIntro = () => (
    <div className="max-w-4xl mx-auto text-center">
      <div className="bg-black/20 backdrop-blur-md rounded-2xl p-8 border border-green-600/30">
        <Target className="w-16 h-16 text-yellow-400 mx-auto mb-6" />
        <h1 className="text-4xl font-bold text-white mb-4">Game 24: Induce/Stop Bluffs</h1>
        <h2 className="text-2xl font-semibold text-green-300 mb-6">Techniques to Encourage/Prevent</h2>
        <p className="text-green-200 text-lg mb-8">Master the art of manipulating your opponents' betting behavior. Learn when to encourage bluffs to build bigger pots and when to stop them to protect your hand.</p>
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
            className="bg-black/20 backdrop-blur-md rounded-2xl p-8 border border-green-600/30"
          >
            <div className="text-center mb-6">
              <Icon className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-white mb-2">{slide.title}</h2>
            </div>
            <div className="bg-white/10 rounded-xl p-6 min-h-[200px] flex flex-col items-center justify-center">
              <p className="text-green-200 text-lg leading-relaxed whitespace-pre-line">{slide.content}</p>
              {slide.showPokerTable && (
                <div className="mt-6 w-full h-[300px]">
                  <PokerTable
                    players={[
                      { position: 'BTN', stack: 500, cards: slide.playerHand, isHero: true, status: "(You)" },
                      { position: 'BB', stack: 400, cards: ['', ''], status: "Opponent" }
                    ]}
                    pot={100}
                    communityCards={slide.board}
                    narration="Example scenario showing check-raise opportunity"
                    dealerPosition="BTN"
                  />
                </div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
        <div className="flex justify-between items-center mt-6">
          <Button onClick={() => handleSlideChange(Math.max(0, currentSlide - 1))} disabled={currentSlide === 0} variant="outline" className="border-green-600 text-green-300 hover:bg-green-600/20"><ArrowLeft className="mr-2 w-4 h-4" /> Previous</Button>
          <div className="flex gap-2">{explanationSlides.map((_, index) => (<button key={index} onClick={() => handleSlideChange(index)} className={`w-3 h-3 rounded-full transition-colors ${currentSlide === index ? 'bg-yellow-400' : 'bg-green-700 hover:bg-green-600'}`} />))}</div>
          {currentSlide < explanationSlides.length - 1 ? (<Button onClick={() => handleSlideChange(currentSlide + 1)} className="bg-green-600 hover:bg-green-700 text-white">Next <ArrowRight className="ml-2 w-4 h-4" /></Button>) : (<Button onClick={() => setCurrentStage('gameIntro')} className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold">Continue <ArrowRight className="ml-2 w-4 h-4" /></Button>)}
        </div>
      </div>
    );
  };

  const renderGameIntro = () => (
    <div className="max-w-4xl mx-auto text-center">
      <div className="bg-black/20 backdrop-blur-md rounded-2xl p-8 border border-green-600/30">
        <h2 className="text-3xl font-bold text-white mb-6">Bluff Master: Outwit Your Opponent!</h2>
        <p className="text-green-200 text-lg mb-6">Understanding how to manipulate your opponents' betting behavior is a hallmark of advanced poker play. This mini-game will teach you the art of inducing bluffs when you have a strong hand, and stopping bluffs when your hand needs protection. Master these strategic techniques to control the pot and maximize your winnings!</p>

        <div className="bg-green-900/30 rounded-xl p-6 mb-6 text-left">
          <h3 className="text-xl font-bold text-white mb-4">Game Format:</h3>
          <p className="text-green-200 mb-4">Scenario-based Decision with Interactive Outcome Simulation. You will be presented with specific poker scenarios where you must choose the most effective action to either induce a bluff from your opponent or stop a potential bluff from occurring.</p>

          <h3 className="text-xl font-bold text-white mb-4">How to Play:</h3>
          <ol className="text-green-200 space-y-2">
            <li>1. You'll see your poker hand, community cards, and opponent tendencies</li>
            <li>2. Choose to either induce a bluff or stop a bluff based on your hand strength</li>
            <li>3. Get immediate feedback on your strategic decision</li>
          </ol>
        </div>

        <Button onClick={() => setCurrentStage('stage1Intro')} className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-8 py-3 text-lg">Begin Game <ArrowRight className="ml-2 w-5 h-5" /></Button>
      </div>
    </div>
  );

  const renderStage1Intro = () => (
    <div className="max-w-4xl mx-auto text-center flex flex-col items-center justify-center h-[60vh]">
      <div className="bg-black/20 backdrop-blur-md rounded-2xl p-8 border-2 border-yellow-700/50 shadow-2xl">
        <h2 className="text-4xl font-bold text-yellow-400 mb-6 font-heading">Stage 1: Live Demo</h2>
        <p className="text-green-200 text-lg mb-6">The system will guide you through two distinct examples, showcasing the application of both bluff-stopping and bluff-inducing techniques.</p>
        <Button onClick={() => {setCurrentStage('liveDemo'); setCurrentDemo(0); setCurrentStep(0);}} className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold">Start Demo <ArrowRight className="ml-2 w-5 h-5" /></Button>
      </div>
    </div>
  );

  const renderLiveDemo = () => {
    const scenario = demoScenarios[currentDemo];
    const step = scenario.steps[currentStep];

    return (
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-white mb-2">{scenario.title}</h2>
          <p className="text-green-300">Interactive Demonstration</p>
        </div>

        <div className="bg-black/40 backdrop-blur-md rounded-2xl p-6 mb-6 border border-yellow-400/30">
          <div className="grid md:grid-cols-2 gap-6 mb-4">
            <div className="text-center">
              <h3 className="text-white font-bold mb-2">Your Hand</h3>
              <div className="flex justify-center gap-2">
                {scenario.playerHand.map((card, i) => (<PlayingCard key={i} card={card} className="w-16 h-24" />))}
              </div>
            </div>
            <div className="text-center">
              <h3 className="text-white font-bold mb-2">Board</h3>
              <div className="flex justify-center gap-2">
                {scenario.board.map((card, i) => (<PlayingCard key={i} card={card} className="w-16 h-24" />))}
              </div>
            </div>
          </div>
          <div className="text-center">
            <p className="text-green-200 mb-2"><strong>Pot:</strong> ${step.potSize}</p>
            <p className="text-blue-200 text-sm">{scenario.opponentInfo}</p>
          </div>
        </div>

        <div className="h-[400px] mb-6">
          <PokerTable
            players={[
              { position: 'BTN', stack: 500, cards: scenario.playerHand, isHero: true, status: step.action && step.action.includes('CHECK') ? 'Checks' : step.action && step.action.includes('BET') ? step.action : step.action && step.action.includes('RAISE') ? step.action : null },
              { position: 'BB', stack: 400, cards: ['', ''], status: step.action && step.action.includes('OPPONENT') ? step.action.replace('OPPONENT ', '') : null }
            ]}
            pot={step.potSize}
            communityCards={scenario.board}
            narration={step.narration}
            dealerPosition="BTN"
          />
        </div>

        {step.result && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={`rounded-xl p-6 mb-6 text-center ${step.result === 'success' ? 'bg-green-900/30 border-green-500' : 'bg-red-900/30 border-red-500'} border`}>
            <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <h3 className="text-xl font-bold text-white mb-2">Strategy Executed Successfully!</h3>
            <p className="text-green-200">{scenario.explanation}</p>
          </motion.div>
        )}

        <div className="flex justify-between items-center">
          <Button
            onClick={() => handleDemoStep(-1)}
            disabled={currentDemo === 0 && currentStep === 0}
            variant="outline"
            className="border-green-700 text-green-300 hover:bg-green-700/20"
          >
            <ArrowLeft className="mr-2 w-4 h-4" /> Previous
          </Button>

          <div className="text-green-300 text-center">
            <div>Demo {currentDemo + 1} of {demoScenarios.length}</div>
            <div className="text-sm">Step {currentStep + 1} of {scenario.steps.length}</div>
          </div>

          {currentStep < scenario.steps.length - 1 ? (
            <Button
              onClick={() => handleDemoStep(1)}
              className="bg-green-700 hover:bg-green-800 text-white"
            >
              Next Step <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          ) : currentDemo < demoScenarios.length - 1 ? (
            <Button
              onClick={() => handleDemoStep(1)}
              className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold"
            >
              Next Demo <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={() => setCurrentStage('guidedPracticeIntro')} // Transition to next stage
              className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold"
            >
              Continue <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    );
  };

  const renderStageIntro = (title, content, nextStage) => (
    <div className="max-w-4xl mx-auto text-center flex flex-col items-center justify-center h-[60vh]">
      <div className="bg-black/20 backdrop-blur-md rounded-2xl p-8 border-2 border-yellow-700/50 shadow-2xl">
        <h2 className="text-4xl font-bold text-yellow-400 mb-6 font-heading">{title}</h2>
        <p className="text-green-200 text-lg mb-6">{content}</p>
        <Button onClick={() => {
          setCurrentStage(nextStage);
          setQuestionIndex(0);
          resetForNextQuestion();
        }} className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold">
          Start <ArrowRight className="ml-2 w-5 h-5" />
        </Button>
      </div>
    </div>
  );

  const renderPracticeStage = (questions, stageTitle, withHints = false) => {
    const question = questions[questionIndex];
    const isFinalChallenge = stageTitle.includes('Final Stage');

    let isCorrect = false;
    if (showExplanation && selectedAnswer !== null) {
      isCorrect = selectedAnswer === question.correct;
    }

    return (
      <div className="max-w-6xl mx-auto">
        <motion.div
          key={currentStage + "-" + questionIndex}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-black/20 backdrop-blur-md rounded-2xl p-8 border border-yellow-600/30"
        >
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold text-white mb-2">{stageTitle}</h2>
            <p className="text-green-300 mb-4">{question.title}</p>

            {isFinalChallenge && (
              <div className="flex items-center justify-center gap-2 text-red-400 mb-4">
                <Timer className="w-6 h-6"/>
                <p className="text-2xl font-bold">{timer}s</p>
              </div>
            )}
          </div>

          {/* Poker Table */}
          <div className="h-[400px] mb-6">
            <PokerTable
              players={[
                { position: 'BTN', stack: 500, cards: question.hand, isHero: true, status: "(You)" },
                { position: 'BB', stack: 400, cards: ['', ''], status: "Opponent" }
              ]}
              pot={100}
              communityCards={question.board}
              narration={question.opponentInfo}
              dealerPosition="BTN"
            />
          </div>

          <div className="bg-white/10 p-6 rounded-xl space-y-6">
            <p className="text-lg text-white text-center">What is the optimal action in your position?</p>

            {/* Answer Options */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {question.options.map((option, idx) => (
                <Button
                  key={idx}
                  onClick={() => !showExplanation && setSelectedAnswer(idx)}
                  variant={selectedAnswer === idx ? 'default' : 'outline'}
                  className={`${selectedAnswer === idx ? "bg-yellow-500 hover:bg-yellow-600 text-black" : "border-green-600 text-green-300 hover:bg-green-600/20"} ${showExplanation && idx === question.correct ? "!bg-green-600 !text-white" : ""}`}
                  disabled={showExplanation}
                >
                  {option}
                </Button>
              ))}
            </div>
          </div>

          {/* Hints for Guided Practice */}
          {withHints && !showExplanation && showHints && question.hints && (
            <motion.div
              initial={{opacity:0}}
              animate={{opacity:1}}
              className="mt-4 p-4 bg-blue-900/30 rounded-lg text-blue-200"
            >
              <p><strong>Hint {currentHint + 1}:</strong> {question.hints[currentHint]}</p>
            </motion.div>
          )}

          {/* Explanation */}
          {showExplanation && (
            <motion.div
              initial={{opacity:0}}
              animate={{opacity:1}}
              className={`mt-4 p-4 rounded-lg ${isCorrect ? 'bg-green-900/30 text-green-200' : 'bg-red-900/30 text-red-200'}`}
            >
              <p><strong>{isCorrect ? 'Correct!' : 'Incorrect.'}</strong> {question.explanation}</p>
            </motion.div>
          )}

          <div className="flex justify-between items-center mt-6">
            {!isFinalChallenge && !showExplanation && withHints && question.hints && currentHint < question.hints.length - 1 && (
              <Button variant="link" onClick={() => {
                if (!showHints) setShowHints(true);
                else if (currentHint < question.hints.length - 1) setCurrentHint(h => h + 1);
              }} className="text-yellow-400 hover:underline">
                Need a Hint? ({currentHint + (showHints ? 1 : 0)}/{question.hints.length})
              </Button>
            )}
            {(!isFinalChallenge && !showExplanation && (!withHints || !question.hints)) && <div />}

            {!showExplanation ? (
              <Button onClick={() => handleNextQuestion()}
                className="bg-green-600 hover:bg-green-700 ml-auto"
                disabled={selectedAnswer === null}
              >
                Submit
              </Button>
            ) : (
              !isFinalChallenge && (
                <Button onClick={advanceAfterExplanation} className="bg-yellow-500 hover:bg-yellow-600 text-black ml-auto">
                  {questionIndex < questions.length - 1 ? 'Next Question' : 'Next Stage'} <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              )
            )}
          </div>
        </motion.div>
      </div>
    );
  };

  const renderCompletion = () => (
    <div className="max-w-4xl mx-auto text-center">
      <div className="bg-black/20 backdrop-blur-md rounded-2xl p-8 border border-green-600/30">
        {hasPassed ? (
          <>
            <Trophy className="w-20 h-20 text-yellow-400 mx-auto mb-6" />
            <h2 className="text-4xl font-bold text-white mb-4">Congratulations!!!</h2>
            <div className="bg-green-900/30 rounded-xl p-6 mb-8">
              <p className="text-green-200 text-lg">
                You have successfully completed the Induce/Stop Bluffs — techniques to encourage/prevent mini-game. You now have the knowledge on how to distinguish between scenarios requiring bluff-inducing and bluff-stopping techniques, and select the optimal strategic play to apply those very important techniques. This is a very Important ability that will help you to be above your opponents in understanding the game, providing a solid knowledge for your poker table decision making. Keep practicing and applying what you have learned!
              </p>
            </div>
            <Button onClick={() => completeGame(true)} className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-8 py-3 text-lg">
              Complete Game <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </>
        ) : (
          <>
            <ThumbsDown className="w-16 h-16 text-red-400 mx-auto mb-6" />
            <h2 className="text-4xl font-bold text-white mb-4">Not enough!!!</h2>
            <p className="text-red-200 text-lg mb-8">
              You did not have enough correct answers. Go and try again to complete this minigame. You Can Do It!
            </p>
            <Button onClick={() => {
              setCurrentStage('finalChallengeIntro');
              setQuestionIndex(0);
              setFinalAnswers([]);
              resetForNextQuestion();
            }} className="bg-blue-500 hover:bg-blue-600 text-white font-bold px-8 py-3 text-lg">
              <RefreshCw className="mr-2 w-5 h-5" /> Try Again
            </Button>
          </>
        )}
      </div>
    </div>
  );

  const renderContent = () => {
    switch (currentStage) {
      case 'intro': return renderIntro();
      case 'explanation': return renderExplanation();
      case 'gameIntro': return renderGameIntro();
      case 'stage1Intro': return renderStage1Intro();
      case 'liveDemo': return renderLiveDemo();
      case 'guidedPracticeIntro': return renderStageIntro("Stage 2: Guided Practice", "A small set of questions designed to reinforce the concepts with interactive hints.", 'guidedPractice');
      case 'guidedPractice': return renderPracticeStage(guidedPracticeQuestions, "Stage 2: Guided Practice", true);
      case 'independentPracticeIntro': return renderStageIntro("Stage 3: Independent Practice", "A larger set of questions without hints, providing immediate, concise feedback upon selection.", 'independentPractice');
      case 'independentPractice': return renderPracticeStage(independentPracticeQuestions, "Stage 3: Independent Practice", false);
      case 'finalChallengeIntro': return renderStageIntro("Final Stage: Bluff Challenge – Rapid Decision Fire Round", "A timed series of 5 mixed poker scenarios presented rapidly. You will have 30 seconds per question to correctly answer at least 4 out of 5 questions.", 'finalChallenge');
      case 'finalChallenge': return renderPracticeStage(finalChallengeQuestions, "Final Stage: Bluff Challenge – Rapid Decision Fire Round", false);
      case 'completion': return renderCompletion();
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
          key={currentStage + currentSlide + currentDemo + currentStep + questionIndex}
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
