import { useEffect, useRef, useState } from 'react';
import type { DemoAppProps } from '../DemoShell';
import { DemoDialog } from '../DemoDialog';
import './landing-demos.scss';

const plans = [
    {
        id: 'solo',
        name: 'Solo',
        monthly: 8,
        annual: 6,
        tagline: 'A place for your next idea.',
        features: ['3 active projects', 'Personal idea library', 'Community templates'],
        detail: 'A small personal workspace for collecting ideas and taking your first projects from sketch to finish.',
    },
    {
        id: 'studio',
        name: 'Studio',
        monthly: 18,
        annual: 14,
        tagline: 'Good work, together.',
        features: ['Unlimited projects', 'Up to 5 collaborators', 'Shared templates'],
        detail: 'A shared home for a small creative team, with room to organize ongoing work and reuse your favorite starting points.',
    },
    {
        id: 'collective',
        name: 'Collective',
        monthly: 32,
        annual: 25,
        tagline: 'Room for the whole crew.',
        features: ['Unlimited projects', 'Up to 15 collaborators', 'Team collections'],
        detail: 'A larger workspace for connected teams, with collections that keep multiple projects easy to find.',
    },
];
function initialPlan() {
    const id = location.hash.split('#')[2]?.replace('plan-', '');
    return plans.find((plan) => plan.id === id)?.id ?? null;
}
export default function PlanChooser({ session }: DemoAppProps) {
    const [annual, setAnnual] = useState(false);
    const [selection, setSelection] = useState<string | null>(initialPlan);
    const [details, setDetails] = useState<string | null>(null);
    const root = useRef<HTMLDivElement>(null);
    const opener = useRef<HTMLElement | null>(null);
    const lastPlan = useRef<string | null>(selection);
    const pendingFocus = useRef(false);
    const navigate = (id: string | null) => {
        if (id) lastPlan.current = id;
        pendingFocus.current = true;
        setSelection(id);
        session.logEvent('application · plan ' + (id ?? 'comparison'));
    };
    const latest = useRef({ selection, details, navigate });
    latest.current = { selection, details, navigate };
    useEffect(
        () =>
            session.registerAction((event) => {
                if (event.type === 'back') {
                    event.preventDefault();
                    if (latest.current.details) {
                        setDetails(null);
                        session.logEvent('application · closed plan details');
                    } else if (latest.current.selection) latest.current.navigate(null);
                    else session.logEvent('application · plan Back: already at comparison');
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
        root.current
            ?.querySelector<HTMLElement>(selection ? '.landing-plan-return' : `[data-plan="${lastPlan.current}"]`)
            ?.focus();
    }, [selection, session.service]);
    const selected = plans.find((plan) => plan.id === selection);
    const detail = plans.find((plan) => plan.id === details);
    return (
        <div className="landing-plans" ref={root}>
            <header>
                <strong>form &amp; flow</strong>
                <span>Space for your next chapter</span>
            </header>
            <div hidden={!!selected} id="plan-comparison">
                <p className="landing-eyebrow">Simple plans. Room to grow.</p>
                <h2>
                    Make space
                    <br />
                    for good work.
                </h2>
                <p>Choose the fictional workspace that fits your creative rhythm.</p>
                <div className="landing-plan-billing" aria-label="Billing period">
                    <button aria-pressed={!annual} onClick={() => setAnnual(false)}>
                        Monthly
                    </button>
                    <button aria-pressed={annual} onClick={() => setAnnual(true)}>
                        Annual <small>Save up to 25%</small>
                    </button>
                </div>
                <div className="landing-plan-grid">
                    {plans.map((plan, index) => (
                        <article
                            key={plan.id}
                            className={index === 1 ? 'landing-plan-card landing-plan-featured' : 'landing-plan-card'}
                        >
                            <p className="landing-eyebrow">{index === 1 ? 'A team favorite' : 'Your workspace'}</p>
                            <h3>{plan.name}</h3>
                            <p>{plan.tagline}</p>
                            <p className="landing-plan-price">
                                <strong>${annual ? plan.annual : plan.monthly}</strong>
                                <span>/ month</span>
                            </p>
                            <small>{annual ? `$${plan.annual * 12} billed yearly` : 'Billed monthly'}</small>
                            <ul>
                                {plan.features.map((feature) => (
                                    <li key={feature}>{feature}</li>
                                ))}
                            </ul>
                            <a
                                className="button primary"
                                data-plan={plan.id}
                                href={`#/docs/demo-plan-chooser#plan-${plan.id}`}
                                onClick={(event) => {
                                    event.preventDefault();
                                    navigate(plan.id);
                                }}
                            >
                                Choose {plan.name}
                            </a>
                            <button
                                className="landing-plan-details"
                                onClick={(event) => {
                                    opener.current = event.currentTarget;
                                    setDetails(plan.id);
                                }}
                            >
                                {plan.name} details
                            </button>
                        </article>
                    ))}
                </div>
            </div>
            {selected && (
                <section id={'plan-' + selected.id} className="landing-plan-summary">
                    <span className="landing-plan-check" aria-hidden="true">
                        ✓
                    </span>
                    <p className="landing-eyebrow">Your local selection</p>
                    <h2>{selected.name} looks good on you.</h2>
                    <p>
                        You chose <strong>{selected.name}</strong> at{' '}
                        <strong>${annual ? selected.annual : selected.monthly} per month</strong>,{' '}
                        {annual ? `billed as $${selected.annual * 12} yearly` : 'billed monthly'}.
                    </p>
                    <p>This is a demo summary. No account was created and no payment was taken.</p>
                    <a
                        className="button primary landing-plan-return"
                        href="#/docs/demo-plan-chooser#plan-comparison"
                        onClick={(event) => {
                            event.preventDefault();
                            navigate(null);
                        }}
                    >
                        ← Compare plans
                    </a>
                </section>
            )}
            <footer>Fictional USD prices · Local selection only</footer>
            {detail && (
                <DemoDialog
                    title={detail.name + ' details'}
                    service={session.service}
                    opener={opener.current}
                    fallback={() => root.current?.querySelector('button') ?? null}
                    onClose={() => setDetails(null)}
                >
                    <p>{detail.detail}</p>
                    <ul>
                        {detail.features.map((feature) => (
                            <li key={feature}>{feature}</li>
                        ))}
                    </ul>
                    <p>
                        Monthly: ${detail.monthly}/month. Annual: ${detail.annual * 12}/year (${detail.annual}/month
                        equivalent).
                    </p>
                    <button className="button primary" onClick={() => setDetails(null)}>
                        Return to comparison
                    </button>
                </DemoDialog>
            )}
        </div>
    );
}
