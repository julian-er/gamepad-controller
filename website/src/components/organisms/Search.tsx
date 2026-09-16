import { useEffect, useRef, useState } from 'react';
import { docs } from '../../content/registry';
import { Icon } from '../atoms/Icon';

export function Search({ onClose }: { onClose: () => void }) {
    const [query, setQuery] = useState('');
    const dialog = useRef<HTMLDialogElement>(null);
    const results = docs.filter((doc) =>
        (
            doc.title + ' ' + doc.summary + ' ' + doc.sections.map((section) =>
                section.title + ' ' + section.body?.join(' ') + ' ' + section.code + ' ' +
                (section.examples ? Object.values(section.examples).map((example) => example.code + ' ' + example.note).join(' ') : '') +
                ' ' + section.rows?.flat().join(' ')
            ).join(' ')
        ).toLowerCase().includes(query.toLowerCase().trim())
    );
    useEffect(() => {
        const previous = document.activeElement as HTMLElement | null;
        dialog.current?.showModal();
        return () => previous?.focus();
    }, []);
    return <dialog
        className="search-dialog"
        ref={dialog}
        onCancel={(event) => { event.preventDefault(); onClose(); }}
        onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}
        aria-labelledby="search-heading"
    >
        <div className="search-dialog-inner">
            <div className="search-input-row">
                <Icon name="search" />
                <label className="sr-only" id="search-heading" htmlFor="doc-search">Search documentation</label>
                <input id="doc-search" autoFocus placeholder="Search documentation..." value={query} onChange={(event) => setQuery(event.target.value)} />
                <button className="icon-button" aria-label="Close search" onClick={onClose}><Icon name="close" size={18} /></button>
            </div>
            <p className="search-count" role="status">
                {query ? results.length + ' results for “' + query + '”' : 'EXPLORE THE DOCUMENTATION'}
            </p>
            <div className="search-results">
                {results.length ? results.map((doc) => (
                    <a href={'#/docs/' + doc.id} key={doc.id} onClick={onClose}>
                        <Icon name="book" size={19} />
                        <div><strong>{doc.title}</strong><p>{doc.summary}</p></div>
                        <Icon name="arrow" size={16} />
                    </a>
                )) : <p className="search-empty">No pages found. Try “focus”, “React”, or “events”.</p>}
            </div>
            <div className="search-footer">
                <span>Search runs locally.</span>
                <span><kbd>Tab</kbd> to navigate · <kbd>Esc</kbd> to close</span>
            </div>
        </div>
    </dialog>;
}
