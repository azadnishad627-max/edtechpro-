"use client";
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';

// Pure Web Audio Synthesizer for F1 Racing Sounds
const playF1Sound = (type) => {
  if (typeof window === 'undefined') return;
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'boost') {
      // F1 Engine acceleration / Nitro roar
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(750, ctx.currentTime + 0.4);
      gain.gain.setValueAtTime(0.35, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
      osc.start();
      osc.stop(ctx.currentTime + 0.6);
    } else if (type === 'spin') {
      // Tire screech / brake slip
      osc.type = 'square';
      osc.frequency.setValueAtTime(450, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(150, ctx.currentTime + 0.4);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } else if (type === 'tick') {
      // 1-second countdown beep
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.06);
      osc.start();
      osc.stop(ctx.currentTime + 0.06);
    } else if (type === 'cheer') {
      // Victory Fanfare
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, idx) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.connect(g);
        g.connect(ctx.destination);
        o.type = 'triangle';
        o.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.12);
        g.gain.setValueAtTime(0.25, ctx.currentTime + idx * 0.12);
        g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + idx * 0.12 + 0.35);
        o.start(ctx.currentTime + idx * 0.12);
        o.stop(ctx.currentTime + idx * 0.12 + 0.35);
      });
    }
  } catch (e) {
    // Audio autoplay blocked
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
  const [questionTimeLeft, setQuestionTimeLeft] = useState(15);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [revealedResult, setRevealedResult] = useState(null); // { isCorrect, actualCorrect }
  const [isRaceFinished, setIsRaceFinished] = useState(false);
  const [answersMap, setAnswersMap] = useState({});

  // F1 Racing Game State
  const [playerSpeed, setPlayerSpeed] = useState(220); // KM/H
  const [nitroActive, setNitroActive] = useState(false);
  const [spinOut, setSpinOut] = useState(false);
  const [streak, setStreak] = useState(0);
  const [totalScore, setTotalScore] = useState(0);

  // 4 Cars Progress on track (0% to 100%)
  const [cars, setCars] = useState([
    { id: 'player', name: studentInfo?.full_name?.split(' ')[0] || 'YOU (Azad)', color: '#eab308', pos: 10, speed: 220, isPlayer: true },
    { id: 'rival1', name: 'Aman (Delhi)', color: '#ef4444', pos: 12, speed: 210, isPlayer: false },
    { id: 'rival2', name: 'Rahul (UP)', color: '#38bdf8', pos: 9, speed: 205, isPlayer: false },
    { id: 'rival3', name: 'Priya (Bihar)', color: '#a855f7', pos: 11, speed: 215, isPlayer: false }
  ]);

  const QUESTION_DURATION = 15;

  // Background Road Animation Speed
  const roadSpeed = nitroActive ? '0.2s' : spinOut ? '1.2s' : '0.5s';

  // 15-Second Question Timer
  useEffect(() => {
    if (isVerifying || revealedResult || isRaceFinished) return;

    if (questionTimeLeft <= 0) {
      handleTimeout();
      return;
    }

    if (questionTimeLeft <= 4) {
      playF1Sound('tick');
    }

    const timer = setTimeout(() => {
      setQuestionTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [questionTimeLeft, isVerifying, revealedResult, isRaceFinished]);

  // Rival AI Natural drift during questions
  useEffect(() => {
    if (isRaceFinished) return;
    const interval = setInterval(() => {
      setCars((prevCars) =>
        prevCars.map((c) => {
          if (c.isPlayer) return c;
          const drift = Math.random() * 2.2 - 0.9;
          const newPos = Math.min(95, Math.max(5, c.pos + drift));
          return { ...c, pos: newPos };
        })
      );
    }, 1200);
    return () => clearInterval(interval);
  }, [isRaceFinished]);

  const handleTimeout = async () => {
    playF1Sound('spin');
    setSpinOut(true);
    setPlayerSpeed(90);
    setStreak(0);
    setRevealedResult({ isCorrect: false, actualCorrect: 'TIME OVER' });

    // Penalty: Rivals surge ahead
    setCars((prevCars) =>
      prevCars.map((c) => {
        if (c.isPlayer) return { ...c, speed: 90 };
        return { ...c, pos: Math.min(98, c.pos + 7) };
      })
    );

    setTimeout(() => {
      setSpinOut(false);
      nextLap();
    }, 1600);
  };

  const handleOptionSelect = async (optionText) => {
    if (isVerifying || revealedResult || isRaceFinished) return;

    setSelectedOption(optionText);
    setIsVerifying(true);

    const currentQ = questions[currentIdx];
    const qId = currentQ.id;
    const updatedAnswers = { ...answersMap, [qId]: optionText };
    setAnswersMap(updatedAnswers);

    // Verify answer in real-time via API
    let isAnsCorrect = false;
    let correctKey = '';

    try {
      const res = await fetch('/api/verify-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId: qId, selectedOption: optionText })
      });
      const data = await res.json();
      isAnsCorrect = !!data.isCorrect;
      correctKey = data.actualCorrect || '';
    } catch (e) {
      // Fallback verification if API is busy
      isAnsCorrect = true;
    }

    setRevealedResult({ isCorrect: isAnsCorrect, actualCorrect: correctKey });

    if (isAnsCorrect) {
      // 🚀 NITRO BOOST!
      playF1Sound('boost');
      setNitroActive(true);
      const newStreak = streak + 1;
      setStreak(newStreak);
      const speedGained = 280 + Math.min(100, (questionTimeLeft * 5) + (newStreak * 15));
      setPlayerSpeed(speedGained);

      // Advance Player Car along the track!
      const stepAdvance = (100 / questions.length) * 1.35;
      const pts = 1000 + (questionTimeLeft * 40) + (newStreak * 150);
      setTotalScore((prev) => prev + pts);

      setCars((prevCars) =>
        prevCars.map((c) => {
          if (c.isPlayer) {
            return { ...c, pos: Math.min(100, c.pos + stepAdvance), speed: speedGained };
          }
          // Rivals advance less
          return { ...c, pos: Math.min(96, c.pos + (stepAdvance * 0.55)) };
        })
      );

      setTimeout(() => {
        setNitroActive(false);
        nextLap(updatedAnswers);
      }, 1500);
    } else {
      // 💨 SPIN OUT / ENGINE STALL
      playF1Sound('spin');
      setSpinOut(true);
      setStreak(0);
      setPlayerSpeed(80);

      // Rivals pass you!
      setCars((prevCars) =>
        prevCars.map((c) => {
          if (c.isPlayer) return { ...c, speed: 80 };
          return { ...c, pos: Math.min(96, c.pos + 8) };
        })
      );

      setTimeout(() => {
        setSpinOut(false);
        nextLap(updatedAnswers);
      }, 1800);
    }

    setIsVerifying(false);
  };

  const nextLap = (finalAnswers = answersMap) => {
    if (currentIdx + 1 >= questions.length) {
      playF1Sound('cheer');
      setIsRaceFinished(true);
      if (onSubmitAll) onSubmitAll(finalAnswers);
    } else {
      setCurrentIdx((prev) => prev + 1);
      setQuestionTimeLeft(QUESTION_DURATION);
      setSelectedOption(null);
      setRevealedResult(null);
      setPlayerSpeed(220);
    }
  };

  // Rank sorting by track position (descending)
  const sortedCars = [...cars].sort((a, b) => b.pos - a.pos);
  const playerRank = sortedCars.findIndex((c) => c.isPlayer) + 1;

  const handleWhatsAppShare = () => {
    const text = `🏎️ *F1 GRAND PRIX CHAMPION!* 🏁\n\nI just finished *P${playerRank}* in the *${test?.title || 'NMMS'} Car Racing Quiz*!\n⚡ Top Speed: *${playerSpeed} KM/H*\n🏆 Total Points: *${totalScore.toLocaleString()} PTS*\n\nCan you overtake my F1 car? 🏎️💨 Play now: ${window.location.href}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  const currentQ = questions[currentIdx];

  // ===================== PODIUM FINISH SCREEN =====================
  if (isRaceFinished) {
    return (
      <div style={styles.fullscreenArena}>
        <Confetti width={width} height={height} numberOfPieces={300} recycle={false} />
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={styles.podiumCard}>
          <div style={{ fontSize: '4rem', marginBottom: '0.5rem' }}>🏁</div>
          <div style={styles.finishBadge}>F1 GRAND PRIX FINISH</div>
          <h1 style={{ color: playerRank === 1 ? '#eab308' : '#22c55e', fontSize: '2.5rem', fontWeight: '900', margin: '0.5rem 0' }}>
            {playerRank === 1 ? '🥇 P1 - RACE WINNER!' : playerRank === 2 ? '🥈 P2 - PODIUM FINISH!' : `🏁 P${playerRank} FINISH!`}
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '1rem' }}>Great driving! You crossed the checkered flag!</p>

          {/* F1 Leaderboard Standings */}
          <div style={styles.standingsBox}>
            <div style={styles.standingsHeader}>FINAL TIMING TOWER</div>
            {sortedCars.map((c, idx) => (
              <div
                key={c.id}
                style={{
                  ...styles.standingRow,
                  background: c.isPlayer ? 'rgba(234, 179, 8, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                  borderColor: c.isPlayer ? '#eab308' : '#27272a'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: '900', color: idx === 0 ? '#eab308' : idx === 1 ? '#cbd5e1' : '#f97316', width: '28px' }}>
                    P{idx + 1}
                  </span>
                  <span style={{ color: c.color, fontSize: '1.2rem' }}>🏎️</span>
                  <span style={{ fontWeight: c.isPlayer ? '800' : '600', color: c.isPlayer ? '#ffffff' : '#cbd5e1' }}>
                    {c.name} {c.isPlayer && '⭐'}
                  </span>
                </div>
                <div style={{ fontWeight: '800', color: '#38bdf8', fontSize: '0.9rem' }}>
                  {c.isPlayer ? `${totalScore.toLocaleString()} PTS` : `${Math.round(c.pos * 42)} PTS`}
                </div>
              </div>
            ))}
          </div>

          <button onClick={handleWhatsAppShare} style={styles.whatsappBtn}>
            <span style={{ fontSize: '1.3rem' }}>📲</span> Share Race Result on WhatsApp Status
          </button>

          <button onClick={onExitNormalMode} style={{ ...styles.exitBtn, width: '100%', marginTop: '1rem' }}>
            Back to Dashboard
          </button>
        </motion.div>
      </div>
    );
  }

  // ===================== LIVE F1 RACING ARENA =====================
  return (
    <div style={styles.arenaContainer}>
      {/* 1. TOP F1 TIMING & DASHBOARD HEADER */}
      <div style={styles.f1Header}>
        {/* Position Badge */}
        <div style={styles.posBadge}>
          <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: '800' }}>POSITION</div>
          <div style={{ fontSize: '1.8rem', fontWeight: '900', color: playerRank === 1 ? '#eab308' : playerRank === 2 ? '#cbd5e1' : '#38bdf8' }}>
            P{playerRank} <span style={{ fontSize: '0.85rem', color: '#64748b' }}>/ 4</span>
          </div>
        </div>

        {/* Speedometer */}
        <div style={styles.speedometer}>
          <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: '800' }}>SPEED</div>
          <div style={{ fontSize: '1.7rem', fontWeight: '900', color: nitroActive ? '#22c55e' : spinOut ? '#ef4444' : '#ffffff' }}>
            {playerSpeed} <span style={{ fontSize: '0.8rem', color: '#64748b' }}>KM/H</span>
          </div>
          {nitroActive && <span style={styles.nitroBadge}>🚀 NITRO BOOST</span>}
          {spinOut && <span style={styles.spinBadge}>💨 SPIN OUT</span>}
        </div>

        {/* Lap / Question Counter & Timer */}
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: '800' }}>LAP</div>
          <div style={{ fontSize: '1.3rem', fontWeight: '900', color: '#ffffff' }}>
            {currentIdx + 1} <span style={{ fontSize: '0.85rem', color: '#64748b' }}>/ {questions.length}</span>
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: '900', color: questionTimeLeft <= 4 ? '#ef4444' : '#eab308' }}>
            ⏱️ {questionTimeLeft}s
          </div>
        </div>
      </div>

      {/* 2. THE LIVE 4-LANE FORMULA 1 RACE TRACK */}
      <div style={styles.trackContainer}>
        {/* Animated Asphalt Stripes */}
        <div style={{ ...styles.asphaltPattern, animationDuration: roadSpeed }} />

        {/* Finish Line Checkered Strip on right */}
        <div style={styles.finishLineStrip} />

        {/* 4 Lanes */}
        {cars.map((car, laneIdx) => {
          const isUser = car.isPlayer;
          return (
            <div key={car.id} style={styles.trackLane}>
              {/* Lane Border Dashed */}
              <div style={styles.laneDash} />

              {/* F1 Car Sprite moving with CSS translate */}
              <motion.div
                animate={{ left: `${Math.min(90, Math.max(5, car.pos))}%` }}
                transition={{ type: 'spring', damping: 15, stiffness: 120 }}
                style={{
                  ...styles.f1CarWrapper,
                  zIndex: isUser ? 20 : 10
                }}
              >
                {/* Racer Name Tag Above Car */}
                <div style={{ ...styles.racerTag, borderColor: car.color, color: isUser ? '#fef08a' : '#ffffff' }}>
                  {isUser && '⭐ '} {car.name}
                </div>

                {/* F1 Car Visual */}
                <div style={{ ...styles.f1CarBody, background: car.color }}>
                  {/* Front Wing */}
                  <div style={styles.frontWing} />
                  {/* Driver Helmet */}
                  <div style={styles.driverHelmet} />
                  {/* Rear Wing */}
                  <div style={styles.rearWing} />
                  {/* Exhaust Flames when Nitro Active */}
                  {isUser && nitroActive && (
                    <motion.div
                      animate={{ scale: [1, 1.4, 1], opacity: [0.8, 1, 0.8] }}
                      transition={{ repeat: Infinity, duration: 0.15 }}
                      style={styles.exhaustFlame}
                    />
                  )}
                  {/* Smoke puff when spin out */}
                  {isUser && spinOut && (
                    <div style={styles.smokeCloud}>💨</div>
                  )}
                </div>
              </motion.div>
            </div>
          );
        })}
      </div>

      {/* 3. QUESTION DASHBOARD (COCKPIT) */}
      <motion.div
        key={currentIdx}
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        style={styles.cockpitCard}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <span style={styles.lapIndicator}>QUESTION {currentIdx + 1} OF {questions.length}</span>
          <button onClick={onExitNormalMode} style={styles.exitTrackBtn}>✕ Exit Race</button>
        </div>

        <h3 style={styles.questionTitle}>{currentQ?.question_text}</h3>

        {currentQ?.image_url && (
          <div style={{ textAlign: 'center', margin: '10px 0' }}>
            <img src={currentQ.image_url} alt="Question Diagram" style={styles.diagramImg} />
          </div>
        )}

        {/* 4 Answers Buttons */}
        <div style={styles.optionsGrid}>
          {['option_a', 'option_b', 'option_c', 'option_d'].map((key, optIdx) => {
            const optVal = currentQ?.[key];
            if (!optVal) return null;
            const letter = String.fromCharCode(65 + optIdx);
            const isSelected = selectedOption === optVal;
            const isAnswered = revealedResult !== null;

            let btnBg = '#1e293b';
            let btnBorder = '#334155';

            if (isSelected) {
              if (revealedResult?.isCorrect) {
                btnBg = '#15803d';
                btnBorder = '#22c55e';
              } else if (revealedResult && !revealedResult.isCorrect) {
                btnBg = '#b91c1c';
                btnBorder = '#ef4444';
              } else {
                btnBg = '#0284c7';
                btnBorder = '#38bdf8';
              }
            }

            return (
              <motion.button
                key={key}
                whileHover={{ scale: isAnswered ? 1 : 1.015 }}
                whileTap={{ scale: isAnswered ? 1 : 0.98 }}
                onClick={() => handleOptionSelect(optVal)}
                disabled={isAnswered || isVerifying}
                style={{
                  ...styles.optionButton,
                  backgroundColor: btnBg,
                  borderColor: btnBorder
                }}
              >
                <span style={styles.optLetterBox}>{letter}</span>
                <span style={{ flex: 1 }}>{optVal}</span>
                {isSelected && revealedResult?.isCorrect && <span style={{ color: '#4ade80', fontWeight: '900' }}>✓ NITRO!</span>}
                {isSelected && revealedResult && !revealedResult.isCorrect && <span style={{ color: '#f87171', fontWeight: '900' }}>✗ SLIP!</span>}
              </motion.button>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}

const styles = {
  arenaContainer: {
    maxWidth: '850px',
    margin: '0 auto',
    padding: '0.75rem',
    color: '#ffffff'
  },
  f1Header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: '#09090b',
    border: '1px solid #27272a',
    borderRadius: '16px',
    padding: '12px 20px',
    marginBottom: '12px',
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.6)'
  },
  posBadge: {
    display: 'flex',
    flexDirection: 'column'
  },
  speedometer: {
    textAlign: 'center',
    position: 'relative'
  },
  nitroBadge: {
    position: 'absolute',
    top: '-8px',
    left: '50%',
    transform: 'translateX(-50%)',
    background: '#22c55e',
    color: '#000',
    fontSize: '0.65rem',
    fontWeight: '900',
    padding: '2px 6px',
    borderRadius: '4px',
    whiteSpace: 'nowrap'
  },
  spinBadge: {
    position: 'absolute',
    top: '-8px',
    left: '50%',
    transform: 'translateX(-50%)',
    background: '#ef4444',
    color: '#fff',
    fontSize: '0.65rem',
    fontWeight: '900',
    padding: '2px 6px',
    borderRadius: '4px',
    whiteSpace: 'nowrap'
  },
  trackContainer: {
    background: '#18181b',
    border: '2px solid #3f3f46',
    borderRadius: '16px',
    padding: '8px 0',
    position: 'relative',
    overflow: 'hidden',
    marginBottom: '16px',
    boxShadow: 'inset 0 0 30px rgba(0, 0, 0, 0.9)'
  },
  asphaltPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 35px, rgba(255,255,255,0.06) 35px, rgba(255,255,255,0.06) 50px)',
    backgroundSize: '70px 100%',
    animation: 'moveTrack linear infinite'
  },
  finishLineStrip: {
    position: 'absolute',
    right: '20px',
    top: 0,
    bottom: 0,
    width: '18px',
    background: 'repeating-linear-gradient(0deg, #fff, #fff 10px, #000 10px, #000 20px)',
    borderLeft: '2px solid #ef4444',
    zIndex: 5
  },
  trackLane: {
    height: '52px',
    position: 'relative',
    display: 'flex',
    alignItems: 'center'
  },
  laneDash: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '1px',
    borderBottom: '1px dashed rgba(255, 255, 255, 0.15)'
  },
  f1CarWrapper: {
    position: 'absolute',
    transform: 'translateX(-50%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  racerTag: {
    fontSize: '0.65rem',
    fontWeight: '800',
    background: 'rgba(0, 0, 0, 0.85)',
    border: '1px solid',
    borderRadius: '6px',
    padding: '1px 6px',
    marginBottom: '2px',
    whiteSpace: 'nowrap'
  },
  f1CarBody: {
    width: '56px',
    height: '22px',
    borderRadius: '6px 14px 14px 6px',
    position: 'relative',
    boxShadow: '0 4px 8px rgba(0,0,0,0.5)'
  },
  frontWing: {
    position: 'absolute',
    right: '-4px',
    top: '2px',
    bottom: '2px',
    width: '5px',
    background: '#ffffff',
    borderRadius: '0 3px 3px 0'
  },
  driverHelmet: {
    position: 'absolute',
    left: '22px',
    top: '4px',
    width: '12px',
    height: '14px',
    background: '#09090b',
    borderRadius: '50%',
    border: '2px solid #ffffff'
  },
  rearWing: {
    position: 'absolute',
    left: '-5px',
    top: '1px',
    bottom: '1px',
    width: '6px',
    background: '#09090b',
    borderRadius: '3px 0 0 3px'
  },
  exhaustFlame: {
    position: 'absolute',
    left: '-16px',
    top: '4px',
    width: '14px',
    height: '14px',
    background: 'radial-gradient(circle, #f97316 0%, #ef4444 60%, transparent 100%)',
    borderRadius: '50%'
  },
  smokeCloud: {
    position: 'absolute',
    left: '-20px',
    top: '2px',
    fontSize: '1rem'
  },
  cockpitCard: {
    background: '#09090b',
    border: '1px solid #27272a',
    borderRadius: '20px',
    padding: '1.25rem',
    boxShadow: '0 20px 30px -10px rgba(0, 0, 0, 0.8)'
  },
  lapIndicator: {
    color: '#38bdf8',
    fontSize: '0.75rem',
    fontWeight: '900',
    letterSpacing: '1px'
  },
  exitTrackBtn: {
    background: 'transparent',
    border: 'none',
    color: '#94a3b8',
    cursor: 'pointer',
    fontSize: '0.85rem'
  },
  questionTitle: {
    fontSize: '1.15rem',
    lineHeight: '1.5',
    color: '#ffffff',
    margin: '0 0 1rem 0'
  },
  diagramImg: {
    maxWidth: '100%',
    maxHeight: '220px',
    borderRadius: '8px',
    background: '#ffffff'
  },
  optionsGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.65rem'
  },
  optionButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    borderRadius: '12px',
    border: '1px solid',
    color: '#ffffff',
    fontSize: '0.95rem',
    fontWeight: '600',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.15s'
  },
  optLetterBox: {
    width: '28px',
    height: '28px',
    borderRadius: '6px',
    background: 'rgba(255, 255, 255, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '900',
    color: '#38bdf8'
  },
  fullscreenArena: {
    minHeight: '85vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1rem',
    background: 'radial-gradient(circle at center, #18181b 0%, #000000 100%)'
  },
  podiumCard: {
    background: '#09090b',
    border: '1px solid #3f3f46',
    borderRadius: '24px',
    padding: '2.25rem',
    maxWidth: '480px',
    width: '100%',
    textAlign: 'center',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.9)'
  },
  finishBadge: {
    display: 'inline-block',
    background: 'linear-gradient(90deg, #f59e0b, #eab308)',
    color: '#000000',
    fontWeight: '900',
    fontSize: '0.75rem',
    letterSpacing: '1.5px',
    padding: '4px 12px',
    borderRadius: '9999px'
  },
  standingsBox: {
    background: '#18181b',
    border: '1px solid #27272a',
    borderRadius: '16px',
    padding: '1rem',
    margin: '1.25rem 0'
  },
  standingsHeader: {
    fontSize: '0.7rem',
    color: '#71717a',
    fontWeight: '900',
    letterSpacing: '1.5px',
    marginBottom: '8px',
    textAlign: 'left'
  },
  standingRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 12px',
    borderRadius: '8px',
    border: '1px solid',
    marginBottom: '6px'
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
  exitBtn: {
    background: 'transparent',
    color: '#94a3b8',
    border: '1px solid #3f3f46',
    borderRadius: '12px',
    padding: '12px',
    fontWeight: '700',
    cursor: 'pointer'
  }
};
