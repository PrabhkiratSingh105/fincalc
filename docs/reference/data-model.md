# Data model

- `users` (primary key `username`): `salt`, `passwordHash`, nullable `sessionHash/sessionCreatedAt`, JSONB `history`, `configs`, `settings`, `createdAt`.
- `history`: capped array of `{id, calcType, title, summary, inputs, createdAt}` inside user JSONB.
- `configs`: object keyed by page; values are arrays of `{id,name,config,createdAt,updatedAt}`.
- `settings`: default inflation rate, custom inflation rows, portfolio array. Portfolio items retain a `resolvedConfig` snapshot.
- `public_configs`: identity id; `page`, `username`, optional `configName/config`, optional `slug/portfolio`, timestamps. Partial unique indexes protect named config per page/user and portfolio slug per page.
- Schema is in `supabase-schema.sql`. No migrations framework, foreign keys, or RLS policy is defined there; assess that deliberately before schema/security changes.
