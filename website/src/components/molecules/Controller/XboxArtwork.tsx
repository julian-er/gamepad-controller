import { useId } from 'react';
import type { ArtworkProps } from './ArtworkProps';

export function XboxArtwork({ pressed, axes }: ArtworkProps) {
    const uid = useId().replace(/:/g, '');
    return (
        <g>
            <defs>
                <filter height="180%" id={uid + '-xbox-jewel-glow'} width="180%" x="-40%" y="-40%">
                    <feGaussianBlur in="SourceGraphic" result="blur" stdDeviation="4"></feGaussianBlur>

                    <feMerge>
                        <feMergeNode in="blur"></feMergeNode>

                        <feMergeNode in="SourceGraphic"></feMergeNode>
                    </feMerge>
                </filter>

                <radialGradient cx="50%" cy="40%" id={uid + '-jewel-gradient'} r="60%">
                    <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95"></stop>

                    <stop offset="45%" stopColor="#d1fae5" stopOpacity="0.75"></stop>

                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.3"></stop>
                </radialGradient>

                <linearGradient id={uid + '-body-gradient'} x1="0%" x2="0%" y1="0%" y2="100%">
                    <stop offset="0%" stopColor="#1c202d"></stop>

                    <stop offset="100%" stopColor="#131620"></stop>
                </linearGradient>
            </defs>

            <path
                d="M 122 18 C 130 18, 140 22, 145 32 L 95 32 C 98 24, 108 18, 122 18 Z"
                fill="#1e2330"
                stroke="rgba(255,255,255,0.12)"
                strokeWidth="1.2"
                data-button="6"
                className={pressed.includes(6) ? 'art-control is-pressed' : 'art-control'}
            ></path>

            <path
                d="M 418 18 C 410 18, 400 22, 395 32 L 445 32 C 442 24, 432 18, 418 18 Z"
                fill="#1e2330"
                stroke="rgba(255,255,255,0.12)"
                strokeWidth="1.2"
                data-button="7"
                className={pressed.includes(7) ? 'art-control is-pressed' : 'art-control'}
            ></path>

            <text
                fill="#64748b"
                fontFamily="JetBrains Mono"
                fontSize="7.5"
                fontWeight="600"
                textAnchor="middle"
                x="120"
                y="27"
            >
                {'LT'}
            </text>

            <text
                fill="#64748b"
                fontFamily="JetBrains Mono"
                fontSize="7.5"
                fontWeight="600"
                textAnchor="middle"
                x="420"
                y="27"
            >
                {'RT'}
            </text>

            <path
                d="M 100 32 L 182 32 C 182 32, 172 44, 150 46 L 105 44 C 98 40, 97 34, 100 32 Z"
                fill="#252b3b"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="1.2"
                data-button="4"
                className={pressed.includes(4) ? 'art-control is-pressed' : 'art-control'}
            ></path>

            <path
                d="M 440 32 L 358 32 C 358 32, 368 44, 390 46 L 435 44 C 442 40, 443 34, 440 32 Z"
                fill="#252b3b"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="1.2"
                data-button="5"
                className={pressed.includes(5) ? 'art-control is-pressed' : 'art-control'}
            ></path>

            <text
                fill="#94a3b8"
                fontFamily="JetBrains Mono"
                fontSize="8"
                fontWeight="500"
                textAnchor="middle"
                x="138"
                y="41"
            >
                {'LB'}
            </text>

            <text
                fill="#94a3b8"
                fontFamily="JetBrains Mono"
                fontSize="8"
                fontWeight="500"
                textAnchor="middle"
                x="402"
                y="41"
            >
                {'RB'}
            </text>

            <path
                d="M 160 38             C 205 35, 335 35, 380 38             C 425 42, 475 78, 498 135             C 525 200, 520 282, 458 304             C 410 320, 368 238, 332 208             C 300 188, 240 188, 208 208             C 172 238, 130 320, 82 304             C 20 282, 15 200, 42 135             C 65 78, 115 42, 160 38 Z"
                fill={'url(#' + uid + '-body-gradient)'}
                stroke="rgba(255,255,255,0.12)"
                strokeWidth="1.5"
            ></path>

            <path
                d="M 68 185 C 80 240, 115 288, 126 293"
                fill="none"
                stroke="rgba(255,255,255,0.04)"
                strokeWidth="1.5"
            ></path>

            <path
                d="M 472 185 C 460 240, 425 288, 414 293"
                fill="none"
                stroke="rgba(255,255,255,0.04)"
                strokeWidth="1.5"
            ></path>

            <g data-button="16" className={pressed.includes(16) ? 'art-control is-pressed' : 'art-control'}>
                <circle
                    cx="270"
                    cy="88"
                    fill="#000000"
                    fillOpacity="0.3"
                    filter={'url(#' + uid + '-xbox-jewel-glow)'}
                    r="22"
                ></circle>

                <circle
                    cx="270"
                    cy="88"
                    fill="#141824"
                    r="18"
                    stroke="rgba(16, 185, 129, 0.55)"
                    strokeWidth="1.5"
                ></circle>

                <circle cx="270" cy="88" fill="#1a202c" r="15"></circle>

                <path
                    d="M 261 80 C 265 85, 275 85, 279 80 C 275 88, 275 92, 281 97 C 274 93, 266 93, 259 97 C 265 92, 265 88, 261 80 Z"
                    fill={'url(#' + uid + '-jewel-gradient)'}
                ></path>
            </g>

            <g
                transform="translate(222, 112)"
                data-button="8"
                className={pressed.includes(8) ? 'art-control is-pressed' : 'art-control'}
            >
                <circle cx="0" cy="0" fill="#1c2130" r="7.5" stroke="rgba(255,255,255,0.15)" strokeWidth="1"></circle>

                <rect
                    fill="none"
                    height="5"
                    rx="0.6"
                    stroke="#94a3b8"
                    strokeWidth="0.9"
                    width="5.5"
                    x="-4.5"
                    y="-3"
                ></rect>

                <rect
                    fill="none"
                    height="5"
                    rx="0.6"
                    stroke="#94a3b8"
                    strokeWidth="0.9"
                    width="5.5"
                    x="-2"
                    y="-1"
                ></rect>
            </g>

            <g transform="translate(270, 134)">
                <circle cx="0" cy="0" fill="#1a1e2b" r="5" stroke="rgba(255,255,255,0.1)" strokeWidth="0.8"></circle>

                <path
                    d="M -2.5 1.5 L 0 -1 L 2.5 1.5 M 0 -1 L 0 3"
                    fill="none"
                    stroke="#64748b"
                    strokeLinecap="round"
                    strokeWidth="0.9"
                ></path>
            </g>

            <g
                transform="translate(318, 112)"
                data-button="9"
                className={pressed.includes(9) ? 'art-control is-pressed' : 'art-control'}
            >
                <circle cx="0" cy="0" fill="#1c2130" r="7.5" stroke="rgba(255,255,255,0.15)" strokeWidth="1"></circle>

                <line
                    stroke="#94a3b8"
                    strokeLinecap="round"
                    strokeWidth="1"
                    x1="-3.5"
                    x2="3.5"
                    y1="-2.5"
                    y2="-2.5"
                ></line>

                <line stroke="#94a3b8" strokeLinecap="round" strokeWidth="1" x1="-3.5" x2="3.5" y1="0" y2="0"></line>

                <line
                    stroke="#94a3b8"
                    strokeLinecap="round"
                    strokeWidth="1"
                    x1="-3.5"
                    x2="3.5"
                    y1="2.5"
                    y2="2.5"
                ></line>
            </g>

            <g id={uid + '-stick-l-group'} transform="translate(155, 120)">
                <circle cx="0" cy="0" fill="#11141c" r="33" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5"></circle>

                <circle cx="0" cy="0" fill="#161b26" r="28"></circle>

                <g
                    data-button="10"
                    className={pressed.includes(10) ? 'art-control is-pressed' : 'art-control'}
                    data-axis="0"
                    transform={`translate(${(axes[0] || 0) * 13}, ${(axes[1] || 0) * 13})`}
                >
                    <circle
                        cx="0"
                        cy="0"
                        fill="#222838"
                        id={uid + '-stick-l-puck'}
                        r="21"
                        stroke="#10b981"
                        strokeWidth="1.8"
                    ></circle>
                    <circle
                        cx="0"
                        cy="0"
                        fill="none"
                        r="14"
                        stroke="rgba(255,255,255,0.12)"
                        strokeDasharray="2 3"
                    ></circle>
                    <circle
                        cx="0"
                        cy="0"
                        fill="#181d2a"
                        r="7"
                        stroke="rgba(16, 185, 129, 0.3)"
                        strokeWidth="1"
                    ></circle>
                </g>
            </g>

            <g id={uid + '-dpad-group'} transform="translate(208, 196)">
                <circle cx="0" cy="0" fill="#121620" r="30" stroke="rgba(255,255,255,0.06)" strokeWidth="1"></circle>

                <path
                    d="M -11 -28 H 11 V -11 H 28 V 11 H 11 V 28 H -11 V 11 H -28 V -11 H -11 Z"
                    fill="#1b202e"
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth="1.2"
                ></path>

                <polygon
                    fill="#323b4e"
                    points="0,-23 -6,-13 6,-13"
                    data-button="12"
                    className={pressed.includes(12) ? 'art-control is-pressed' : 'art-control'}
                ></polygon>

                <polygon
                    fill="#323b4e"
                    points="0,23 -6,13 6,13"
                    data-button="13"
                    className={pressed.includes(13) ? 'art-control is-pressed' : 'art-control'}
                ></polygon>

                <polygon
                    fill="#323b4e"
                    points="-23,0 -13,-6 -13,6"
                    data-button="14"
                    className={pressed.includes(14) ? 'art-control is-pressed' : 'art-control'}
                ></polygon>

                <polygon
                    fill="#323b4e"
                    points="23,0 13,-6 13,6"
                    data-button="15"
                    className={pressed.includes(15) ? 'art-control is-pressed' : 'art-control'}
                ></polygon>

                <circle cx="0" cy="0" fill="#141822" r="5"></circle>
            </g>

            <g id={uid + '-stick-r-group'} transform="translate(335, 196)">
                <circle cx="0" cy="0" fill="#11141c" r="33" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5"></circle>

                <circle cx="0" cy="0" fill="#161b26" r="28"></circle>

                <g
                    data-button="11"
                    className={pressed.includes(11) ? 'art-control is-pressed' : 'art-control'}
                    data-axis="2"
                    transform={`translate(${(axes[2] || 0) * 13}, ${(axes[3] || 0) * 13})`}
                >
                    <circle
                        cx="0"
                        cy="0"
                        fill="#222838"
                        r="21"
                        stroke="rgba(255,255,255,0.14)"
                        strokeWidth="1.5"
                    ></circle>
                    <circle
                        cx="0"
                        cy="0"
                        fill="none"
                        r="14"
                        stroke="rgba(255,255,255,0.1)"
                        strokeDasharray="2 3"
                    ></circle>
                    <circle cx="0" cy="0" fill="#181d2a" r="7"></circle>
                </g>
            </g>

            <g transform="translate(390, 120)">
                <g data-button="2" className={pressed.includes(2) ? 'art-control is-pressed' : 'art-control'}>
                    <circle cx="-25" cy="0" fill="#122033" r="11.5" stroke="#38bdf8" strokeWidth="1.2"></circle>

                    <text
                        fill="#38bdf8"
                        fontFamily="JetBrains Mono"
                        fontSize="10.5"
                        fontWeight="700"
                        textAnchor="middle"
                        x="-25"
                        y="3.5"
                    >
                        {'X'}
                    </text>
                </g>

                <g data-button="3" className={pressed.includes(3) ? 'art-control is-pressed' : 'art-control'}>
                    <circle cx="0" cy="-25" fill="#2e2716" r="11.5" stroke="#fbbf24" strokeWidth="1.2"></circle>

                    <text
                        fill="#fbbf24"
                        fontFamily="JetBrains Mono"
                        fontSize="10.5"
                        fontWeight="700"
                        textAnchor="middle"
                        x="0"
                        y="-21.5"
                    >
                        {'Y'}
                    </text>
                </g>

                <g data-button="1" className={pressed.includes(1) ? 'art-control is-pressed' : 'art-control'}>
                    <circle cx="25" cy="0" fill="#33191c" r="11.5" stroke="#f87171" strokeWidth="1.2"></circle>

                    <text
                        fill="#f87171"
                        fontFamily="JetBrains Mono"
                        fontSize="10.5"
                        fontWeight="700"
                        textAnchor="middle"
                        x="25"
                        y="3.5"
                    >
                        {'B'}
                    </text>
                </g>

                <g data-button="0" className={pressed.includes(0) ? 'art-control is-pressed' : 'art-control'}>
                    <circle cx="0" cy="25" fill="#102e21" r="11.5" stroke="#34d399" strokeWidth="1.2"></circle>

                    <text
                        fill="#34d399"
                        fontFamily="JetBrains Mono"
                        fontSize="10.5"
                        fontWeight="700"
                        textAnchor="middle"
                        x="0"
                        y="28.5"
                    >
                        {'A'}
                    </text>
                </g>
            </g>
        </g>
    );
}
