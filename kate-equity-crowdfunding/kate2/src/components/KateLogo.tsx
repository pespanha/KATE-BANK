import React from 'react';

export const KateLogo = ({ width = 120, height = "auto", mode = 'color' }: { width?: number | string, height?: number | string, mode?: 'color' | 'white' | 'dark' }) => {
  const primaryColor = mode === 'white' ? '#FFFFFF' : mode === 'dark' ? '#14213C' : '#FCA310';
  const textColor = mode === 'white' ? '#FFFFFF' : mode === 'dark' ? '#14213C' : 'currentColor';

  return (
    <svg width={width} height={height} viewBox="0 0 200 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* K Symbol - Square Outline with K shape */}
      <g transform="translate(0, 5) scale(0.7)">
        {/* Outer Square */}
        <rect x="0" y="0" width="100" height="100" stroke={primaryColor} strokeWidth="8" fill="none" />
        
        {/* K Vertical Bar */}
        <rect x="25" y="20" width="18" height="60" fill={primaryColor} />
        
        {/* K Top Arm */}
        <path d="M45 45 L80 15 L80 35 L45 60 Z" fill={primaryColor} />
        
        {/* K Bottom Arm with rounded corner cut */}
        <path d="M55 55 L80 55 L80 80 C65 80 55 70 55 55 Z" fill={primaryColor} />
      </g>
      
      {/* KATE Text (Custom geometric font style matching the logo) */}
      <g transform="translate(85, 55)" fill="none" stroke={textColor} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        {/* K */}
        <path d="M0 -30 L0 0 M0 -15 L15 -30 M0 -5 L15 0" />
        {/* A */}
        <path d="M25 0 L35 -30 L45 0 M30 -12 L40 -12" />
        {/* T */}
        <path d="M55 -30 L75 -30 M65 -30 L65 0" />
        {/* E */}
        <path d="M95 -30 L85 -30 L85 0 L95 0 M85 -15 L92 -15" />
      </g>
    </svg>
  );
};
