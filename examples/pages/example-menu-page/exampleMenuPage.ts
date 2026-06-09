import { gamepadService, gamepadUtils } from 'gamepad-controller';

const gamepad = gamepadService('.container', {
    navigationMode: 'spatial',
    focusedClass: 'menu-focused',
    selectedClass: 'menu-selected',
    statusElementId: 'gamepad-status',
    useDataAttributes: false,
    
});

(window as any).handleMenuSelect = function(action: string) {
    console.log('Menu selected:', action);
    const currentElement = gamepadUtils.getCurrentElement();
    if (currentElement) {
        (currentElement as HTMLElement).style.background = '#28a745';
        setTimeout(() => {
            (currentElement as HTMLElement).style.background = '';
        }, 300);
    }
    switch(action) {
        case 'new-game':
            alert('Starting new game... 🎮');
            break;
        case 'continue':
            alert('Continuing game... ▶️');
            break;
        case 'settings':
            alert('Opening settings... ⚙️');
            break;
        case 'achievements':
            alert('Viewing achievements... 🏆');
            break;
        case 'leaderboard':
            alert('Showing leaderboard... 📊');
            break;
        case 'quit':
            if (confirm('Are you sure you want to quit?')) {
                alert('Thanks for playing! 👋');
            }
            break;
    }
};

gamepad.on('focus', (_element: Element, index: number) => {
    console.log(`Focused on menu item ${index + 1}`);
});

gamepad.on('select', (element: Element, index: number) => {
    console.log(`Selected menu item ${index + 1}`);
    (element as HTMLElement).click();
});

gamepad.on('controllerconnect', (_gamepad: Gamepad) => {
    const controllerType = gamepad.getControllerType();
    console.log(`Controller connected: ${controllerType}`);
    // Theme the page to the detected controller brand (see theme.css body.controller-*).
    document.body.classList.remove('controller-xbox', 'controller-playstation', 'controller-nintendo');
    if (controllerType === 'xbox' || controllerType === 'playstation' || controllerType === 'nintendo') {
        document.body.classList.add(`controller-${controllerType}`);
    }
});

gamepadUtils.addStyles(); 