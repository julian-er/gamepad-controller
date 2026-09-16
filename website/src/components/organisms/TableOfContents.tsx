import type { Doc } from '../../content/types';
import { Icon } from '../atoms/Icon';

export function TableOfContents({ doc }: { doc: Doc }) {
    return <aside className="table-of-contents">
        <h2>ON THIS PAGE</h2>
        {(doc.id === 'introduction' || doc.id === 'playground') && (
            <button onClick={() => document.getElementById('interactive-preview')?.scrollIntoView()}>Interactive preview</button>
        )}
        {doc.sections.filter((section) => section.title).map((section) => (
            <button key={section.id} onClick={() => document.getElementById(section.id)?.scrollIntoView()}>{section.title}</button>
        ))}
        <div className="toc-note">
            <Icon name="pad" size={23} />
            <strong>Made to be explored.</strong>
            <p>Try the library with a controller, or use simulated input.</p>
            <a href="#/docs/playground">Open playground →</a>
        </div>
    </aside>;
}
