import { useCallback, useEffect, useRef, useState } from 'react';
import type { DemoAppProps } from '../DemoShell';
import { DemoDialog } from '../DemoDialog';
const durations = [
    { seconds: 10, label: '10-second demo' },
    { seconds: 300, label: '5 minutes' },
    { seconds: 1500, label: '25 minutes' },
];
export default function FocusTimer({ session }: DemoAppProps) {
    const [duration, setDuration] = useState(1500);
    const [remaining, setRemaining] = useState(1500);
    const [deadline, setDeadline] = useState<number | null>(null);
    const [settings, setSettings] = useState(false);
    const settingsButton = useRef<HTMLButtonElement>(null);
    const primary = useRef<HTMLButtonElement>(null);
    const deadlineRef = useRef(deadline);
    deadlineRef.current = deadline;
    const pause = useCallback(() => {
        if (deadlineRef.current !== null)
            setRemaining(Math.max(0, Math.ceil((deadlineRef.current - Date.now()) / 1000)));
        deadlineRef.current = null;
        setDeadline(null);
    }, []);
    useEffect(() => {
        if (deadline === null) return;
        const tick = () => {
            const left = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
            setRemaining(left);
            if (left === 0) setDeadline(null);
        };
        tick();
        const interval = window.setInterval(tick, 100);
        return () => window.clearInterval(interval);
    }, [deadline]);
    const wasRunning = useRef(session.running);
    useEffect(() => {
        if (wasRunning.current && !session.running) pause();
        wasRunning.current = session.running;
    }, [session.running, pause]);
    useEffect(() => {
        const hidden = () => {
            if (document.hidden) pause();
        };
        window.addEventListener('blur', pause);
        document.addEventListener('visibilitychange', hidden);
        return () => {
            window.removeEventListener('blur', pause);
            document.removeEventListener('visibilitychange', hidden);
        };
    }, [pause]);
    useEffect(
        () =>
            session.registerAction((event) => {
                if (event.type === 'back') {
                    event.preventDefault();
                    setSettings(false);
                    session.logEvent('application · timer settings closed');
                }
            }),
        [session.registerAction, session.logEvent]
    );
    const choose = (seconds: number) => {
        pause();
        setDuration(seconds);
        setRemaining(seconds);
    };
    const reset = () => {
        pause();
        setRemaining(duration);
    };
    const start = () => {
        const seconds = remaining || duration;
        setRemaining(seconds);
        setDeadline(Date.now() + seconds * 1000);
    };
    return (
        <div className="focus-timer">
            <div className="timer-eyebrow">
                <span className="mono">A LITTLE SPACE TO FOCUS</span>
                <span>LOCAL TIMER</span>
            </div>
            <h2>
                One thing
                <br />
                at a time.
            </h2>
            <div className="timer-presets" role="group" aria-label="Focus duration">
                {durations.map((item) => (
                    <button
                        key={item.seconds}
                        aria-pressed={duration === item.seconds}
                        onClick={() => choose(item.seconds)}
                    >
                        {item.label}
                    </button>
                ))}
            </div>
            <div className="timer-clock" aria-label="Time remaining">
                {String(Math.floor(remaining / 60)).padStart(2, '0')}
                <span>:</span>
                {String(remaining % 60).padStart(2, '0')}
            </div>
            <p role="status">
                {remaining === 0
                    ? 'Session complete. Take a breath.'
                    : deadline !== null
                      ? 'Focus session in progress.'
                      : 'Ready when you are.'}
            </p>
            <div className="timer-actions">
                <button ref={primary} className="button primary" onClick={deadline !== null ? pause : start}>
                    {deadline !== null ? 'Pause timer' : 'Start timer'}
                </button>
                <button className="button secondary" onClick={reset}>
                    Reset timer
                </button>
                <button ref={settingsButton} className="button secondary" onClick={() => setSettings(true)}>
                    Timer settings
                </button>
            </div>
            <p className="timer-caption">
                The timer pauses when you stop controller input or leave this window. No account, sound, or
                notifications.
            </p>
            {settings && (
                <DemoDialog
                    title="Set your pace"
                    service={session.service}
                    opener={settingsButton.current}
                    fallback={() => primary.current}
                    onClose={() => setSettings(false)}
                >
                    <p>Choose a session length. Changing it pauses and resets the timer.</p>
                    <div className="timer-settings-options">
                        {durations.map((item) => (
                            <button
                                key={item.seconds}
                                className="button secondary"
                                aria-pressed={duration === item.seconds}
                                onClick={() => choose(item.seconds)}
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>
                </DemoDialog>
            )}
        </div>
    );
}
