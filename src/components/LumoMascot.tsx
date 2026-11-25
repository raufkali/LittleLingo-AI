import React from 'react';
import type { LumoExpression } from '../types/learning';

interface LumoMascotProps {
  expression?: LumoExpression;
  size?: number;
  className?: string;
  reducedMotion?: boolean;
  label?: string;
}

export const LumoMascot: React.FC<LumoMascotProps> = ({
  expression = 'happy',
  size = 96,
  className = '',
  reducedMotion = false,
  label = 'Lumo the learning companion',
}) => {
  const animClass = reducedMotion
    ? ''
    : expression === 'celebrating' || expression === 'excited'
      ? 'animate-lumo-bounce'
      : 'animate-lumo-float';

  const renderEyes = () => {
    switch (expression) {
      case 'excited':
      case 'celebrating':
        return (
          <>
            <path d="M35 45 Q40 39 45 45" stroke="#302B45" strokeWidth="3.2" fill="none" strokeLinecap="round" />
            <path d="M55 45 Q60 39 65 45" stroke="#302B45" strokeWidth="3.2" fill="none" strokeLinecap="round" />
          </>
        );
      case 'thinking':
        return (
          <>
            <circle cx="40" cy="44" r="4.5" fill="#302B45" />
            <circle cx="41.5" cy="42.5" r="1.4" fill="#FFFFFF" />
            <circle cx="60" cy="44" r="4.5" fill="#302B45" />
            <circle cx="61.5" cy="42.5" r="1.4" fill="#FFFFFF" />
            <line x1="34" y1="36" x2="45" y2="38" stroke="#302B45" strokeWidth="2.4" strokeLinecap="round" />
            <path d="M55 37 Q60 33 66 36" stroke="#302B45" strokeWidth="2.4" fill="none" strokeLinecap="round" />
          </>
        );
      case 'surprised':
        return (
          <>
            <circle cx="40" cy="44" r="5.5" fill="#FFFFFF" stroke="#302B45" strokeWidth="2.5" />
            <circle cx="40" cy="44" r="2.6" fill="#302B45" />
            <circle cx="60" cy="44" r="5.5" fill="#FFFFFF" stroke="#302B45" strokeWidth="2.5" />
            <circle cx="60" cy="44" r="2.6" fill="#302B45" />
          </>
        );
      case 'encouraging':
        return (
          <>
            <circle cx="40" cy="44" r="4.5" fill="#302B45" />
            <circle cx="41.5" cy="42.5" r="1.5" fill="#FFFFFF" />
            <path d="M55 44 Q60 40 65 44" stroke="#302B45" strokeWidth="3" fill="none" strokeLinecap="round" />
          </>
        );
      default:
        return (
          <>
            <circle cx="40" cy="44" r="4.8" fill="#302B45" />
            <circle cx="41.5" cy="42.3" r="1.6" fill="#FFFFFF" />
            <circle cx="60" cy="44" r="4.8" fill="#302B45" />
            <circle cx="61.5" cy="42.3" r="1.6" fill="#FFFFFF" />
          </>
        );
    }
  };

  const renderMouth = () => {
    switch (expression) {
      case 'celebrating':
      case 'excited':
        return (
          <path
            d="M44 54 Q50 64 56 54 Z"
            fill="#FFD45A"
            stroke="#302B45"
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
        );
      case 'surprised':
        return <circle cx="50" cy="57" r="4.2" fill="#FFD45A" stroke="#302B45" strokeWidth="2.2" />;
      case 'thinking':
        return (
          <path d="M46 56 Q50 54 55 56" stroke="#302B45" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        );
      case 'encouraging':
        return (
          <path d="M44 55 Q50 60 56 55" stroke="#302B45" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        );
      default:
        return (
          <path
            d="M45 53 L50 59 L55 53 Z"
            fill="#FFD45A"
            stroke="#302B45"
            strokeWidth="2"
            strokeLinejoin="round"
          />
        );
    }
  };

  return (
    <div
      className={`inline-flex items-center justify-center select-none ${animClass} ${className}`}
      role="img"
      aria-label={`${label} (${expression})`}
    >
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
        {/* Soft shadow */}
        <ellipse cx="50" cy="91" rx="22" ry="4.5" fill="#302B45" opacity="0.1" />

        {/* Celebratory sparkles for excited/celebrating */}
        {(expression === 'celebrating' || expression === 'excited') && (
          <>
            <path d="M16 24 L19 17 L22 24 L29 27 L22 30 L19 37 L16 30 L9 27 Z" fill="#FFD45A" />
            <path d="M82 20 L84 15 L86 20 L91 22 L86 24 L84 29 L82 24 L77 22 Z" fill="#56C88A" />
          </>
        )}

        {/* Thinking bubble */}
        {expression === 'thinking' && (
          <>
            <circle cx="80" cy="24" r="3.5" fill="#48B8E8" opacity="0.7" />
            <circle cx="88" cy="15" r="5" fill="#48B8E8" opacity="0.85" />
          </>
        )}

        {/* Ear tufts / leaf plumes */}
        <path
          d="M27 30 Q20 14 35 22 Z"
          fill="#7557D9"
          stroke="#302B45"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <path
          d="M73 30 Q80 14 65 22 Z"
          fill="#7557D9"
          stroke="#302B45"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />

        {/* Wings */}
        <ellipse
          cx="22"
          cy="58"
          rx="9"
          ry="15"
          transform={expression === 'celebrating' ? 'rotate(28 22 58)' : 'rotate(12 22 58)'}
          fill="#5E42C2"
          stroke="#302B45"
          strokeWidth="2.5"
        />
        <ellipse
          cx="78"
          cy="58"
          rx="9"
          ry="15"
          transform={expression === 'celebrating' ? 'rotate(-28 78 58)' : 'rotate(-12 78 58)'}
          fill="#5E42C2"
          stroke="#302B45"
          strokeWidth="2.5"
        />

        {/* Round cozy body */}
        <ellipse cx="50" cy="54" rx="28" ry="30" fill="#7557D9" stroke="#302B45" strokeWidth="2.6" />

        {/* Cream belly & face mask */}
        <ellipse cx="50" cy="65" rx="18" ry="16" fill="#FFF9EF" />
        <path
          d="M28 45 C28 33, 44 33, 50 40 C56 33, 72 33, 72 45 C72 56, 61 60, 50 60 C39 60, 28 56, 28 45 Z"
          fill="#FFFFFF"
        />

        {/* Golden star crest */}
        <polygon
          points="50,18 52.5,24 59,24.5 54,28.5 55.5,35 50,31.5 44.5,35 46,28.5 41,24.5 47.5,24"
          fill="#FFD45A"
          stroke="#302B45"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />

        {/* Rosy cheeks */}
        <circle cx="33" cy="51" r="3.6" fill="#F9A8D4" opacity="0.7" />
        <circle cx="67" cy="51" r="3.6" fill="#F9A8D4" opacity="0.7" />

        {/* Dynamic eyes & beak/smile */}
        {renderEyes()}
        {renderMouth()}

        {/* Little feet */}
        <ellipse cx="40" cy="84" rx="6" ry="3.6" fill="#FFD45A" stroke="#302B45" strokeWidth="2" />
        <ellipse cx="60" cy="84" rx="6" ry="3.6" fill="#FFD45A" stroke="#302B45" strokeWidth="2" />
      </svg>
    </div>
  );
};
