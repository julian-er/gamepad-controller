import { learning } from './learning';
import type { Doc } from '../content/types';
import { demos } from './registry';
export const demoDocs: Doc[] = [
    {
        id: 'examples',
        group: 'CORE CONCEPTS',
        title: 'Example gallery',
        summary:
            'Explore real interfaces powered by gamepad-controller. Try a challenge, inspect the code, and build your own.',
        interactiveDemo: 'gallery',
        sections: [],
    },
    ...demos
        .filter((demo) => demo.load)
        .map(
            (demo): Doc => ({
                id: 'demo-' + demo.id,
                group: 'PLAYABLE EXAMPLES',
                title: demo.title,
                summary: demo.challenge,
                interactiveDemo: demo.id,
                sections: [
                    {
                        id: 'capabilities',
                        title: 'What you will learn',
                        body: [demo.capability, learning[demo.id].explanation, learning[demo.id].experiment],
                    },
                ],
            })
        ),
];
