export function compositeVisible(element: any): boolean;
/** Preserve author tab stops, including late items and items removed before teardown. */
export function tabStops(root: any): {
    set: (element: any, value: any) => void;
    sync(items: any, active: any): void;
    restore(): void;
};
export function compositeIndex(key: any, current: any, count: any, vertical: any, rtl?: boolean): number | null;
/** A surrounding editor does not own the composite's controls. */
export function editingControl(element: any, root: any): boolean;
/** DOM ownership matters before a framework's delegated key handler runs. */
export function nestedComposite(element: any, root: any): boolean;
//# sourceMappingURL=composite.d.ts.map