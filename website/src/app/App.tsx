import { useEffect, useState } from 'react';
import { Search } from '../components/organisms/Search';
import { SiteHeader } from '../components/organisms/SiteHeader';
import { docs } from '../content/registry';
import { useRoute } from '../hooks/useRoute';
import { useTheme } from '../hooks/useTheme';
import { Documentation } from '../pages/Documentation';
import { Landing } from '../pages/Landing';
import { NotFound } from '../pages/NotFound';
import { DocumentationLayout } from '../templates/DocumentationLayout';

const repository = 'https://github.com/julian-er/gamepad-controller';

export function App() {
    const route = useRoute();
    const isDocs = route.startsWith('/docs');
    const slug = (route.split('/')[2] || 'introduction').split('#')[0]!;
    const doc = docs.find((item) => item.id === slug);
    const [theme, setTheme] = useTheme();
    const [menuOpen, setMenuOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    useEffect(() => {
        setMenuOpen(false);
        document.getElementById('main-content')?.focus({ preventScroll: true });
        const anchor = route.split('#')[1];
        if (anchor) {
            document.getElementById(anchor)?.scrollIntoView();
            if (anchor === 'playground')
                document.querySelector<HTMLButtonElement>('[data-home-playground-start]')?.focus({ preventScroll: true });
        }
        document.title = isDocs
            ? (doc?.title ?? 'Page not found') + ' — gamepad-ui-engine docs'
            : 'gamepad-ui-engine — Console-grade navigation for the web';
    }, [route, doc, isDocs]);
    useEffect(() => {
        const handler = (event: KeyboardEvent) => {
            if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
                event.preventDefault();
                setSearchOpen(true);
            }
            if (event.key === 'Escape') setMenuOpen(false);
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, []);
    return (
        <div className={isDocs ? 'docs-app' : 'landing-app'}>
            <a
                className="skip-link"
                href="#main-content"
                onClick={(event) => {
                    event.preventDefault();
                    document.getElementById('main-content')?.focus();
                }}
            >
                Skip to content
            </a>
            <SiteHeader
                isDocs={isDocs}
                docTitle={doc?.title}
                theme={theme}
                menuOpen={menuOpen}
                repository={repository}
                onSearchOpen={() => setSearchOpen(true)}
                onThemeToggle={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                onMenuToggle={() => setMenuOpen(!menuOpen)}
            />
            {isDocs ? (
                <DocumentationLayout
                    current={slug}
                    menuOpen={menuOpen}
                    repository={repository}
                    onMenuClose={() => setMenuOpen(false)}
                >
                    {doc ? (
                        <Documentation key={doc.id} doc={doc} suspended={searchOpen || menuOpen} />
                    ) : (
                        <NotFound />
                    )}
                </DocumentationLayout>
            ) : (
                <>
                    {menuOpen && (
                        <nav className="mobile-landing-nav" id="mobile-navigation">
                            <a href="#/docs/introduction">Documentation</a>
                            <a href="#/docs/playground">Playground</a>
                            <a href="#/docs/react">React integration</a>
                        </nav>
                    )}
                    <Landing repository={repository} suspended={searchOpen || menuOpen} />
                </>
            )}
            {searchOpen && <Search onClose={() => setSearchOpen(false)} />}
        </div>
    );
}
