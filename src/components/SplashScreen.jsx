"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';

const SPLASH_FALLBACK_TIMEOUT_MS = 4500;
const SPLASH_END_DELAY_MS = 150;
const SPLASH_FADE_OUT_MS = 450;

export default function SplashScreen() {
  const [showSplash, setShowSplash] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const endDelayTimeoutRef = useRef(null);
  const hideTimeoutRef = useRef(null);
  const fallbackTimeoutRef = useRef(null);
  const isDismissingRef = useRef(false);

  const dismissSplash = useCallback((delayMs = 0) => {
    if (isDismissingRef.current) return;
    isDismissingRef.current = true;

    if (endDelayTimeoutRef.current) {
      clearTimeout(endDelayTimeoutRef.current);
    }
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }

    endDelayTimeoutRef.current = setTimeout(() => {
      setIsFadingOut(true);

      hideTimeoutRef.current = setTimeout(() => {
        setShowSplash(false);
      }, SPLASH_FADE_OUT_MS);
    }, delayMs);
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
      if (endDelayTimeoutRef.current) {
        clearTimeout(endDelayTimeoutRef.current);
      }
      if (fallbackTimeoutRef.current) {
        clearTimeout(fallbackTimeoutRef.current);
      }
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, [dismissSplash]);

  const handleVideoEnd = () => {
    dismissSplash(SPLASH_END_DELAY_MS);
  };

  if (!showSplash) return null;

  return (
    <div 
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-black pointer-events-none transition-opacity ease-out ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{ transitionDuration: `${SPLASH_FADE_OUT_MS}ms` }}
    >
      <video
        autoPlay
        muted
        playsInline
        preload="auto"
        disablePictureInPicture
        controlsList="nodownload nofullscreen noremoteplayback"
        onEnded={handleVideoEnd}
        onError={() => dismissSplash()}
        onStalled={() => dismissSplash()}
        className="w-full h-full object-contain select-none"
      >
        <source src="/videos/splash.mp4" type="video/mp4" />
        Tu navegador no soporta el formato de video.
      </video>
    </div>
  );
}
