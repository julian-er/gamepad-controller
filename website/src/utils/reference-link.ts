import { referenceSources } from '../content/reference-sources';

export function referenceLink(href: string, source = 'docs/README.md'): string {
    if (/^https?:\/\//i.test(href)) return href;
    if (href.startsWith('#/')) return href;
    const url = new URL(href, 'https://local.invalid/' + source);
    if (url.origin !== 'https://local.invalid') return '#/docs/introduction';
    const file = decodeURIComponent(url.pathname.slice(1));
    const entry = referenceSources.find(([path]) => path === file);
    return entry
        ? '#/docs/' + entry[1] + url.hash
        : 'https://github.com/julian-er/gamepad-controller/blob/main/' + file + url.hash;
}
