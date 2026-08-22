/**
 * Public Database types.
 *
 * Source of truth is the live-schema dump in `database.generated.ts`.
 * Regenerate after migrations: `npm run types:generate`
 * Guard: `npm run types:check`
 *
 * Do not add hand-written tables here. See `.claude/rules/data-model.md`.
 */

export type {
  Json,
  Database,
  Tables,
  TablesInsert,
  TablesUpdate,
  Enums,
} from './database.generated';
