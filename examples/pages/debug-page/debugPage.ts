import { initGamepadNavigation } from 'gamepad-controller';
import * as gamepadUtils from 'gamepad-controller';

console.log('🔧 Debug Test Started');

const updateStatus = (id: string, message: string, type = '') => {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = message;
        element.className = `status ${type}`;
    }
};

let gamepadInstance: any = null;

(async () => {
    try {
        updateStatus('test-status', '1️⃣ Testing module imports...', 'warning');
        updateStatus('module-status', '✅ All modules loaded successfully!', 'success');
        updateStatus('test-status', '2️⃣ Initializing gamepad service...', 'warning');
        gamepadInstance = initGamepadNavigation({
            containerSelector: '.test-grid',
            navigationMode: 'grid',
            focusedClass: 'gamepad-focused',
            selectedClass: 'gamepad-selected',
            statusElementId: null,
            autoAddStyles: false,
            autoCreateStatusElement: false,
            useDataAttributes: false,
            gamepadContext: 'grid'
        });
        gamepadUtils.onFocus((element: Element, index: number) => {
            updateStatus('gamepad-debug', `🎯 Focused on item ${index + 1}`, 'success');
            console.log('Focus:', element, index);
        });
        gamepadUtils.onSelect((element: Element, index: number) => {
            updateStatus('gamepad-debug', `✅ Selected item ${index + 1}`, 'success');
            console.log('Select:', element, index);
        });
        gamepadUtils.onControllerConnect((gamepad: any) => {
            updateStatus('gamepad-debug', `🎮 Controller connected`, 'success');
            console.log('Controller connected:', gamepad);
        });
        updateStatus('test-status', '✅ All tests passed! Connect a gamepad to test navigation.', 'success');
    } catch (error: any) {
        console.error('❌ Module loading failed:', error);
        updateStatus('test-status', `❌ Error: ${error.message}`, 'error');
        updateStatus('module-status', `Module Error: ${error.stack}`, 'error');
    }

    (window as any).testClick = function(itemNumber: number) {
        console.log(`Clicked item ${itemNumber}`);
        updateStatus('gamepad-debug', `🖱️ Clicked item ${itemNumber} with mouse`, 'warning');
    };
    (window as any).debugRefresh = function() {
        if (gamepadInstance) {
            gamepadInstance.refresh();
            updateStatus('gamepad-debug', '🔄 Navigation refreshed', 'success');
        } else {
            updateStatus('gamepad-debug', '❌ No gamepad instance available', 'error');
        }
    };
    (window as any).debugInfo = function() {
        const info = (window as any).gamepadUtils.getNavigationInfo();
        if (info) {
            const debugText = `
                Connected: ${info.isConnected ? '✅' : '❌'}
                Controller: ${info.controllerType}
                Current Index: ${info.currentIndex}
                Total Elements: ${info.totalElements}
                Navigation: ${info.navigationEnabled ? '✅' : '❌'}
                Back Button: ${info.backButtonEnabled ? '✅' : '❌'}
                Shoulder Nav: ${info.shoulderNavigationEnabled ? '✅' : '❌'}
                `;
            updateStatus('gamepad-debug', debugText, 'success');
            console.log('Debug Info:', info);
        } else {
            updateStatus('gamepad-debug', '❌ No debug info available', 'error');
        }
    };
    (window as any).debugElements = function() {
        const elements = (window as any).gamepadUtils.getElements();
        console.log('Detected elements:', elements);
        updateStatus('gamepad-debug', `📋 Found ${elements.length} elements (check console)`, 'success');
    };
    (window as any).debugStyles = function() {
        if (gamepadUtils.addNavigationStyles) {
            gamepadUtils.addNavigationStyles();
            updateStatus('gamepad-debug', '🎨 Example styles added', 'success');
        }
    };
    (window as any).debugCSSExamples = function() {
        if (gamepadUtils.printCSSExamples) {
            gamepadUtils.printCSSExamples();
            updateStatus('gamepad-debug', '📄 CSS examples printed to console', 'success');
        }
    };
    function detectControllerType(gp: Gamepad): string {
        const id = gp.id.toLowerCase();
        if (id.includes('xbox')) return 'Xbox';
        if (id.includes('playstation') || id.includes('ps4') || id.includes('ps5')) return 'PlayStation';
        if (id.includes('nintendo') || id.includes('switch') || id.includes('joy-con') || id.includes('pro controller')) return 'Nintendo';
        if (gp.buttons.length >= 8 && gp.axes.length >= 2) return 'Genérico';
        return 'Otro';
    }
    window.addEventListener('gamepadconnected', (e: any) => {
        const type = detectControllerType(e.gamepad);
        if (type === 'Otro') return;
        console.log('Gamepad connected:', e.gamepad.id);
        updateStatus('gamepad-debug', `🎮 Raw gamepad connected: ${e.gamepad.id}`, 'success');
    });
    window.addEventListener('gamepaddisconnected', (e: any) => {
        const type = detectControllerType(e.gamepad);
        if (type === 'Otro') return;
        console.log('Gamepad disconnected:', e.gamepad.id);
        updateStatus('gamepad-debug', `🎮 Raw gamepad disconnected: ${e.gamepad.id}`, 'warning');
    });
    setInterval(() => {
        const gamepads = navigator.getGamepads();
        const connected = Array.from(gamepads).filter(gp => gp && gp.connected);
        if (connected.length > 0) {
            console.log('Live gamepad data:', connected.map(gp => gp && {
                id: gp.id,
                buttons: gp.buttons.map((btn: any, i: number) => btn.pressed ? i : null).filter((i: number | null) => i !== null),
                axes: gp.axes.map((axis: number) => Math.round(axis * 100) / 100)
            }));
        }
    }, 2000);
})(); 