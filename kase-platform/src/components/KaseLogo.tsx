import React from 'react';

interface KaseLogoProps {
  variant?: 'full' | 'icon' | 'wordmark';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizes = {
  sm: { width: 80, height: 28 },
  md: { width: 120, height: 42 },
  lg: { width: 160, height: 56 },
  xl: { width: 220, height: 77 },
};

export default function KaseLogo({ variant = 'full', size = 'md', className }: KaseLogoProps) {
  const { width, height } = sizes[size];

  if (variant === 'icon') {
    const iconSize = height;
    return (
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        aria-label="KASE icon"
      >
        <defs>
          <linearGradient id="kase-icon-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F5A623" />
            <stop offset="100%" stopColor="#D4891A" />
          </linearGradient>
        </defs>
        {/* K letter stylized */}
        <path
          d="M12 8V40M12 24L30 8M12 24L30 40"
          stroke="url(#kase-icon-grad)"
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Upward arrow accent */}
        <path
          d="M34 18L38 8L42 18"
          stroke="url(#kase-icon-grad)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 220 77"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="KASE - Kate Assets Stellar Exchange"
    >
      <defs>
        <linearGradient id="kase-text-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="60%" stopColor="#F5C563" />
          <stop offset="100%" stopColor="#F5A623" />
        </linearGradient>
        <linearGradient id="kase-accent-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#F5A623" />
          <stop offset="100%" stopColor="#D4891A" />
        </linearGradient>
      </defs>
      {/* KASE text */}
      <text
        x="0"
        y="44"
        fill="url(#kase-text-grad)"
        fontFamily="'Inter', 'Helvetica Neue', Arial, sans-serif"
        fontSize="52"
        fontWeight="800"
        letterSpacing="6"
      >
        KASE
      </text>
      {/* Tagline */}
      {variant === 'full' && (
        <text
          x="2"
          y="66"
          fill="rgba(255,255,255,0.5)"
          fontFamily="'Inter', 'Helvetica Neue', Arial, sans-serif"
          fontSize="10"
          fontWeight="500"
          letterSpacing="3"
        >
          KATE ASSETS STELLAR EXCHANGE
        </text>
      )}
      {/* Accent line */}
      <rect
        x="0"
        y="72"
        width="180"
        height="2"
        rx="1"
        fill="url(#kase-accent-grad)"
        opacity="0.4"
      />
    </svg>
  );
}
