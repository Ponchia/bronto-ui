export function resolveHost(root: any, fallback?: Document): any;
export function bindOnce(target: any, key: any, add: any): () => void;
export function byIdInHost(host: any, id: any): any;
export function closestSafe(el: any, selector: any): any;
export function collectHosts(host: any, selector: any): any[];
export function scrollIntoViewSafe(el: any, opts?: {
    block: string;
}): void;
export function wrapIndex(cur: any, delta: any, len: any): any;
export function noop(): void;
export function hasDom(): boolean;
export function nextFieldUid(): number;
/**
 * Cleanup function returned by every initializer; calling it tears down the
 * behavior's listeners/observers.
 */
export type Cleanup = () => void;
export type DelegateOpts = {
    /**
     * Event-delegation root; also scopes which controls are queried. Default: `document`.
     */
    root?: Document | Element | undefined;
};
//# sourceMappingURL=internal.d.ts.map