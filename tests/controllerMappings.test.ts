import { describe, it, expect } from 'vitest';
import {
    getPrimaryActionButtonIndex,
    getBackButtonIndex,
    getShoulderIndices,
    getDpadIndices,
    getButtonName,
    getAxisName,
} from '../src/mappings/controllerMappings';

describe('getPrimaryActionButtonIndex', () => {
    it('is 0 for xbox/playstation and 1 for nintendo', () => {
        expect(getPrimaryActionButtonIndex('xbox')).toBe(0);
        expect(getPrimaryActionButtonIndex('playstation')).toBe(0);
        expect(getPrimaryActionButtonIndex('nintendo')).toBe(1);
        expect(getPrimaryActionButtonIndex('unknown')).toBe(0);
    });
});

describe('getBackButtonIndex', () => {
    it('is 1 for standard mapping and 0 for nintendo', () => {
        expect(getBackButtonIndex('xbox')).toBe(1);
        expect(getBackButtonIndex('playstation')).toBe(1);
        expect(getBackButtonIndex('nintendo')).toBe(0);
    });
});

describe('getShoulderIndices', () => {
    it('maps L1/R1 to indices 4 and 5', () => {
        expect(getShoulderIndices('xbox')).toEqual({ l1: 4, r1: 5 });
        expect(getShoulderIndices('playstation')).toEqual({ l1: 4, r1: 5 });
    });
});

describe('getDpadIndices', () => {
    it('maps the d-pad to indices 12-15', () => {
        expect(getDpadIndices('xbox')).toEqual({ up: 12, down: 13, left: 14, right: 15 });
    });
});

describe('getButtonName / getAxisName', () => {
    it('returns mapped names and a fallback for out-of-range indices', () => {
        expect(getButtonName(0, 'xbox')).toBe('A');
        expect(getButtonName(1, 'playstation')).toBe('Circle');
        expect(getButtonName(99, 'xbox')).toBe('Button 99');
        expect(getAxisName(0, 'xbox')).toBe('Left Stick X');
        expect(getAxisName(99, 'xbox')).toBe('Axis 99');
    });
});
