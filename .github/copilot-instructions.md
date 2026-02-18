# Copilot Instructions: Mystery Party

## Project Overview
**Mystery Party** is a real-time multiplayer murder mystery game powered by AI (Google Gemini). Players join via a game code, receive secret roles, and must identify the killer through investigation and voting. The host controls game flow and reveals clues strategically.

**Core Pattern**: AI generates complete mysteries (story, characters, clues, killer) → stored in Supabase → distributed to players in real-time → host narrates the experience.

## Architecture & Data Flow

### Key Components

1. **Game Lifecycle**: `lobby` → `role_reveal` → `investigation` → `accusations` → `voting` → `reveal` → `finished`
   - Phases defined in [types/index.ts](types/index.ts#L1) with durations in [lib/game-utils.ts](lib/game-utils.ts)
   - Host controls phase transitions via dashboard

2. **AI Generation Pipeline** ([lib/ai-generator.ts](lib/ai-generator.ts))
   - Input: player names, locations, theme, optional notes
   - Generates JSON with: story, characters (with secrets/motives/aliases), clues, killer identity, twists
   - Uses Google Gemini 1.5 Flash (free tier, 15 req/min, 1500 req/day)

3. **Real-Time Database** ([lib/supabase.ts](lib/supabase.ts))
   - PostgreSQL via Supabase with WebSocket subscriptions
   - Tables: `games`, `players`, `roles`, `clues`, `messages`, `votes`, `game_logs`
   - All critical data subscribed for instant updates across clients

4. **API Routes** ([app/api/game/](app/api/game/))
   - `POST /api/game/create`: AI generation + database seed
   - `POST /api/game/join`: Add player to game
   - Validates input before AI calls to avoid wasted quota

### Page Structure
- `/` - Home (create/join flows)
- `/create` - Game setup form → triggers AI generation via API
- `/game/[gagame_IdmeId]` - Lobby (waiting room before role reveal)
- `/host/[game_Id]` - Host dashboard (control panel, game state, phase transitions)
- `/player/[game_Id]` - Main gameplay UI (chat, roles, voting)

## Critical Patterns

### State Management
- **Server Source of Truth**: All game state lives in Supabase
- **Real-time Subscriptions**: Listen to `games`, `messages`, `votes` tables for instant updates
- **No Client-Side State**: Calculate derived state (suspicion, phase labels) from DB on demand
- Example: [lib/game-utils.ts](lib/game-utils.ts#L52-L62) has `calculateSuspicion()` that reads votes + messages

### AI Prompt Engineering
- Prompt in [lib/ai-generator.ts](lib/ai-generator.ts) hardcodes JSON format expectation
- Parser strips markdown backticks: `text.replace(/```json|```/g, "").trim()`
- **Always validate** AI output before DB insert (check required fields: story, killer, characters, clues)
- If Gemini format changes, update parser first, then validation

### Supabase Integration
- Use snake_case column names (`host_id`, `game_id`, `is_killer`)
- All responses require `.select()` to return data
- Realtime enabled by default; use `.on('*', callback)` for subscriptions
- Game code is 6-char alphanumeric (no confusing chars like 0/O, 1/I, L)—see [lib/game-utils.ts](lib/game-utils.ts#L71-L78)

### Type Safety
- All DB models typed in [types/index.ts](types/index.ts)
- API request/response follow `AIGenerationInput` and `AIGenerationOutput` interfaces
- Player roles map 1:1 with characters from AI output

## Workflows & Commands

```bash
npm run dev          # Start dev server with hot reload
npm run build        # Production build
npm run start        # Run production build locally
npm run lint         # Check code quality
npm run lint -- --fix # Auto-fix lint issues
```

**Local Testing**:
1. Create `.env.local` with `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `GEMINI_API_KEY`
2. `npm run dev` → http://localhost:3000
3. Test create/join/host flows end-to-end

## Key Files & Responsibilities

| File | Purpose |
|------|---------|
| [lib/ai-generator.ts](lib/ai-generator.ts) | Gemini API calls, JSON parsing |
| [lib/game-utils.ts](lib/game-utils.ts) | Phase logic, suspicion calc, game code generation |
| [lib/supabase.ts](lib/supabase.ts) | DB client initialization |
| [lib/avatars.ts](lib/avatars.ts) | Avatar assignment by player index |
| [types/index.ts](types/index.ts) | All TypeScript interfaces (GameData, Player, Clue, Message, etc.) |
| [app/api/game/create/route.ts](app/api/game/create/route.ts) | Game creation orchestration |
| [supabase-schema.sql](supabase-schema.sql) | Database schema (run once in Supabase SQL editor) |

## Common Modifications

**Adding a new game phase**:
1. Add to `GamePhase` type in [types/index.ts](types/index.ts#L1)
2. Add label & duration in [lib/game-utils.ts](lib/game-utils.ts#L3-L16)
3. Add phase handler in host/player pages

**Changing AI generation scope**:
- Edit prompt in [lib/ai-generator.ts](lib/ai-generator.ts#L11-L19)
- Update `AIGenerationOutput` type to match new fields
- Update DB insert in [app/api/game/create/route.ts](app/api/game/create/route.ts#L37-L70) to handle new fields

**Adding player-facing features**:
- Store state in `messages` or `game_logs` tables (not local state)
- Subscribe in component using Supabase listener
- Host features go in `/host/[game_id]`, player features in `/player/[game_id]`

## Environment & Dependencies

- **Next.js 14** with App Router (not Pages Router)
- **React 18** with Server Components where possible
- **Tailwind + Framer Motion** for UI/animations
- **@google/genai** v1.39.0 (watch for breaking changes in new versions)
- **@supabase/supabase-js** v2.39.0 (use `from().insert().select()` pattern)
- **nanoid** for short unique IDs (game codes use custom logic instead)

## Debugging Tips

1. **AI Generation Fails**: Check Gemini API key in `.env.local` and verify quota (1500 req/day). Inspect `console.log()` at line 23 of create route.
2. **Realtime Not Updating**: Ensure `NEXT_PUBLIC_SUPABASE_ANON_KEY` has realtime permissions in Supabase dashboard (Settings → API).
3. **Type Errors**: Always update [types/index.ts](types/index.ts) before modifying DB columns.
4. **Phase Transitions**: Check `game.phase` in Supabase UI; host dashboard updates via subscription, not manual POST.
