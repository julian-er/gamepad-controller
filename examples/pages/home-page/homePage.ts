import { initDualContextGamepad } from 'gamepad-controller'


document.addEventListener('DOMContentLoaded', () => {
    const gamepadService = initDualContextGamepad({
        menuContextSelector: '#navigation-menu',
        contentContextSelector: null,
        focusedClass: 'gamepad-focused',
        selectedClass: 'gamepad-selected',
        useDataAttributes: false,
        statusElementId: 'gamepad-status',
        autoCreateStatusElement: true,
        enableNavigation: true,
        enableBackButton: true,
        enableShoulderNavigation: true,
        debounceTime: 150,
        deadzone: 0.1
    });

    gamepadService.onContextSwitch = (newContext: any, oldContext: any) => {
        console.log(`🔄 Context switched from ${oldContext?.id || 'none'} to ${newContext.id}`);
        if (newContext.id === 'menu') {
            document.body.classList.add('menu-context-active');
            document.body.classList.remove('content-context-active');
        } else {
            document.body.classList.add('content-context-active');
            document.body.classList.remove('menu-context-active');
        }
    };

    console.log('🎮 Dual context gamepad navigation ready!');
    console.log('📖 Controls:');
    console.log('  • Left stick: Navigate content area');
    console.log('  • R1/L1: Navigate menu items');
    console.log('  • A/X: Select current item');
    console.log('  • B/Circle: Go back');
    console.log('🎯 Navigation contexts are mutually exclusive - only one active at a time!');
}); 