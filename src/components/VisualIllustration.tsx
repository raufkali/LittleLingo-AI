import React from 'react';

interface VisualIllustrationProps {
  visualKey?: string;
  colorHex?: string;
  size?: number;
  className?: string;
}

export const VisualIllustration: React.FC<VisualIllustrationProps> = ({
  visualKey = 'star',
  colorHex,
  size = 72,
  className = '',
}) => {
  const s = size;

  if (visualKey === 'color' && colorHex) {
    return (
      <svg width={s} height={s} viewBox="0 0 80 80" className={className} aria-hidden="true">
        <circle cx="40" cy="40" r="32" fill={colorHex} stroke="#302B45" strokeWidth="2.5" />
        <path
          d="M24 28 C28 20, 38 18, 46 21"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="4"
          strokeLinecap="round"
          opacity="0.65"
        />
      </svg>
    );
  }

  if (visualKey?.startsWith('number-')) {
    const num = visualKey.replace('number-', '');
    return (
      <svg width={s} height={s} viewBox="0 0 80 80" className={className} aria-hidden="true">
        <rect x="10" y="10" width="60" height="60" rx="18" fill="#EDE9FE" stroke="#7557D9" strokeWidth="3" />
        <text
          x="40"
          y="50"
          textAnchor="middle"
          fill="#302B45"
          fontSize={num.length >= 3 ? '22' : '30'}
          fontWeight="800"
          fontFamily="Outfit, sans-serif"
        >
          {num}
        </text>
      </svg>
    );
  }

  switch (visualKey) {
    case 'apple':
      return (
        <svg width={s} height={s} viewBox="0 0 80 80" className={className} aria-hidden="true">
          <path d="M40 18 C40 12, 47 9, 52 12" stroke="#5B3A29" strokeWidth="3.5" fill="none" strokeLinecap="round" />
          <path d="M42 15 C50 9, 58 14, 54 22 C48 22, 43 19, 42 15 Z" fill="#56C88A" />
          <path
            d="M40 24 C26 19, 14 30, 17 48 C19 61, 30 69, 40 65 C50 69, 61 61, 63 48 C66 30, 54 19, 40 24 Z"
            fill="#E05A5A"
            stroke="#302B45"
            strokeWidth="2.5"
          />
          <path d="M27 33 C25 40, 26 47, 29 52" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" fill="none" opacity="0.55" />
        </svg>
      );
    case 'ball':
      return (
        <svg width={s} height={s} viewBox="0 0 80 80" className={className} aria-hidden="true">
          <circle cx="40" cy="40" r="28" fill="#48B8E8" stroke="#302B45" strokeWidth="2.5" />
          <path d="M22 20 C35 32, 35 48, 22 60" stroke="#FFD45A" strokeWidth="5" fill="none" />
          <path d="M58 20 C45 32, 45 48, 58 60" stroke="#FFD45A" strokeWidth="5" fill="none" />
          <circle cx="40" cy="40" r="28" fill="none" stroke="#302B45" strokeWidth="2.5" />
        </svg>
      );
    case 'cat':
      return (
        <svg width={s} height={s} viewBox="0 0 80 80" className={className} aria-hidden="true">
          <polygon points="18,34 22,12 36,24" fill="#FDBA74" stroke="#302B45" strokeWidth="2.5" strokeLinejoin="round" />
          <polygon points="62,34 58,12 44,24" fill="#FDBA74" stroke="#302B45" strokeWidth="2.5" strokeLinejoin="round" />
          <ellipse cx="40" cy="45" rx="24" ry="21" fill="#FDBA74" stroke="#302B45" strokeWidth="2.5" />
          <circle cx="31" cy="42" r="3.2" fill="#302B45" />
          <circle cx="49" cy="42" r="3.2" fill="#302B45" />
          <polygon points="37,48 43,48 40,52" fill="#E05A5A" />
          <path d="M34 55 Q40 59 46 55" stroke="#302B45" strokeWidth="2.2" fill="none" strokeLinecap="round" />
          <path d="M12 45 L24 47 M12 51 L24 51 M68 45 L56 47 M68 51 L56 51" stroke="#302B45" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case 'dog':
      return (
        <svg width={s} height={s} viewBox="0 0 80 80" className={className} aria-hidden="true">
          <ellipse cx="18" cy="40" rx="8" ry="16" fill="#A16207" stroke="#302B45" strokeWidth="2.5" />
          <ellipse cx="62" cy="40" rx="8" ry="16" fill="#A16207" stroke="#302B45" strokeWidth="2.5" />
          <circle cx="40" cy="42" r="22" fill="#FDE68A" stroke="#302B45" strokeWidth="2.5" />
          <ellipse cx="40" cy="49" rx="11" ry="8" fill="#FFFBEB" />
          <circle cx="32" cy="37" r="3.2" fill="#302B45" />
          <circle cx="48" cy="37" r="3.2" fill="#302B45" />
          <ellipse cx="40" cy="46" rx="4.5" ry="3.2" fill="#302B45" />
          <path d="M35 53 Q40 57 45 53" stroke="#302B45" strokeWidth="2.2" fill="none" strokeLinecap="round" />
        </svg>
      );
    case 'elephant':
      return (
        <svg width={s} height={s} viewBox="0 0 80 80" className={className} aria-hidden="true">
          <ellipse cx="18" cy="40" rx="12" ry="17" fill="#93C5FD" stroke="#302B45" strokeWidth="2.5" />
          <ellipse cx="62" cy="40" rx="12" ry="17" fill="#93C5FD" stroke="#302B45" strokeWidth="2.5" />
          <circle cx="40" cy="38" r="20" fill="#BFDBFE" stroke="#302B45" strokeWidth="2.5" />
          <path d="M36 46 Q36 66 47 64" stroke="#302B45" strokeWidth="7" strokeLinecap="round" fill="none" />
          <path d="M36 46 Q36 66 47 64" stroke="#BFDBFE" strokeWidth="3.5" strokeLinecap="round" fill="none" />
          <circle cx="32" cy="35" r="3" fill="#302B45" />
          <circle cx="48" cy="35" r="3" fill="#302B45" />
        </svg>
      );
    case 'fish':
      return (
        <svg width={s} height={s} viewBox="0 0 80 80" className={className} aria-hidden="true">
          <polygon points="55,40 70,26 70,54" fill="#FB923C" stroke="#302B45" strokeWidth="2.5" strokeLinejoin="round" />
          <ellipse cx="36" cy="40" rx="23" ry="16" fill="#FDBA74" stroke="#302B45" strokeWidth="2.5" />
          <circle cx="24" cy="37" r="3" fill="#302B45" />
          <path d="M34 30 Q40 40 34 50" stroke="#FB923C" strokeWidth="3" fill="none" strokeLinecap="round" />
        </svg>
      );
    case 'grapes':
      return (
        <svg width={s} height={s} viewBox="0 0 80 80" className={className} aria-hidden="true">
          <path d="M40 12 L40 22" stroke="#5B3A29" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M41 16 Q54 12 52 22 Q43 23 41 16 Z" fill="#56C88A" />
          {[
            [31, 30], [41, 30], [51, 30],
            [35, 42], [46, 42],
            [40, 54],
          ].map(([cx, cy], idx) => (
            <circle key={idx} cx={cx} cy={cy} r="8" fill="#7557D9" stroke="#302B45" strokeWidth="2.2" />
          ))}
        </svg>
      );
    case 'sun':
      return (
        <svg width={s} height={s} viewBox="0 0 80 80" className={className} aria-hidden="true">
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
            <line
              key={deg}
              x1="40"
              y1="10"
              x2="40"
              y2="17"
              stroke="#F59E0B"
              strokeWidth="4"
              strokeLinecap="round"
              transform={`rotate(${deg} 40 40)`}
            />
          ))}
          <circle cx="40" cy="40" r="19" fill="#FFD45A" stroke="#302B45" strokeWidth="2.5" />
          <circle cx="34" cy="38" r="2.3" fill="#302B45" />
          <circle cx="46" cy="38" r="2.3" fill="#302B45" />
          <path d="M35 45 Q40 49 45 45" stroke="#302B45" strokeWidth="2.2" fill="none" strokeLinecap="round" />
        </svg>
      );
    case 'moon':
      return (
        <svg width={s} height={s} viewBox="0 0 80 80" className={className} aria-hidden="true">
          <path
            d="M48 16 C32 18, 22 32, 26 48 C30 62, 46 68, 59 59 C44 60, 36 48, 39 34 C41 25, 45 20, 48 16 Z"
            fill="#FFD45A"
            stroke="#302B45"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <circle cx="57" cy="24" r="3" fill="#7557D9" />
          <circle cx="63" cy="36" r="2" fill="#48B8E8" />
        </svg>
      );
    case 'star':
      return (
        <svg width={s} height={s} viewBox="0 0 80 80" className={className} aria-hidden="true">
          <polygon
            points="40,12 48,30 68,32 53,46 57,66 40,56 23,66 27,46 12,32 32,30"
            fill="#FFD45A"
            stroke="#302B45"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'tree':
      return (
        <svg width={s} height={s} viewBox="0 0 80 80" className={className} aria-hidden="true">
          <rect x="34" y="46" width="12" height="24" rx="3" fill="#92400E" stroke="#302B45" strokeWidth="2.2" />
          <circle cx="40" cy="32" r="20" fill="#56C88A" stroke="#302B45" strokeWidth="2.5" />
          <circle cx="27" cy="38" r="12" fill="#56C88A" stroke="#302B45" strokeWidth="2.2" />
          <circle cx="53" cy="38" r="12" fill="#56C88A" stroke="#302B45" strokeWidth="2.2" />
          <circle cx="40" cy="34" r="16" fill="#56C88A" />
        </svg>
      );
    case 'rabbit':
      return (
        <svg width={s} height={s} viewBox="0 0 80 80" className={className} aria-hidden="true">
          <ellipse cx="30" cy="23" rx="6" ry="15" fill="#FFFFFF" stroke="#302B45" strokeWidth="2.5" />
          <ellipse cx="50" cy="23" rx="6" ry="15" fill="#FFFFFF" stroke="#302B45" strokeWidth="2.5" />
          <ellipse cx="30" cy="24" rx="2.5" ry="9" fill="#FCA5A5" />
          <ellipse cx="50" cy="24" rx="2.5" ry="9" fill="#FCA5A5" />
          <circle cx="40" cy="49" r="19" fill="#FFFFFF" stroke="#302B45" strokeWidth="2.5" />
          <circle cx="33" cy="46" r="2.8" fill="#302B45" />
          <circle cx="47" cy="46" r="2.8" fill="#302B45" />
          <polygon points="37,51 43,51 40,54" fill="#F472B6" />
          <path d="M35 58 Q40 61 45 58" stroke="#302B45" strokeWidth="2" fill="none" strokeLinecap="round" />
        </svg>
      );
    case 'banana':
      return (
        <svg width={s} height={s} viewBox="0 0 80 80" className={className} aria-hidden="true">
          <path
            d="M20 52 C32 66, 58 58, 62 24 C63 18, 56 16, 54 22 C49 44, 34 50, 22 46 C18 45, 17 49, 20 52 Z"
            fill="#FFD45A"
            stroke="#302B45"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'orange':
      return (
        <svg width={s} height={s} viewBox="0 0 80 80" className={className} aria-hidden="true">
          <circle cx="40" cy="44" r="22" fill="#FB923C" stroke="#302B45" strokeWidth="2.5" />
          <path d="M40 22 Q48 12 56 18 Q48 25 40 22 Z" fill="#56C88A" stroke="#302B45" strokeWidth="2" />
          <circle cx="32" cy="36" r="2" fill="#FFFFFF" opacity="0.6" />
        </svg>
      );
    case 'book':
      return (
        <svg width={s} height={s} viewBox="0 0 80 80" className={className} aria-hidden="true">
          <rect x="16" y="16" width="48" height="48" rx="8" fill="#7557D9" stroke="#302B45" strokeWidth="2.5" />
          <rect x="24" y="22" width="34" height="36" rx="4" fill="#FFFFFF" />
          <line x1="30" y1="32" x2="50" y2="32" stroke="#7557D9" strokeWidth="3" strokeLinecap="round" />
          <line x1="30" y1="41" x2="46" y2="41" stroke="#48B8E8" strokeWidth="3" strokeLinecap="round" />
        </svg>
      );
    case 'water':
    case 'rain':
      return (
        <svg width={s} height={s} viewBox="0 0 80 80" className={className} aria-hidden="true">
          <path
            d="M40 14 C40 14, 20 38, 20 50 C20 61, 29 68, 40 68 C51 68, 60 61, 60 50 C60 38, 40 14, 40 14 Z"
            fill="#48B8E8"
            stroke="#302B45"
            strokeWidth="2.5"
          />
          <path d="M31 46 C30 53, 33 58, 38 60" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.7" />
        </svg>
      );
    case 'ship':
      return (
        <svg width={s} height={s} viewBox="0 0 80 80" className={className} aria-hidden="true">
          <polygon points="38,14 38,44 58,44" fill="#FFD45A" stroke="#302B45" strokeWidth="2.5" strokeLinejoin="round" />
          <polygon points="34,20 34,44 19,44" fill="#FFFFFF" stroke="#302B45" strokeWidth="2.5" strokeLinejoin="round" />
          <polygon points="14,48 66,48 56,64 24,64" fill="#E05A5A" stroke="#302B45" strokeWidth="2.5" strokeLinejoin="round" />
        </svg>
      );
    case 'chair':
      return (
        <svg width={s} height={s} viewBox="0 0 80 80" className={className} aria-hidden="true">
          <rect x="24" y="16" width="32" height="24" rx="6" fill="#F59E0B" stroke="#302B45" strokeWidth="2.5" />
          <rect x="20" y="40" width="40" height="10" rx="4" fill="#D97706" stroke="#302B45" strokeWidth="2.5" />
          <line x1="25" y1="50" x2="25" y2="66" stroke="#302B45" strokeWidth="4" strokeLinecap="round" />
          <line x1="55" y1="50" x2="55" y2="66" stroke="#302B45" strokeWidth="4" strokeLinecap="round" />
        </svg>
      );
    case 'flower':
      return (
        <svg width={s} height={s} viewBox="0 0 80 80" className={className} aria-hidden="true">
          <line x1="40" y1="42" x2="40" y2="68" stroke="#56C88A" strokeWidth="4.5" strokeLinecap="round" />
          {[0, 60, 120, 180, 240, 300].map((deg) => (
            <circle
              key={deg}
              cx="40"
              cy="22"
              r="9"
              fill="#F472B6"
              stroke="#302B45"
              strokeWidth="2"
              transform={`rotate(${deg} 40 34)`}
            />
          ))}
          <circle cx="40" cy="34" r="9" fill="#FFD45A" stroke="#302B45" strokeWidth="2.2" />
        </svg>
      );
    case 'umbrella':
      return (
        <svg width={s} height={s} viewBox="0 0 80 80" className={className} aria-hidden="true">
          <path d="M14 42 C14 22, 66 22, 66 42 Z" fill="#48B8E8" stroke="#302B45" strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M40 42 L40 60 C40 66, 48 66, 48 60" stroke="#302B45" strokeWidth="3.5" fill="none" strokeLinecap="round" />
        </svg>
      );
    default:
      return (
        <svg width={s} height={s} viewBox="0 0 80 80" className={className} aria-hidden="true">
          <rect x="14" y="14" width="52" height="52" rx="16" fill="#EDE9FE" stroke="#7557D9" strokeWidth="2.5" />
          <polygon
            points="40,22 45,33 57,34 48,42 50,54 40,48 30,54 32,42 23,34 35,33"
            fill="#FFD45A"
            stroke="#302B45"
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </svg>
      );
  }
};
