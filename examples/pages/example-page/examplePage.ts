// examplePage.ts
// Example page demonstrating gamepad navigation

import { GamepadService } from 'gamepad-controller';

// Initialize gamepad service with different viewport options
const gamepadService = new GamepadService({
    containerSelector: '.gamepad-container',
    focusedClass: 'gamepad-focused',
    selectedClass: 'gamepad-selected',
    useDataAttributes: true,
    useGamepadIndex: false,
    onlyViewport: false, // Set to true to only include elements visible in viewport
    autoAddStyles: true,
    statusElementId: 'gamepad-status'
});

// Set up event handlers
gamepadService.onFocus = (element, index) => {
    console.log(`Focused element ${index}:`, element);
};

gamepadService.onSelect = (element, index) => {
    console.log(`Selected element ${index}:`, element);
};

gamepadService.onControllerConnect = (gamepad) => {
    console.log('Controller connected:', gamepad.id);
};

gamepadService.onControllerDisconnect = (gamepad) => {
    console.log('Controller disconnected:', gamepad.id);
};

// Initialize the service
gamepadService.init();

// Add some dynamic content to test viewport filtering
setTimeout(() => {
    const container = document.querySelector('.gamepad-container');
    if (container) {
        // Add elements outside viewport to test onlyViewport option
        const offscreenDiv = document.createElement('div');
        offscreenDiv.className = 'offscreen-element';
        offscreenDiv.style.cssText = 'position: absolute; top: 2000px; left: 0; width: 200px; height: 50px; background: #ff6b6b; color: white; display: flex; align-items: center; justify-content: center;';
        offscreenDiv.textContent = 'Off-screen Element (only visible if onlyViewport: false)';
        offscreenDiv.setAttribute('tabindex', '0');
        container.appendChild(offscreenDiv);

        // Refresh to detect new elements
        gamepadService.refresh();
        
        console.log('Added off-screen element. If onlyViewport is false, you should be able to navigate to it.');
    }
}, 2000);

// Expose for debugging
(window as any).gamepadService = gamepadService; 