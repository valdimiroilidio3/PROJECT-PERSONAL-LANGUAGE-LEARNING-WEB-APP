'use client';

/** Nori, the original Lumio mascot: a small lantern-like learning robot. */
export function Mascot({ className = 'h-28 w-28', mood = 'happy' }: { className?: string; mood?: 'happy' | 'wink' | 'celebrate' }) {
  return (
    <svg viewBox="0 0 220 220" className={className} role="img" aria-label="Nori, o robô tutor do Lumio">
      <defs>
        <linearGradient id="nori-body" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FFF38A" />
          <stop offset="45%" stopColor="#FFE500" />
          <stop offset="100%" stopColor="#E9B900" />
        </linearGradient>
        <linearGradient id="nori-screen" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3A3A33" />
          <stop offset="100%" stopColor="#20201D" />
        </linearGradient>
        <filter id="nori-shadow" x="-30%" y="-30%" width="160%" height="180%">
          <feDropShadow dx="0" dy="8" stdDeviation="7" floodColor="#20201D" floodOpacity="0.18" />
        </filter>
      </defs>

      {/* antenna with a leaf */}
      <path d="M110 45 C108 30 112 22 124 14" fill="none" stroke="#20201D" strokeWidth="6" strokeLinecap="round" />
      <path d="M123 15 C138 6 151 12 148 25 C137 30 126 27 123 15Z" fill="#7DBE73" stroke="#20201D" strokeWidth="3" />
      <circle cx="110" cy="43" r="7" fill="#FFE500" stroke="#20201D" strokeWidth="3" />

      {/* little side fins */}
      <path d="M39 95 C24 80 23 63 31 52 C44 61 51 76 51 93Z" fill="#FFE500" stroke="#20201D" strokeWidth="4" strokeLinejoin="round" />
      <path d="M181 95 C196 80 197 63 189 52 C176 61 169 76 169 93Z" fill="#FFE500" stroke="#20201D" strokeWidth="4" strokeLinejoin="round" />

      {/* body */}
      <g filter="url(#nori-shadow)">
        <rect x="36" y="47" width="148" height="128" rx="52" fill="url(#nori-body)" stroke="#20201D" strokeWidth="4" />
        <rect x="55" y="66" width="110" height="88" rx="38" fill="url(#nori-screen)" />
        <path d="M64 79 C77 68 96 66 110 68" fill="none" stroke="#FFFFFF" strokeOpacity="0.22" strokeWidth="5" strokeLinecap="round" />

        {mood === 'wink' ? (
          <>
            <ellipse cx="88" cy="100" rx="10" ry="15" fill="#FFFDF4" />
            <path d="M121 101 C128 94 140 94 146 101" fill="none" stroke="#FFFDF4" strokeWidth="5" strokeLinecap="round" />
          </>
        ) : (
          <>
            <ellipse cx="88" cy="100" rx="10" ry="15" fill="#FFFDF4" />
            <ellipse cx="132" cy="100" rx="10" ry="15" fill="#FFFDF4" />
          </>
        )}
        <circle cx="90" cy="105" r="3" fill="#20201D" opacity="0.75" />
        <circle cx="134" cy="105" r="3" fill="#20201D" opacity="0.75" />
        <path
          d={mood === 'celebrate' ? 'M95 126 C104 139 121 139 130 126' : 'M99 124 C108 132 118 132 126 124'}
          fill="none"
          stroke="#FFFDF4"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <circle cx="69" cy="121" r="5" fill="#FF9E92" opacity="0.75" />
        <circle cx="151" cy="121" r="5" fill="#FF9E92" opacity="0.75" />
      </g>

      {/* feet */}
      <rect x="58" y="174" width="42" height="20" rx="10" fill="#E9B900" stroke="#20201D" strokeWidth="4" />
      <rect x="120" y="174" width="42" height="20" rx="10" fill="#E9B900" stroke="#20201D" strokeWidth="4" />

      {mood === 'celebrate' && (
        <>
          <path d="M32 47 L24 36 M42 29 L40 17 M184 43 L194 32" stroke="#FFE500" strokeWidth="5" strokeLinecap="round" />
          <circle cx="190" cy="58" r="4" fill="#7DBE73" />
        </>
      )}
    </svg>
  );
}
