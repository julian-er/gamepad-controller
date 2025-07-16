import { GamepadService } from 'gamepad-controller';

// Demo state management
class DemoState {
    totalSelections: number = 0;
    selectionHistory: string[] = [];
    selectionCounts: Record<string, number> = {};
    toggleStates: Record<string, boolean> = {};
    counters: Record<string, number> = {};

    updateAnalytics() {
        const totalElement = document.getElementById('total-selections');
        const lastElement = document.getElementById('last-selected');
        const mostElement = document.getElementById('most-selected');

        if (totalElement) totalElement.textContent = this.totalSelections.toString();
        if (lastElement) lastElement.textContent = this.selectionHistory[this.selectionHistory.length - 1] || 'None';
        
        // Find most selected element
        const mostSelected = Object.entries(this.selectionCounts)
            .reduce((a, b) => a[1] > b[1] ? a : b, ['None', 0]);
        if (mostElement) mostElement.textContent = `${mostSelected[0]} (${mostSelected[1]})`;
    }

    recordSelection(elementName: string) {
        this.totalSelections++;
        this.selectionHistory.push(elementName);
        this.selectionCounts[elementName] = (this.selectionCounts[elementName] || 0) + 1;
        this.updateAnalytics();
    }
}

// Activity logger
class ActivityLogger {
    private logContainer: HTMLElement;

    constructor() {
        this.logContainer = document.getElementById('activity-log')!;
    }

    log(message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') {
        const entry = document.createElement('div');
        entry.className = `log-entry ${type}`;
        entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
        
        this.logContainer.insertBefore(entry, this.logContainer.firstChild);
        
        // Keep only last 50 entries
        while (this.logContainer.children.length > 50) {
            this.logContainer.removeChild(this.logContainer.lastChild!);
        }
    }
}

// Initialize demo components
const demoState = new DemoState();
const logger = new ActivityLogger();

// Initialize GamepadService
const gamepadService = new GamepadService({
    containerSelector: '.container',
    focusedClass: 'gamepad-focused',
    selectedClass: 'gamepad-selected',
    statusElementId: 'gamepad-status',
    useGamepadIndex: true,
    useDataAttributes: false,
    autoAddStyles: true,
    debounceTime: 150,
    deadzone: 0.1,
    wrapNavigation: true,
    navigationMode: 'grid'
});

// Different onSelect behavior implementations
const behaviors = {
    // Basic behavior: just log the selection
    basic: (element: Element, index: number) => {
        const elementName = getElementName(element);
        logger.log(`Basic selection: ${elementName} (index: ${index})`, 'info');
        demoState.recordSelection(elementName);
    },

    // Advanced behavior: handle different element types
    advanced: (element: Element, index: number) => {
        const elementName = getElementName(element);
        const elementType = element.getAttribute('data-type');
        const elementAction = element.getAttribute('data-action');
        
        logger.log(`Advanced selection: ${elementName} (type: ${elementType}, action: ${elementAction})`, 'success');
        demoState.recordSelection(elementName);

        // Handle different element types
        switch (elementType) {
            case 'button':
                handleButtonSelection(element, elementAction);
                break;
            case 'link':
                handleLinkSelection(element, elementAction);
                break;
            case 'toggle':
                handleToggleSelection(element, elementAction);
                break;
            case 'counter':
                handleCounterSelection(element, elementAction);
                break;
            case 'input':
                handleInputSelection(element, elementAction);
                break;
            case 'modal':
                handleModalSelection(element, elementAction);
                break;
            default:
                logger.log(`Unknown element type: ${elementType}`, 'warning');
        }
    },

    // Custom behavior: complex interaction patterns
    custom: (element: Element, index: number) => {
        const elementName = getElementName(element);
        const elementType = element.getAttribute('data-type');
        
        logger.log(`Custom selection: ${elementName} with enhanced behavior`, 'success');
        demoState.recordSelection(elementName);

        // Add visual feedback
        addSelectionFeedback(element);

        // Handle with custom logic
        switch (elementType) {
            case 'button':
                // Custom button behavior with confirmation
                if (confirm(`Execute ${elementName}?`)) {
                    handleButtonSelection(element, element.getAttribute('data-action'));
                    logger.log(`Confirmed execution of ${elementName}`, 'success');
                } else {
                    logger.log(`Cancelled execution of ${elementName}`, 'warning');
                }
                break;
            case 'toggle':
                // Custom toggle with sound effect simulation
                handleToggleSelection(element, element.getAttribute('data-action'));
                logger.log(`Toggle sound: ${demoState.toggleStates[elementName] ? 'ON' : 'OFF'}`, 'info');
                break;
            case 'counter':
                // Custom counter with limits
                const currentValue = demoState.counters[elementName] || 0;
                if (currentValue < 10) {
                    handleCounterSelection(element, element.getAttribute('data-action'));
                    logger.log(`Counter incremented to ${demoState.counters[elementName]}`, 'success');
                } else {
                    logger.log(`Counter limit reached (10)`, 'warning');
                }
                break;
            default:
                // Default custom behavior
                if (element instanceof HTMLElement) {
                    element.style.transform = 'scale(1.1)';
                    setTimeout(() => {
                        element.style.transform = '';
                    }, 200);
                }
        }
    }
};

// Helper functions
function getElementName(element: Element): string {
    const h4 = element.querySelector('h4');
    if (h4) return h4.textContent || 'Unknown';
    
    const textContent = element.textContent?.trim();
    if (textContent && textContent.length < 50) return textContent;
    
    return element.tagName.toLowerCase();
}

function addSelectionFeedback(element: Element) {
    element.classList.add('gamepad-selected');
    setTimeout(() => {
        element.classList.remove('gamepad-selected');
    }, 300);
}

function handleButtonSelection(element: Element, action: string | null) {
    logger.log(`Button action: ${action}`, 'info');
    addSelectionFeedback(element);
}

function handleLinkSelection(element: Element, action: string | null) {
    logger.log(`Navigation action: ${action}`, 'info');
    addSelectionFeedback(element);
}

function handleToggleSelection(element: Element, action: string | null) {
    const elementName = getElementName(element);
    const indicator = element.querySelector('.toggle-indicator') as HTMLElement;
    
    if (indicator) {
        const currentState = demoState.toggleStates[elementName] || false;
        const newState = !currentState;
        
        demoState.toggleStates[elementName] = newState;
        indicator.textContent = newState ? 'ON' : 'OFF';
        indicator.classList.toggle('active', newState);
        
        logger.log(`Toggle ${elementName}: ${newState ? 'ON' : 'OFF'}`, 'success');
    }
}

function handleCounterSelection(element: Element, action: string | null) {
    const elementName = getElementName(element);
    const display = element.querySelector('.counter-display') as HTMLElement;
    
    if (display) {
        const currentValue = demoState.counters[elementName] || 0;
        const newValue = currentValue + 1;
        
        demoState.counters[elementName] = newValue;
        display.textContent = newValue.toString();
        
        logger.log(`Counter ${elementName}: ${newValue}`, 'success');
    }
}

function handleInputSelection(element: Element, action: string | null) {
    const input = element.querySelector('.demo-input') as HTMLInputElement;
    if (input) {
        input.focus();
        logger.log(`Input field focused`, 'info');
    }
}

function handleModalSelection(element: Element, action: string | null) {
    const modal = document.getElementById('demo-modal');
    if (modal) {
        modal.classList.add('show');
        logger.log(`Modal opened`, 'success');
    }
}

// Set up behavior switching buttons
document.addEventListener('DOMContentLoaded', () => {
    // Basic behavior button
    document.getElementById('basic-behavior')?.addEventListener('click', () => {
        gamepadService.onSelect = behaviors.basic;
        logger.log('Switched to BASIC behavior', 'info');
    });

    // Advanced behavior button
    document.getElementById('advanced-behavior')?.addEventListener('click', () => {
        gamepadService.onSelect = behaviors.advanced;
        logger.log('Switched to ADVANCED behavior', 'success');
    });

    // Custom behavior button
    document.getElementById('custom-behavior')?.addEventListener('click', () => {
        gamepadService.onSelect = behaviors.custom;
        logger.log('Switched to CUSTOM behavior', 'success');
    });

    // Clear behavior button
    document.getElementById('clear-behavior')?.addEventListener('click', () => {
        gamepadService.onSelect = null;
        logger.log('Cleared onSelect behavior', 'warning');
    });

    // Modal close button
    document.getElementById('close-modal')?.addEventListener('click', () => {
        const modal = document.getElementById('demo-modal');
        if (modal) {
            modal.classList.remove('show');
            logger.log('Modal closed', 'info');
        }
    });

    // Set up focus callback to show current element
    gamepadService.onFocus = (element: Element, index: number) => {
        const elementName = getElementName(element);
        logger.log(`Focused: ${elementName} (index: ${index})`, 'info');
    };

    // Set up controller connection callbacks
    gamepadService.onControllerConnect = (gamepad: Gamepad) => {
        logger.log(`Controller connected: ${gamepad.id}`, 'success');
    };

    gamepadService.onControllerDisconnect = (gamepad: Gamepad) => {
        logger.log(`Controller disconnected: ${gamepad.id}`, 'warning');
    };

    // Initialize with basic behavior
    gamepadService.onSelect = behaviors.basic;
    logger.log('Demo initialized with BASIC behavior', 'success');
    logger.log('Use the buttons above to switch between different onSelect behaviors', 'info');
    logger.log('Connect a gamepad and use the A/X button to select elements', 'info');

    // Initialize the gamepad service
    gamepadService.init();
});

// Export for debugging
(window as any).gamepadService = gamepadService;
(window as any).demoState = demoState;
(window as any).logger = logger;
(window as any).behaviors = behaviors; 