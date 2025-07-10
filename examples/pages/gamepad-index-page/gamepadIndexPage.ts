import { gamepadService } from 'gamepad-controller';
import * as gamepadUtils from 'gamepad-controller';

// Global gamepad service instance
let gamepad: any = null;
let useGamepadIndexEnabled = true;

document.addEventListener('DOMContentLoaded', () => {
    initializeGamepad();
    gamepadUtils.addDefaultStyles();
    setupEventListeners();
    
    console.log('🎯 Gamepad-Index Demo initialized');
    console.log('💡 Use your gamepad to test custom navigation order!');
});

function initializeGamepad() {
    // Destroy existing instance if any
    if (gamepad) {
        gamepad.destroy();
    }
    
    // Create new gamepad service with gamepad-index enabled
    gamepad = gamepadService('.container', {
        navigationMode: 'spatial',
        focusedClass: 'gamepad-focused',
        selectedClass: 'gamepad-selected',
        statusElementId: 'gamepad-status',
        useDataAttributes: false,
        useGamepadIndex: useGamepadIndexEnabled,
        wrapNavigation: true,
        autoDetectElements: true
    });
    
    // Set up focus callback to show current element info
    gamepad.onFocus = (element: Element, index: number) => {
        const gamepadIndex = element.getAttribute('gamepad-index');
        const tagName = element.tagName.toLowerCase();
        const text = element.textContent?.slice(0, 30) + (element.textContent && element.textContent.length > 30 ? '...' : '');
        
        console.log(`🎯 Focus: ${tagName} [${index}]${gamepadIndex ? ` (gamepad-index=${gamepadIndex})` : ''} - "${text}"`);
        
        // Update navigation order indicators if they exist
        updateNavigationOrderIndicators();
    };
    
    // Set up selection callback
    gamepad.onSelect = (element: Element, index: number) => {
        const gamepadIndex = element.getAttribute('gamepad-index');
        console.log(`✅ Selected: ${element.tagName.toLowerCase()} [${index}]${gamepadIndex ? ` (gamepad-index=${gamepadIndex})` : ''}`);
        
        // Trigger click if it's a clickable element
        if (element instanceof HTMLElement) {
            element.click();
        }
    };
    
    updateToggleButton();
}

function setupEventListeners() {
    // Handle form submission
    const form = document.querySelector('.form-demo') as HTMLFormElement;
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            showMessage('Form submitted successfully!');
        });
    }
    
    // Add keyboard support for better testing
    document.addEventListener('keydown', (e) => {
        if (e.target instanceof HTMLElement && 
            (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) {
            return; // Don't interfere with form input
        }
        
        if (e.key === 'Enter' || e.key === ' ') {
            const focused = document.querySelector('.gamepad-focused');
            if (focused instanceof HTMLElement) {
                e.preventDefault();
                focused.click();
            }
        }
    });
}

// Control functions
function toggleGamepadIndex() {
    useGamepadIndexEnabled = !useGamepadIndexEnabled;
    console.log(`🔄 Gamepad-Index ${useGamepadIndexEnabled ? 'ENABLED' : 'DISABLED'}`);
    
    // Reinitialize gamepad with new setting
    initializeGamepad();
    
    updateToggleButton();
    
    // Show visual feedback
    const message = useGamepadIndexEnabled 
        ? '🎯 Gamepad-Index ENABLED - Custom navigation order active!'
        : '❌ Gamepad-Index DISABLED - Default DOM order active!';
    
    showTemporaryMessage(message);
}

function refreshNavigation() {
    if (gamepad) {
        gamepad.refresh();
        console.log('🔄 Navigation refreshed');
        showTemporaryMessage('🔄 Navigation refreshed!');
    }
}

function showNavigationOrder() {
    if (!gamepad) {
        showMessage('Gamepad service not initialized');
        return;
    }
    
    const elements = gamepad.getElements();
    let orderInfo = `📋 Navigation Order (${useGamepadIndexEnabled ? 'Gamepad-Index ENABLED' : 'Gamepad-Index DISABLED'}):\n\n`;
    
    elements.forEach((element: Element, index: number) => {
        const gamepadIndex = element.getAttribute('gamepad-index');
        const tagName = element.tagName.toLowerCase();
        const text = element.textContent?.slice(0, 40) + (element.textContent && element.textContent.length > 40 ? '...' : '');
        const indexInfo = gamepadIndex ? ` (gamepad-index=${gamepadIndex})` : ' (no index)';
        
        orderInfo += `${index + 1}. ${tagName}${indexInfo}\n   "${text}"\n\n`;
    });
    
    alert(orderInfo);
    console.log(orderInfo);
}

function updateToggleButton() {
    const toggleBtn = document.getElementById('toggle-btn');
    if (toggleBtn) {
        const status = useGamepadIndexEnabled ? 'ON' : 'OFF';
        const emoji = useGamepadIndexEnabled ? '🎯' : '❌';
        toggleBtn.textContent = `${emoji} Toggle Gamepad-Index (Currently: ${status})`;
        toggleBtn.style.backgroundColor = useGamepadIndexEnabled ? '#27ae60' : '#e74c3c';
        toggleBtn.style.color = 'white';
        toggleBtn.style.borderColor = useGamepadIndexEnabled ? '#27ae60' : '#e74c3c';
    }
}

function updateNavigationOrderIndicators() {
    // Remove existing indicators
    document.querySelectorAll('.nav-order-indicator').forEach(indicator => {
        indicator.remove();
    });
    
    if (!gamepad || !useGamepadIndexEnabled) return;
    
    // Add order indicators to focused elements
    const elements = gamepad.getElements();
    elements.forEach((element: Element, index: number) => {
        if (element.hasAttribute('gamepad-index')) {
            const indicator = document.createElement('div');
            indicator.className = 'nav-order-indicator';
            indicator.textContent = (index + 1).toString();
            
            // Position relative to element
            if (element instanceof HTMLElement) {
                element.style.position = 'relative';
                element.appendChild(indicator);
            }
        }
    });
}

function showTemporaryMessage(message: string) {
    const messageDiv = document.createElement('div');
    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: #333;
        color: white;
        padding: 1rem 2rem;
        border-radius: 8px;
        font-weight: bold;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        animation: slideIn 0.3s ease;
    `;
    messageDiv.textContent = message;
    
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
        messageDiv.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(messageDiv);
        }, 300);
    }, 3000);
}

// Make functions available globally
(window as any).toggleGamepadIndex = toggleGamepadIndex;
(window as any).refreshNavigation = refreshNavigation;
(window as any).showNavigationOrder = showNavigationOrder;

// Enhanced showMessage function
function showMessage(message: string) {
    const enhancedMessages: Record<string, string> = {
        'First Button': '🥇 First button selected! (gamepad-index=1)',
        'Second Button': '🥈 Second button selected! (gamepad-index=2)', 
        'Third Button': '🥉 Third button selected! (gamepad-index=3)',
        'Fourth Button': '4️⃣ Fourth button selected! (gamepad-index=4)',
        'Fifth Button (no index)': '5️⃣ Fifth button selected! (no gamepad-index)',
        'Emergency Button': '🚨 Emergency action triggered! (gamepad-index=-1)',
        'Critical Button': '🔴 Critical action triggered! (gamepad-index=-2)',
        'Zero Button': '0️⃣ Zero button selected! (gamepad-index=0)',
        'Important Card': '🔥 Important card selected! High priority navigation.',
        'First Card': '⭐ First card selected! Primary navigation target.',
        'Third Card': '🎯 Final indexed card selected!',
        'Regular Card 1': '📄 Regular card selected (no gamepad-index)',
        'Regular Card 2': '📄 Another regular card selected (no gamepad-index)',
        'Form submitted successfully!': '✅ Form submission completed!'
    };
    
    const displayMessage = enhancedMessages[message] || `You selected: ${message}`;
    alert(displayMessage);
    console.log(`💬 ${displayMessage}`);
}

(window as any).showMessage = showMessage; 