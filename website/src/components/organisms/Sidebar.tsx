import { docs } from '../../content/registry';
import { Icon } from '../atoms/Icon';

export function Sidebar({ current }: { current: string }) {
    const groups = [...new Set(docs.map((doc) => doc.group))];
    return <nav aria-label="Documentation navigation">{groups.map((group) => (
        <div className="nav-group" key={group}>
            <h2>{group}</h2>
            {docs.filter((doc) => doc.group === group).map((doc) => (
                <a key={doc.id} href={'#/docs/' + doc.id} aria-current={current === doc.id ? 'page' : undefined}>
                    <Icon name={doc.id === 'playground' ? 'pad' : doc.id === 'api' ? 'code' : doc.id === 'navigation' ? 'grid' : 'book'} size={16} />
                    <span>{doc.id === 'introduction' ? 'Introduction' : doc.title}</span>
                    {doc.id === 'playground' && <span className="nav-live">LIVE</span>}
                </a>
            ))}
        </div>
    ))}</nav>;
}
