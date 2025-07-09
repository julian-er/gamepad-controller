import { gamepadService } from '../gamepadService.js';
import * as gamepadUtils from '../gamepadUtils.js';

const gamepad = gamepadService('.menu', {
    navigationMode: 'spatial',
    focusedClass: 'menu-focused',
    selectedClass: 'menu-selected',
    statusElementId: 'gamepad-status'
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

gamepadUtils.onFocus((element: Element, index: number) => {
    console.log(`Focused on menu item ${index + 1}`);
});

gamepadUtils.onSelect((element: Element, index: number) => {
    console.log(`Selected menu item ${index + 1}`);
    (element as HTMLElement).click();
});

gamepadUtils.onControllerConnect((gamepad: any, controllerType: string) => {
    console.log(`Controller connected: ${controllerType}`);
    document.body.style.background = controllerType === 'xbox' ? 
        'linear-gradient(135deg, #107c10 0%, #0e6b0e 100%)' :
        controllerType === 'playstation' ?
        'linear-gradient(135deg, #003087 0%, #00246b 100%)' :
        controllerType === 'nintendo' ?
        'linear-gradient(135deg, #e60012 0%, #cc0010 100%)' :
        'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
});

gamepadUtils.addDefaultStyles(); 