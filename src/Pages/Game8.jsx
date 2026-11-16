
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { UserService as User } from "@/services/user";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, ArrowRight, Trophy, CheckCircle, Target, ThumbsDown, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import PokerTable from "../components/game2/PokerTable";
import { motion, AnimatePresence } from "framer-motion";
import { track } from "@/lib/analytics";
import useActiveStopwatch from "@/hooks/useActiveStopwatch";

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
    transition: { duration: 0.6, ease: "easeOut" }
  },
  exit: (direction) => ({
    x: direction < 0 ? 300 : -300,
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.4, ease: "easeIn" }
  })
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" }
  }
};

export default function Game8() {
  const [stage, setStage] = useState('intro'); // Changed from 'explanation' to 'intro'
  const [slide, setSlide] = useState(0);
  const [question, setQuestion] = useState(0);
  const [selected, setSelected] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [user, setUser] = useState(null);
  const [timeLeft, setTimeLeft] = useState(30);
  const [timerActive, setTimerActive] = useState(false);
  const [finalResults, setFinalResults] = useState([]);
  const [direction, setDirection] = useState(1);
  const [demoStep, setDemoStep] = useState(0);
  const gameId = 8;
  const navigate = useNavigate();
  const timer = useActiveStopwatch();
  const completedRef = React.useRef(false);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await User.me();
        setUser(currentUser);
      } catch (error) {
        console.error("Error loading user:", error);
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

  const allSlides = useMemo(() => [
    // Explanation Stage
    { stage: 'explanation', title: 'Part A: Understanding Effective Odds', content: "When playing poker, deciding whether to call a bet isn't always as simple as comparing the current pot odds to your chances of improving your hand. Pot odds only account for the money currently in the pot for a single card to come. However, in many situations, you have more than one card to come (e.g., on the flop in Hold 'em, you still have the turn and river)." },
    { stage: 'explanation', title: 'Part A: Understanding Effective Odds', content: "This is where the concept of effective odds becomes crucial. Effective odds take into account the money you expect to win or lose in future betting rounds if you make your hand. This allows you to justify calls that might appear incorrect if you only considered the immediate pot odds. For instance, if you have a four-flush and the pot is $20, with your opponent betting $10 (making the pot $30), your immediate pot odds are 3-to-1. Your chances of making the flush are approximately 4.22-to-1 (9 outs out of 47 unseen cards). Based on immediate pot odds, calling would be incorrect." },
    { stage: 'explanation', title: 'Part A: Understanding Effective Odds', content: "But if you anticipate winning an additional $20 in later bets because you expect your opponent to call your future bets, your total potential win becomes $50 ($30 current pot + $20 expected future win) for your $10 call. Your effective odds are now 5-to-1 ($50 to $10), making the call profitable since 5-to-1 is better than 4.22-to-1." },
    { stage: 'explanation', title: 'Part A: Understanding Effective Odds: Conclusion', content: "To conclude, This strategic insight helps you pursue draws with positive expectation over multiple streets." },
    { stage: 'explanation', title: "Part B: Situations When Effective Odds Don't Apply", content: "There are specific scenarios where calculating effective odds is not necessary or appropriate. Firstly, when you or your opponent are all-in or almost all-in, there will be no further betting rounds. In such cases, you should only consider your immediate pot odds. You compare your direct pot odds against your chances of having the best hand at showdown, without factoring in future bets." },
    { stage: 'explanation', title: "Part B: Situations When Effective Odds Don't Apply", content: "Secondly, if you are expecting to receive a \"free card\" on a subsequent street, effective odds calculations are also irrelevant. A free card means you won't have to put any more money into the pot to see the next community card. This usually happens when all players check after your action. In this situation, your decision is not about effective odds, but rather about whether to check (to get the free card) or bet (to deny a free card to your opponent or build the pot)." },
    { stage: 'explanation', title: "Part B: Situations When Effective Odds Don't Apply", content: "Thirdly, if you highly suspect your opponent will fold to a bet on a later street even if you make your hand, then you cannot rely on getting additional money from them. Therefore, anticipating future bets (which is the basis of effective odds) would be misleading." },
    { stage: 'explanation', title: 'Part C: Calculating Effective Odds with Multiple Future Bets', content: "Calculating effective odds involves a straightforward addition of expected future betting action. Let's consider an example: Suppose the pot is currently $100, and your opponent bets $20, making the pot $120. You need to call $20. If you anticipate that there will be two more betting rounds, and you expect your opponent to call your $20 bets on both of those streets, then you can add these expected future bets to your calculation." },
    { stage: 'explanation', title: 'Part C: Calculating Effective Odds with Multiple Future Bets', content: "Your total anticipated win from the pot would be $100 (initial pot) + $20 (your current call) + $20 (your expected bet on the next street) + $20 (your expected bet on the final street) = $160. Your total anticipated cost to reach showdown would be $20 (current call) + $20 (next street call) + $20 (final street call) = $60. Therefore, your effective odds are $160 to $60, which simplifies to approximately 2.67-to-1. If your chance of making your hand is, for example, 3-to-1, then the 2.67-to-1 effective odds make the call correct." },
    { stage: 'explanation', title: 'Part C: Calculating Effective Odds with Multiple Future Bets', content: "Conversely, if you don't expect your opponent to call your future bets, your effective odds would be reduced. The crucial principle is that if these effective odds are greater than your actual chances of making your hand, then you should continue to play the hand through to the end; otherwise, you should fold." },
    { stage: 'explanation', title: 'Master Effective Odds – Can You Spot the True Values and make the right decision?', content: "In poker, the immediate pot can be deceiving. When more cards are yet to come, the true cost and potential reward of a drawing hand extend beyond the current bet. This mini-game will train you to see the full financial picture, ensuring you make the most profitable decisions for drawing hands." },
    { stage: 'explanation', title: 'What will you do in this game?', content: "1. By the end of this mini-game, You will be able to differentiate between immediate pot odds and effective odds, accurately identifying poker situations where considering effective odds is crucial for making profitable decisions.\n2. You will be able to calculate effective odds by accurately assessing total potential winnings against total expected investment in multi-street poker scenarios, and determine the correct action (call/fold) based on this calculation." },
    { stage: 'explanation', title: 'How to Play', content: "\"Effective Odds: Beyond the Bet\" will guide you through scenarios where the decision to call isn't as simple as comparing the current pot to the current bet. You'll learn to factor in future betting rounds and your opponent's likely actions.\n• Stage 1: Live Demo: Observe a step-by-step animation demonstrating how effective odds are calculated in a typical scenario.\n• Stage 2: Guided Practice: Answer questions that require you to identify when effective odds apply and practice simple calculations with active hints.\n• Stage 3: Independent Practice: Apply your knowledge to a variety of poker hands, calculating effective odds or choosing the correct action without hints.\n• Final Challenge: Test your mastery in a series of complex scenarios, determining the most profitable play using effective odds." },
  ], []);

  const stage2Questions = useMemo(() => [
      { question: "In which of the following scenarios should you primarily rely on Effective Odds rather than just immediate Pot Odds when deciding whether to call with a drawing hand (Multiple choice)?", options: ["A. Your opponent goes all-in on the flop.", "B. You are facing a bet on the river (the last card has already been dealt).", "C. You are on the flop with an open-ended straight draw, and there are two more betting rounds (turn and river) to come.", "D. You are guaranteed a free card on the next street."], correct: 2, hint: "Remember, effective odds are crucial when there are multiple betting rounds remaining and money can still be invested or won.", explanation: "You should rely on Effective Odds in scenario C because with two betting rounds left, future potential winnings (implied value) matter more than just the immediate pot odds on the flop." },
      { question: "You have a flush draw on the turn in Hold 'em. The current pot is $100, your opponent bets $25, you anticipate your opponent calling one more $25 bet on the river if you hit your hand, and you also expect to call $25 yourself on the river if you don’t hit and want to see the hand through. What are your Effective Odds in this situation?", options: ["A) Total Potential Winnings: $100. Total Expected Investment: $25. (Effective Odds: 4:1)", "B) Total Potential Winnings: $125. Total Expected Investment: $25. (Effective Odds: 5:1)", "C) Total Potential Winnings: $125. Total Expected Investment: $50. (Effective Odds: 2.5:1)", "D) Total Potential Winnings: $150. Total Expected Investment: $50. (Effective Odds: 3:1)"], correct: 2, explanation: "The correct inputs are $125 total potential winnings and $50 total expected investment. This gives you effective odds of 2.5:1, showing that future betting dynamics significantly improve the value of your draw." },
      { question: "You are playing Texas Hold’em. On the flop, you have an open-ended straight draw. The current pot size is $50, and your opponent bets $10. You expect your opponent to call another $10 bet on the turn if you hit, and another $10 bet on the river if you hit. You also expect to call $10 on the turn and $10 on the river if you don’t hit, to see the showdown. What are your effective pot odds?", options: ["A) Total potential win: $60. Total expected investment: $30. (Effective odds: 2:1)", "B) Total potential win: $70. Total expected investment: $20. (Effective odds: 3.5:1)", "C) Total potential winnings: $80. Total expected investment: $30. (Effective odds: approximately 2.67:1)", "D) Total potential winnings: $80. Total expected investment: $20. (Effective odds: 4:1)"], correct: 2, explanation: "The total potential winnings are $80 ($50 pot + $10 bet + $10 turn + $10 river). The total expected investment is $30 ($10 call + $10 turn + $10 river). Effective odds are $80 to $30." },
      { question: "You are playing Hold 'em. On the Turn, the current pot is $200. Your opponent bets $50. You have a Draw to Full House / Quads. You expect your opponent to call another $50 bet on the River if you hit your hand, and you also expect to call $50 yourself on the River if you don’t hit. What are your effective pot odds?", options: ["A) Total potential win: $250. Total expected investment: $50. (Effective odds: 5:1)", "B) Total potential win: $300. Total expected investment: $50. (Effective Odds: 6:1)", "C) Total potential win: $250. Total expected investment: $100. (Effective Odds: 2.5:1)", "D) Total potential win: $300. Total expected bet: $100. (Effective Odds: 3:1)"], correct: 3, explanation: "Total potential win is $300 ($200 pot + $50 opponent bet + $50 river bet). Total expected investment is $100 ($50 call + $50 river call). Effective pot odds are 3:1." }
  ], []);

  const stage3Questions = useMemo(() => [
      { question: "You are playing Texas Hold’em. On the turn, you hold two pair (K♥ K♠ and 9♣ 9♦ on a K-9-4-2 board). Current pot: $150. Opponent bets: $40. You anticipate your opponent calling one more $40 river bet if you hit. If you miss, you expect to call $40 on the turn and another $40 on the river. What are your Effective Odds?", options: ["A) Effective Odds: 2.38:1", "B) Effective Odds: ~1.92:1", "C) Effective Odds: 2.88:1", "D) Effective Odds: 2.25:1"], correct: 1, explanation: "Potential winnings: $150 + $40 + $40 = $230. Total investment: $40 + $40 = $80. Wait, the investment is $40 + $40 + $40 if we see showdown. Total investment is $120. So $230 to $120 is ~1.92:1. Correct." },
      { question: "In which of these poker situations would you NOT need to calculate effective odds?", options: ["A. On the turn, with river to come.", "B. Your opponent is all-in on the flop.", "C. You are certain to receive a free card.", "D. Both B and C."], correct: 3, explanation: "You don’t need effective odds when no future betting is possible (all-in) or when you are guaranteed a free card." },
      { question: "On the Turn, you have a Flush Draw. Pot: $120. Opponent Bet: $30. You expect a cautious opponent to call only $10 on the river if you hit. If you miss, you'll call another $30. What are your effective odds?", options: ["A) Effective odds: ~2.67:1", "B) Effective odds: 5:1", "C) Effective odds: ~3.17:1", "D) Effective odds: ~5.33:1"], correct: 0, explanation: "Potential win: $120 + $30 + $10 = $160. Total investment: $30 + $30 = $60. Effective odds: $160 to $60, or about 2.67:1." },
      { question: "On the flop, you have a combo draw (flush + straight). Pot: $100. Opponent bets $20. You expect an aggressive opponent to bet/call $40 on both turn and river. You'll call both streets if you miss. What are your effective odds?", options: ["A) Effective odds: 2:1", "B) Effective odds: 2.25:1", "C) Effective odds: ~2.67:1", "D) Effective odds: 2:1 (with different numbers)"], correct: 0, explanation: "Potential win: $100 + $20 + $40 + $40 = $200. Total investment: $20 + $40 + $40 = $100. Effective odds: $200 to $100, or 2:1." }
  ], []);

  const finalChallengeQuestions = useMemo(() => [
      { pot: 250, bet: 100, question: "Flush Draw on Turn. Pot: $250. Bet: $100. You have a flush draw (4:1 against). Expect opponent to call $100 on river if you hit. You'll call $100 if you miss. What are your effective odds and correct action?", options: ["A) Effective odds: 4:1. Call.", "B) Effective odds: 1.75:1. Call.", "C) Effective odds: 2.5:1. Fold.", "D) Effective odds: 1.5:1. Fold."], correct: 1, explanation: "Potential win: $250 + $100 = $350. Total investment: $100 + $100 = $200. Odds: 1.75:1, which is better than 4:1 against. Call." },
      { pot: 100, bet: 30, question: "Straight Draw on Flop. Pot: $100. Bet: $30. Gutshot draw (11:1 against). Expect opponent to call $30 on turn, but fold river if you hit. You'll call turn & river if you miss. What are your effective odds and action?", options: ["A) Effective odds: 4.33:1. Call.", "B) Effective odds: 2.17:1. Fold.", "C) Effective odds: 3:1. Call.", "D) Effective odds: 1.4:1. Fold."], correct: 1, explanation: "Potential win: $100 + $30 = $130. Total investment: $30 + $30 = $60. Odds: ~2.17:1. Much worse than 11:1 against. Fold." },
      { pot: 300, bet: 50, question: "Seven-Card Stud, 4th Street. Pot: $300. Bet: $50. Strong draw (3:1 against). Aggressive opponent, expect $50 bets on 5th, 6th, 7th. You'll call all. What are your effective odds?", options: ["A) Effective odds: 4.5:1. Fold.", "B) Effective odds: 3:1. Call.", "C) Effective odds: 2.25:1. Call.", "D) Effective odds: 1.5:1. Fold."], correct: 2, explanation: "Potential win: $300 + 3*$50 = $450. Total investment: 4*$50 = $200. Odds: 2.25:1, better than 3:1 against. Call." },
      { pot: 80, bet: 20, question: "Reverse Implied Odds. Pot: $80. Bet: $20. Straight draw (5:1 against) on a scary board. You think opponent will stop betting if you hit. You'll call turn & river if you miss. What are your odds & action?", options: ["A) Effective odds: 5:1. Call.", "B) Effective odds: 2.67:1. Call.", "C) Effective odds: 2:1. Fold.", "D) Effective odds: 1.5:1. Fold."], correct: 2, explanation: "Potential win: $80 + $20 = $100. Total investment: $20 + $20 + $20 = $60. Odds: ~1.67:1. This calculation is a bit tricky, but the key is that the odds offered are much worse than the odds of making the hand. Fold is correct." },
      { pot: 40, bet: 10, question: "Limit Hold'em ($10/$20). Flop. Pot: $40. Bet: $10. Flush draw (4.22:1 against). Bets double on turn. Expect opponent to call $20 on turn & river. You'll call both if you miss. Odds & action?", options: ["A) Effective odds: 1.8:1. Call.", "B) Effective odds: 4:1. Call.", "C) Effective Odds: 2.5:1. Fold.", "D) Effective Odds: 3.1:1. Call."], correct: 0, explanation: "Potential win: $40 + $10 + $20 + $20 = $90. Total investment: $10 + $20 + $20 = $50. Odds: 1.8:1, much better than 4.22:1 against. Call." },
  ], []);

  const handleNextFinal = useCallback(() => {
    setTimerActive(false);
    setShowExplanation(false);
    setSelected(null);
    if (question < finalChallengeQuestions.length - 1) {
      setQuestion(prev => prev + 1);
      setTimeLeft(30);
      setTimerActive(true);
    } else {
      setStage('results');
    }
  }, [question, finalChallengeQuestions]);

  useEffect(() => {
    let interval;
    if (timerActive && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft(t => t - 1), 1000);
    } else if (timerActive && timeLeft === 0) {
      setFinalResults(prev => [...prev, false]);
      setShowExplanation(true);
      setTimeout(() => handleNextFinal(), 2000);
    }
    return () => clearInterval(interval);
  }, [timerActive, timeLeft, handleNextFinal]);

  const completeGame = async (passed) => {
    if (!user) return; // Safeguard

    if (!passed) {
        changeStage('finalIntro');
        return;
    }
    const today = new Date().toISOString().split('T')[0];
    completedRef.current = true;
    const spentSec = timer.readSeconds();
    track("Game Completed", { gameId, spentSec });
    await User.completeGame(8);
    navigate(createPageUrl("Home"));
  };

  const handleSelect = (index, correct, stageName) => {
    if (showExplanation) return;
    setSelected(index);
    setShowExplanation(true);
    if (stageName === 'final') {
      setFinalResults(prev => [...prev, index === correct]);
      setTimerActive(false);
      setTimeout(() => handleNextFinal(), 2000);
    }
  };

  const resetQuestionState = () => {
    setQuestion(0);
    setSelected(null);
    setShowExplanation(false);
    setShowHint(false);
    setDemoStep(0);
  };

  const changeStage = (newStage) => {
    setStage(newStage);
    resetQuestionState();
    if(newStage === 'final') {
        setFinalResults([]);
        setTimeLeft(30);
        setTimerActive(true);
    }
  };

  const renderExplanationSlides = () => {
    const current = allSlides[slide];
    if (!current || current.stage !== 'explanation') return null;

    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={slide}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
        >
          <motion.h2 variants={itemVariants} className="text-3xl font-bold text-white mb-6 text-center">{current.title}</motion.h2>
          <motion.div variants={itemVariants} className="bg-black/20 backdrop-blur-md rounded-xl p-6 min-h-[200px]">
            <p className="text-green-200 text-lg whitespace-pre-line">{current.content}</p>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  };

  const renderNavigation = () => {
      const isLastSlide = slide === allSlides.length - 1;
      return (
          <div className="flex justify-between items-center mt-8">
              <Button onClick={() => { setSlide(s => s - 1); setDirection(-1); }} disabled={slide === 0} variant="outline" className="border-green-600 text-green-300">
                  <ArrowLeft className="mr-2 w-4 h-4"/> Previous
              </Button>
              <span className="text-green-300">{slide + 1} / {allSlides.length}</span>
              <Button onClick={() => {
                  if (isLastSlide) {
                    changeStage('demoIntro');
                  } else {
                    setSlide(s => s + 1);
                    setDirection(1);
                  }
              }} className="bg-yellow-500 hover:bg-yellow-600 text-black">
                  {isLastSlide ? 'Start Game' : 'Next'} <ArrowRight className="ml-2 w-4 h-4"/>
              </Button>
          </div>
      )
  };

  const renderQuestionComponent = (qSet, stageName, title) => {
    const q = qSet[question];
    return (
      <div className="max-w-5xl mx-auto">
        <div className="bg-black/20 backdrop-blur-md rounded-2xl p-8 border border-green-700/30">
          <h2 className="text-3xl font-bold text-white text-center mb-2">{title}</h2>
          <p className="text-center text-green-300 mb-8">Question {question + 1} of {qSet.length}</p>

          <div className="bg-white/5 rounded-xl p-6 mb-6">
            <p className="text-green-200 text-lg">{q.question}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {q.options.map((opt, i) => (
              <Button
                key={i}
                className={`justify-start p-4 h-auto text-left transition-all duration-300 bg-yellow-500 hover:bg-yellow-600 text-black font-medium whitespace-normal break-words ${
                  selected === i ? 'ring-2 ring-yellow-400 bg-yellow-400' : ''
                } ${
                  showExplanation && i === q.correct ? 'ring-2 ring-green-500 bg-green-500 text-white hover:bg-green-500' : ''
                } ${
                  showExplanation && selected === i && i !== q.correct ? 'ring-2 ring-red-500 bg-red-500 text-white hover:bg-red-500' : ''
                }`}
                onClick={() => handleSelect(i, q.correct, stageName)}
                disabled={showExplanation}
              >
                {opt}
              </Button>
            ))}
          </div>

          {showExplanation && (
            <div className={`rounded-xl p-4 mb-6 ${selected === q.correct ? 'bg-green-900/50' : 'bg-red-900/50'}`}>
              <div className="flex items-center gap-2 mb-2">
                {selected === q.correct ? <CheckCircle className="w-6 h-6 text-green-400" /> : <ThumbsDown className="w-6 h-6 text-red-400" />}
                <h3 className="text-xl font-bold text-white">{selected === q.correct ? 'Correct!' : 'Incorrect'}</h3>
              </div>
              <p className="text-green-200">{q.explanation}</p>
            </div>
          )}

          <div className="flex justify-between items-center mt-8">
            {stageName === 'stage2' && !showHint && q.hint && !showExplanation && (
                 <Button onClick={() => setShowHint(true)} variant="outline" className="border-yellow-600 text-yellow-300">Need a Hint?</Button>
            )}
            {!showExplanation && showHint && (
              <div className="text-blue-200 mt-4 bg-blue-900/30 p-4 rounded-lg w-full">
                <strong>Hint:</strong> {q.hint}
              </div>
            )}
            {showExplanation && (
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="ml-auto">
                  <Button onClick={() => {
                      if (question < qSet.length - 1) {
                          setQuestion(prev => prev + 1);
                          setSelected(null);
                          setShowExplanation(false);
                          setShowHint(false);
                      } else {
                          if (stageName === 'stage2') {
                            changeStage('stage3Intro');
                          } else if (stageName === 'stage3') {
                            changeStage('finalIntro');
                          }
                      }
                  }} className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold">
                    {question < qSet.length - 1 ? "Next Question" : "Next Stage"} <ArrowRight className="ml-2 w-4 h-4"/>
                  </Button>
                </motion.div>
            )}
          </div>
        </div>
      </div>
    );
  };

    const renderFinalChallenge = () => {
    const q = finalChallengeQuestions[question];
    if (!q) return null;
    return (
      <div className="max-w-5xl mx-auto">
        <div className="bg-black/20 backdrop-blur-md rounded-2xl p-8 border border-green-700/30">
          <h2 className="text-3xl font-bold text-white text-center mb-2">Final Challenge</h2>
          <p className="text-center text-green-300 mb-4">Question {question + 1} of {finalChallengeQuestions.length}</p>
          <div className="relative w-full bg-gray-700 rounded-full h-2.5 mb-6">
              <div className="bg-yellow-400 h-2.5 rounded-full" style={{ width: `${(timeLeft/30)*100}%` }}></div>
              <span className="absolute -top-6 right-0 text-white font-bold"><Clock className="inline w-4 h-4 mr-1"/>{timeLeft}s</span>
          </div>

          <PokerTable pot={q.pot} communityCards={['K♥', 'J♣', '8♥', '4♠']} players={[{position: 'UTG', stack: 500, bet: q.bet, status: 'Bets'}, {position: 'BTN', stack: 500, isHero: true, cards: ['A♥', 'Q♥']}]}/>

            <br />
            <br />
          <div className="bg-white/5 rounded-xl p-6 my-6">
            <p className="text-green-200 text-lg">{q.question}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {q.options.map((opt, i) => (
              <Button key={i} variant="outline" className={`justify-start p-4 h-auto text-left ${ selected === i ? 'border-yellow-400' : 'border-gray-600'}`} onClick={() => handleSelect(i, q.correct, 'final')} disabled={showExplanation}>
                {opt}
              </Button>
            ))}
          </div>

          {showExplanation && (
            <div className={`rounded-xl p-4 mb-6 ${selected === q.correct ? 'bg-green-900/50' : 'bg-red-900/50'}`}>
              <h3 className="text-xl font-bold text-white">{selected === q.correct ? 'Correct!' : 'Incorrect'}</h3>
              <p className="text-green-200">{q.explanation}</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderDemo = () => {
      const demoSteps = [
          { narration: "Scenario: Pot is $50, opponent bets $10. We have a flush draw." },
          { narration: "Step 1: Immediate pot odds are ($50 pot + $10 bet) / $10 call = 6:1. This is misleading with more cards to come." },
          { narration: "Step 2: Calculate total anticipated winnings. If we expect to win $10 on turn and $10 on river, total winnings are $50 + $10 + $10 = $70." },
          { narration: "Step 3: Calculate total expected investment. We call $10 now, and expect to call $10 on turn and river. Total investment = $30." },
          { narration: "Step 4: Effective odds are $70 to $30, or ~2.33:1. This is better than our odds to hit, so we call. Call is correct." }
      ];

      return (
          <div className="max-w-5xl mx-auto text-center">
            <div className="bg-black/20 backdrop-blur-md rounded-2xl p-8 border border-green-700/30">
              <h2 className="text-3xl font-bold text-white mb-6">Stage 1: Live Demo</h2>
              <h4 className="text-2xl font-bold text-yellow-500 mb-6">{demoSteps[demoStep].narration}</h4>
              <br />
              <PokerTable pot={50} communityCards={['A♥', '7♥', '2♠']} players={[{position: 'UTG', stack: 500, bet: 10}, {position: 'BTN', stack: 500, isHero: true, cards: ['K♥', 'Q♥']}]}/>
              <div className="flex justify-between items-center mt-8">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button onClick={() => setDemoStep(s => Math.max(0, s-1))} disabled={demoStep === 0} variant="outline" className="border-green-600 text-green-300 hover:bg-green-600/20">
                      <ArrowLeft className="mr-2 w-4 h-4"/> Prev
                    </Button>
                  </motion.div>
                  <span className="text-white">{demoStep + 1}/{demoSteps.length}</span>
                  {demoStep < demoSteps.length - 1 ? (
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button onClick={() => setDemoStep(s => s + 1)} className="bg-green-600 hover:bg-green-700 text-white">
                          Next <ArrowRight className="ml-2 w-4 h-4"/>
                        </Button>
                      </motion.div>
                  ) : (
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button onClick={() => changeStage('stage2Intro')} className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold">
                          Start Practice <ArrowRight className="ml-2 w-4 h-4"/>
                        </Button>
                      </motion.div>
                  )}
              </div>
            </div>
          </div>
      )
  }

  const renderStageDivider = (title, content, nextStageName) => (
    <div className="max-w-4xl mx-auto text-center flex items-center justify-center min-h-[60vh]">
        <motion.div
            className="bg-black/30 backdrop-blur-xl rounded-2xl p-8 md:p-12 border-2 border-yellow-500/50 shadow-2xl w-full"
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.7, ease: [0.25, 1, 0.5, 1] }}
        >
            <motion.h2
                className="text-4xl font-bold text-yellow-400 mb-6 font-heading"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
            >
                {title}
            </motion.h2>
            <motion.div
                className="text-green-200 text-lg leading-relaxed mb-8 text-left"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
            >
                {typeof content === 'string' ? <p>{content}</p> : content}
            </motion.div>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
            >
                <Button
                    onClick={() => changeStage(nextStageName)}
                    className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-10 py-4 text-lg rounded-full shadow-lg"
                >
                    Continue <ArrowRight className="ml-3 w-5 h-5" />
                </Button>
            </motion.div>
        </motion.div>
    </div>
  );

  const renderResults = () => {
    const correctCount = finalResults.filter(Boolean).length;
    const passed = correctCount >= 4;
    return (
        <div className="max-w-4xl mx-auto text-center">
            <div className={`bg-black/20 backdrop-blur-md rounded-2xl p-8 border ${passed ? 'border-green-600/30' : 'border-red-600/30'}`}>
                <Trophy className="w-20 h-20 text-yellow-400 mx-auto mb-6" />
                <h2 className="text-4xl font-bold text-white mb-4">{passed ? "Congratulations!!!" : "Not Quite!!!"}</h2>
                <p className="text-lg text-yellow-400 mb-6">{`You got ${correctCount} out of ${finalChallengeQuestions.length} correct.`}</p>
                <div className={`rounded-xl p-6 mb-8 ${passed ? 'bg-green-900/30' : 'bg-red-900/30'}`}>
                    <p className="text-green-200">{passed ? "You have successfully completed the Effective Odds mini-game. Keep practicing and applying what you have learned!" : `You needed at least 4 correct answers to pass. Feel free to try again to master this skill!`}</p>
                </div>
                <Button onClick={() => completeGame(passed)} className={`font-bold px-8 py-3 text-lg ${passed ? 'bg-green-600 hover:bg-green-700' : 'bg-yellow-500 hover:bg-yellow-600'}`}>
                    {passed ? "Continue" : "Try Again"} <ArrowRight className="ml-2 w-5 h-5"/>
                </Button>
            </div>
        </div>
    );
  };

  const renderIntro = () => (
    <div className="max-w-4xl mx-auto text-center">
      <div className="bg-black/20 backdrop-blur-md rounded-2xl p-8 border border-green-600/30">
        <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-6" />
        <h1 className="text-4xl font-bold text-white mb-4">
          Game 8: Effective Odds
        </h1>
        <h2 className="text-2xl font-semibold text-green-300 mb-6">
          Beyond the Bet: When Future Streets Matter
        </h2>
        <Button
          onClick={() => setStage('explanation')}
          className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-8 py-3 text-lg"
        >
          Start Learning
          <ArrowRight className="ml-2 w-5 h-5" />
        </Button>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (stage) {
      case 'intro': return renderIntro(); // Added intro stage
      case 'explanation': return <div className="max-w-4xl mx-auto"><motion.div initial="hidden" animate="visible" variants={containerVariants}>{renderExplanationSlides()}</motion.div>{renderNavigation()}</div>;
      case 'demoIntro': return renderStageDivider("Stage 1: Live Demo", "An animated walk-through will visually demonstrate the difference between basic pot odds and effective odds in a Hold 'em scenario with multiple streets remaining.", "demo");
      case 'demo': return renderDemo();
      case 'stage2Intro': return renderStageDivider("Stage 2: Guided Practice", "Game Format: Multiple Choice and Interactive Calculator. Active hints will be provided.", "stage2");
      case 'stage2': return renderQuestionComponent(stage2Questions, 'stage2', 'Stage 2: Guided Practice');
      case 'stage3Intro': return renderStageDivider("Stage 3: Independent Practice", "Game Format: Interactive Calculator and Multiple Choice. No hints, immediate feedback.", "stage3");
      case 'stage3': return renderQuestionComponent(stage3Questions, 'stage3', 'Stage 3: Independent Practice');
      case 'finalIntro':
        const finalContent = (
            <div className="space-y-4">
                <p>• <strong>Objective:</strong> To apply effective odds calculations and decision-making in more dynamic, multi-faceted poker scenarios.</p>
                <p>• <strong>How to Play:</strong> You will be presented with a series of interactive poker hand scenarios. Your task is to accurately calculate the effective odds for your drawing hand and then make the correct strategic decision (Call or Fold) out of the presented options.</p>
            </div>
        );
        return renderStageDivider("Final Stage: The Pro Challenge", finalContent, "final");
      case 'final': return renderFinalChallenge();
      case 'results': return renderResults();
      default: return <div>Loading...</div>;
    }
  };

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-6xl mx-auto mb-6">
        <Button onClick={() => navigate(createPageUrl("Home"))} variant="outline" className="border-green-600 text-green-300 hover:bg-green-600/20">
          <ArrowLeft className="mr-2 w-4 h-4" /> Back to Home
        </Button>
      </div>
      {renderContent()}
    </div>
  );
}
