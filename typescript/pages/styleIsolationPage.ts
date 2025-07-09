import { initGamepadNavigation } from '../gamepadService.js';

let gamepadInstance: any = null;
let stylesEnabled = false;

document.addEventListener('DOMContentLoaded', () => {
    gamepadInstance = initGamepadNavigation({
        navigationMode: 'spatial',
        focusedClass: 'gamepad-focused',
        selectedClass: 'gamepad-selected',
        statusElementId: 'gamepad-status',
        autoAddStyles: false,
        useDataAttributes: true,
        gamepadContext: 'grid'
    });
});
