import type { Doc } from './types';
import { loadReferenceSource } from './reference-loader';
import { referenceSources } from './reference-sources';
import { parseReference } from '../utils/markdown';

export const referenceDocs: Doc[] = referenceSources.map(([source, id, title]) => ({
    id,
    title,
    source,
    group: source === 'docs/CONFIGURATION.md' ? 'CORE CONCEPTS' : source.startsWith('skills/') || source === 'docs/AGENT_SKILLS.md' ? 'AI SKILLS & RECIPES' : 'SOURCE GUIDES',
    summary: 'Local package documentation · ' + source,
    sections: parseReference(loadReferenceSource(source)),
}));
