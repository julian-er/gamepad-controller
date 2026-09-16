import type { DemoId } from '../demos/registry';
import type { Examples } from '../examples';

export type Section = {
    id: string;
    title: string;
    body?: string[];
    code?: string;
    examples?: Examples;
    language?: string;
    rows?: string[][];
    headers?: string[];
};

export type Doc = {
    interactiveDemo?: DemoId | 'gallery';
    source?: string;
    id: string;
    group: string;
    title: string;
    summary: string;
    sections: Section[];
};
