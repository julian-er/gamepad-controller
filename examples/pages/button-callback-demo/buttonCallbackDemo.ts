import { GamepadService } from 'gamepad-controller';

const logArea = document.getElementById('log-area');
function log(msg: string) {
    if (logArea) {
        logArea.textContent = `${msg}\n` + logArea.textContent;
    }
}

const gamepadService = new GamepadService({
    containerSelector: '.nav-menu',
    focusedClass: 'gamepad-focused',
    selectedClass: 'gamepad-selected',
    useDataAttributes: true,
    autoAddStyles: true,
    statusElementId: 'gamepad-status',
});

gamepadService.onButtonDown = (buttonIndex, gamepad) => {
    if (buttonIndex === 0) {
        log('⬇️ Botón X/A/Cross presionado (índice 0)');
    } else if (buttonIndex === 1) {
        log('⬇️ Botón O/B/Circle presionado (índice 1)');
    } else {
        log(`⬇️ Botón ${buttonIndex} presionado`);
    }
};

gamepadService.onButtonUp = (buttonIndex, gamepad) => {
    if (buttonIndex === 0) {
        log('⬆️ Botón X/A/Cross soltado (índice 0)');
    } else if (buttonIndex === 1) {
        log('⬆️ Botón O/B/Circle soltado (índice 1)');
    } else {
        log(`⬆️ Botón ${buttonIndex} soltado`);
    }
};

gamepadService.init(); 