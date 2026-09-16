import { useId } from 'react';
import type { ArtworkProps } from './ArtworkProps';

export function ArcadeArtwork({ pressed, axes }: ArtworkProps) {
    const uid = useId().replace(/:/g, '');
    return (
        <g>
            <rect
                fill="#131722"
                height="240"
                rx="18"
                stroke="rgba(255,255,255,0.08)"
                strokeWidth="2"
                width="500"
                x="20"
                y="20"
            ></rect>

            <rect
                fill="#171c2a"
                height="224"
                rx="12"
                stroke="rgba(255,255,255,0.04)"
                strokeWidth="1.5"
                width="484"
                x="28"
                y="28"
            ></rect>

            <circle cx="38" cy="38" fill="#242b3d" r="3.5" stroke="rgba(255,255,255,0.15)" strokeWidth="1"></circle>

            <circle cx="502" cy="38" fill="#242b3d" r="3.5" stroke="rgba(255,255,255,0.15)" strokeWidth="1"></circle>

            <circle cx="38" cy="242" fill="#242b3d" r="3.5" stroke="rgba(255,255,255,0.15)" strokeWidth="1"></circle>

            <circle cx="502" cy="242" fill="#242b3d" r="3.5" stroke="rgba(255,255,255,0.15)" strokeWidth="1"></circle>

            <rect
                fill="#10141f"
                height="34"
                rx="6"
                stroke="rgba(255,255,255,0.06)"
                strokeWidth="1"
                width="456"
                x="42"
                y="38"
            ></rect>

            <text
                fill="#10b981"
                fontFamily="JetBrains Mono"
                fontSize="9"
                fontWeight="600"
                letterSpacing="1"
                x="56"
                y="59"
            >
                {'USB ARCADE PRO'}
            </text>

            <circle cx="160" cy="55" fill="#10b981" filter="drop-shadow(0 0 3px #10b981)" r="4"></circle>

            <text fill="#94a0b8" fontFamily="JetBrains Mono" fontSize="8" x="170" y="58">
                {'POV / DPAD'}
            </text>

            <g>
                <rect
                    fill="#1f2536"
                    height="14"
                    rx="7"
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth="1"
                    width="26"
                    x="240"
                    y="48"
                ></rect>

                <circle cx="258" cy="55" fill="#10b981" r="5"></circle>

                <text fill="#64748b" fontFamily="JetBrains Mono" fontSize="7" x="240" y="44">
                    {'TURBO'}
                </text>
            </g>

            <g data-button="8" className={pressed.includes(8) ? 'art-control is-pressed' : 'art-control'}>
                <rect
                    fill="#23293a"
                    height="14"
                    rx="3"
                    stroke="rgba(255,255,255,0.12)"
                    strokeWidth="1"
                    width="34"
                    x="310"
                    y="48"
                ></rect>

                <text
                    fill="#e2e6f0"
                    fontFamily="JetBrains Mono"
                    fontSize="8"
                    fontWeight="600"
                    textAnchor="middle"
                    x="327"
                    y="58"
                >
                    {'SELECT'}
                </text>
            </g>

            <g>
                <rect
                    fill="#23293a"
                    height="14"
                    rx="3"
                    stroke="rgba(255,255,255,0.12)"
                    strokeWidth="1"
                    width="30"
                    x="354"
                    y="48"
                ></rect>

                <text
                    fill="#94a0b8"
                    fontFamily="JetBrains Mono"
                    fontSize="8"
                    fontWeight="600"
                    textAnchor="middle"
                    x="369"
                    y="58"
                >
                    {'MODE'}
                </text>
            </g>

            <g data-button="9" className={pressed.includes(9) ? 'art-control is-pressed' : 'art-control'}>
                <rect
                    fill="#23293a"
                    height="14"
                    rx="3"
                    stroke="rgba(255,255,255,0.12)"
                    strokeWidth="1"
                    width="34"
                    x="394"
                    y="48"
                ></rect>

                <text
                    fill="#10b981"
                    fontFamily="JetBrains Mono"
                    fontSize="8"
                    fontWeight="600"
                    textAnchor="middle"
                    x="411"
                    y="58"
                >
                    {'START'}
                </text>
            </g>

            <g>
                <rect
                    fill="#23293a"
                    height="14"
                    rx="3"
                    stroke="rgba(255,255,255,0.12)"
                    strokeWidth="1"
                    width="34"
                    x="438"
                    y="48"
                ></rect>

                <text
                    fill="#94a0b8"
                    fontFamily="JetBrains Mono"
                    fontSize="8"
                    fontWeight="600"
                    textAnchor="middle"
                    x="455"
                    y="58"
                >
                    {'CLEAR'}
                </text>
            </g>

            <g transform="translate(130, 160)">
                <polygon
                    fill="#10141f"
                    points="0,-64 45,-45 64,0 45,45 0,64 -45,45 -64,0 -45,-45"
                    stroke="#252d40"
                    strokeWidth="2"
                ></polygon>

                <line
                    stroke="rgba(16,185,129,0.3)"
                    strokeDasharray="2 2"
                    strokeWidth="1.5"
                    x1="0"
                    x2="0"
                    y1="-28"
                    y2="-52"
                ></line>

                <polygon
                    fill="#10b981"
                    opacity="0.6"
                    points="0,-56 -4,-48 4,-48"
                    data-button="12"
                    className={pressed.includes(12) ? 'art-control is-pressed' : 'art-control'}
                ></polygon>

                <text fill="#64748b" fontFamily="JetBrains Mono" fontSize="8" textAnchor="middle" x="0" y="-68">
                    {'UP'}
                </text>

                <line
                    stroke="rgba(16,185,129,0.3)"
                    strokeDasharray="2 2"
                    strokeWidth="1.5"
                    x1="0"
                    x2="0"
                    y1="28"
                    y2="52"
                ></line>

                <polygon
                    fill="#10b981"
                    opacity="0.6"
                    points="0,56 -4,48 4,48"
                    data-button="13"
                    className={pressed.includes(13) ? 'art-control is-pressed' : 'art-control'}
                ></polygon>

                <text fill="#64748b" fontFamily="JetBrains Mono" fontSize="8" textAnchor="middle" x="0" y="74">
                    {'DOWN'}
                </text>

                <line
                    stroke="rgba(16,185,129,0.3)"
                    strokeDasharray="2 2"
                    strokeWidth="1.5"
                    x1="-28"
                    x2="-52"
                    y1="0"
                    y2="0"
                ></line>

                <polygon
                    fill="#10b981"
                    opacity="0.6"
                    points="-56,0 -48,-4 -48,4"
                    data-button="14"
                    className={pressed.includes(14) ? 'art-control is-pressed' : 'art-control'}
                ></polygon>

                <text fill="#64748b" fontFamily="JetBrains Mono" fontSize="8" textAnchor="middle" x="-72" y="3">
                    {'LEFT'}
                </text>

                <line
                    stroke="rgba(16,185,129,0.3)"
                    strokeDasharray="2 2"
                    strokeWidth="1.5"
                    x1="28"
                    x2="52"
                    y1="0"
                    y2="0"
                ></line>

                <polygon
                    fill="#10b981"
                    opacity="0.6"
                    points="56,0 48,-4 48,4"
                    data-button="15"
                    className={pressed.includes(15) ? 'art-control is-pressed' : 'art-control'}
                ></polygon>

                <text fill="#64748b" fontFamily="JetBrains Mono" fontSize="8" textAnchor="middle" x="72" y="3">
                    {'RIGHT'}
                </text>

                <circle cx="36" cy="-36" fill="#38bdf8" opacity="0.7" r="2"></circle>

                <circle cx="36" cy="36" fill="#38bdf8" opacity="0.7" r="2"></circle>

                <circle cx="-36" cy="36" fill="#38bdf8" opacity="0.7" r="2"></circle>

                <circle cx="-36" cy="-36" fill="#38bdf8" opacity="0.7" r="2"></circle>

                <circle cx="0" cy="0" fill="#0d111a" r="34" stroke="#1f2638" strokeWidth="2"></circle>

                <rect fill="#94a3b8" height="24" rx="2" width="8" x="-4" y="-22"></rect>

                <g data-axis="0" transform={`translate(${(axes[0] || 0) * 13}, ${(axes[1] || 0) * 13})`}>
                    <circle cx="-1" cy="-18" fill="#059669" r="22" stroke="#34d399" strokeWidth="2"></circle>

                    <ellipse
                        cx="-8"
                        cy="-26"
                        fill="#a7f3d0"
                        opacity="0.7"
                        rx="7"
                        ry="4"
                        transform="rotate(-25 -8 -26)"
                    ></ellipse>

                    <circle cx="-1" cy="-18" fill="none" r="16" stroke="rgba(255,255,255,0.2)" strokeWidth="1"></circle>
                </g>
            </g>

            <g transform="translate(245, 95)">
                <text fill="#64748b" fontFamily="JetBrains Mono" fontSize="8" letterSpacing="1" x="75" y="10">
                    {'CURVED JAPANESE VIEWIX LAYOUT'}
                </text>

                <g data-button="0" className={pressed.includes(0) ? 'art-control is-pressed' : 'art-control'}>
                    <circle cx="45" cy="38" fill="#141a27" r="20" stroke="#2a3349" strokeWidth="2.5"></circle>

                    <circle cx="45" cy="38" fill="#102f23" r="15" stroke="#10b981" strokeWidth="2"></circle>

                    <text
                        fill="#10b981"
                        fontFamily="JetBrains Mono"
                        fontSize="10"
                        fontWeight="700"
                        textAnchor="middle"
                        x="45"
                        y="34"
                    >
                        {'1'}
                    </text>

                    <text fill="#94a0b8" fontFamily="JetBrains Mono" fontSize="6" textAnchor="middle" x="45" y="44">
                        {'LP'}
                    </text>
                </g>

                <g data-button="1" className={pressed.includes(1) ? 'art-control is-pressed' : 'art-control'}>
                    <circle cx="95" cy="32" fill="#141a27" r="20" stroke="#2a3349" strokeWidth="2.5"></circle>

                    <circle cx="95" cy="32" fill="#102a3a" r="15" stroke="#38bdf8" strokeWidth="2"></circle>

                    <text
                        fill="#38bdf8"
                        fontFamily="JetBrains Mono"
                        fontSize="10"
                        fontWeight="700"
                        textAnchor="middle"
                        x="95"
                        y="28"
                    >
                        {'2'}
                    </text>

                    <text fill="#94a0b8" fontFamily="JetBrains Mono" fontSize="6" textAnchor="middle" x="95" y="38">
                        {'MP'}
                    </text>
                </g>

                <g data-button="2" className={pressed.includes(2) ? 'art-control is-pressed' : 'art-control'}>
                    <circle cx="145" cy="36" fill="#141a27" r="20" stroke="#2a3349" strokeWidth="2.5"></circle>

                    <circle cx="145" cy="36" fill="#2d2238" r="15" stroke="#a78bfa" strokeWidth="2"></circle>

                    <text
                        fill="#a78bfa"
                        fontFamily="JetBrains Mono"
                        fontSize="10"
                        fontWeight="700"
                        textAnchor="middle"
                        x="145"
                        y="32"
                    >
                        {'3'}
                    </text>

                    <text fill="#94a0b8" fontFamily="JetBrains Mono" fontSize="6" textAnchor="middle" x="145" y="42">
                        {'HP'}
                    </text>
                </g>

                <g data-button="6" className={pressed.includes(6) ? 'art-control is-pressed' : 'art-control'}>
                    <circle cx="195" cy="46" fill="#141a27" r="17" stroke="#232b3d" strokeWidth="2"></circle>

                    <circle cx="195" cy="46" fill="#1c2233" r="12" stroke="#64748b" strokeWidth="1.5"></circle>

                    <text
                        fill="#94a0b8"
                        fontFamily="JetBrains Mono"
                        fontSize="8"
                        fontWeight="600"
                        textAnchor="middle"
                        x="195"
                        y="49"
                    >
                        {'7'}
                    </text>
                </g>

                <g data-button="3" className={pressed.includes(3) ? 'art-control is-pressed' : 'art-control'}>
                    <circle cx="45" cy="88" fill="#141a27" r="20" stroke="#2a3349" strokeWidth="2.5"></circle>

                    <circle cx="45" cy="88" fill="#102f23" r="15" stroke="#10b981" strokeWidth="2"></circle>

                    <text
                        fill="#10b981"
                        fontFamily="JetBrains Mono"
                        fontSize="10"
                        fontWeight="700"
                        textAnchor="middle"
                        x="45"
                        y="84"
                    >
                        {'4'}
                    </text>

                    <text fill="#94a0b8" fontFamily="JetBrains Mono" fontSize="6" textAnchor="middle" x="45" y="94">
                        {'LK'}
                    </text>
                </g>

                <g data-button="4" className={pressed.includes(4) ? 'art-control is-pressed' : 'art-control'}>
                    <circle cx="95" cy="82" fill="#141a27" r="20" stroke="#2a3349" strokeWidth="2.5"></circle>

                    <circle cx="95" cy="82" fill="#321e25" r="15" stroke="#f87171" strokeWidth="2"></circle>

                    <text
                        fill="#f87171"
                        fontFamily="JetBrains Mono"
                        fontSize="10"
                        fontWeight="700"
                        textAnchor="middle"
                        x="95"
                        y="78"
                    >
                        {'5'}
                    </text>

                    <text fill="#94a0b8" fontFamily="JetBrains Mono" fontSize="6" textAnchor="middle" x="95" y="88">
                        {'MK'}
                    </text>
                </g>

                <g data-button="5" className={pressed.includes(5) ? 'art-control is-pressed' : 'art-control'}>
                    <circle cx="145" cy="86" fill="#141a27" r="20" stroke="#2a3349" strokeWidth="2.5"></circle>

                    <circle cx="145" cy="86" fill="#332a18" r="15" stroke="#fbbf24" strokeWidth="2"></circle>

                    <text
                        fill="#fbbf24"
                        fontFamily="JetBrains Mono"
                        fontSize="10"
                        fontWeight="700"
                        textAnchor="middle"
                        x="145"
                        y="82"
                    >
                        {'6'}
                    </text>

                    <text fill="#94a0b8" fontFamily="JetBrains Mono" fontSize="6" textAnchor="middle" x="145" y="92">
                        {'HK'}
                    </text>
                </g>

                <g data-button="7" className={pressed.includes(7) ? 'art-control is-pressed' : 'art-control'}>
                    <circle cx="195" cy="96" fill="#141a27" r="17" stroke="#232b3d" strokeWidth="2"></circle>

                    <circle cx="195" cy="96" fill="#1c2233" r="12" stroke="#64748b" strokeWidth="1.5"></circle>

                    <text
                        fill="#94a0b8"
                        fontFamily="JetBrains Mono"
                        fontSize="8"
                        fontWeight="600"
                        textAnchor="middle"
                        x="195"
                        y="99"
                    >
                        {'8'}
                    </text>
                </g>
            </g>
        </g>
    );
}
