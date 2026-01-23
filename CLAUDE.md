# MathClicks - Claude Code Guide

## Project Overview

MathClicks is an iPad-first educational app that transforms whiteboard photos into personalized math practice. Students photograph their teacher's whiteboard, and the app uses Claude AI to extract math content and generate adaptive practice problems.

## Architecture

```
mathclicks/
├── src/                    # Backend (Express + TypeScript)
│   ├── server.ts           # Main Express server with all API routes
│   ├── api/                # API clients
│   │   └── claude-client.ts
│   ├── lib/                # Core business logic
│   │   ├── image-extraction.ts    # Claude vision for whiteboard analysis
│   │   ├── problem-generation.ts  # AI problem generation
│   │   ├── answer-validation.ts   # Answer checking logic
│   │   ├── mastery-tracker.ts     # Adaptive difficulty tracking
│   │   ├── problem-selection.ts   # Smart problem selection
│   │   ├── supabase.ts            # Database client
│   │   └── ...
│   ├── import/             # Problem bank import pipeline
│   │   ├── engage-ny-importer.ts
│   │   ├── problem-normalizer.ts
│   │   └── scripts/
│   └── types/              # TypeScript types
│       └── database.ts     # Database schema types
│
├── frontend/               # Next.js 16 App Router
│   ├── app/
│   │   ├── page.tsx        # Home page (image upload or class join)
│   │   ├── practice/       # Practice session page
│   │   └── api/            # Next.js API routes (proxy to backend)
│   ├── components/         # React components
│   │   ├── ProblemCard.tsx
│   │   ├── DiagramRenderer.tsx   # SVG diagram rendering
│   │   ├── MathRenderer.tsx      # KaTeX math rendering
│   │   ├── WorkCanvas.tsx        # Drawing canvas
│   │   └── ...
│   ├── hooks/
│   │   └── usePracticeSession.ts # Main session state management
│   └── lib/
│       └── types.ts        # Frontend TypeScript types
│
├── supabase/               # Database
│   ├── schema.sql          # Full database schema
│   ├── seed-standards.sql  # CCSS math standards
│   └── migrations/         # Schema migrations
│
└── data/                   # Static data files
    └── engage-ny/          # Sample problems (JSON/CSV)
```

## Key Concepts

### 5-Tier Difficulty System
Problems are rated 1-5:
- **Tier 1**: Warmup (basic recall)
- **Tier 2**: Easy (single-step)
- **Tier 3**: Medium (multi-step)
- **Tier 4**: Hard (complex application)
- **Tier 5**: Challenge (advanced)

### Adaptive Mastery
- Students progress through tiers based on consecutive correct/incorrect answers
- 3 correct in a row → tier up
- 2 incorrect in a row → tier down
- Mastery is tracked per CCSS standard

### Diagram Types
The app supports 8 diagram types for visual math problems:
- `coordinate_plane` - Graphs, points, lines, functions
- `geometry` - Shapes, angles, measurements
- `number_line` - Number positions, intervals
- `bar_model` - Part-whole relationships
- `area_model` - Multiplication visualization
- `tape_diagram` - Comparison problems
- `angle` - Angle measurement
- `circle_graph` - Pie charts

## Common Tasks

### Running the App
```bash
# Backend (from root)
npm run dev          # Runs on port 3001

# Frontend (from frontend/)
npm run dev          # Runs on port 3000
```

### Building
```bash
# Backend
npm run build        # TypeScript → dist/

# Frontend
cd frontend && npm run build
```

### Testing
```bash
npm test             # Run all tests
npm run test:watch   # Watch mode
```

### Importing Problems
```bash
# Import from JSON (requires Supabase configured)
npx tsx src/import/scripts/import-engage-ny.ts data/engage-ny/diagram-problems.json

# Dry run (validate only)
npx tsx src/import/scripts/import-engage-ny.ts data/file.json --dry-run
```

### Database Migrations
Migrations are in `supabase/migrations/`. Run them manually in Supabase SQL Editor.

## Environment Variables

```bash
# Required
ANTHROPIC_API_KEY=sk-...

# Optional (enables problem bank & mastery tracking)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_KEY=eyJ...
```

## Code Conventions

### TypeScript
- Strict mode enabled
- Use Zod for runtime validation of AI responses
- Types shared between frontend/backend in respective `types.ts` files

### API Routes
- Backend: Express routes in `src/server.ts`
- Frontend: Next.js API routes proxy to backend or call Claude directly

### State Management
- Frontend uses React hooks + localStorage for persistence
- `usePracticeSession` hook manages all session state

### Styling
- Tailwind CSS for all styling
- Framer Motion for animations
- Mobile-first, iPad-optimized

## Important Files

| File | Purpose |
|------|---------|
| `src/server.ts` | All backend API routes |
| `src/lib/problem-generation.ts` | AI problem generation prompts |
| `src/lib/answer-validation.ts` | Answer checking with tolerance |
| `frontend/hooks/usePracticeSession.ts` | Session state management |
| `frontend/components/DiagramRenderer.tsx` | SVG diagram rendering |
| `frontend/lib/types.ts` | All frontend TypeScript types |
| `src/types/database.ts` | Database schema types |

## Current Work in Progress

### Diagram Support (partially complete)
- [x] DiagramRenderer component (8 diagram types)
- [x] Type definitions for all diagram types
- [x] Import pipeline supports diagram fields
- [x] Sample diagram problems in `data/engage-ny/diagram-problems.json`
- [ ] Database migration needs to be applied
- [ ] Sample problems need to be imported

To complete:
1. Run `supabase/migrations/001_add_diagram_support.sql` in Supabase SQL Editor
2. Run: `npx tsx src/import/scripts/import-engage-ny.ts data/engage-ny/diagram-problems.json`
