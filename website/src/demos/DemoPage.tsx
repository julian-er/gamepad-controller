import { useEffect, useMemo, useState, type ComponentType } from 'react';
import { CodeBlock } from '../components';
import { DemoShell, type DemoAppProps } from './DemoShell';
import { demos, type DemoId } from './registry';
import { learning } from './learning';
import { demoSourceFiles } from './source-files';
export function DemoPage({ id, suspended = false }: { id: DemoId; suspended?: boolean }) {
    const demo = demos.find((entry) => entry.id === id)!;
    const files = useMemo(() => demoSourceFiles(demo), [demo]);
    const [app, setApp] = useState<ComponentType<DemoAppProps> | null>(null);
    const [sourcePath, setSourcePath] = useState<string | null>(null);
    const [source, setSource] = useState('');
    const [sourceError, setSourceError] = useState('');
    const [sourceLoading, setSourceLoading] = useState(false);
    const [sourceAttempt, setSourceAttempt] = useState(0);
    const [error, setError] = useState('');
    const [attempt, setAttempt] = useState(0);
    useEffect(() => {
        let active = true;
        setApp(null);
        setError('');
        demo.load?.()
            .then((module) => {
                if (active) setApp(() => module.default);
            })
            .catch(() => {
                if (active) setError('The example could not load. Try again.');
            });
        return () => {
            active = false;
        };
    }, [demo, attempt]);
    useEffect(() => {
        if (!sourcePath) return;
        let active = true;
        setSource('');
        setSourceError('');
        setSourceLoading(true);
        const file = files.find((entry) => entry.path === sourcePath)!;
        file.load()
            .then((text) => {
                if (active) setSource(text);
            })
            .catch(() => {
                if (active)
                    setSourceError(
                        'Source could not load. The input session has stopped; retry or return to the gallery.'
                    );
            })
            .finally(() => {
                if (active) setSourceLoading(false);
            });
        return () => {
            active = false;
        };
    }, [sourcePath, sourceAttempt, files]);
    const selectedFile = files.find((file) => file.path === sourcePath);
    return (
        <div className="demo-page">
            <a href="#/docs/examples">← Example gallery</a>
            {error ? (
                <p role="alert">
                    {error} <button onClick={() => setAttempt((value) => value + 1)}>Retry example</button>
                </p>
            ) : app ? (
                <DemoShell demo={demo} app={app} suspended={suspended || Boolean(sourceError)} />
            ) : (
                <p role="status">Loading example…</p>
            )}
            <section className="doc-section">
                <h2>How it works</h2>
                <p>{learning[id].explanation}</p>
                <p>
                    <a href={'#/docs/project-cookbook#' + demo.anchor}>Read the cookbook recipe →</a>
                    {learning[id].topics.map((topic) => (
                        <span key={topic.id}>
                            {' '}
                            · <a href={'#/docs/' + topic.id}>{topic.label} →</a>
                        </span>
                    ))}
                </p>
            </section>
            <section className="doc-section">
                <h2>Explore the source</h2>
                <p>
                    These are the actual React/TSX app and support files from this checkout, loaded when requested. The
                    component runs inside the documentation host; it is not a standalone copy-and-run application.
                </p>
                <p>
                    Run the website checkout with React, React DOM and gamepad-controller using the{' '}
                    <a href="#/docs/building">local library build guide</a> and website README below. Vite provides raw
                    source loading, Sass compiles the styles, and the host supplies theme tokens and self-hosted fonts
                    from website/public/fonts. The registry references the other gallery apps; use the existing checkout
                    when running the host. The{' '}
                    <a href="#/docs/project-cookbook#start-here-treasure-tiles">vanilla Treasure Tiles recipe</a> is the
                    standalone alternative.
                </p>
                {sourcePath === null ? (
                    <button className="button secondary" onClick={() => setSourcePath(files[0]!.path)}>
                        View source
                    </button>
                ) : (
                    <div>
                        <label>
                            Source file{' '}
                            <select
                                aria-label="Source file"
                                value={sourcePath}
                                onChange={(event) => setSourcePath(event.target.value)}
                                style={{ maxWidth: '100%' }}
                            >
                                {files.map((file) => (
                                    <option key={file.path} value={file.path}>
                                        {file.path}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <p style={{ overflowWrap: 'anywhere' }}>
                            <code>{sourcePath}</code>
                        </p>
                        {sourceLoading && <p role="status">Loading source…</p>}
                        {sourceError && (
                            <p role="alert">
                                {sourceError}{' '}
                                <button onClick={() => setSourceAttempt((value) => value + 1)}>Retry source</button>{' '}
                                <a href="#/docs/examples">Back to gallery</a>
                            </p>
                        )}
                        {source && <CodeBlock code={source} language={selectedFile!.language} />}
                    </div>
                )}
            </section>
        </div>
    );
}
