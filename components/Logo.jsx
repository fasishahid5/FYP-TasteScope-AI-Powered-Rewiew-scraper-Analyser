import React from 'react';

const Logo = ({ size = 'large', showTitle = true }) => {
  const containerClasses = size === 'small' ? 'text-sm' : 'text-base';
  const iconSize = size === 'small' ? 'w-12 h-12' : 'w-16 h-16';

  return (
    <div className={`group flex flex-col items-center gap-2 ${containerClasses}`}>
      <div className="flex items-center gap-3">
        {/* SVG Magnifying Glass Icon */}
        <div
          className={`${iconSize} drop-shadow-sm transition-transform duration-200 ease-out group-hover:scale-105`}
          role="img"
          aria-label="TasteScope logo"
        >
          <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="glassGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#60A5FA" />
                <stop offset="100%" stopColor="#3B82F6" />
              </linearGradient>
              <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#000" floodOpacity="0.15" />
              </filter>
            </defs>

            <g filter="url(#shadow)">
              <circle cx="26" cy="26" r="24" stroke="url(#glassGrad)" strokeWidth="6" fill="rgba(255,255,255,0.2)" className="animate-pulse" />
              <path d="M37 37L56 56" stroke="url(#glassGrad)" strokeWidth="8" strokeLinecap="round" />
              <circle cx="26" cy="26" r="10" fill="rgba(255,255,255,0.35)" />
            </g>

            {/* Inner Icons (fork/knife, cloche, smiley) */}
            <g transform="translate(14,16) scale(1.0)">
              {/* Fork & Knife */}
              <g transform="translate(-4,0)">
                <path d="M3 2V12" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
                <path d="M6 2V12" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
                <path d="M3 2H6" stroke="#fff" strokeWidth="2" />
              </g>

              {/* Steaming Platter */}
              <g transform="translate(4,0)">
                <path d="M2 10C2 8 4 6 8 6C12 6 14 8 14 10H2Z" fill="#fff" opacity="0.85" />
                <path d="M4 10H12" stroke="#60A5FA" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M7 4C7 3.3 6.4 2.7 5.7 2.5" stroke="#60A5FA" strokeWidth="1.4" strokeLinecap="round" />
                <path d="M9 4C9 3.3 8.4 2.7 7.7 2.5" stroke="#60A5FA" strokeWidth="1.4" strokeLinecap="round" />
              </g>

              {/* Smiley Face */}
              <g transform="translate(20,0)" className="group-hover:animate-pulse">
                <circle cx="6" cy="6" r="5" fill="#fff" opacity="0.85" />
                <circle cx="4" cy="5" r="1" fill="#60A5FA" />
                <circle
                  cx="8"
                  cy="5"
                  r="1"
                  fill="#60A5FA"
                  className="transition-opacity duration-200 ease-out group-hover:opacity-0"
                />
                <path
                  d="M7.5 5.5L9.5 5"
                  stroke="#60A5FA"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  className="opacity-0 transition-opacity duration-200 ease-out group-hover:opacity-100"
                />
                <path d="M4 8C5 9.3 7 9.3 8 8" stroke="#60A5FA" strokeWidth="1.5" strokeLinecap="round" />
              </g>
            </g>
          </svg>
        </div>

        {/* Typography */}
        {showTitle && (
          <div className="flex flex-col">
            <div className="flex">
              <span className="font-bold text-[#374151] tracking-tight text-2xl md:text-3xl">TASTE</span>
              <span className="font-bold text-[#3B82F6] tracking-tight text-2xl md:text-3xl">SCOPE</span>
            </div>
            <p className="text-slate-500 text-xs md:text-sm font-medium">
              AI Restaurant Sentiment Analysis
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Logo;
