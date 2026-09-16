import { useEffect, useRef, useState } from 'react';
import { Icon } from '../atoms/Icon';

export function InstallCommand() {
    const [status, setStatus] = useState('Copy install command');
    const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    useEffect(() => () => clearTimeout(timer.current), []);
    return <button
        className="install-command"
        onClick={async () => {
            try {
                await navigator.clipboard.writeText('npm install gamepad-controller');
                setStatus('Copied!');
                clearTimeout(timer.current);
                timer.current = setTimeout(() => setStatus('Copy install command'), 1800);
            } catch {
                setStatus('Select and copy: npm install gamepad-controller');
            }
        }}
        aria-label={status}
    >
        <span>$</span><code>npm install gamepad-controller</code><Icon name="copy" size={15} />
        {status !== 'Copy install command' && <span className="copy-feedback" role="status">{status}</span>}
    </button>;
}
