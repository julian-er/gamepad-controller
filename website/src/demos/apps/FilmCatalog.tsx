import { useEffect, useRef, useState } from 'react';
import type { DemoAppProps } from '../DemoShell';
import { DemoDialog } from '../DemoDialog';
const films = [
    {
        title: 'The Quiet Orbit',
        genre: 'Science fiction',
        year: '2041',
        color: 'orbit',
        mark: '◯',
        description: 'A cartographer follows a faint radio melody beyond the last mapped moon.',
    },
    {
        title: 'Summer in Amber',
        genre: 'Drama',
        year: '2028',
        color: 'amber',
        mark: '☀',
        description: 'Two old friends return to the seaside town that kept their unfinished letters.',
    },
    {
        title: 'Wild Current',
        genre: 'Adventure',
        year: '2032',
        color: 'current',
        mark: '≈',
        description: 'A river guide and a reluctant passenger take the long way home.',
    },
    {
        title: 'Paper Cities',
        genre: 'Animation',
        year: '2027',
        color: 'paper',
        mark: '▱',
        description: 'An apprentice architect discovers that every folded street has a story.',
    },
    {
        title: 'After the Rain',
        genre: 'Mystery',
        year: '2030',
        color: 'rain',
        mark: '⋮',
        description: 'The lights of an empty railway station come on at precisely midnight.',
    },
    {
        title: 'Midnight Radio',
        genre: 'Music',
        year: '2029',
        color: 'radio',
        mark: '♫',
        description: 'One late-night broadcast brings a sleeping neighborhood back together.',
    },
];
export default function FilmCatalog({ session }: DemoAppProps) {
    const [selected, setSelected] = useState<number | null>(null);
    const [saved, setSaved] = useState<number[]>([]);
    const [removed, setRemoved] = useState<number[]>([]);
    const [preview, setPreview] = useState(false);
    const catalog = useRef<HTMLDivElement>(null);
    const opener = useRef<HTMLElement | null>(null);
    const close = () => {
        setSelected(null);
        setPreview(false);
    };
    const closeRef = useRef(close);
    closeRef.current = close;
    useEffect(
        () =>
            session.registerAction((event) => {
                if (event.type === 'back') {
                    event.preventDefault();
                    closeRef.current();
                    session.logEvent('application · returned to catalog');
                }
            }),
        [session.registerAction, session.logEvent]
    );
    useEffect(() => {
        session.service?.refresh();
    }, [session.service, removed]);
    const film = selected === null ? null : films[selected]!;
    return (
        <div className="film-catalog">
            <div className="film-masthead">
                <span className="mono">AFTER HOURS / CINEMA CLUB</span>
                <span>{saved.length} saved</span>
            </div>
            <h2>
                A story for
                <br />
                tonight.
            </h2>
            <p>Six imaginary films. Your own front-row seat.</p>
            <div className="film-posters" ref={catalog}>
                {films.map(
                    (entry, index) =>
                        !removed.includes(index) && (
                            <button
                                key={entry.title}
                                className={'film-poster film-' + entry.color}
                                onClick={(event) => {
                                    opener.current = event.currentTarget;
                                    setSelected(index);
                                    setPreview(false);
                                }}
                                aria-label={'Open ' + entry.title}
                            >
                                <span className="film-symbol" aria-hidden="true">
                                    {entry.mark}
                                </span>
                                <span className="film-poster-title">{entry.title}</span>
                                <small>
                                    {entry.genre} · {entry.year}
                                    {saved.includes(index) ? ' · Saved' : ''}
                                </small>
                            </button>
                        )
                )}
            </div>
            {removed.length > 0 && (
                <button className="button secondary" onClick={() => setRemoved([])}>
                    Restore catalog
                </button>
            )}
            {film && selected !== null && (
                <DemoDialog
                    title={film.title}
                    service={session.service}
                    opener={opener.current}
                    fallback={() =>
                        catalog.current?.querySelector('button') ?? document.querySelector('.film-catalog > button')
                    }
                    onClose={close}
                >
                    <p className="film-detail-meta">
                        {film.genre} / {film.year} / Fictional demo
                    </p>
                    <p>{film.description}</p>
                    <div className="film-detail-actions">
                        <button
                            className="button primary"
                            aria-pressed={saved.includes(selected)}
                            onClick={() =>
                                setSaved((previous) =>
                                    previous.includes(selected)
                                        ? previous.filter((index) => index !== selected)
                                        : [...previous, selected]
                                )
                            }
                        >
                            {saved.includes(selected) ? 'Saved to your list' : 'Save to your list'}
                        </button>
                        <button className="button secondary" onClick={() => setPreview(true)}>
                            Play preview
                        </button>
                    </div>
                    {preview && (
                        <div className={'film-preview film-' + film.color} role="status">
                            <span aria-hidden="true">{film.mark}</span>
                            <strong>{film.title}</strong>
                            <p>Local preview: {film.description}</p>
                            <small>No streaming service or network video is used.</small>
                        </div>
                    )}
                    <details className="film-experiment">
                        <summary>Try a focus experiment</summary>
                        <p>
                            Remove this poster, then close details. Focus returns to the next available catalog control.
                        </p>
                        <button
                            className="button secondary"
                            disabled={removed.includes(selected)}
                            onClick={() => setRemoved((previous) => [...previous, selected])}
                        >
                            Remove poster from catalog
                        </button>
                    </details>
                </DemoDialog>
            )}
        </div>
    );
}
