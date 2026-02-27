# Migration notes: app tables + enums

## Overview

This migration adds app-domain models and enums while keeping existing NextAuth models (`User`, `Account`, `Session`, `VerificationToken`). All session/response data is scoped to a relationship via foreign keys.

## Tables and relations

| Table | Purpose | Key relations |
|-------|---------|----------------|
| **users** | NextAuth `User` (unchanged) | — |
| **relationships** | A pair/group (e.g. couple) | Has many members, invites, daily_sessions, streaks, subscriptions |
| **relationship_members** | User ↔ Relationship join | `relationship_id`, `user_id`; unique(relationship_id, user_id) |
| **invites** | Invite codes to join a relationship | `relationship_id`, `invited_by` (user); unique(code) |
| **prompts** | Prompt text for daily sessions | Category/tone enums; referenced by daily_sessions |
| **daily_sessions** | One session per relationship per day | `relationship_id`, `prompt_id`; unique(relationship_id, session_date) |
| **responses** | User’s answer in a session | `session_id`, `user_id`; unique(session_id, user_id) |
| **reflections** | Follow-up on a response | `response_id`, `user_id` |
| **streaks** | Streak counter (user or relationship) | `user_id`, optional `relationship_id` |
| **subscriptions** | Stripe subscription (user or relationship) | `user_id`, optional `relationship_id` |

## Enums

- **RelationshipStatus**: `active`, `archived`
- **InviteStatus**: `pending`, `accepted`, `expired`
- **PromptCategory**: `gratitude`, `communication`, `reflection`, `fun`, `growth`, `other`
- **PromptTone**: `light`, `deep`, `playful`, `serious`
- **SessionState**: `draft`, `active`, `completed`
- **SubscriptionStatus**: `active`, `canceled`, `past_due`, `trialing`

## Unique constraints

- `relationship_members`: `@@unique([relationshipId, userId])`
- `invites`: `code` unique
- `daily_sessions`: `@@unique([relationshipId, sessionDate])`
- `responses`: `@@unique([sessionId, userId])`

## Indices

- **relationship_id**: `RelationshipMember`, `Invite`, `DailySession`, `Streak`, `Subscription`
- **user_id**: `RelationshipMember`, `Response`, `Reflection`, `Streak`, `Subscription`
- **session_date**: `DailySession`
- **code**: `Invite`
- **session_id**, **response_id**: `Response`, `Reflection`
- **status**: `Relationship`, `Subscription`
- **category**, **active**: `Prompt`
- **last_activity_date**: `Streak`

## Timestamps

All app models have `createdAt` and `updatedAt` (and `joinedAt` on `RelationshipMember` where relevant).

## How to run

1. **From a clean DB (no prior app tables)**  
   Create and apply the migration:
   ```bash
   npx prisma migrate dev --name add_app_tables
   ```

2. **If you already have existing migrations**  
   The new schema adds models and enums. Prisma will generate a migration that:
   - Creates enums
   - Creates new tables with FKs to `User` and to each other as in the schema
   - Adds the unique constraints and indices above

3. **Regenerate client after schema or migration changes**
   ```bash
   npx prisma generate
   ```

## Data scope

- **daily_sessions** and **responses** are scoped to a relationship: each `DailySession` has `relationship_id`, and each `Response` belongs to a `DailySession`, so responses are implicitly scoped by relationship.
- **streaks** and **subscriptions** support both user-level and relationship-level use via optional `relationship_id`.

## Breaking changes from previous schema

- **User**: No field changes; only new relations added. NextAuth behavior is unchanged.
- **Account / Session / VerificationToken**: Unchanged.
- Any existing app tables not in this list would need to be merged or dropped before applying this migration; adjust the schema or write a custom migration if you have existing `relationships`, `invites`, etc.
