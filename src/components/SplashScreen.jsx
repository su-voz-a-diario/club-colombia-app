"use client";

import React, { useState, useEffect } from 'react';

export default function SplashScreen() {
  const [showSplash, setShowSplash] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    // Verificar si el splash ya se mostró en esta sesión
    const hasSeenSplash = sessionStorage.getItem('hasSeenSplash');
    
    if (hasSeenSplash) {
      setShowSplash(false);
      return;
    }
    
    // Si no se ha visto, lo marcamos para que no vuelva a aparecer al recargar/navegar
    sessionStorage.setItem('hasSeenSplash', 'true');
  }, []);

  const handleVideoEnd = () => {
    // Iniciar el efecto de desvanecimiento
    setIsFadingOut(true);
    
    // Desmontar el componente completamente después de 1 segundo (tiempo del fade out)
    setTimeout(() => {
      setShowSplash(false);
    }, 1000);
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
        className="w-full h-full object-cover"
      >
        <source src="/videos/splash.mp4" type="video/mp4" />
        Tu navegador no soporta el formato de video.
      </video>
    </div>
  );
}
