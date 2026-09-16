const sources = import.meta.glob<string>(
    [
        '../../../docs/README.md',
        '../../../docs/PROJECT_COOKBOOK.md',
        '../../../docs/USAGE_*.md',
        '../../../docs/API.md',
        '../../../docs/CONFIGURATION.md',
        '../../../docs/PUBLIC_API.md',
        '../../../docs/GAMEPAD_SERVICE_METHODS.md',
        '../../../docs/GAMEPAD_ACTION_DETECTION.md',
        '../../../docs/ARCHITECTURE.md',
        '../../../docs/BUILDING.md',
        '../../../docs/CHANGELOG.md',
        '../../../docs/AGENT_SKILLS.md',
        '../../../skills/**/*.md',
    ],
    { eager: true, query: '?raw', import: 'default' }
);

export function loadReferenceSource(source: string): string {
    const markdown = sources['../../../' + source];
    if (!markdown) throw new Error('Missing documentation source: ' + source);
    return markdown;
}
