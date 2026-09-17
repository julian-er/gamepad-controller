import { getButtonName } from 'gamepad-ui-engine';
import { ArcadeArtwork } from './ArcadeArtwork';
import { PlayStationArtwork } from './PlayStationArtwork';
import { XboxArtwork } from './XboxArtwork';

export type Variant = 'xbox' | 'playstation' | 'unknown';

export function Controller({ variant, pressed, axes }: { variant: Variant; pressed: number[]; axes: number[] }) {
    const Artwork = variant === 'xbox' ? XboxArtwork : variant === 'playstation' ? PlayStationArtwork : ArcadeArtwork;
    return (
        <svg
            className={'controller stitch-controller controller-' + variant}
            viewBox={variant === 'unknown' ? '0 0 540 280' : '0 0 540 330'}
            role="img"
            aria-label={
                (variant === 'unknown' ? 'Generic arcade' : variant) +
                ' controller preview. Pressed: ' +
                (pressed.map((i) => getButtonName(i, variant)).join(', ') || 'none')
            }
        >
            <Artwork pressed={pressed} axes={axes} />
        </svg>
    );
}
