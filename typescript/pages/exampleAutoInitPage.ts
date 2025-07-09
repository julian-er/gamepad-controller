import { initGamepadForPage } from '../gamepadService.js';

document.addEventListener('DOMContentLoaded', () => {
    initGamepadForPage({
        statusElementId: 'gamepad-status'
    });
    console.log('🎮 Enhanced gamepad navigation initialized!');
    console.log('📖 Use D-pad/stick to navigate, A/X to select, B/Circle to go back, R1/L1 for page navigation');
}); 