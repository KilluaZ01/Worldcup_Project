# WorldCupBet
 
A private, room-based prediction and scoring platform for World Cup 2026 matches, with an automated data pipeline that syncs live tournament results and a custom rules engine for outcome resolution.
 
Two people join a private room via a shareable code, pick opposite sides of real World Cup matches, and the app tracks wins, losses, balances, and group-stage standings — all backed by a relational database kept in sync automatically with zero manual intervention.
 
## Why this exists
 
This started as a way to dig into a few specific engineering problems rather than just ship a CRUD app:
 
- **Idempotent data ingestion** — how do you keep a database in sync with an external data source on a schedule, without duplicating records or re-processing already-finalized data, when the source has no native unique keys for some records?
- **Consistent business logic across services** — how do you guarantee a leaderboard and a stats page never disagree about who "won," especially with a non-obvious tie-breaking rule for draws?
- **Real deployment debugging** — Python/Rust toolchain mismatches, CORS across separately-hosted services, cold-start tradeoffs on free infrastructure tiers.
## How it works
 
```
User signs up / logs in
        │
        ▼
Dashboard — create a room or join one via code
        │
        ▼
Room — browse all World Cup 2026 matches in a chronological feed
        │
        ▼
Pick a side on any upcoming match
        │
        ▼
Opponent is automatically assigned the other side, same stake
        │
        ▼
Match finishes → result synced automatically → outcome resolved
        │
        ▼
Leaderboard, stats, and group standings update
```
 
### The prediction rule
 
When either participant picks a side first, the system atomically creates **both** sides of the prediction — the second participant doesn't get to choose, they're assigned the remaining side at the same stake. This is enforced server-side, not just in the UI.
 
Outcomes resolve as you'd expect, with one deliberate twist: **on a draw, the participant who did *not* initiate the pick wins.** This is computed by a single shared function used by both the leaderboard and statistics services, so the two can never drift out of agreement.
 
## The data pipeline
 
Match data isn't entered manually. A Python script:
 
1. Fetches the full World Cup 2026 fixture list from a free, static, public-domain JSON dataset ([openfootball/worldcup.json](https://github.com/openfootball/worldcup.json))
2. Filters out unresolved knockout-stage placeholders (e.g. `"2A"`, `"W74"`) using pattern matching, since those teams aren't determined yet
3. Generates a deterministic ID for matches that have no native unique key, so re-running the sync never creates duplicates
4. Parses mixed-timezone kickoff times into proper UTC timestamps
5. Upserts into PostgreSQL — inserting new fixtures, updating only matches that have newly finished, and leaving everything else untouched
This runs automatically every 3 hours via a scheduled GitHub Actions workflow (with a manual trigger available), talking directly to the production database — completely decoupled from the API server itself.
 
**Note on the data source:** the original plan used a paid sports-data API, but its free tier didn't cover the 2026 season. Rather than pay for a hobby project, the ingestion layer was redesigned around a free static dataset mid-build — without changing the database schema or any downstream consumer of the data.
 
## Group standings
 
Group-stage tables (W/D/L, goal difference, points) aren't stored — they're computed on request, server-side, directly from raw match results using standard tournament ranking rules (points → goal difference → goals scored). This guarantees the standings are always consistent with whatever the latest sync produced, with no separate cache to keep in sync.
 
## Tech stack
 
**Backend**
- FastAPI (Python)
- PostgreSQL ([Neon](https://neon.tech), serverless)
- SQLAlchemy (ORM)
- JWT-based authentication (`python-jose`, `passlib`)
- Deployed on [Render](https://render.com)
**Data sync**
- Standalone Python script, scheduled via GitHub Actions cron workflow
- [openfootball/worldcup.json](https://github.com/openfootball/worldcup.json) as the data source
**Frontend**
- React + TypeScript + Vite
- TailwindCSS
- Deployed on [Vercel](https://vercel.com)
## Project structure
 
```
backend/
├── app/
│   ├── core/          # DB connection, settings, room-resolution helpers
│   ├── models/        # SQLAlchemy models (User, Room, Participant, Match, Bet, Result)
│   ├── routers/        # FastAPI route handlers (auth, rooms, matches, bets, leaderboard, stats)
│   ├── schemas/        # Pydantic request/response schemas
│   └── services/       # Business logic (leaderboard, stats, standings, sports data client)
├── scripts/             # One-off migration scripts + the sync pipeline
└── requirements.txt
 
frontend/
├── src/
│   ├── components/      # Reusable UI (match cards, modals, user menu, etc.)
│   ├── context/         # Room context (resolves room from URL, not local cache)
│   ├── lib/             # API client, theming helpers
│   ├── pages/           # Route-level pages (Dashboard, Bet Feed, History, Leaderboard, Stats)
│   └── types.ts
└── package.json
 
.github/workflows/
└── sync-worldcup.yml    # Scheduled job that runs the data sync every 3 hours
```
 
## Notable engineering decisions
 
- **Global match model, room-scoped predictions.** Matches exist once in the database regardless of how many rooms reference them; only predictions (`Bet` rows) are room-scoped. This avoids data duplication and keeps the sync pipeline simple — it never needs to know which rooms exist.
- **Room identity resolved from the URL, not local storage.** An earlier version cached the active room in `localStorage`, which caused stale-data bugs when switching between rooms without going through the join flow. Every room-scoped page now resolves the room fresh from the URL on mount via a shared `RoomContext`, and several data-fetching functions now require an explicit room ID parameter — making the entire bug class a compile-time error rather than a runtime one.
- **Shared outcome-resolution logic.** The leaderboard and statistics services both import a single `bet_wins()` function rather than each implementing the win/loss/draw rule independently — a deliberate refactor after finding the two had briefly drifted apart during development.
## Running locally
 
**Backend**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
cp .env.example .env      # fill in DATABASE_URL, JWT_SECRET, etc.
uvicorn app.main:app --reload
```
 
**Frontend**
```bash
cd frontend
npm install
cp .env.example .env.local  # set VITE_API_URL to your backend URL
npm run dev
```
 
**Run the data sync manually**
```bash
cd backend
python -m scripts.sync_worldcup
```
 
## Live demo
 
[your-deployed-url.vercel.app](https://your-deployed-url.vercel.app)
 
---
 
Built as a personal project to explore data pipeline design, server-side business logic consistency, and full deployment ownership — not a production gambling product, and not affiliated with FIFA or any official World Cup data provider.
