import { initGamepadNavigation } from 'gamepad-controller';

let gamepadInstance: any = null;
let stylesEnabled = false;

document.addEventListener('DOMContentLoaded', () => {
    gamepadInstance = initGamepadNavigation({
        navigationMode: 'grid',
        focusedClass: 'gamepad-focused',
        selectedClass: 'gamepad-selected',
        statusElementId: 'gamepad-status',
        autoAddStyles: false,
        useDataAttributes: true,
        gamepadContext: 'grid'
    });
});
