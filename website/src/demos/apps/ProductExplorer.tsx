import { useEffect, useRef, useState } from 'react';
import type { DemoAppProps } from '../DemoShell';
import { DemoDialog } from '../DemoDialog';
import './landing-demos.scss';

const features = [
    {
        name: 'Deep focus',
        icon: '◉',
        label: 'FOCUS MODE',
        title: 'Space to hear yourself think.',
        copy: 'A warm pool of light and a quiet 25-minute rhythm make room for one thing at a time.',
        detail: 'Turn the outer dial to set a focus block. The light slowly fades toward the end of your session, so you can finish a thought without a sudden alarm.',
    },
    {
        name: 'Gentle mornings',
        icon: '☀',
        label: 'SUNRISE MODE',
        title: 'A softer start to the day.',
        copy: 'Amber light rises slowly, bringing a little sunrise to your desk.',
        detail: 'The sunrise concept moves from a dim amber glow to warm daylight over 15 minutes. A single tap holds the brightness wherever it feels right.',
    },
    {
        name: 'Evening calm',
        icon: '☾',
        label: 'EVENING MODE',
        title: 'Let the day settle.',
        copy: 'A low, soft glow makes the last chapter your favorite part of the day.',
        detail: 'Evening mode lowers the lamp to a soft reading glow. A 30-minute wind-down gradually dims the light; the dial always gives you direct control.',
    },
];
export default function ProductExplorer({ session }: DemoAppProps) {
    const [feature, setFeature] = useState(0);
    const [details, setDetails] = useState(false);
    const opener = useRef<HTMLElement | null>(null);
    const hero = useRef<HTMLButtonElement>(null);
    const detailsOpen = useRef(details);
    detailsOpen.current = details;
    useEffect(
        () =>
            session.registerAction((event) => {
                if (event.type === 'back') {
                    event.preventDefault();
                    setDetails(false);
                    session.logEvent(
                        detailsOpen.current
                            ? 'application · closed product details'
                            : 'application · product Back: already at preview'
                    );
                }
            }),
        [session.registerAction, session.logEvent]
    );
    const current = features[feature]!;
    return (
        <div className="landing-product">
            <header>
                <strong>
                    luma<span> / </span>
                </strong>
                <span>A little light. A little space.</span>
            </header>
            <div className="landing-product-hero">
                <div>
                    <p className="landing-eyebrow">Meet your daily ritual</p>
                    <h2>
                        Less noise.
                        <br />
                        More presence.
                    </h2>
                    <p>A fictional desk companion that brings a softer rhythm to your day.</p>
                    <button
                        ref={hero}
                        className="button primary"
                        onClick={(event) => {
                            opener.current = event.currentTarget;
                            setDetails(true);
                        }}
                    >
                        Explore Luma
                    </button>
                </div>
                <div
                    className={'landing-lamp landing-lamp-' + feature}
                    role="img"
                    aria-label={'Luma lamp showing ' + current.name.toLowerCase()}
                >
                    <div className="landing-lamp-glow" />
                    <div className="landing-lamp-shade" />
                    <div className="landing-lamp-stem" />
                    <div className="landing-lamp-foot" />
                    <span>{current.icon}</span>
                </div>
            </div>
            <div className="landing-product-features" aria-label="Light modes">
                {features.map((entry, index) => (
                    <button key={entry.name} aria-pressed={index === feature} onClick={() => setFeature(index)}>
                        <span aria-hidden="true">{entry.icon}</span>
                        {entry.name}
                    </button>
                ))}
            </div>
            <section className="landing-product-preview" aria-live="polite">
                <p className="landing-eyebrow">{current.label}</p>
                <h3>{current.title}</h3>
                <p>{current.copy}</p>
            </section>
            {details && (
                <DemoDialog
                    title={'Luma / ' + current.name}
                    service={session.service}
                    opener={opener.current}
                    fallback={() => hero.current}
                    onClose={() => setDetails(false)}
                >
                    <p>{current.detail}</p>
                    <dl className="landing-product-specs">
                        <div>
                            <dt>Material</dt>
                            <dd>Recycled aluminum concept</dd>
                        </div>
                        <div>
                            <dt>Control</dt>
                            <dd>One tactile dial</dd>
                        </div>
                        <div>
                            <dt>Connection</dt>
                            <dd>No account, no cloud</dd>
                        </div>
                    </dl>
                    <p>This is a local product concept. No device connection or purchase is required.</p>
                    <button className="button primary" onClick={() => setDetails(false)}>
                        Back to the light
                    </button>
                </DemoDialog>
            )}
        </div>
    );
}
