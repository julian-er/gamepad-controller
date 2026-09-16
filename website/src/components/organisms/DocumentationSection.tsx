import type { Doc, Section } from '../../content/types';
import { sharedExamples } from '../../examples';
import { InlineText } from '../atoms/InlineText';
import { CodeBlock } from '../molecules/CodeBlock';
import { FrameworkCode } from './FrameworkCode';

export function DocumentationSection({ doc, section }: { doc: Doc; section: Section }) {
    return <section id={section.id} className="doc-section">
        {section.title && <h2>
            <InlineText text={section.title} source={doc.source} />
            <a
                className="heading-anchor"
                href={'#/docs/' + doc.id + '#' + section.id}
                aria-label={'Scroll to ' + section.title}
                onClick={(event) => { event.preventDefault(); document.getElementById(section.id)?.scrollIntoView({ behavior: 'auto' }); }}
            >#</a>
        </h2>}
        {section.body?.map((paragraph) => <p className="reference-prose" key={paragraph}><InlineText text={paragraph} source={doc.source} /></p>)}
        {section.examples ? (
            <FrameworkCode examples={section.examples} initial={doc.id === 'angular' ? 'angular' : doc.id === 'react' ? 'react' : 'vanilla'} />
        ) : (
            section.code && (!section.language || /^(TypeScript|ts|tsx|js)$/i.test(section.language)
                ? <FrameworkCode examples={sharedExamples(section.code)} />
                : <CodeBlock code={section.code} language={section.language} />)
        )}
        {section.rows && <div className="table-scroll"><table>
            <thead><tr>{section.headers?.map((header) => <th key={header} scope="col"><InlineText text={header} source={doc.source} /></th>)}</tr></thead>
            <tbody>{section.rows.map((row, rowIndex) => <tr key={rowIndex}>{row.map((cell, cellIndex) => <td key={cellIndex}><InlineText text={cell} source={doc.source} /></td>)}</tr>)}</tbody>
        </table></div>}
    </section>;
}
