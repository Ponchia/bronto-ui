/**
 * Optional framework adapter peers.
 *
 * The core package has zero runtime dependencies. These peers are allowed only
 * for adapter subpaths, and packed-consumer checks link them only for the full
 * adapter-surface smoke.
 */
export const OPTIONAL_FRAMEWORK_PEERS = [
  { peer: '@builder.io/qwik', subpath: './qwik', target: './qwik/index.js' },
  { peer: 'react', subpath: './react', target: './react/index.js' },
  { peer: 'solid-js', subpath: './solid', target: './solid/index.js' },
];

export function optionalFrameworkPeerNames() {
  return OPTIONAL_FRAMEWORK_PEERS.map((entry) => entry.peer).sort((a, b) => a.localeCompare(b));
}

export function optionalFrameworkPeerTargets() {
  return OPTIONAL_FRAMEWORK_PEERS.map((entry) => entry.target).sort((a, b) => a.localeCompare(b));
}
