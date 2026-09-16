import { useEffect, useState } from 'react';

export function useRoute() {
    const [route, setRoute] = useState(location.hash.slice(1) || '/');
    useEffect(() => {
        const update = () => {
            setRoute(location.hash.slice(1) || '/');
            window.scrollTo({ top: 0, behavior: 'instant' });
        };
        window.addEventListener('hashchange', update);
        return () => window.removeEventListener('hashchange', update);
    }, []);
    return route;
}
