import { gamepadService, gamepadUtils } from 'gamepad-controller';

document.addEventListener('DOMContentLoaded', () => {
    gamepadService('.container', {
        navigationMode: 'grid',
        focusedClass: 'gamepad-focused',
        selectedClass: 'gamepad-selected',
        statusElementId: 'gamepad-status',
        useDataAttributes: false
    });

    gamepadUtils.addStyles();

    document.querySelectorAll('.card').forEach(card => {
        card.addEventListener('keydown', (e) => {
            const event = e as KeyboardEvent;
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                (card as HTMLElement).click();
            }
        });
    });

    console.log('Gamepad navigation initialized for simple example');
});

function showMessage(item: string) {
    const messages: Record<string, string> = {
        'Card 1': '🎯 You selected Feature One! This could trigger any action.',
        'Card 2': '🚀 You selected Feature Two! Perfect for launching new features.',
        'Card 3': '⚡ You selected Feature Three! Lightning fast navigation.',
        'Card 4': '🎨 You selected Feature Four! Beautiful visual feedback.',
        'Card 5': '🔧 You selected Feature Five! Highly configurable system.',
        'Card 6': '🌟 You selected Feature Six! Amazing user experience.',
        'Action Button': '🎮 Action button pressed! This could save data, submit forms, etc.',
        'Secondary Button': '🔄 Secondary action triggered! Perfect for cancel or reset actions.',
        'Success Button': '✅ Success action completed! Great for confirmations.'
    };
    alert(messages[item] || `You selected: ${item}`);
}
(window as any).showMessage = showMessage; 