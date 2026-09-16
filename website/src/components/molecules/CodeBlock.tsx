import { useEffect, useRef, useState } from 'react';
import { Icon } from '../atoms/Icon';

export function CodeBlock({ code, language = 'TypeScript' }: { code: string; language?: string }) {
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState(false);
    const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    useEffect(() => () => clearTimeout(timer.current), []);
    useEffect(() => { clearTimeout(timer.current); setCopied(false); setError(false); }, [code]);
    async function copy() {
        try { await navigator.clipboard.writeText(code); setCopied(true); setError(false); clearTimeout(timer.current); timer.current = setTimeout(() => setCopied(false), 1800); }
        catch { setError(true); }
    }
    return <div className="code-block"><div className="code-header"><span><span className="code-dot" /> {language}</span><button onClick={copy} aria-label="Copy code"><Icon name="copy" size={14} /><span role="status">{copied ? 'Copied!' : error ? 'Select code to copy' : 'Copy'}</span></button></div><pre tabIndex={0}><code>{code.split('\n').map((line, i) => <span className="code-line" key={i}><span className="line-number" aria-hidden="true">{i + 1}</span><span className={line.trim().startsWith('//') ? 'code-comment' : /import|const |return |export /.test(line) ? 'code-keyword' : ''}>{line || ' '}</span></span>)}</code></pre></div>;
}
