import React from 'react';

export default function CleanTechLogo({ className = "h-10 w-auto", showSubtitle = true }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 320 76" 
      className={className}
      fill="none"
      aria-label="Clean Tech Pro"
    >
      <defs>
        <linearGradient id="ctlGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38BDF8"/>
          <stop offset="100%" stopColor="#0284C7"/>
        </linearGradient>
        <linearGradient id="ctlGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#E0F2FE"/>
          <stop offset="100%" stopColor="#38BDF8"/>
        </linearGradient>
        <linearGradient id="ctlGrad3" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#BAE6FD"/>
          <stop offset="100%" stopColor="#0284C7"/>
        </linearGradient>
        <filter id="ctlShadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="1.5" stdDeviation="2" floodColor="#000000" floodOpacity="0.25"/>
        </filter>
      </defs>

      <g filter="url(#ctlShadow)">
        {/* Isometric Dynamic Ribbon Symbol */}
        <g transform="translate(6, 6) scale(0.85)">
          {/* Top Fold */}
          <polygon points="26,6 54,6 68,22 40,22" fill="url(#ctlGrad2)"/>
          {/* Right Fold */}
          <polygon points="54,6 68,22 56,52 42,36" fill="url(#ctlGrad1)"/>
          {/* Left Fold */}
          <polygon points="26,6 40,22 28,52 14,36" fill="url(#ctlGrad1)"/>
          {/* Center Intersecting Fold */}
          <polygon points="40,22 62,22 46,52 24,52" fill="url(#ctlGrad3)" opacity="0.95"/>
          {/* Bottom Return Tail */}
          <polygon points="46,52 60,52 44,70 30,70" fill="url(#ctlGrad1)"/>
        </g>

        {/* Typography */}
        {/* CLEAN TECH */}
        <text 
          x="74" 
          y="39" 
          fontFamily="-apple-system, BlinkMacSystemFont, 'Montserrat', 'Inter', 'Segoe UI', Roboto, sans-serif" 
          fontSize="23" 
          fontWeight="900" 
          letterSpacing="1.2" 
          fill="#FFFFFF"
        >
          CLEAN TECH
        </text>
        
        {/* PRO Badge */}
        <rect x="230" y="21" width="54" height="22" rx="5" fill="#38BDF8"/>
        <text 
          x="257" 
          y="37" 
          textAnchor="middle" 
          fontFamily="-apple-system, BlinkMacSystemFont, 'Montserrat', 'Inter', 'Segoe UI', Roboto, sans-serif" 
          fontSize="14" 
          fontWeight="900" 
          letterSpacing="1.5" 
          fill="#00353F"
        >
          PRO
        </text>

        {/* Tagline Subtitle */}
        {showSubtitle && (
          <text 
            x="75" 
            y="58" 
            fontFamily="-apple-system, BlinkMacSystemFont, 'Montserrat', 'Inter', 'Segoe UI', Roboto, sans-serif" 
            fontSize="7.6" 
            fontWeight="700" 
            letterSpacing="1.6" 
            fill="#BAE6FD"
          >
            LOCAÇÃO E ASSISTÊNCIA TÉCNICA
          </text>
        )}
      </g>
    </svg>
  );
}
