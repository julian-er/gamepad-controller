import { useEffect, useRef, useState } from 'react';
import type { DemoAppProps } from '../DemoShell';
import './landing-demos.scss';

const projects = [
    {
        id: 'atlas',
        name: 'Atlas',
        type: 'Wayfinding / 2026',
        mark: '↗',
        title: 'A quieter way to find your way.',
        challenge: 'A busy botanical garden needed directions that visitors could understand at a glance.',
        solution:
            'We built a family of bold landmarks, short walking routes and a high-contrast map. Every path starts with a clear next step.',
        result: 'The finished concept connects the gate, greenhouse and river walk through one consistent visual language.',
    },
    {
        id: 'common',
        name: 'Common Ground',
        type: 'Identity / 2025',
        mark: '◎',
        title: 'Room for everyone at the table.',
        challenge: 'A neighborhood kitchen wanted an identity that felt welcoming without losing its character.',
        solution:
            'A generous wordmark, seasonal colors and hand-drawn ingredients give menus and posters a shared voice.',
        result: 'The concept includes a weekly menu, takeaway packaging and a community noticeboard.',
    },
    {
        id: 'field',
        name: 'Field Notes',
        type: 'Digital product / 2026',
        mark: '▤',
        title: 'Small observations. Lasting stories.',
        challenge: 'Nature journals are easy to start and surprisingly hard to keep organized.',
        solution:
            'We designed a calm reading view, collections by place and an accessible entry flow that works with a keyboard or controller.',
        result: 'The prototype makes capturing a moment and finding it later equally simple.',
    },
];
function initialProject() {
    const id = location.hash.split('#')[2]?.replace('portfolio-', '');
    return projects.find((project) => project.id === id)?.id ?? null;
}
export default function Portfolio({ session }: DemoAppProps) {
    const [selected, setSelected] = useState<string | null>(initialProject);
    const root = useRef<HTMLDivElement>(null);
    const returnTarget = useRef<string | null>(selected);
    const pendingFocus = useRef(false);
    const navigate = (id: string | null) => {
        if (id) returnTarget.current = id;
        pendingFocus.current = true;
        setSelected(id);
        session.logEvent('application · portfolio ' + (id ?? 'project index'));
    };
    const latest = useRef({ selected, navigate });
    latest.current = { selected, navigate };
    useEffect(
        () =>
            session.registerAction((event) => {
                if (event.type === 'back') {
                    event.preventDefault();
                    if (latest.current.selected) latest.current.navigate(null);
                    else session.logEvent('application · portfolio Back: already at project index');
                } else if (
                    event.type === 'select' &&
                    event.target instanceof HTMLAnchorElement &&
                    root.current?.contains(event.target)
                ) {
                    event.preventDefault();
                    event.target.click();
                }
            }),
        [session.registerAction, session.logEvent]
    );
    useEffect(() => {
        session.service?.refresh();
        if (!pendingFocus.current) return;
        pendingFocus.current = false;
        const selector = selected ? '.landing-portfolio-return' : `[data-project="${returnTarget.current}"]`;
        root.current?.querySelector<HTMLElement>(selector)?.focus();
    }, [selected, session.service]);
    const project = projects.find((entry) => entry.id === selected);
    return (
        <div className="landing-portfolio" ref={root}>
            <header className="landing-portfolio-masthead">
                <strong>ELI MORROW</strong>
                <span>
                    Independent designer
                    <br />
                    Based everywhere
                </span>
            </header>
            <div hidden={!!project} id="portfolio-index">
                <p className="landing-eyebrow">Selected work / 01—03</p>
                <h2>
                    Useful things.
                    <br />
                    <em>Made with feeling.</em>
                </h2>
                <p>Identity, spaces and digital experiences for a more thoughtful everyday.</p>
                <nav className="landing-portfolio-projects" aria-label="Portfolio projects">
                    {projects.map((entry, index) => (
                        <a
                            key={entry.id}
                            data-project={entry.id}
                            href={`#/docs/demo-portfolio#portfolio-${entry.id}`}
                            onClick={(event) => {
                                event.preventDefault();
                                navigate(entry.id);
                            }}
                        >
                            <span className={'landing-project-art landing-project-art-' + index} aria-hidden="true">
                                {entry.mark}
                            </span>
                            <span className="landing-project-caption">
                                <strong>{entry.name}</strong>
                                <span>↗</span>
                                <small>{entry.type}</small>
                            </span>
                        </a>
                    ))}
                </nav>
            </div>
            {project && (
                <article id={'portfolio-' + project.id} className="landing-portfolio-study">
                    <a
                        className="landing-portfolio-return"
                        href="#/docs/demo-portfolio#portfolio-index"
                        onClick={(event) => {
                            event.preventDefault();
                            navigate(null);
                        }}
                    >
                        ← All projects
                    </a>
                    <p className="landing-eyebrow">{project.name} / Case study</p>
                    <h2>{project.title}</h2>
                    <div className="landing-study-mark" aria-hidden="true">
                        {project.mark}
                    </div>
                    <h3>The question</h3>
                    <p>{project.challenge}</p>
                    <h3>The approach</h3>
                    <p>{project.solution}</p>
                    <h3>The outcome</h3>
                    <p>{project.result}</p>
                </article>
            )}
            <footer>Fictional portfolio · Three small ideas, fully explored.</footer>
        </div>
    );
}
