// viewportDemoPage.ts
// Demo page for testing onlyViewport functionality

import { GamepadService } from 'gamepad-controller';

let gamepadService: GamepadService;

// Initialize gamepad service
function initGamepadService(onlyViewport: boolean = true) {
    // Destroy existing service if any
    if (gamepadService) {
        gamepadService.destroy();
    }

    // Create new service with specified viewport setting
    gamepadService = new GamepadService({
        containerSelector: null,
        focusedClass: 'gamepad-focused',
        selectedClass: 'gamepad-selected',
        useDataAttributes: true,
        useGamepadIndex: false,
        onlyViewport: onlyViewport,
        autoAddStyles: true,
        statusElementId: 'gamepad-status'
    });

    // Set up event handlers
    gamepadService.onFocus = (element, index) => {
        console.log(`Focused element ${index}:`, element);
        updateElementCount();
    };

    gamepadService.onSelect = (element, index) => {
        console.log(`Selected element ${index}:`, element);
        
        // Show which element was selected
        const cardTitle = element.querySelector('h3')?.textContent || 'Unknown';
        alert(`Selected: ${cardTitle}`);
    };

    gamepadService.onControllerConnect = (gamepad) => {
        console.log('Controller connected:', gamepad.id);
        updateElementCount();
    };

    gamepadService.onControllerDisconnect = (gamepad) => {
        console.log('Controller disconnected:', gamepad.id);
    };

    // Initialize the service
    gamepadService.init();
    
    // Update UI
    updateElementCount();
    updateCurrentMode(onlyViewport);
}

// Update element count display
function updateElementCount() {
    const elements = gamepadService.getElements();
    const currentIndex = gamepadService.getCurrentIndex();
    const statusElement = document.getElementById('gamepad-status');
    
    if (statusElement) {
        const controllerInfo = gamepadService.isControllerConnected() 
            ? `🎮 ${gamepadService.getControllerType()} connected` 
            : '🎮 Waiting for gamepad connection...';
        
        statusElement.innerHTML = `
            ${controllerInfo}<br>
            📊 Elements: ${elements.length}<br>
            🎯 Current: ${currentIndex + 1}/${elements.length}
        `;
    }
}

// Update current mode display
function updateCurrentMode(onlyViewport: boolean) {
    const modeText = onlyViewport ? 'Viewport Only' : 'All Elements';
    const currentModeElement = document.getElementById('current-mode');
    
    if (currentModeElement) {
        currentModeElement.textContent = `Current: ${modeText}`;
    }
    
    // Update button states
    const allElementsBtn = document.getElementById('all-elements');
    const viewportOnlyBtn = document.getElementById('viewport-only');
    
    if (allElementsBtn && viewportOnlyBtn) {
        allElementsBtn.classList.toggle('active', !onlyViewport);
        viewportOnlyBtn.classList.toggle('active', onlyViewport);
    }
}

// Set up toggle buttons
function setupToggleButtons() {
    const allElementsBtn = document.getElementById('all-elements');
    const viewportOnlyBtn = document.getElementById('viewport-only');
    
    if (allElementsBtn) {
        allElementsBtn.addEventListener('click', () => {
            console.log('🔄 Switching to All Elements mode');
            initGamepadService(false);
        });
    }
    
    if (viewportOnlyBtn) {
        viewportOnlyBtn.addEventListener('click', () => {
            console.log('🔄 Switching to Viewport Only mode');
            initGamepadService(true);
        });
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎮 Viewport Demo initialized');
    
    // Set up toggle buttons
    setupToggleButtons();
    
    // Initialize with all elements (onlyViewport: false)
    initGamepadService(false);
    
    // Expose for debugging
    (window as any).gamepadService = gamepadService;
    (window as any).initGamepadService = initGamepadService;
    
    // Add some helpful console messages
    console.log('💡 Try toggling between "All Elements" and "Viewport Only" to see the difference');
    console.log('💡 Connect a gamepad and navigate to see which elements are focusable');
    console.log('💡 Scroll down to see off-screen elements that are only accessible when onlyViewport is false');
}); 