"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';

// Pure Web Audio API Sound Synthesizer (Zero audio file dependencies!)
const playSound = (type) => {
  if (typeof window === 'undefined') return;
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'correct') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.15); // G5
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } else if (type === 'wrong') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } else if (type === 'tick') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } else if (type === 'gameover') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.8);
      gain.gain.setValueAtTime(0.5, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);
      osc.start();
      osc.stop(ctx.currentTime + 0.8);
    }
  } catch (e) {
    // AudioContext autoplay restriction
  }
};

export default function BattleRoyaleView({
  questions,
  test,
  studentInfo,
  onExitNormalMode,
  onSubmitAll
}) {
  const { width, height } = useWindowSize();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [lives, setLives] = useState(3);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [highestStreak, setHighestStreak] = useState(0);
  const [questionTimeLeft, setQuestionTimeLeft] = useState(15);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isVictory, setIsVictory] = useState(false);
  const [answersMap, setAnswersMap] = useState({});
  const [earnedPointsAnim, setEarnedPointsAnim] = useState(null);

  const QUESTION_DURATION = 15;

  // 15-Second Countdown Timer per question
  useEffect(() => {
    if (isAnswerRevealed || isGameOver || isVictory) return;

    if (questionTimeLeft <= 0) {
      handleTimeOut();
      return;
    }

    if (questionTimeLeft <= 4) {
      playSound('tick');
    }

    const timer = setTimeout(() => {
      setQuestionTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [questionTimeLeft, isAnswerRevealed, isGameOver, isVictory]);

  const handleTimeOut = () => {
    playSound('wrong');
    const newLives = lives - 1;
    setLives(newLives);
    setStreak(0);
    setIsAnswerRevealed(true);
    setIsCorrect(false);

    if (newLives <= 0) {
      playSound('gameover');
      setIsGameOver(true);
    } else {
      setTimeout(() => {
        nextQuestion();
      }, 1500);
    }
  };

  const handleAnswerSelect = (optionText) => {
    if (isAnswerRevealed || isGameOver || isVictory) return;

    setSelectedOption(optionText);
    setIsAnswerRevealed(true);

    const currentQ = questions[currentIdx];
    const qId = currentQ.id;
    setAnswersMap((prev) => ({ ...prev, [qId]: optionText }));

    // Points calculation: Speed + Base + Streak
    const basePts = 1000;
    const speedBonus = Math.round((questionTimeLeft / QUESTION_DURATION) * 500);
    const newStreak = streak + 1;
    const streakMultiplier = newStreak >= 5 ? 2.0 : newStreak >= 3 ? 1.5 : newStreak >= 2 ? 1.2 : 1.0;
    const pointsGained = Math.round((basePts + speedBonus) * streakMultiplier);

    playSound('correct');
    setIsCorrect(true);
    setStreak(newStreak);
    if (newStreak > highestStreak) setHighestStreak(newStreak);
    setScore((prev) => prev + pointsGained);
    setEarnedPointsAnim(`+${pointsGained} PTS!`);

    setTimeout(() => {
      setEarnedPointsAnim(null);
      nextQuestion();
    }, 1400);
  };

  const nextQuestion = () => {
    if (currentIdx + 1 >= questions.length) {
      setIsVictory(true);
      if (onSubmitAll) onSubmitAll(answersMap);
    } else {
      setCurrentIdx((prev) => prev + 1);
      setQuestionTimeLeft(QUESTION_DURATION);
      setSelectedOption(null);
      setIsAnswerRevealed(false);
    }
  };

  const handleWhatsAppShare = () => {
    const text = `🏆 *BATTLE ROYALE CHAMPION!* 🏆\n\nI just scored *${score.toLocaleString()} Points* in the *${test?.title || 'NMMS'} Battle Royale*!\n🔥 Highest Streak: *${highestStreak}x Combo*\n❤️ Lives Survived: *${lives}/3*\n\nCan you beat my score? ⚔️ Play now: ${window.location.href}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  const currentQ = questions[currentIdx];

  // ===================== GAME OVER SCREEN =====================
  if (isGameOver) {
    return (
      <div style={styles.fullscreenContainer}>
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={styles.card}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>💀</div>
          <h1 style={{ color: '#ef4444', fontSize: '2.4rem', fontWeight: '900', margin: 0 }}>ELIMINATED!</h1>
          <p style={{ color: '#94a3b8', margin: '0.5rem 0 1.5rem 0' }}>All 3 hearts were lost in the arena!</p>

          <div style={styles.statBox}>
            <div>
              <div style={styles.statLabel}>FINAL SCORE</div>
              <div style={{ fontSize: '1.8rem', fontWeight: '900', color: '#38bdf8' }}>{score.toLocaleString()}</div>
            </div>
            <div>
              <div style={styles.statLabel}>QUESTIONS SURVIVED</div>
              <div style={{ fontSize: '1.8rem', fontWeight: '900', color: '#a855f7' }}>{currentIdx} / {questions.length}</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
            <button
              onClick={() => {
                setLives(3);
                setScore(0);
                setStreak(0);
                setCurrentIdx(0);
                setQuestionTimeLeft(QUESTION_DURATION);
                setIsGameOver(false);
              }}
              style={styles.retryBtn}
            >
              🔄 Play Again
            </button>
            <button onClick={onExitNormalMode} style={styles.exitBtn}>
              📝 Normal Mode
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ===================== VICTORY SCREEN =====================
  if (isVictory) {
    return (
      <div style={styles.fullscreenContainer}>
        <Confetti width={width} height={height} numberOfPieces={250} recycle={false} />
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={styles.card}>
          <div style={{ fontSize: '4.5rem', marginBottom: '0.5rem' }}>🏆</div>
          <div style={styles.victoryBadge}>ARENA CONQUEROR</div>
          <h1 style={{ color: '#22c55e', fontSize: '2.2rem', fontWeight: '900', margin: '0.5rem 0' }}>
            VICTORY ROYALE!
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem' }}>You survived all questions and dominated the battle!</p>

          <div style={styles.statGrid}>
            <div style={styles.statItem}>
              <div style={styles.statLabel}>SCORE</div>
              <div style={{ fontSize: '1.6rem', fontWeight: '900', color: '#eab308' }}>{score.toLocaleString()}</div>
            </div>
            <div style={styles.statItem}>
              <div style={styles.statLabel}>STREAK</div>
              <div style={{ fontSize: '1.6rem', fontWeight: '900', color: '#f97316' }}>🔥 {highestStreak}x</div>
            </div>
            <div style={styles.statItem}>
              <div style={styles.statLabel}>HEARTS LEFT</div>
              <div style={{ fontSize: '1.6rem', fontWeight: '900', color: '#ef4444' }}>{'❤️'.repeat(lives)}</div>
            </div>
          </div>

          {/* WhatsApp Brag Button */}
          <button onClick={handleWhatsAppShare} style={styles.whatsappBtn}>
            <span style={{ fontSize: '1.3rem' }}>📲</span> Share Victory on WhatsApp Status
          </button>

          <button onClick={onExitNormalMode} style={{ ...styles.exitBtn, width: '100%', marginTop: '1rem' }}>
            Back to Dashboard
          </button>
        </motion.div>
      </div>
    );
  }

  // ===================== GAMEPLAY ARENA =====================
  const timerPercentage = (questionTimeLeft / QUESTION_DURATION) * 100;
  const timerColor = questionTimeLeft <= 4 ? '#ef4444' : questionTimeLeft <= 8 ? '#f59e0b' : '#22c55e';

  return (
    <div style={styles.arenaContainer}>
      {/* Top HUD: Hearts, Timer, Points, Combo */}
      <div style={styles.hud}>
        {/* Lives */}
        <div style={{ display: 'flex', gap: '4px', fontSize: '1.4rem' }}>
          {[1, 2, 3].map((h) => (
            <span key={h} style={{ opacity: h <= lives ? 1 : 0.2, filter: h <= lives ? 'drop-shadow(0 0 8px #ef4444)' : 'none' }}>
              ❤️
            </span>
          ))}
        </div>

        {/* Circular Timer Display */}
        <div style={{ ...styles.timerBadge, borderColor: timerColor, color: timerColor }}>
          ⏱️ {questionTimeLeft}s
        </div>

        {/* Score & Combo */}
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '1.1rem', fontWeight: '900', color: '#38bdf8' }}>
            {score.toLocaleString()} <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>PTS</span>
          </div>
          {streak >= 2 && (
            <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#f97316' }}>
              🔥 {streak}x COMBO!
            </div>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div style={styles.progressBarBg}>
        <motion.div
          animate={{ width: `${timerPercentage}%` }}
          transition={{ duration: 1, ease: 'linear' }}
          style={{ ...styles.progressBarFill, backgroundColor: timerColor }}
        />
      </div>

      {/* Floating Points Animation */}
      <AnimatePresence>
        {earnedPointsAnim && (
          <motion.div
            initial={{ opacity: 1, y: 0, scale: 0.8 }}
            animate={{ opacity: 0, y: -40, scale: 1.3 }}
            exit={{ opacity: 0 }}
            style={styles.floatingPoints}
          >
            {earnedPointsAnim}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Question Card */}
      <motion.div
        key={currentIdx}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        style={styles.questionCard}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <span style={styles.questionNum}>QUESTION {currentIdx + 1} OF {questions.length}</span>
          <button onClick={onExitNormalMode} style={styles.modeSwitchBtn}>Exit Game ✕</button>
        </div>

        <h2 style={styles.questionText}>{currentQ?.question_text}</h2>

        {currentQ?.image_url && (
          <div style={{ textAlign: 'center', margin: '1rem 0' }}>
            <img src={currentQ.image_url} alt="Question Diagram" style={styles.diagramImg} />
          </div>
        )}

        {/* 4 Game Options Buttons */}
        <div style={styles.optionsGrid}>
          {['option_a', 'option_b', 'option_c', 'option_d'].map((key, optIdx) => {
            const optVal = currentQ?.[key];
            if (!optVal) return null;
            const letter = String.fromCharCode(65 + optIdx);
            const isSelected = selectedOption === optVal;

            return (
              <motion.button
                key={key}
                whileHover={{ scale: isAnswerRevealed ? 1 : 1.02 }}
                whileTap={{ scale: isAnswerRevealed ? 1 : 0.98 }}
                onClick={() => handleAnswerSelect(optVal)}
                disabled={isAnswerRevealed}
                style={{
                  ...styles.optionBtn,
                  backgroundColor: isSelected ? (isCorrect ? '#166534' : '#991b1b') : '#1e293b',
                  borderColor: isSelected ? (isCorrect ? '#22c55e' : '#ef4444') : '#334155'
                }}
              >
                <span style={styles.optionLetter}>{letter}</span>
                <span style={{ flex: 1 }}>{optVal}</span>
              </motion.button>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}

const styles = {
  fullscreenContainer: {
    minHeight: '85vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1rem',
    background: 'radial-gradient(circle at center, #1e1b4b 0%, #09090b 100%)'
  },
  card: {
    background: 'rgba(24, 24, 27, 0.85)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    backdropFilter: 'blur(20px)',
    borderRadius: '24px',
    padding: '2.5rem',
    maxWidth: '480px',
    width: '100%',
    textAlign: 'center',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)'
  },
  victoryBadge: {
    display: 'inline-block',
    background: 'linear-gradient(90deg, #f59e0b, #eab308)',
    color: '#000',
    fontWeight: '900',
    fontSize: '0.75rem',
    letterSpacing: '1.5px',
    padding: '4px 12px',
    borderRadius: '9999px',
    textTransform: 'uppercase'
  },
  statGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: '0.75rem',
    margin: '1.5rem 0'
  },
  statItem: {
    background: '#18181b',
    border: '1px solid #27272a',
    borderRadius: '12px',
    padding: '0.75rem 0.5rem'
  },
  statBox: {
    display: 'flex',
    justifyContent: 'space-around',
    background: '#18181b',
    border: '1px solid #27272a',
    borderRadius: '16px',
    padding: '1.25rem',
    margin: '1.5rem 0'
  },
  statLabel: {
    fontSize: '0.7rem',
    color: '#71717a',
    fontWeight: '800',
    letterSpacing: '1px',
    marginBottom: '4px'
  },
  whatsappBtn: {
    width: '100%',
    background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
    color: '#ffffff',
    border: 'none',
    borderRadius: '12px',
    padding: '14px',
    fontSize: '1rem',
    fontWeight: '800',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    boxShadow: '0 10px 20px -5px rgba(34, 197, 94, 0.4)'
  },
  retryBtn: {
    flex: 1,
    background: '#38bdf8',
    color: '#000',
    border: 'none',
    borderRadius: '12px',
    padding: '12px',
    fontWeight: '800',
    cursor: 'pointer'
  },
  exitBtn: {
    flex: 1,
    background: 'transparent',
    color: '#cbd5e1',
    border: '1px solid #334155',
    borderRadius: '12px',
    padding: '12px',
    fontWeight: '700',
    cursor: 'pointer'
  },
  arenaContainer: {
    maxWidth: '700px',
    margin: '0 auto',
    padding: '1rem'
  },
  hud: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: 'rgba(15, 23, 42, 0.85)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '16px',
    padding: '10px 18px',
    marginBottom: '8px'
  },
  timerBadge: {
    fontWeight: '900',
    fontSize: '1.2rem',
    border: '2px solid',
    borderRadius: '50px',
    padding: '4px 14px'
  },
  progressBarBg: {
    height: '6px',
    background: '#1e293b',
    borderRadius: '9999px',
    overflow: 'hidden',
    marginBottom: '1rem'
  },
  progressBarFill: {
    height: '100%',
    borderRadius: '9999px'
  },
  floatingPoints: {
    position: 'absolute',
    left: '50%',
    transform: 'translateX(-50%)',
    color: '#22c55e',
    fontSize: '1.8rem',
    fontWeight: '900',
    textShadow: '0 0 10px rgba(34, 197, 94, 0.8)',
    pointerEvents: 'none'
  },
  questionCard: {
    background: 'rgba(15, 23, 42, 0.9)',
    border: '1px solid #334155',
    borderRadius: '20px',
    padding: '1.5rem',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
  },
  questionNum: {
    color: '#38bdf8',
    fontWeight: '800',
    fontSize: '0.8rem',
    letterSpacing: '1px'
  },
  modeSwitchBtn: {
    background: 'transparent',
    border: 'none',
    color: '#94a3b8',
    cursor: 'pointer',
    fontSize: '0.85rem'
  },
  questionText: {
    fontSize: '1.25rem',
    lineHeight: '1.5',
    color: '#ffffff',
    margin: '0 0 1.25rem 0'
  },
  diagramImg: {
    maxWidth: '100%',
    maxHeight: '260px',
    borderRadius: '12px',
    background: '#ffffff'
  },
  optionsGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem'
  },
  optionBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '14px 16px',
    borderRadius: '12px',
    border: '1px solid',
    color: '#ffffff',
    fontSize: '1rem',
    fontWeight: '600',
    textAlign: 'left',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  optionLetter: {
    width: '30px',
    height: '30px',
    borderRadius: '8px',
    background: 'rgba(255, 255, 255, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '800',
    fontSize: '0.9rem',
    color: '#38bdf8'
  }
};
