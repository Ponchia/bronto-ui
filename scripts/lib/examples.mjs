/** Canonical example app inventory shared by checks and browser smokes. */

const EXAMPLES = Object.freeze([
  { name: 'vanilla-vite', smoke: true },
  { name: 'astro', smoke: true },
  { name: 'sveltekit', smoke: true, distDir: 'build' },
  { name: 'vue-vite', smoke: true },
  { name: 'react-vite', smoke: true },
  { name: 'solid-vite', smoke: true },
  { name: 'qwik-vite', smoke: true },
  { name: 'tailwind-vite', smoke: true },
  { name: 'report-static', smoke: true },
]);

export const EXAMPLE_NAMES = Object.freeze(EXAMPLES.map((example) => example.name));
export const BROWSER_SMOKE_EXAMPLE_NAMES = Object.freeze(
  EXAMPLES.filter((example) => example.smoke).map((example) => example.name),
);

export function defaultDistDirFor(exampleName) {
  const example = EXAMPLES.find(({ name }) => name === exampleName);
  return `examples/${exampleName}/${example?.distDir ?? 'dist'}`;
}
