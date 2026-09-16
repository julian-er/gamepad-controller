import { demoDocs } from '../demos/demo-docs';
import { authoredDocs } from './authored';
import { referenceDocs } from './reference-documents';
import type { Doc } from './types';

export const docs: Doc[] = [...authoredDocs];
docs.find((d) => d.id === 'api')!.sections.push({
    id: 'public-exports',
    title: 'Complete public contracts',
    body: ['See [Complete public contracts](#/docs/public-api) for all exported helper signatures, context methods, event payloads, styling, logging, platform integration and public types. See [Configuration](#/docs/configuration) for every option and effective default.'],
});
docs.splice(docs.findIndex((doc) => doc.id === 'playground') + 1, 0, ...demoDocs);
docs.push(...referenceDocs);
