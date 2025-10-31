
import React from 'react';

export const LogoIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" {...props}>
        <defs>
            <radialGradient id="glow" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                <stop offset="0%" style={{ stopColor: '#a78bfa', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: '#6366f1', stopOpacity: 0 }} />
            </radialGradient>
        </defs>
        <circle cx="50" cy="50" r="10" fill="url(#glow)" />
        <ellipse cx="50" cy="50" rx="30" ry="12" stroke="#818cf8" strokeWidth="2" fill="none" transform="rotate(30 50 50)" />
        <ellipse cx="50" cy="50" rx="40" ry="18" stroke="#6366f1" strokeWidth="2" fill="none" transform="rotate(-45 50 50)" />
        <circle cx="50" cy="50" r="8" fill="#c4b5fd" className="animate-pulse" />
    </svg>
);
