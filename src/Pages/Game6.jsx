
import React, { useState, useEffect } from "react";
import { UserService as User } from "@/services/user";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, ArrowRight, Trophy, CheckCircle, ThumbsDown, ThumbsUp, Users, Orbit, Shield, UserCheck, Target, TrendingUp, Eye, Calculator} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import PlayingCard from "../components/shared/PlayingCard"; // New import
import { track } from "@/lib/analytics";
import useActiveStopwatch from "@/hooks/useActiveStopwatch";

const StageDivider = ({ title, onContinue }) => (
  <div className="max-w-4xl mx-auto text-center flex flex-col items-center justify-center h-[60vh]">
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.7, ease: "easeOut" }}
      className="bg-black/20 backdrop-blur-md rounded-2xl p-8 border-2 border-yellow-700/50 shadow-2xl"
    >
      <h2 className="text-4xl font-bold text-yellow-400 mb-6 font-heading">{title}</h2>
      <Button onClick={onContinue} className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold">
        Continue <ArrowRight className="ml-2 w-5 h-5" />
      </Button>
    </motion.div>
  </div>
);

export default function Game6() {
  const [currentStage, setCurrentStage] = useState('intro');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slideDirection, setSlideDirection] = useState(1);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [user, setUser] = useState(null);
  const gameId = 6;
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
    await User.completeGame(6);

    navigate(createPageUrl("Home"));
  };


  const handleSlideChange = (newSlide) => {
    setSlideDirection(newSlide > currentSlide ? 1 : -1);
    setCurrentSlide(newSlide);
  };

  const explanationSlides = [
  {
    title: "Part A: What are Implied Odds?",
    content: "Implied odds can be understood as an extension of pot odds, focusing on the potential future earnings a player can expect. Unlike direct pot odds, which only consider the immediate money in the pot versus the amount you must call, implied odds take into account the additional winnings you anticipate from future betting rounds (the turn or river) after your drawing hand successfully improves.",
    icon: Target
  },
  {
    title: "Part A: What are Implied Odds?",
    content: "This concept is particularly valuable because it allows a player to justify calling a bet in the present moment—even when the immediate pot odds are unfavorable—if they believe they can recover their investment and gain further profit from their opponent on later streets. Essentially, implied odds reflect your expectation of future gains once you hit your desired card.",
    icon: TrendingUp
  },
  {
    title: "Part A: What are Implied Odds?",
    content: "Example: If you have a flush draw and the pot offers 5:1 odds, but you need 4:1 to call profitably right now, you might still call if you expect your opponent to bet more chips into the pot on later streets once you hit your flush.",
    icon: Calculator
  },
  {
    title: "Part B: When are Implied Odds \"Good\"?",
    content: "Good implied odds are found in situations where you have a strong expectation of winning significantly more money from your opponent once your drawing hand completes. These favorable conditions typically arise when facing:\n• Aggressive Opponents: Players who are likely to continue betting heavily on later streets, even after your hand improves.\n• Calling Stations: Opponents who rarely fold and are prone to calling bets with weaker hands, thereby paying you off when you hit your draw.\n• Hidden Draws: If your completed hand (like a straight or set) is not easily detectable by your opponent, they are more likely to bet into your strong hand, increasing your potential winnings.\n• Multi-way Pots: When there are multiple opponents in the hand, the pot tends to grow larger, offering more opportunities to extract value after hitting your draw.\n• Being in Position: Acting last in a betting round (being \"in position\") gives you the advantage of seeing your opponent's action first, allowing you to make better decisions to extract value.",
    icon: ThumbsUp
  },
  {
    title: "Part B: When are Implied Odds \"Good\"? - Example",
    content: "You're holding a flush draw against a very aggressive player who constantly bets. Even if the current pot odds are slim, the implied odds are good because if you hit your flush, that opponent is likely to bet again, allowing you to win more.",
    icon: CheckCircle
  },
  {
    title: "Part C: When are Implied Odds \"Bad\"?",
    content: "Conversely, implied odds are considered bad when there's little to no expectation of extracting additional value from your opponent after completing your drawing hand. These situations include:\n• Tight Players: Opponents who are disciplined and will likely fold if your draw completes and you show strength, meaning they won't pay off further bets.\n• Short-Stacked Opponents: If your opponent has very few chips left, there's not much potential for future winnings, even if you hit a strong hand.\n• Being Out of Position: Acting first makes it challenging to control the size of the pot and extract maximum value, as you provide information to your opponent before they act.\n• End-of-Action Scenarios: On the river, there are no more betting rounds after the current one, meaning no future value can be extracted.",
    icon: ThumbsDown
  },
  {
    title: "Part C: When are Implied Odds \"Bad\"? - Example",
    content: "You have a straight draw against a tight player who has only a small stack of chips left. If you hit your straight, they'll likely fold, meaning you won't get any more chips from them beyond the current bet.",
    icon: Shield
  },
  {
    title: "Part D: Practical Application",
    content: "While implied odds are an essential concept for making profitable decisions, it's crucial to understand that they are not accurately quantifiable through precise mathematical formulas in the same way pot odds are. This is because calculating implied odds depends heavily on predictions about your opponent's future behavior and how they might react to your completed draw, which is inherently uncertain.",
    icon: Eye
  },
  {
    title: "Part D: Practical Application",
    content: "Therefore, rather than attempting complex calculations, it is more practical to make educated guesses based on your experience and your observations of opponent tendencies. Factors like your opponents' playing styles, their stack sizes, and the overall dynamics of the game, along with the specific nature of your draw, all play a vital role in assessing your implied odds.",
    icon: Users
  },
  {
    title: "Part D: Practical Application",
    content: "As you gain experience, your ability to make these informed guesses will improve, providing a strategic advantage. Example: If you consistently observe a specific opponent calling down light, your \"educated guess\" on implied odds against them will be higher compared to an opponent who folds easily.",
    icon: UserCheck
  }
];

  const questions = [
    // Stage 2 Questions
    {
      stage: 'stage2',
      playerHand: ['8♥', '7♥'],
      board: ['6♠', '9♦', 'K♣'],
      scenario: "You have an open-ended straight draw on the flop. Your opponent is short-stacked and a tight player (NIT). You are facing a bet that offers unfavorable immediate odds.",
      question: "Should you consider calling based on Implied odds?",
      options: ["Yes, good Implied odds", "No, bad Implied odds"],
      correct: 1,
      explanation: "Bad Implied odds in this situation because a short-stacked tight player (NIT) is unlikely to bet much or call you on later streets, even if you complete your draw. You will not be able to maximize future profits beyond the current bet.",
      hint: "Consider how much money a short-stacked and tight opponent can (or will) put in the pot on later streets. If he has little to lose and won't call, can you really expect to win more from him later?"
    },
    {
      stage: 'stage2',
      playerHand: ['5♣', '5♦'],
      board: ['K♠', 'T♦', '5♥'],
      scenario: "You have a set draw with a pocket pair on the flop (e.g., you have 55 and the flop is K-T-5). You are in a multi-way pot with three other players, all with deep stacks. You are also acting last. The immediate odds are mediocre.",
      question: "Are your Implied odds good or bad?",
      options: ["Good Implied odds", "Bad Implied odds"],
      correct: 0,
      explanation: "Implied odds are good here because of a number of factors: a multi-way pot (greater potential for overall profit), deep stacks of opponents (more chips to make on later streets), and position (ability to respond to opponents' bets after they've acted). A set draw is also a 'hidden draw' that opponents are likely to pay off when you make it.",
      hint: "A hidden draw like a set, combined with multiple opponents, deep stacks, and position advantage, offers excellent opportunities to generate value. Think about how big the pot can get and your ability to control your bets when you hit."
    },
    {
      stage: 'stage2',
      playerHand: ['A♥', '7♥'],
      board: ['K♥', 'Q♦', '2♥'],
      scenario: "You have a flush draw on the flop. Your opponent is a classic “calling station” - he almost never checks and likes to call bets, even with weak hands.",
      question: "What are your Implied odds in this situation?",
      options: ["Good Implied odds", "Bad Implied odds"],
      correct: 0,
      explanation: "A 'calling station' player is ideal for good Implied odds because they are likely to call you on later streets once you complete your draw, even if their hand is relatively weak. This significantly increases your profit potential.",
      hint: "A calling station player's tendency to call frequently means that he is likely to call you when you complete your draw, even if his hand is not strong. This creates excellent future profit potential."
    },
    // Stage 3 Questions
    {
      stage: 'stage3',
      playerHand: ['8♥', '9♥'],
      board: ['T♠', 'J♦', '2♣'],
      scenario: "You hold an open-ended straight draw. Your opponent is a tight (NIT) player who consistently folds when they face strength. You are out of position.",
      question: "Is calling based on implied odds a good idea here?",
      options: ["Yes, Good Implied Odds", "No, Bad Implied Odds"],
      correct: 1,
      explanation: "Bad implied odds. Tight players won't pay off when you hit, and being out of position makes it harder to extract value."
    },
    {
      stage: 'stage3',
      playerHand: ['A♥', 'K♥'],
      board: ['Q♥', 'J♦', '2♥', '7♠'],
      scenario: "You have a nut flush draw on the turn. Your opponent is a highly aggressive player who bets big regardless of the board, and you are in position. You are facing a bet that makes your immediate pot odds slightly unprofitable.",
      question: "What are your implied odds in this situation?",
      options: ["Good Implied Odds", "Bad Implied Odds"],
      correct: 0,
      explanation: "Good implied odds. Aggressive opponents + being in position = high potential for future payoff."
    },
    {
      stage: 'stage3',
      playerHand: ['8♠', '9♠'],
      board: ['T♥', 'J♣', 'Q♦', '3♠', '7♠'],
      scenario: "You've just hit your straight on the river. Your opponent bets, and there are no more betting rounds after this one.",
      question: "Are there any implied odds to consider in this situation?",
      options: ["Yes, Good Implied Odds", "No, Bad Implied Odds", "No Implied Odds"],
      correct: 2, // Corrected to match "No Implied Odds" option and explanation
      explanation: "No implied odds. Implied odds don't apply on the river as there are no future betting rounds to extract value."
    },
    {
      stage: 'stage3',
      playerHand: ['8♦', '7♦'],
      board: ['6♠', '9♥', 'K♣'],
      scenario: "You have a strong straight draw on the flop. You are in a multi-way pot with multiple opponents who are all deep-stacked and passive. You are also in position.",
      question: "Are your implied odds strong enough to consider calling with this drawing hand?",
      options: ["Yes, Good Implied Odds", "No, Bad Implied Odds"],
      correct: 0,
      explanation: "Good implied odds. Multi-way, deep-stacked, and passive players (calling stations) offer great implied odds, and being in position helps."
    },
    {
      stage: 'stage3',
      playerHand: ['A♠', '7♠'],
      board: ['K♦', 'Q♥', '2♣'],
      scenario: "You have a weak backdoor flush draw on the flop (meaning you need both the turn and river to hit). You are heads-up against a very cautious and tight player who has a medium stack and is known to fold if you hit a big hand. You are out of position.",
      question: "Are your implied odds good or bad for pursuing this draw?",
      options: ["Good Implied Odds", "No, Bad Implied Odds"],
      correct: 1,
      explanation: "Bad implied odds. Tight player unlikely to pay off + out of position + weak draw = poor implied odds."
    }
  ];

  const stage2Questions = questions.filter(q => q.stage === 'stage2');
  const stage3Questions = questions.filter(q => q.stage === 'stage3');

  const resetQuestionState = () => {
    setSelectedAnswer(null);
    setShowExplanation(false);
    setShowHint(false);
  }

  const handleNext = () => {
    const currentQuestions = currentStage === 'stage2' ? stage2Questions : stage3Questions;
    if (currentQuestion < currentQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      resetQuestionState();
    } else {
      if (currentStage === 'stage2') {
        setCurrentStage('stage3-intro'); // Changed to go to stage3-intro
        setCurrentQuestion(0);
        resetQuestionState();
      } else {
        setCurrentStage('completion');
      }
    }
  };

  const renderIntro = () => (
    <div className="max-w-4xl mx-auto text-center">
      <div className="bg-black/20 backdrop-blur-md rounded-2xl p-8 border border-green-600/30">
        <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-6" />
        <h1 className="text-4xl font-bold text-white mb-4">
          Game 6: Implied Odds (Intro)
        </h1>
        <h2 className="text-2xl font-semibold text-green-300 mb-6">
          When “bad now, good later”
        </h2>
        <p className="text-green-200 text-lg mb-8">
          Learn to recognize when situations with poor immediate odds can still be profitable. Master the
          art of spotting future value with implied odds!
        </p>
        <Button
          onClick={() => setCurrentStage('explanation')}
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
              <div className="bg-white/10 rounded-xl p-6 min-h-[200px] flex items-center">
                <p className="text-green-200 text-lg leading-relaxed whitespace-pre-line">{slide.content}</p>
              </div>
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
            <ArrowLeft className="mr-2 w-4 h-4" />
            Previous
          </Button>

          <div className="flex gap-2">
            {explanationSlides.map((_, index) => (
              <button
                key={index}
                onClick={() => handleSlideChange(index)}
                className={`w-3 h-3 rounded-full transition-colors ${
                  currentSlide === index ? 'bg-yellow-400' : 'bg-green-700'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>

          {currentSlide < explanationSlides.length - 1 ? (
            <Button
              onClick={() => handleSlideChange(currentSlide + 1)}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Next
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={() => setCurrentStage('gameIntro')}
              className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold"
            >
              Start Game
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    );
  };

  const renderGameIntro = () => (
    <div className="max-w-4xl mx-auto text-center">
      <div className="bg-black/20 backdrop-blur-md rounded-2xl p-8 border border-green-600/30">
        <h2 className="text-3xl font-bold text-white mb-6">
          Implied Odds: Can You Spot the Winning Hand?
        </h2>

        <div className="bg-green-900/30 rounded-xl p-6 mb-8 text-left">
          <h3 className="text-xl font-bold text-white mb-4">Short Intro:</h3>
          <p className="text-green-200">
            In poker, making a smart decision isn't always about immediate gains. Sometimes, a "bad" call now
            can turn into a big "good" win later, thanks to implied odds. This mini-game will train your eye
            to spot these crucial opportunities and understand when to chase your draws for maximum profit.
          </p>
        </div>

        <Button
          onClick={() => setCurrentStage('stage1')}
          className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-8 py-3 text-lg"
        >
          Begin Game
          <ArrowRight className="ml-2 w-5 h-5" />
        </Button>
      </div>
    </div>
  );

  const renderStage1 = () => (
    <div className="max-w-5xl mx-auto">
      <div className="bg-black/20 backdrop-blur-md rounded-2xl p-8 border border-green-600/30">
        <h2 className="text-3xl font-bold text-white text-center mb-8">Stage 1: Live Demo</h2>

        <div className="bg-white/5 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-4">Scenario:</h3>
          <p className="text-green-200 mb-4">
            You hold A♦ K♦ on a flop of J♦ T♦ 2♠. This gives you a nut flush draw. The pot currently has $20,
            and your opponent bets $10. Your immediate pot odds are 3:1 ($30 total pot / $10 to call). Your opponent
            is identified as a Loose-Aggressive (LAG) player who consistently bets large amounts.
          </p>
          <div className="bg-blue-900/30 rounded-lg p-4">
            <h4 className="text-blue-300 font-bold mb-3">Explanation:</h4>
            <p className="text-blue-200">
              In this scenario, your immediate pot odds might not seem favorable for calling your flush draw.
              However, we consider implied odds. Notice your opponent is a Loose-Aggressive (LAG) player.
              These players are known for frequently making large bets on later streets. If you hit your flush
              on the turn or river, this aggressive opponent is highly likely to bet more chips, allowing you
              to win a significantly larger pot than what's currently available. This strong expectation of
              future winnings means you have Good Implied Odds, making the call profitable in the long run,
              even if the direct pot odds are initially unfavorable. This is a classic 'bad now, good later'
              situation because of the expected future payoff.
            </p>
          </div>
        </div>

        <div className="text-center mt-8">
          <Button
            onClick={() => {
              setCurrentStage('stage2-intro'); // Changed to go to stage2-intro
              setCurrentQuestion(0);
              resetQuestionState();
            }}
            className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-8 py-3"
          >
            Continue to Practice
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );

  const renderQuestion = () => {
    const currentQuestions = currentStage === 'stage2' ? stage2Questions : stage3Questions;
    const question = currentQuestions[currentQuestion];
    const isCorrect = selectedAnswer === question.correct;

    return (
      <div className="max-w-5xl mx-auto">
        <div className="bg-black/20 backdrop-blur-md rounded-2xl p-8 border border-green-600/30">
          <h2 className="text-3xl font-bold text-white text-center mb-2">
            {currentStage === 'stage2' ? 'Stage 2: Guided Practice' : 'Stage 3: On Your Own!'}
          </h2>
          <p className="text-center text-green-300 mb-8">Question {currentQuestion + 1} of {currentQuestions.length}</p>

          <div className="bg-white/5 rounded-xl p-6 mb-6">
            <div className="grid md:grid-cols-2 gap-6 items-center mb-6">
              {question.playerHand && (
                <div className="text-center">
                  <h4 className="text-white font-bold mb-3">Your Hand</h4>
                  <div className="flex justify-center gap-2">
                    {question.playerHand.map((card, i) => <PlayingCard key={i} card={card} className="w-16 h-24" />)}
                  </div>
                </div>
              )}
              {question.board && (
                <div className="text-center">
                  <h4 className="text-white font-bold mb-3">Board</h4>
                  <div className="flex justify-center gap-2">
                    {question.board.map((card, i) => <PlayingCard key={i} card={card} className="w-16 h-24" />)}
                  </div>
                </div>
              )}
            </div>

            <p className="text-green-200 text-lg mb-4 text-center">{question.scenario}</p>
            <h3 className="text-xl font-bold text-white mb-4 text-center">{question.question}</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {question.options.map((option, index) => (
              <div
                key={index}
                className={`
                  p-6 rounded-lg cursor-pointer transition-all duration-300 border-2
                  ${selectedAnswer === index ? 'border-yellow-400 bg-yellow-400/10' : 'border-transparent bg-white/5 hover:border-green-400/50'}
                  ${showExplanation && index === question.correct ? 'border-green-400 bg-green-400/10' : ''}
                  ${showExplanation && selectedAnswer === index && index !== question.correct ? 'border-red-400 bg-red-400/10' : ''}
                `}
                onClick={() => !showExplanation && setSelectedAnswer(index)}
              >
                <div className="flex items-center gap-3">
                  <div className="text-white font-bold text-lg">{option}</div>
                  {showExplanation && index === question.correct && (
                    <CheckCircle className="ml-auto w-6 h-6 text-green-400" />
                  )}
                  {showExplanation && selectedAnswer === index && index !== question.correct && (
                    <ThumbsDown className="ml-auto w-6 h-6 text-red-400" />
                  )}
                </div>
              </div>
            ))}
          </div>

          {!showExplanation && showHint && question.hint && (
            <div className="bg-blue-900/30 rounded-xl p-4 mb-6">
              <p className="text-blue-200">
                <strong>Hint:</strong> {question.hint}
              </p>
            </div>
          )}

          {showExplanation && (
            <div className={`rounded-xl p-6 mb-6 ${isCorrect ? 'bg-green-900/30 border-green-500/30 border' : 'bg-red-900/30 border-red-500/30 border'}`}>
              <div className="flex items-center gap-2 mb-3">
                {isCorrect ? (
                  <CheckCircle className="w-6 h-6 text-green-400" />
                ) : (
                  <ThumbsDown className="w-6 h-6 text-red-400" />
                )}
                <h3 className="text-xl font-bold text-white">
                  {isCorrect ? 'Correct!' : 'Incorrect'}
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
                onClick={handleNext}
                className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold ml-auto"
              >
                {currentQuestion < currentQuestions.length - 1 ? 'Next Question' : currentStage === 'stage2' ? 'Continue to Final Stage' : 'Complete Game'}
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderCompletion = () => (
    <div className="max-w-4xl mx-auto text-center">
      <div className="bg-black/20 backdrop-blur-md rounded-2xl p-8 border border-green-600/30">
        <Trophy className="w-20 h-20 text-yellow-400 mx-auto mb-6" />
        <h2 className="text-4xl font-bold text-white mb-4">Congratulations!</h2>
        <div className="bg-green-900/30 rounded-xl p-6 mb-8">
          <p className="text-green-200 text-lg">
            You have successfully completed the 'Implied Odds: Can You Spot the Winning Hand?' mini-game.
            You now master the ability to recognize when implied odds justify a call beyond immediate pot odds,
            and you can evaluate how opponent tendencies and table dynamics affect your long-term profitability.
            This knowledge equips you with sharper decision-making skills and a deeper understanding of poker
            strategy that goes beyond simple math. Keep practicing these insights at the tables, and you'll be
            able to spot profitable opportunities that many players overlook!
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

      <AnimatePresence mode="wait">
        <motion.div
          key={currentStage + currentQuestion}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5 }}
        >
          {currentStage === 'intro' && renderIntro()}
          {currentStage === 'explanation' && renderExplanation()}
          {currentStage === 'gameIntro' && renderGameIntro()}
          {currentStage === 'stage1' && renderStage1()}
          {currentStage === 'stage2-intro' && <StageDivider title="Stage 2: Guided Practice" onContinue={() => setCurrentStage('stage2')} />}
          {(currentStage === 'stage2' || currentStage === 'stage3') && renderQuestion()}
          {currentStage === 'stage3-intro' && <StageDivider title="Stage 3: Now without hints" onContinue={() => setCurrentStage('stage3')} />}
          {currentStage === 'completion' && renderCompletion()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
