import React, { useState, useEffect } from 'react';

export default function PullToRefresh({ onRefresh, children }) {
  const [startY, setStartY] = useState(0);
  const [currentY, setCurrentY] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const handleTouchStart = (e) => {
      if (window.scrollY === 0) {
        setStartY(e.touches[0].clientY);
        setIsPulling(true);
      }
    };

    const handleTouchMove = (e) => {
      if (!isPulling || isRefreshing) return;
      const y = e.touches[0].clientY;
      if (y > startY) {
        // Prevent default scrolling when pulling down at the very top
        if (e.cancelable) e.preventDefault();
        setCurrentY(y - startY);
      }
    };

    const handleTouchEnd = async () => {
      if (!isPulling) return;
      setIsPulling(false);
      
      if (currentY > 70 && !isRefreshing) {
        setIsRefreshing(true);
        if (onRefresh) {
          await onRefresh();
        } else {
          window.location.reload();
        }
        setIsRefreshing(false);
      }
      setCurrentY(0);
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [startY, currentY, isPulling, isRefreshing, onRefresh]);

  return (
    <div style={{ position: 'relative', width: '100%', minHeight: '100vh' }}>
      {/* Pull indicator */}
      <div 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '60px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transform: `translateY(${Math.min(currentY - 60, 0)}px)`,
          transition: isPulling ? 'none' : 'transform 0.3s ease',
          zIndex: 100,
          color: 'var(--primary-color)'
        }}
      >
        {isRefreshing ? (
          <div style={{ animation: 'spin 1s linear infinite' }}>↻ Refreshing...</div>
        ) : (
          <div>{currentY > 70 ? '↓ Release to refresh' : '↓ Pull to refresh'}</div>
        )}
      </div>

      {/* Content wrapper */}
      <div 
        style={{
          transform: `translateY(${Math.min(currentY, 70)}px)`,
          transition: isPulling ? 'none' : 'transform 0.3s ease',
        }}
      >
        {children}
      </div>
    </div>
  );
}
