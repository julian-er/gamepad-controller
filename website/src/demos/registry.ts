import type { ComponentType } from 'react';
import type { DemoAppProps } from './DemoShell';
export type DemoId =
    | 'treasure-tiles'
    | 'film-catalog'
    | 'portfolio'
    | 'focus-timer'
    | 'recipe-browser'
    | 'product-explorer'
    | 'plan-chooser'
    | 'quiz-night';
export type DemoDefinition = {
    id: DemoId;
    title: string;
    category: string;
    challenge: string;
    capability: string;
    anchor: string;
    mode: 'spatial' | 'horizontal';
    back?: boolean;
    scroll?: boolean;
    load?: () => Promise<{ default: ComponentType<DemoAppProps> }>;
    source?: () => Promise<string>;
};
export const demos: DemoDefinition[] = [
    {
        id: 'treasure-tiles',
        title: 'Treasure Tiles',
        category: 'Mini games',
        challenge: 'Find the hidden treasure in as few reveals as possible.',
        capability: 'Spatial movement · one selection per press · safe Back',
        anchor: 'start-here-treasure-tiles',
        mode: 'spatial',
        back: true,
        load: () => import('./apps/TreasureTiles'),
        source: () => import('./apps/TreasureTiles.tsx?raw').then((m) => m.default),
    },
    {
        id: 'film-catalog',
        load: () => import('./apps/FilmCatalog'),
        source: () => import('./apps/FilmCatalog.tsx?raw').then((m) => m.default),
        title: 'Living-room film catalog',
        category: 'Websites',
        challenge: 'Find a film, save it and watch a local preview.',
        capability: 'Scoped details · focus restoration',
        anchor: 'living-room-film-catalog',
        mode: 'spatial',
        back: true,
    },
    {
        id: 'portfolio',
        load: () => import('./apps/Portfolio'),
        source: () => import('./apps/Portfolio.tsx?raw').then((m) => m.default),
        title: 'Playable portfolio',
        category: 'Websites',
        challenge: 'Explore a project and return from its case study.',
        capability: 'Semantic links · responsive navigation',
        anchor: 'playable-portfolio',
        mode: 'spatial',
        back: true,
    },
    {
        id: 'focus-timer',
        load: () => import('./apps/FocusTimer'),
        source: () => import('./apps/FocusTimer.tsx?raw').then((m) => m.default),
        title: 'Focus timer',
        category: 'Small apps',
        challenge: 'Choose a duration and start a focused session.',
        capability: 'Horizontal navigation · scoped settings',
        anchor: 'focus-timer',
        mode: 'horizontal',
        back: true,
    },
    {
        id: 'recipe-browser',
        load: () => import('./apps/RecipeBrowser'),
        source: () => import('./apps/RecipeBrowser.tsx?raw').then((m) => m.default),
        title: 'Recipe browser',
        category: 'Small apps',
        challenge: 'Filter a recipe collection and browse cooking steps.',
        capability: 'Dynamic targets · right-stick scrolling',
        anchor: 'recipe-browser',
        mode: 'spatial',
        back: true,
        scroll: true,
    },
    {
        id: 'product-explorer',
        load: () => import('./apps/ProductExplorer'),
        source: () => import('./apps/ProductExplorer.tsx?raw').then((m) => m.default),
        title: 'Product explorer',
        category: 'Landing pages',
        challenge: 'Compare features and open a product preview.',
        capability: 'Spatial layouts · scoped preview',
        anchor: 'product-explorer',
        mode: 'spatial',
        back: true,
    },
    {
        id: 'plan-chooser',
        load: () => import('./apps/PlanChooser'),
        source: () => import('./apps/PlanChooser.tsx?raw').then((m) => m.default),
        title: 'Plan chooser',
        category: 'Landing pages',
        challenge: 'Compare plans and inspect a pricing explanation.',
        capability: 'Spatial navigation · local destinations',
        anchor: 'plan-chooser',
        mode: 'spatial',
        back: true,
    },
    {
        id: 'quiz-night',
        load: () => import('./apps/QuizNight'),
        source: () => import('./apps/QuizNight.tsx?raw').then((m) => m.default),
        title: 'Quiz night',
        category: 'Mini games',
        challenge: 'Answer three questions and check your final score.',
        capability: 'Ordered targets · focus after rendering',
        anchor: 'quiz-night',
        mode: 'spatial',
        back: true,
    },
];
