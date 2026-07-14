"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';

const SPLASH_FALLBACK_TIMEOUT_MS = 4500;
const SPLASH_FADE_OUT_MS = 1000;

export default function SplashScreen() {
  const [showSplash, setShowSplash] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const hideTimeoutRef = useRef(null);
  const fallbackTimeoutRef = useRef(null);

  const dismissSplash = useCallback(() => {
    setIsFadingOut(true);

    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }

    hideTimeoutRef.current = setTimeout(() => {
      setShowSplash(false);
    }, SPLASH_FADE_OUT_MS);
  }, []);

  useEffect(() => {
    try {
      const hasSeenSplash = sessionStorage.getItem('hasSeenSplash');
      if (hasSeenSplash) {
        setShowSplash(false);
        return;
      }

      sessionStorage.setItem('hasSeenSplash', 'true');
    } catch (err) {
      console.warn('No fue posible leer sessionStorage para el splash:', err);
      setShowSplash(false);
      return;
    }

    fallbackTimeoutRef.current = setTimeout(() => {
      dismissSplash();
    }, SPLASH_FALLBACK_TIMEOUT_MS);

    return () => {
      if (fallbackTimeoutRef.current) {
        clearTimeout(fallbackTimeoutRef.current);
      }
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, [dismissSplash]);

  const handleVideoEnd = () => {
    dismissSplash();
  };

  if (!showSplash) return null;

  return (
    <div 
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-black transition-opacity duration-1000 ease-in-out ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <video
        autoPlay
        muted
        playsInline
        onEnded={handleVideoEnd}
        onError={dismissSplash}
        onStalled={dismissSplash}
        className="w-full h-full object-cover"
      >
        <source src="/videos/splash.mp4" type="video/mp4" />
        Tu navegador no soporta el formato de video.
      </video>
    </div>
  );
}
