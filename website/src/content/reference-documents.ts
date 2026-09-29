import type { Doc } from './types';
import { loadReferenceSource } from './reference-loader';
import { referenceSources } from './reference-sources';
import { parseReference } from '../utils/markdown';

export const referenceDocs: Doc[] = referenceSources.map(([source, id, title]) => ({
    id,
    title,
    source,
    group: source === 'docs/knowledge/foundations/configuration.md' ? 'CORE CONCEPTS' : source.startsWith('skills/') || source === 'docs/knowledge/integrations/consumer-skills.md' ? 'AI SKILLS & RECIPES' : 'SOURCE GUIDES',
    summary: 'Local package documentation · ' + source,
    sections: parseReference(loadReferenceSource(source)),
}));
