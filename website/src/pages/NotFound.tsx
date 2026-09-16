import { Badge } from '../components/atoms/Badge';
import { Icon } from '../components/atoms/Icon';

export function NotFound() {
    return <main id="main-content" className="docs-content" tabIndex={-1}>
        <Badge>404</Badge>
        <h1>That page is off the map.</h1>
        <p>Choose a guide from the sidebar to get back on track.</p>
        <a className="button primary" href="#/docs/introduction">Documentation home <Icon name="arrow" /></a>
    </main>;
}
