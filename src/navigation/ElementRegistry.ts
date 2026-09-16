/** Keeps manually supplied references and their base indices stable across DOM changes. */
export class ElementRegistry {
    private manual: Element[] | null = null;
    set(elements: readonly Element[]): void {
        this.manual = Array.from(elements);
    }
    clear(): void {
        this.manual = null;
    }
    get(): Element[] | null {
        return this.manual?.slice() ?? null;
    }
    get isManual(): boolean {
        return this.manual !== null;
    }
}
