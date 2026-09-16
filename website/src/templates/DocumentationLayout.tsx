import type { ReactNode } from 'react';
import { Sidebar } from '../components/organisms/Sidebar';

type DocumentationLayoutProps = { children: ReactNode; current: string; menuOpen: boolean; repository: string; onMenuClose: () => void };

export function DocumentationLayout({ children, current, menuOpen, repository, onMenuClose }: DocumentationLayoutProps) {
    return <>
        <aside className={'docs-sidebar ' + (menuOpen ? 'is-open' : '')} id="mobile-navigation">
            <Sidebar current={current} />
            <div className="sidebar-foot">
                <span className="status-dot on" /> Open source. Controller ready.
                <a href={repository}>Contribute on GitHub ↗</a>
            </div>
        </aside>
        {children}
        {menuOpen && <button className="drawer-backdrop" aria-label="Close navigation" onClick={onMenuClose} />}
    </>;
}
