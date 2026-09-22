import type { DemoDefinition } from './registry';
export type DemoSourceFile = { path: string; language: string; load: () => Promise<string> };
const modules = import.meta.glob<string>(
    [
        './apps/*.tsx',
        './apps/*.scss',
        './DemoShell.tsx',
        './DemoDialog.tsx',
        './useDemoSession.ts',
        './controller-preview.ts',
        './registry.ts',
        '../simulation.ts',
        '../components/molecules/Controller/Controller.tsx',
        '../components/molecules/Controller/ArtworkProps.ts',
        '../components/molecules/Controller/XboxArtwork.tsx',
        '../components/molecules/Controller/PlayStationArtwork.tsx',
        '../components/molecules/Controller/ArcadeArtwork.tsx',
        '../styles/*.scss',
        '../../package.json',
        '../../tsconfig.json',
        '../../vite.config.ts',
        '../../README.md',
    ],
    { query: '?raw', import: 'default' }
);
const appNames = {
    'treasure-tiles': 'TreasureTiles',
    'film-catalog': 'FilmCatalog',
    portfolio: 'Portfolio',
    'focus-timer': 'FocusTimer',
    'recipe-browser': 'RecipeBrowser',
    'product-explorer': 'ProductExplorer',
    'plan-chooser': 'PlanChooser',
    'quiz-night': 'QuizNight',
};
export function demoSourceFiles(demo: DemoDefinition): DemoSourceFile[] {
    const paths = [
        './apps/' + appNames[demo.id] + '.tsx',
        './DemoShell.tsx',
        './useDemoSession.ts',
        './controller-preview.ts',
        '../simulation.ts',
        '../components/molecules/Controller/Controller.tsx',
        '../components/molecules/Controller/ArtworkProps.ts',
        '../components/molecules/Controller/XboxArtwork.tsx',
        '../components/molecules/Controller/PlayStationArtwork.tsx',
        '../components/molecules/Controller/ArcadeArtwork.tsx',
        './registry.ts',
        '../styles/site.scss',
        '../styles/_demos.scss',
        '../styles/_tokens.scss',
        '../styles/_tokens_light.scss',
        '../styles/_fonts.scss',
        '../styles/_base.scss',
        '../styles/_header.scss',
        '../styles/_landing.scss',
        '../styles/_playground.scss',
        '../styles/_landing-footer.scss',
        '../styles/_docs.scss',
        '../styles/_responsive.scss',
        '../styles/_framework.scss',
        '../../package.json',
        '../../tsconfig.json',
        '../../vite.config.ts',
        '../../README.md',
    ];
    if (['film-catalog', 'focus-timer', 'product-explorer', 'plan-chooser'].includes(demo.id))
        paths.splice(2, 0, './DemoDialog.tsx');
    if (['portfolio', 'product-explorer', 'plan-chooser'].includes(demo.id))
        paths.splice(1, 0, './apps/landing-demos.scss');
    if (demo.id === 'recipe-browser') paths.splice(1, 0, './apps/recipe-browser.scss');
    return paths.map((path) => ({
        path: path.startsWith('../../')
            ? 'website/' + path.slice(6)
            : path.startsWith('../')
              ? 'website/src/' + path.slice(3)
              : 'website/src/demos/' + path.slice(2),
        language: path.endsWith('.tsx')
            ? 'React / TSX'
            : path.endsWith('.scss')
              ? 'SCSS'
              : path.endsWith('.json')
                ? 'JSON'
                : path.endsWith('.md')
                  ? 'Markdown'
                  : 'TypeScript',
        load: modules[path]!,
    }));
}
