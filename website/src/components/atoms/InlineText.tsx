import { referenceLink } from '../../utils/reference-link';

export function InlineText({ text, source }: { text: string; source?: string }) {
    const tokens = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g);
    return <>{tokens.map((token, index) => {
        if (token.startsWith('`')) return <code key={index}>{token.slice(1, -1)}</code>;
        if (token.startsWith('**')) return <strong key={index}>{token.slice(2, -2)}</strong>;
        const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(token);
        if (link) return <a key={index} href={referenceLink(link[2]!, source)}>{link[1]}</a>;
        return token;
    })}</>;
}
