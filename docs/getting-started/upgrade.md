# Upgrading an existing Bronto UI consumer

Treat pre-1.0 minor upgrades as coordinated UI changes. Green library CI proves package contracts;
it cannot guarantee that an application's custom overrides, real data, and user journeys are still good.

## Make the change in the consumer's own branch

Record the current Bronto UI version and its CSS/behavior imports.
Install the target release (the example below uses the current published version):

```bash
npm install @ponchia/ui@0.16.0
```

For projects coming from 0.9 or 0.11, review the migration steps in order:

- [0.9 → 0.10](../migrations/0.9-to-0.10.md): composition and API changes
- [0.10 → 0.11](../migrations/0.10-to-0.11.md): narrow layouts and typography roles
- [0.11 → 0.12](../migrations/0.11-to-0.12.md): data/renderer color contracts

Review the [changelog](../../CHANGELOG.md) for releases after 0.12 up to your target.
A release without a separate migration page may still affect appearance.

## Verify the application itself

1. Inventory Bronto CSS imports, tokens, and custom overrides.
2. Run the consumer's existing typecheck, production build, and automated tests.
3. Check actual application screens in both themes, with keyboard input, narrow layouts, and empty/loading/error states.
4. Review print/PDF outputs if the app uses report leaves.
5. Run the shipped class and token checker from a consumer with the package installed:

   ```bash
   npx --no-install bronto-ui-check src
   ```

   It catches unknown literal Bronto classes and token references, not dynamic class strings or visual regressions.
6. Record how much duplicate CSS and behavior code the shared library can replace. Prefer deletion over another abstraction.

The [stability contract](../stability.md) defines compatibility policy.
The [machine-readable migration map](../../MIGRATIONS.json) distinguishes mechanically safe from manual renames.

## Record the result

Compare screenshots, core workflows, font and layout changes, remaining overrides, regressions, and deleted duplicated code.
A successful package installation alone is not adoption evidence.

Complete consumer upgrades belong in their **own repositories**. This page describes how to review them without changing those projects here.
