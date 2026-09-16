import { docs } from '../../content/registry';
import type { Doc } from '../../content/types';

export function DocPagination({ doc }: { doc: Doc }) {
    const index = docs.indexOf(doc);
    return <nav className="pagination" aria-label="Documentation pages">
        {index > 0 ? (
            <a href={'#/docs/' + docs[index - 1]!.id}><span>← Previous</span><strong>{docs[index - 1]!.title}</strong></a>
        ) : (
            <a href="#/"><span>← Back</span><strong>Home</strong></a>
        )}
        {index < docs.length - 1 && (
            <a href={'#/docs/' + docs[index + 1]!.id}><span>Next →</span><strong>{docs[index + 1]!.title}</strong></a>
        )}
    </nav>;
}
