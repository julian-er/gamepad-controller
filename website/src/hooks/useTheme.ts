import { useEffect, useState } from 'react';

export type Theme = 'dark' | 'light';

export function useTheme() {
    const [theme, setTheme] = useState<Theme>(() => {
        try {
            return localStorage.getItem('gc-theme') === 'light' ? 'light' : 'dark';
        } catch {
            return 'dark';
        }
    });
    useEffect(() => {
        document.documentElement.dataset.theme = theme;
        document
            .querySelector('meta[name="theme-color"]')
            ?.setAttribute('content', theme === 'dark' ? '#0a0e17' : '#f8fafc');
        try {
            localStorage.setItem('gc-theme', theme);
        } catch {
            /* Storage is optional. */
        }
    }, [theme]);
    return [theme, setTheme] as const;
}
