/** Intentional stdout for CLI scripts and generators. */
export function log(message = '') {
  process.stdout.write(`${message}\n`);
}
