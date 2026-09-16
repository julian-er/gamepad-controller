import { useId } from 'react';
import type { ArtworkProps } from './ArtworkProps';

export function PlayStationArtwork({ pressed, axes }: ArtworkProps) {
    const uid = useId().replace(/:/g, '');
    return (
        <g>
            <defs>
                <radialGradient cx="50%" cy="40%" id={uid + '-mintGlow'} r="60%">
                    <stop offset="0%" stopColor="#4edea3" stopOpacity="0.35"></stop>

                    <stop offset="65%" stopColor="#10b981" stopOpacity="0.12"></stop>

                    <stop offset="100%" stopColor="#10b981" stopOpacity="0"></stop>
                </radialGradient>

                <linearGradient id={uid + '-touchpadLightbar'} x1="0%" x2="100%" y1="0%" y2="0%">
                    <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8"></stop>

                    <stop offset="50%" stopColor="#4edea3" stopOpacity="0.95"></stop>

                    <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.8"></stop>
                </linearGradient>
            </defs>

            <path
                d="M 120 30 C 130 18, 160 16, 180 20 L 175 32 C 158 29, 136 30, 128 38 Z"
                fill="#1b202c"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="1.2"
                data-button="6"
                className={pressed.includes(6) ? 'art-control is-pressed' : 'art-control'}
            ></path>

            <text fill="#64748b" fontFamily="JetBrains Mono" fontSize="7.5" textAnchor="middle" x="148" y="27">
                {'L2'}
            </text>

            <path
                d="M 420 30 C 410 18, 380 16, 360 20 L 365 32 C 382 29, 404 30, 412 38 Z"
                fill="#1b202c"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="1.2"
                data-button="7"
                className={pressed.includes(7) ? 'art-control is-pressed' : 'art-control'}
            ></path>

            <text fill="#64748b" fontFamily="JetBrains Mono" fontSize="7.5" textAnchor="middle" x="392" y="27">
                {'R2'}
            </text>

            <path
                d="M 106 38 C 120 34, 172 34, 186 38 L 182 50 C 168 47, 122 47, 110 50 Z"
                fill="#242a38"
                stroke="rgba(255,255,255,0.12)"
                strokeWidth="1.2"
                data-button="4"
                className={pressed.includes(4) ? 'art-control is-pressed' : 'art-control'}
            ></path>

            <text
                fill="#94a3b8"
                fontFamily="JetBrains Mono"
                fontSize="8"
                fontWeight="600"
                textAnchor="middle"
                x="146"
                y="46"
            >
                {'L1'}
            </text>

            <path
                d="M 434 38 C 420 34, 368 34, 354 38 L 358 50 C 372 47, 418 47, 430 50 Z"
                fill="#242a38"
                stroke="rgba(255,255,255,0.12)"
                strokeWidth="1.2"
                data-button="5"
                className={pressed.includes(5) ? 'art-control is-pressed' : 'art-control'}
            ></path>

            <text
                fill="#94a3b8"
                fontFamily="JetBrains Mono"
                fontSize="8"
                fontWeight="600"
                textAnchor="middle"
                x="394"
                y="46"
            >
                {'R1'}
            </text>

            <path
                d="M 175 52 C 220 52, 320 52, 365 52 C 430 52, 480 82, 498 140 C 516 195, 492 285, 444 308 C 412 322, 382 292, 362 250 C 344 214, 324 200, 270 200 C 216 200, 196 214, 178 250 C 158 292, 128 322, 96 308 C 48 285, 24 195, 42 140 C 60 82, 110 52, 175 52 Z"
                fill="#141824"
                stroke="rgba(255,255,255,0.12)"
                strokeWidth="1.5"
            ></path>

            <path
                d="M 186 78 C 225 78, 315 78, 354 78 C 375 110, 395 160, 388 230 C 375 258, 345 264, 328 245 C 305 220, 290 212, 270 212 C 250 212, 235 220, 212 245 C 195 264, 165 258, 152 230 C 145 160, 165 110, 186 78 Z"
                fill="#0f131c"
                stroke="rgba(255,255,255,0.06)"
                strokeWidth="1.2"
            ></path>

            <path
                d="M 198 70 C 235 68, 305 68, 342 70 L 334 140 C 298 146, 242 146, 206 140 Z"
                fill={'url(#' + uid + '-mintGlow)'}
            ></path>

            <path
                d="M 202 72 L 338 72 L 331 136 C 295 142, 245 142, 209 136 Z"
                fill="#1a202d"
                stroke="rgba(255,255,255,0.12)"
                strokeWidth="1.2"
            ></path>

            <path
                d="M 199 71 L 341 71"
                stroke={'url(#' + uid + '-touchpadLightbar)'}
                strokeLinecap="round"
                strokeWidth="2.5"
            ></path>

            <path
                d="M 202 73 L 208 134"
                opacity="0.8"
                stroke={'url(#' + uid + '-touchpadLightbar)'}
                strokeLinecap="round"
                strokeWidth="1.5"
            ></path>

            <path
                d="M 338 73 L 332 134"
                opacity="0.8"
                stroke={'url(#' + uid + '-touchpadLightbar)'}
                strokeLinecap="round"
                strokeWidth="1.5"
            ></path>

            <g data-button="8" className={pressed.includes(8) ? 'art-control is-pressed' : 'art-control'}>
                <line stroke="#64748b" strokeLinecap="round" strokeWidth="2" x1="184" x2="188" y1="88" y2="98"></line>

                <line stroke="#475569" strokeLinecap="round" strokeWidth="1" x1="180" x2="182" y1="90" y2="95"></line>

                <line stroke="#475569" strokeLinecap="round" strokeWidth="1" x1="190" x2="192" y1="91" y2="96"></line>
            </g>

            <g data-button="9" className={pressed.includes(9) ? 'art-control is-pressed' : 'art-control'}>
                <line stroke="#64748b" strokeLinecap="round" strokeWidth="1.5" x1="349" x2="357" y1="90" y2="90"></line>

                <line stroke="#64748b" strokeLinecap="round" strokeWidth="1.5" x1="349" x2="357" y1="94" y2="94"></line>

                <line stroke="#64748b" strokeLinecap="round" strokeWidth="1.5" x1="349" x2="357" y1="98" y2="98"></line>
            </g>

            <g id={uid + '-ps-dpad'} transform="translate(132, 126)">
                <circle cx="0" cy="0" fill="#121622" r="32" stroke="rgba(255,255,255,0.06)" strokeWidth="1"></circle>

                <path
                    d="M -7 -10 L 7 -10 L 8 -24 C 8 -27, -8 -27, -8 -24 Z"
                    fill="#242c3c"
                    stroke="rgba(255,255,255,0.12)"
                    strokeWidth="1"
                    data-button="12"
                    className={pressed.includes(12) ? 'art-control is-pressed' : 'art-control'}
                ></path>

                <polygon fill="#64748b" pointerEvents="none" points="0,-21 -3.5,-15 3.5,-15"></polygon>

                <path
                    d="M -7 10 L 7 10 L 8 24 C 8 27, -8 27, -8 24 Z"
                    fill="#242c3c"
                    stroke="rgba(255,255,255,0.12)"
                    strokeWidth="1"
                    data-button="13"
                    className={pressed.includes(13) ? 'art-control is-pressed' : 'art-control'}
                ></path>

                <polygon fill="#64748b" pointerEvents="none" points="0,21 -3.5,15 3.5,15"></polygon>

                <path
                    d="M -10 -7 L -10 7 L -24 8 C -27 8, -27 -8, -24 -8 Z"
                    fill="#242c3c"
                    stroke="rgba(255,255,255,0.12)"
                    strokeWidth="1"
                    data-button="14"
                    className={pressed.includes(14) ? 'art-control is-pressed' : 'art-control'}
                ></path>

                <polygon fill="#64748b" pointerEvents="none" points="-21,0 -15,-3.5 -15,3.5"></polygon>

                <path
                    d="M 10 -7 L 10 7 L 24 8 C 27 8, 27 -8, 24 -8 Z"
                    fill="#242c3c"
                    stroke="rgba(255,255,255,0.12)"
                    strokeWidth="1"
                    data-button="15"
                    className={pressed.includes(15) ? 'art-control is-pressed' : 'art-control'}
                ></path>

                <polygon fill="#64748b" pointerEvents="none" points="21,0 15,-3.5 15,3.5"></polygon>

                <circle cx="0" cy="0" fill="#181e2b" r="6"></circle>
            </g>

            <g id={uid + '-ps-face-buttons'} transform="translate(408, 126)">
                <circle cx="0" cy="0" fill="#121622" r="32" stroke="rgba(255,255,255,0.06)" strokeWidth="1"></circle>

                <g data-button="3" className={pressed.includes(3) ? 'art-control is-pressed' : 'art-control'}>
                    <circle
                        cx="0"
                        cy="-20"
                        fill="#1a2424"
                        r="9"
                        stroke="rgba(78,222,163,0.35)"
                        strokeWidth="1"
                    ></circle>

                    <polygon
                        fill="none"
                        points="0,-25 -4.5,-16 4.5,-16"
                        stroke="#4edea3"
                        strokeLinejoin="round"
                        strokeWidth="1.6"
                    ></polygon>
                </g>

                <g data-button="1" className={pressed.includes(1) ? 'art-control is-pressed' : 'art-control'}>
                    <circle
                        cx="20"
                        cy="0"
                        fill="#281a1f"
                        r="9"
                        stroke="rgba(248,113,113,0.35)"
                        strokeWidth="1"
                    ></circle>

                    <circle cx="20" cy="0" fill="none" r="4.5" stroke="#f87171" strokeWidth="1.6"></circle>
                </g>

                <g data-button="0" className={pressed.includes(0) ? 'art-control is-pressed' : 'art-control'}>
                    <circle cx="0" cy="20" fill="#162332" r="9" stroke="rgba(56,189,248,0.35)" strokeWidth="1"></circle>

                    <path
                        d="M -3.2 16.8 L 3.2 23.2 M 3.2 16.8 L -3.2 23.2"
                        stroke="#38bdf8"
                        strokeLinecap="round"
                        strokeWidth="1.8"
                    ></path>
                </g>

                <g data-button="2" className={pressed.includes(2) ? 'art-control is-pressed' : 'art-control'}>
                    <circle
                        cx="-20"
                        cy="0"
                        fill="#271a2b"
                        r="9"
                        stroke="rgba(232,121,249,0.35)"
                        strokeWidth="1"
                    ></circle>

                    <rect
                        fill="none"
                        height="8"
                        rx="0.5"
                        stroke="#e879f9"
                        strokeWidth="1.6"
                        width="8"
                        x="-24"
                        y="-4"
                    ></rect>
                </g>
            </g>

            <g
                transform="translate(270, 168)"
                data-button="16"
                className={pressed.includes(16) ? 'art-control is-pressed' : 'art-control'}
            >
                <circle cx="0" cy="0" fill="#1a1f2c" r="10" stroke="rgba(255,255,255,0.15)" strokeWidth="1.2"></circle>

                <path
                    d="M -3 3 L -3 -4 C -3 -5, -1 -5.5, 0 -4.5 C 1 -3.5, 0 -2.5, -3 -2.5"
                    fill="none"
                    stroke="#dfe2ef"
                    strokeLinecap="round"
                    strokeWidth="1.3"
                ></path>

                <path
                    d="M 0 0 C 2 0, 3 1, 3 2.5 C 3 4, 1.5 4.5, -0.5 4.5 C -2.5 4.5, -2 3.5, -2 3"
                    fill="none"
                    stroke="#4edea3"
                    strokeLinecap="round"
                    strokeWidth="1.2"
                ></path>
            </g>

            <rect fill="#475569" height="2" rx="1" width="6" x="267" y="184"></rect>

            <g id={uid + '-stick-l-group'} transform="translate(208, 196)">
                <circle cx="0" cy="0" fill="#10141e" r="30" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5"></circle>

                <circle cx="0" cy="0" fill="#1b2230" r="23" stroke="rgba(255,255,255,0.05)" strokeWidth="1"></circle>

                <g
                    data-button="10"
                    className={pressed.includes(10) ? 'art-control is-pressed' : 'art-control'}
                    data-axis="0"
                    transform={`translate(${(axes[0] || 0) * 13}, ${(axes[1] || 0) * 13})`}
                >
                    <circle
                        cx="0"
                        cy="0"
                        fill="#222a3a"
                        id={uid + '-stick-l-puck'}
                        r="18"
                        stroke="#4edea3"
                        strokeWidth="1.6"
                        data-button="10"
                        className={pressed.includes(10) ? 'art-control is-pressed' : 'art-control'}
                    ></circle>
                    <circle
                        cx="0"
                        cy="0"
                        fill="none"
                        r="12"
                        stroke="rgba(255,255,255,0.12)"
                        strokeDasharray="2 3"
                    ></circle>
                    <text
                        fill="#64748b"
                        fontFamily="JetBrains Mono"
                        fontSize="7"
                        fontWeight="600"
                        pointerEvents="none"
                        textAnchor="middle"
                        x="3"
                        y="-0.5"
                    >
                        {'L3'}
                    </text>
                </g>
            </g>

            <g id={uid + '-stick-r-group'} transform="translate(332, 196)">
                <circle cx="0" cy="0" fill="#10141e" r="30" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5"></circle>

                <circle cx="0" cy="0" fill="#1b2230" r="23" stroke="rgba(255,255,255,0.05)" strokeWidth="1"></circle>

                <g
                    data-button="11"
                    className={pressed.includes(11) ? 'art-control is-pressed' : 'art-control'}
                    data-axis="2"
                    transform={`translate(${(axes[2] || 0) * 13}, ${(axes[3] || 0) * 13})`}
                >
                    <circle
                        cx="0"
                        cy="0"
                        fill="#222a3a"
                        id={uid + '-stick-r-puck'}
                        r="18"
                        stroke="rgba(255,255,255,0.15)"
                        strokeWidth="1.4"
                        data-button="11"
                        className={pressed.includes(11) ? 'art-control is-pressed' : 'art-control'}
                    ></circle>
                    <circle
                        cx="0"
                        cy="0"
                        fill="none"
                        r="12"
                        stroke="rgba(255,255,255,0.12)"
                        strokeDasharray="2 3"
                    ></circle>
                    <text
                        fill="#64748b"
                        fontFamily="JetBrains Mono"
                        fontSize="7"
                        fontWeight="600"
                        pointerEvents="none"
                        textAnchor="middle"
                        x="0"
                        y="2.5"
                    >
                        {'R3'}
                    </text>
                </g>
            </g>

            <ellipse cx="270" cy="205" fill="#0a0d14" rx="2.5" ry="2"></ellipse>
        </g>
    );
}
