"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';

const SPLASH_DEFAULT_FALLBACK_TIMEOUT_MS = 15000;
const SPLASH_FALLBACK_GRACE_MS = 2000;
const SPLASH_PRE_END_FADE_MS = 350;
const SPLASH_FADE_OUT_MS = 350;

export default function SplashScreen() {
  const [showSplash, setShowSplash] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const hideTimeoutRef = useRef(null);
  const fallbackTimeoutRef = useRef(null);
  const playbackMonitorRef = useRef(null);
  const fadeStartedRef = useRef(false);
  const splashRemovedRef = useRef(false);

  const clearPlaybackMonitor = useCallback(() => {
    if (playbackMonitorRef.current) {
      cancelAnimationFrame(playbackMonitorRef.current);
      playbackMonitorRef.current = null;
    }
  }, []);

  const removeSplash = useCallback(() => {
    if (splashRemovedRef.current) return;
    splashRemovedRef.current = true;
    clearPlaybackMonitor();
    setShowSplash(false);
  }, [clearPlaybackMonitor]);

  const startFadeOut = useCallback(() => {
    if (fadeStartedRef.current || splashRemovedRef.current) return;
    fadeStartedRef.current = true;
    setIsFadingOut(true);

    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }

    hideTimeoutRef.current = setTimeout(() => {
      removeSplash();
    }, SPLASH_FADE_OUT_MS + 150);
  }, [removeSplash]);

  const dismissSplash = useCallback(() => {
    startFadeOut();
  }, [startFadeOut]);

  const scheduleFallbackDismiss = useCallback((durationMs = SPLASH_DEFAULT_FALLBACK_TIMEOUT_MS) => {
    if (fallbackTimeoutRef.current) {
      clearTimeout(fallbackTimeoutRef.current);
    }

    fallbackTimeoutRef.current = setTimeout(() => {
      dismissSplash();
    }, durationMs);
  }, [dismissSplash]);

  const monitorPlayback = useCallback((video) => {
    clearPlaybackMonitor();

    const tick = () => {
      if (!video || splashRemovedRef.current) return;

      if (Number.isFinite(video.duration) && video.duration > 0) {
        const remainingMs = Math.max(0, (video.duration - video.currentTime) * 1000);
        if (remainingMs <= SPLASH_PRE_END_FADE_MS) {
          startFadeOut();
        }
      }

      playbackMonitorRef.current = requestAnimationFrame(tick);
    };

    playbackMonitorRef.current = requestAnimationFrame(tick);
  }, [clearPlaybackMonitor, startFadeOut]);

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

    scheduleFallbackDismiss();

    return () => {
      if (fallbackTimeoutRef.current) {
        clearTimeout(fallbackTimeoutRef.current);
      }
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
      clearPlaybackMonitor();
    };
  }, [clearPlaybackMonitor, scheduleFallbackDismiss]);

  const handleLoadedMetadata = (event) => {
    const durationMs = Number.isFinite(event.currentTarget.duration)
      ? (event.currentTarget.duration * 1000) + SPLASH_FALLBACK_GRACE_MS
      : SPLASH_DEFAULT_FALLBACK_TIMEOUT_MS;

    scheduleFallbackDismiss(durationMs);
  };

  const handleVideoPlay = (event) => {
    monitorPlayback(event.currentTarget);
  };

  const handleVideoTimeUpdate = (event) => {
    const video = event.currentTarget;
    if (!Number.isFinite(video.duration) || video.duration <= 0) return;

    const remainingMs = Math.max(0, (video.duration - video.currentTime) * 1000);
    if (remainingMs <= SPLASH_PRE_END_FADE_MS) {
      startFadeOut();
    }
  };

  const handleVideoEnd = () => {
    removeSplash();
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
        onLoadedMetadata={handleLoadedMetadata}
        onPlay={handleVideoPlay}
        onTimeUpdate={handleVideoTimeUpdate}
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
