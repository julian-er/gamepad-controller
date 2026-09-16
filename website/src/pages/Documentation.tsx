import { Badge } from '../components/atoms/Badge';
import { Icon } from '../components/atoms/Icon';
import { DocPagination } from '../components/molecules/DocPagination';
import { DocumentationSection } from '../components/organisms/DocumentationSection';
import { TableOfContents } from '../components/organisms/TableOfContents';
import type { Doc } from '../content/types';
import { DemoGallery } from '../demos/DemoGallery';
import { DemoPage } from '../demos/DemoPage';
import { Playground } from '../Playground';

const repository = 'https://github.com/julian-er/gamepad-controller';

export function Documentation({ doc, suspended = false }: { doc: Doc; suspended?: boolean }) {
    return <>
        <main className="docs-content" id="main-content" tabIndex={-1}>
            <div className="doc-eyebrow"><span>{doc.group}</span><span className="mono">VERSION 1.0.0</span></div>
            <h1>{doc.title}<span className="mint">.</span></h1>
            <p className="doc-lede">{doc.summary}</p>
            <div className="doc-meta">
                <Badge>First release · unreleased</Badge><Badge>TypeScript first</Badge><Badge>Zero runtime dependencies</Badge><Badge>MIT license</Badge>
            </div>
            {(doc.id === 'introduction' || doc.id === 'playground') && <section id="interactive-preview" className="doc-section">
                <Playground /><p><a href="#/docs/examples">Explore eight complete mini apps →</a></p>
            </section>}
            {doc.id === 'project-cookbook' && <p><a className="button primary" href="#/docs/examples">Try all eight projects in the example gallery →</a></p>}
            {doc.interactiveDemo === 'gallery' ? <DemoGallery /> : doc.interactiveDemo ? <DemoPage key={doc.interactiveDemo} id={doc.interactiveDemo} suspended={suspended} /> : null}
            {doc.sections.map((section) => <DocumentationSection key={section.id} doc={doc} section={section} />)}
            <div className="doc-source">
                <Icon name="github" size={16} /><span>Matches the current library source.</span>
                <a href={repository + '/blob/main/' + (doc.source ?? ({ angular: 'docs/USAGE_ANGULAR.md', react: 'docs/USAGE_REACT.md', vanilla: 'docs/USAGE_VANILLA.md' } as Record<string, string>)[doc.id] ?? 'docs/API.md')}>View source reference ↗</a>
            </div>
            <DocPagination doc={doc} />
        </main>
        <TableOfContents doc={doc} />
    </>;
}
