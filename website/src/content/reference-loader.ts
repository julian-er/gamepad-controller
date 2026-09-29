const sources = import.meta.glob<string>(
    [
        '../../../docs/README.md',
        '../../../docs/knowledge/index.md',
        '../../../docs/knowledge/*/index.md',
        '../../../docs/knowledge/features/project-cookbook.md',
        '../../../docs/knowledge/integrations/angular.md',
        '../../../docs/knowledge/integrations/react.md',
        '../../../docs/knowledge/integrations/vanilla.md',
        '../../../docs/knowledge/foundations/api.md',
        '../../../docs/knowledge/foundations/configuration.md',
        '../../../docs/knowledge/foundations/public-api.md',
        '../../../docs/knowledge/foundations/gamepad-service.md',
        '../../../docs/knowledge/features/action-detection.md',
        '../../../docs/knowledge/architecture/overview.md',
        '../../../docs/knowledge/operations/building-and-packaging.md',
        '../../../docs/CHANGELOG.md',
        '../../../docs/knowledge/integrations/consumer-skills.md',
        '../../../skills/**/*.md',
    ],
    { eager: true, query: '?raw', import: 'default' }
);

export function loadReferenceSource(source: string): string {
    const markdown = sources['../../../' + source];
    if (!markdown) throw new Error('Missing documentation source: ' + source);
    return markdown;
}
