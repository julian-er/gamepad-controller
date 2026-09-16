import { useEffect, useRef, useState } from 'react';
import type { DemoAppProps } from '../DemoShell';

/** The host owns input; this component owns only the round and semantic buttons. */
export default function TreasureTiles({ session, onReset }: DemoAppProps) {
    const [treasure] = useState(() => Math.floor(Math.random() * 9));
    const [revealed, setRevealed] = useState<number[]>([]);
    const board = useRef<HTMLDivElement>(null);
    const resetRef = useRef(onReset);
    resetRef.current = onReset;
    const won = revealed.includes(treasure);
    useEffect(
        () =>
            session.registerAction((event) => {
                if (event.type === 'back') {
                    event.preventDefault();
                    resetRef.current();
                    session.logEvent('application · new round');
                }
            }),
        [session.registerAction, session.logEvent]
    );
    useEffect(() => {
        if (session.service) {
            session.service.refresh();
            board.current?.querySelector('button')?.focus();
        }
    }, [session.service]);
    return (
        <div className="treasure-game">
            <div className="treasure-heading">
                <span className="mono">EXPEDITION 09</span>
                <strong>
                    {revealed.length} {revealed.length === 1 ? 'reveal' : 'reveals'}
                </strong>
            </div>
            <h2>
                Somewhere here,
                <br />a little treasure.
            </h2>
            <p>Nine islands. One discovery. Trust your next move.</p>
            <div ref={board} className="treasure-board" role="group" aria-label="Treasure board">
                {Array.from({ length: 9 }, (_, index) => (
                    <button
                        key={index}
                        aria-label={
                            'Tile ' +
                            (index + 1) +
                            ', ' +
                            (revealed.includes(index) ? (index === treasure ? 'treasure' : 'empty') : 'hidden')
                        }
                        aria-disabled={won || revealed.includes(index)}
                        className={
                            revealed.includes(index) ? (index === treasure ? 'treasure-found' : 'treasure-empty') : ''
                        }
                        onClick={() => {
                            if (!won && !revealed.includes(index))
                                setRevealed((previous) =>
                                    previous.includes(index) || previous.includes(treasure)
                                        ? previous
                                        : [...previous, index]
                                );
                        }}
                    >
                        <span aria-hidden="true">
                            {revealed.includes(index) ? (index === treasure ? '◆' : '·') : '◇'}
                        </span>
                        <small>{String(index + 1).padStart(2, '0')}</small>
                    </button>
                ))}
            </div>
            <p role="status" className="treasure-result">
                {won
                    ? `Treasure found in ${revealed.length} reveals! Start a new round to explore again.`
                    : 'Find the treasure. Every new tile counts as one reveal.'}
            </p>
            <button className="button secondary" onClick={onReset}>
                New round
            </button>
        </div>
    );
}
