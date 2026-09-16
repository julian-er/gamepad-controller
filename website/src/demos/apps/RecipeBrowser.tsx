import { useEffect, useRef, useState } from 'react';
import type { DemoAppProps } from '../DemoShell';
import './recipe-browser.scss';
const recipes = [
    {
        id: 'garden-toast',
        name: 'Garden toast',
        category: 'Quick',
        time: '10 min',
        symbol: '◒',
        color: 'garden',
        ingredients: 'Bread · avocado · tomatoes · lemon',
        description: 'A bright, crunchy lunch with whatever looks best at the market.',
    },
    {
        id: 'citrus-couscous',
        name: 'Citrus couscous',
        category: 'Quick',
        time: '15 min',
        symbol: '◉',
        color: 'citrus',
        ingredients: 'Couscous · cucumber · orange · herbs',
        description: 'Fluffy grains, crisp vegetables and a little sunshine in a bowl.',
    },
    {
        id: 'golden-lentils',
        name: 'Golden lentils',
        category: 'Comfort',
        time: '35 min',
        symbol: '∴',
        color: 'golden',
        ingredients: 'Lentils · carrots · onion · cumin',
        description: 'A slow afternoon staple made for a deep bowl and a quiet moment.',
    },
    {
        id: 'roasted-bowl',
        name: 'Roasted vegetable bowl',
        category: 'Comfort',
        time: '40 min',
        symbol: '◓',
        color: 'roasted',
        ingredients: 'Seasonal vegetables · rice · tahini · herbs',
        description: 'Warm roasted vegetables meet a soft bed of grains and a creamy dressing.',
    },
];
const steps = [
    {
        title: 'Make some space',
        text: 'Read the ingredient list and gather your tools. Set a cutting board on a stable surface, rinse the produce, and arrange a small bowl for scraps. A clear counter makes the rest of the recipe easier to follow.',
        tip: 'Gather everything before you begin.',
    },
    {
        title: 'Prepare the ingredients',
        text: 'Cut the vegetables into similar-sized pieces and measure your grains or lentils. Keep delicate herbs separate until the end. For this local demo, the ingredient list is a starting point: adapt the preparation to the dish you choose.',
        tip: 'Similar sizes help ingredients cook evenly.',
    },
    {
        title: 'Build the base',
        text: 'Toast the bread, prepare the couscous or rice according to its package, or simmer the lentils until tender. Use a pan with enough room for the ingredients. Pause here to check the texture before moving on.',
        tip: 'Look for the texture you enjoy.',
    },
    {
        title: 'Bring it together',
        text: 'Arrange the prepared ingredients, add the dressing or seasoning a little at a time, and taste as you go. Keep something crisp for contrast. Turn off the heat before adding delicate herbs or citrus.',
        tip: 'Small adjustments can make a big difference.',
    },
    {
        title: 'Serve and enjoy',
        text: 'Spoon the finished dish into your favorite bowl or onto a plate. Add the reserved herbs and a final squeeze of citrus if you like. This is the final step: mark it complete and return to the collection to explore another idea.',
        tip: 'Make it your own.',
    },
];
export default function RecipeBrowser({ session }: DemoAppProps) {
    const [category, setCategory] = useState('All');
    const [selected, setSelected] = useState<string | null>(null);
    const [done, setDone] = useState<number[]>([]);
    const root = useRef<HTMLDivElement>(null);
    const lastTargets = useRef<Element[]>([]);
    const lastService = useRef<DemoAppProps['session']['service']>(null);
    const requestedFocus = useRef<string | null>(null);
    const selectedRef = useRef(selected);
    selectedRef.current = selected;
    const close = () => {
        requestedFocus.current = selectedRef.current;
        setSelected(null);
        setDone([]);
    };
    const closeRef = useRef(close);
    closeRef.current = close;
    useEffect(
        () =>
            session.registerAction((event) => {
                if (event.type === 'back') {
                    event.preventDefault();
                    closeRef.current();
                    session.logEvent('application · returned to recipes');
                }
            }),
        [session.registerAction, session.logEvent]
    );
    useEffect(() => {
        const node = root.current;
        if (!node) return;
        const targets = [...node.querySelectorAll<HTMLButtonElement>('button')];
        const active = document.activeElement;
        const requested = requestedFocus.current;
        const target = selected
            ? node.querySelector<HTMLButtonElement>('.recipe-back')
            : requested
              ? (targets.find((button) => button.dataset.recipeId === requested) ?? targets[0])
              : targets.find((button) => button === active);
        if (session.service) {
            if (
                session.service !== lastService.current ||
                targets.length !== lastTargets.current.length ||
                targets.some((button, index) => button !== lastTargets.current[index])
            )
                session.service.setElements(targets);
            session.service.refresh();
            if (target) session.service.navigateToIndex(targets.indexOf(target));
        } else if (target && (selected || requested)) target.focus();
        lastTargets.current = targets;
        lastService.current = session.service;
        requestedFocus.current = null;
    }, [session.service, category, selected]);
    const recipe = recipes.find((entry) => entry.id === selected);
    const visible = recipes.filter((entry) => category === 'All' || entry.category === category);
    return (
        <div className="recipe-browser" ref={root}>
            <div className="recipe-masthead">
                <span className="mono">THE EVERYDAY TABLE</span>
                <span>FRESH IDEAS, SIMPLE INGREDIENTS</span>
            </div>
            <h2>
                Good things
                <br />
                start here.
            </h2>
            <div className="recipe-filters" role="group" aria-label="Recipe categories">
                {['All', 'Quick', 'Comfort', 'Desserts'].map((name) => (
                    <button
                        key={name}
                        aria-pressed={category === name}
                        onClick={() => {
                            setCategory(name);
                            setSelected(null);
                            setDone([]);
                        }}
                    >
                        {name}
                    </button>
                ))}
            </div>
            {recipe ? (
                <article className="recipe-detail">
                    <button className="button secondary recipe-back" onClick={close}>
                        Back to recipes
                    </button>
                    <div className={'recipe-hero recipe-' + recipe.color}>
                        <span aria-hidden="true">{recipe.symbol}</span>
                        <p>
                            {recipe.time} / {recipe.category}
                        </p>
                        <h3>{recipe.name}</h3>
                    </div>
                    <p>{recipe.description}</p>
                    <section className="recipe-ingredients">
                        <h4>On the counter</h4>
                        <p>{recipe.ingredients}</p>
                    </section>
                    <p className="recipe-scroll-note">
                        Use the right stick or the demo scroll controls to read these steps. The documentation page
                        stays in place.
                    </p>
                    <ol className="recipe-steps">
                        {steps.map((step, index) => (
                            <li key={step.title} className={done.includes(index) ? 'recipe-step-done' : ''}>
                                <span className="mono">STEP {index + 1}</span>
                                <h4>{step.title}</h4>
                                <p>{step.text}</p>
                                <p className="recipe-tip">{step.tip}</p>
                                <button
                                    aria-pressed={done.includes(index)}
                                    onClick={() =>
                                        setDone((previous) =>
                                            previous.includes(index)
                                                ? previous.filter((value) => value !== index)
                                                : [...previous, index]
                                        )
                                    }
                                >
                                    {done.includes(index)
                                        ? 'Step complete ✓'
                                        : 'Mark step ' + (index + 1) + ' complete'}
                                </button>
                            </li>
                        ))}
                    </ol>
                    <p role="status">{done.length} of 5 steps complete.</p>
                    <button className="button secondary" onClick={close}>
                        Back to collection
                    </button>
                </article>
            ) : (
                <>
                    <p role="status" className="recipe-count">
                        {visible.length
                            ? visible.length + ' recipes to explore'
                            : 'No desserts yet. Choose another category to keep exploring.'}
                    </p>
                    <div className="recipe-cards">
                        {visible.map((entry) => (
                            <button
                                key={entry.id}
                                data-recipe-id={entry.id}
                                className="recipe-card"
                                onClick={() => {
                                    setSelected(entry.id);
                                    setDone([]);
                                }}
                            >
                                <span className={'recipe-thumbnail recipe-' + entry.color} aria-hidden="true">
                                    {entry.symbol}
                                </span>
                                <span className="recipe-card-copy">
                                    <small>
                                        {entry.time} · {entry.category}
                                    </small>
                                    <strong>{entry.name}</strong>
                                    <span>{entry.description}</span>
                                </span>
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
