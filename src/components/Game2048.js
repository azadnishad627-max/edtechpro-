"use client";
import React, { useState, useEffect, useCallback } from 'react';

const SIZE = 4;

export default function Game2048() {
  const [board, setBoard] = useState(getEmptyBoard());
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [touchStart, setTouchStart] = useState({ x: null, y: null });

  // Initialize game
  useEffect(() => {
    startNewGame();
  }, []);

  function getEmptyBoard() {
    return Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
  }

  function addRandomTile(newBoard) {
    let emptyCells = [];
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (newBoard[r][c] === 0) emptyCells.push({ r, c });
      }
    }
    if (emptyCells.length > 0) {
      const { r, c } = emptyCells[Math.floor(Math.random() * emptyCells.length)];
      newBoard[r][c] = Math.random() < 0.9 ? 2 : 4;
    }
    return newBoard;
  }

  function startNewGame() {
    let newBoard = getEmptyBoard();
    newBoard = addRandomTile(newBoard);
    newBoard = addRandomTile(newBoard);
    setBoard(newBoard);
    setScore(0);
    setGameOver(false);
  }

  const handleKeyDown = useCallback((e) => {
    if (gameOver) return;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      e.preventDefault();
      move(e.key.replace('Arrow', '').toLowerCase());
    }
  }, [board, gameOver]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleTouchStart = (e) => {
    setTouchStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
  };

  const handleTouchEnd = (e) => {
    if (!touchStart.x || !touchStart.y || gameOver) return;
    
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    
    const dx = touchEndX - touchStart.x;
    const dy = touchEndY - touchStart.y;
    
    if (Math.abs(dx) > Math.abs(dy)) {
      if (Math.abs(dx) > 30) move(dx > 0 ? 'right' : 'left');
    } else {
      if (Math.abs(dy) > 30) move(dy > 0 ? 'down' : 'up');
    }
    
    setTouchStart({ x: null, y: null });
  };

  function move(direction) {
    let newBoard = board.map(row => [...row]);
    let moved = false;
    let newScore = score;

    const slide = (row) => {
      let arr = row.filter(val => val);
      let missing = SIZE - arr.length;
      let zeros = Array(missing).fill(0);
      return arr.concat(zeros);
    };

    const combine = (row) => {
      for (let i = 0; i < SIZE - 1; i++) {
        if (row[i] !== 0 && row[i] === row[i + 1]) {
          row[i] *= 2;
          newScore += row[i];
          row[i + 1] = 0;
        }
      }
      return row;
    };

    if (direction === 'left' || direction === 'right') {
      for (let r = 0; r < SIZE; r++) {
        let row = newBoard[r];
        if (direction === 'right') row.reverse();
        
        let initialRow = [...row];
        row = slide(row);
        row = combine(row);
        row = slide(row);
        
        if (direction === 'right') row.reverse();
        newBoard[r] = row;
        
        if (initialRow.join(',') !== row.join(',')) moved = true;
      }
    } else if (direction === 'up' || direction === 'down') {
      for (let c = 0; c < SIZE; c++) {
        let col = [newBoard[0][c], newBoard[1][c], newBoard[2][c], newBoard[3][c]];
        if (direction === 'down') col.reverse();
        
        let initialCol = [...col];
        col = slide(col);
        col = combine(col);
        col = slide(col);
        
        if (direction === 'down') col.reverse();
        
        for (let r = 0; r < SIZE; r++) {
          newBoard[r][c] = col[r];
        }
        
        if (initialCol.join(',') !== col.join(',')) moved = true;
      }
    }

    if (moved) {
      newBoard = addRandomTile(newBoard);
      setBoard(newBoard);
      setScore(newScore);
      checkGameOver(newBoard);
    }
  }

  function checkGameOver(b) {
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (b[r][c] === 0) return;
        if (r < SIZE - 1 && b[r][c] === b[r + 1][c]) return;
        if (c < SIZE - 1 && b[r][c] === b[r][c + 1]) return;
      }
    }
    setGameOver(true);
  }

  const getTileColor = (val) => {
    const colors = {
      0: '#334155',
      2: '#475569',
      4: '#64748b',
      8: '#f59e0b',
      16: '#f97316',
      32: '#ef4444',
      64: '#ec4899',
      128: '#d946ef',
      256: '#a855f7',
      512: '#8b5cf6',
      1024: '#6366f1',
      2048: '#3b82f6',
    };
    return colors[val] || '#14b8a6';
  };

  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 mins
  const [isLocked, setIsLocked] = useState(false);
  const [unlockTime, setUnlockTime] = useState(null);

  // Load and manage timer state
  useEffect(() => {
    const saved = localStorage.getItem('gameStats');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.unlockTime && Date.now() < parsed.unlockTime) {
        setIsLocked(true);
        setUnlockTime(parsed.unlockTime);
      } else if (parsed.unlockTime && Date.now() >= parsed.unlockTime) {
        // Cooldown passed
        setIsLocked(false);
        setTimeLeft(15 * 60);
        localStorage.setItem('gameStats', JSON.stringify({ timeLeft: 15 * 60, unlockTime: null }));
      } else if (parsed.timeLeft !== undefined) {
        setTimeLeft(parsed.timeLeft);
      }
    }
  }, []);

  // Timer interval
  useEffect(() => {
    if (isLocked) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Lock the game for 1 hour (3600000 ms)
          const newUnlockTime = Date.now() + 60 * 60 * 1000;
          setIsLocked(true);
          setUnlockTime(newUnlockTime);
          localStorage.setItem('gameStats', JSON.stringify({ timeLeft: 15 * 60, unlockTime: newUnlockTime }));
          return 0;
        }
        localStorage.setItem('gameStats', JSON.stringify({ timeLeft: prev - 1, unlockTime: null }));
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isLocked]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const getUnlockWaitTime = () => {
    if (!unlockTime) return '';
    const diff = Math.max(0, Math.ceil((unlockTime - Date.now()) / 1000));
    const m = Math.floor(diff / 60);
    return `${m} min${m !== 1 ? 's' : ''}`;
  };

  // Prevent interactions if locked
  const safeHandleKeyDown = useCallback((e) => {
    if (isLocked) return;
    handleKeyDown(e);
  }, [isLocked, handleKeyDown]);

  useEffect(() => {
    window.addEventListener('keydown', safeHandleKeyDown);
    return () => window.removeEventListener('keydown', safeHandleKeyDown);
  }, [safeHandleKeyDown]);

  const safeHandleTouchStart = (e) => {
    if (isLocked) return;
    handleTouchStart(e);
  };

  const safeHandleTouchEnd = (e) => {
    if (isLocked) return;
    handleTouchEnd(e);
  };

  if (isLocked) {
    return (
      <div className="game-container glass-card" style={{ maxWidth: '400px', margin: '0 auto', padding: '2rem', textAlign: 'center' }}>
        <h2 style={{ color: '#ff4444', marginBottom: '1rem' }}>Game Locked 🔒</h2>
        <p className="text-muted mb-4">You have played your 15 minutes for this session! Time to get back to studying.</p>
        <div style={{ background: 'var(--bg-dark)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
          <p style={{ margin: 0 }}>Unlocks in approx:</p>
          <h3 className="text-accent" style={{ margin: '0.5rem 0 0' }}>{getUnlockWaitTime()}</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="game-container glass-card" style={{ maxWidth: '400px', margin: '0 auto', padding: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          <h3 style={{ margin: 0, color: 'var(--text-primary-dark)' }}>2048 Break</h3>
          <p className="text-muted" style={{ margin: 0, fontSize: '0.9rem' }}>Join the numbers!</p>
        </div>
        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.5rem 1rem', borderRadius: '8px', textAlign: 'center' }}>
          <p className="text-muted" style={{ margin: 0, fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 'bold' }}>Score</p>
          <h3 style={{ margin: 0, color: 'white' }}>{score}</h3>
        </div>
      </div>

      <div style={{ background: 'rgba(255, 68, 68, 0.1)', border: '1px solid #ff4444', padding: '0.5rem', borderRadius: '8px', marginBottom: '1.5rem', textAlign: 'center' }}>
        <p style={{ margin: 0, color: '#ff4444', fontWeight: 'bold', fontSize: '0.9rem' }}>
          ⏳ Time Remaining: {formatTime(timeLeft)}
        </p>
      </div>

      <div 
        style={{ 
          background: '#1e293b', 
          padding: '0.5rem', 
          borderRadius: '8px', 
          touchAction: 'none',
          position: 'relative'
        }}
        onTouchStart={safeHandleTouchStart}
        onTouchEnd={safeHandleTouchEnd}
      >
        {gameOver && (
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(15, 23, 42, 0.8)', zIndex: 10,
            display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
            borderRadius: '8px'
          }}>
            <h2 style={{ color: 'white', marginBottom: '1rem' }}>Game Over!</h2>
            <button className="btn-primary" onClick={startNewGame}>Try Again</button>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
          {board.map((row, rIdx) => 
            row.map((val, cIdx) => (
              <div key={`${rIdx}-${cIdx}`} style={{
                aspectRatio: '1',
                background: getTileColor(val),
                display: 'flex', justifyContent: 'center', alignItems: 'center',
                borderRadius: '4px',
                fontSize: val > 1000 ? '1.2rem' : val > 100 ? '1.5rem' : '1.8rem',
                fontWeight: 'bold',
                color: val === 0 ? 'transparent' : (val <= 4 ? '#f8fafc' : 'white'),
                transition: 'background 0.2s ease',
                boxShadow: val > 0 ? 'inset 0 0 10px rgba(255,255,255,0.1)' : 'none'
              }}>
                {val !== 0 ? val : ''}
              </div>
            ))
          )}
        </div>
      </div>

      <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
        <p className="text-muted" style={{ fontSize: '0.85rem' }}>
          Use <strong>Arrow Keys</strong> or <strong>Swipe</strong> to move tiles. Tiles with the same number merge into one!
        </p>
        <button onClick={startNewGame} className="btn-outline" style={{ marginTop: '1rem', padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
          Restart Game
        </button>
      </div>
    </div>
  );
}
