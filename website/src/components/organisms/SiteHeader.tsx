import type { Theme } from '../../hooks/useTheme';
import { Icon } from '../atoms/Icon';
import { Brand } from '../molecules/Brand';

type SiteHeaderProps = {
    isDocs: boolean;
    docTitle?: string;
    theme: Theme;
    menuOpen: boolean;
    repository: string;
    onSearchOpen: () => void;
    onThemeToggle: () => void;
    onMenuToggle: () => void;
};

export function SiteHeader({ isDocs, docTitle, theme, menuOpen, repository, onSearchOpen, onThemeToggle, onMenuToggle }: SiteHeaderProps) {
    return (
        <header className="site-header">
            <div className="header-inner">
                <Brand />
                <span className="version mono">v1.0.0</span>
                {isDocs ? (
                    <div className="header-breadcrumb">
                        <span>Documentation</span><span>/</span><strong>{docTitle ?? 'Not found'}</strong>
                    </div>
                ) : (
                    <nav className="desktop-nav" aria-label="Main navigation">
                        <a href="#/docs/introduction">Documentation</a>
                        <a href="#/docs/playground">Playground</a>
                        <a href="#/docs/installation">Integrations</a>
                    </nav>
                )}
                <div className="header-actions">
                    <button className="search-trigger" aria-label="Search documentation" onClick={onSearchOpen}>
                        <Icon name="search" size={16} /><span>Search docs...</span><kbd>Ctrl K</kbd>
                    </button>
                    <button className="icon-button" aria-label={'Switch to ' + (theme === 'dark' ? 'light' : 'dark') + ' theme'} onClick={onThemeToggle}>
                        <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={18} />
                    </button>
                    <a className="icon-button github-link" href={repository} aria-label="GitHub repository"><Icon name="github" size={19} /></a>
                    <button className="icon-button mobile-menu" aria-expanded={menuOpen} aria-controls="mobile-navigation" aria-label="Toggle navigation" onClick={onMenuToggle}>
                        <Icon name={menuOpen ? 'close' : 'menu'} />
                    </button>
                </div>
            </div>
        </header>
    );
}
