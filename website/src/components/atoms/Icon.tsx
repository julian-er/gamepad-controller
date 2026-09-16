import type { ReactNode } from 'react';

export function Icon({ name = 'pad', size = 20 }: { name?: string; size?: number }) {
    const paths: Record<string, ReactNode> = {
        pad: <><path d="M7 7h10c3 0 5 10 3 12-2 1-4-4-5-4H9c-1 0-3 5-5 4C2 17 4 7 7 7Z" /><path d="M7 9v4m-2-2h4m6 0h.01m3 2h.01" /></>,
        arrow: <><path d="M4 12h16m-6-6 6 6-6 6" /></>,
        code: <><path d="m8 6-6 6 6 6m8-12 6 6-6 6m-3-15-2 18" /></>,
        copy: <><rect x="8" y="8" width="12" height="13" rx="2" /><path d="M16 8V3H3v13h5" /></>,
        search: <><circle cx="10" cy="10" r="6" /><path d="m15 15 6 6" /></>,
        sun: <><circle cx="12" cy="12" r="4" /><path d="M12 1v2m0 18v2M1 12h2m18 0h2M4 4l2 2m12 12 2 2M4 20l2-2M18 6l2-2" /></>,
        moon: <path d="M20 15A9 9 0 0 1 9 4a9 9 0 1 0 11 11Z" />,
        menu: <path d="M4 6h16M4 12h16M4 18h16" />,
        close: <path d="m5 5 14 14M5 19 19 5" />,
        grid: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
        bolt: <path d="m13 2-9 12h7l-1 8 10-13h-8Z" />,
        screen: <><rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8m-4-4v4" /></>,
        layers: <><path d="m12 2 10 6-10 6L2 8Zm-10 10 10 6 10-6M2 17l10 6 10-6" /></>,
        book: <><path d="M12 5C8 2 4 3 2 4v15c4-2 7-1 10 1 3-2 6-3 10-1V4c-3-1-6-2-10 1Zm0 0v15" /></>,
        github: <><path d="M9 20c-5 2-5-3-7-3m14 5v-4c0-1-.3-2-1-2 4-.5 7-2 7-6 0-2-.5-3-2-4 0-1 0-3-1-4-2 0-3 1-4 2a14 14 0 0 0-6 0C7 3 6 2 4 2 3 3 3 5 4 6 2.5 7 2 8 2 10c0 4 3 5.5 7 6-1 0-1 2-1 2v4" /></>,
    };
    return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name] ?? paths.code}</svg>;
}
