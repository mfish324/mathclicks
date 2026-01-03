# MathClicks Tech Stack

## Overview

MathClicks is a full-stack TypeScript application with a Node.js backend and Next.js frontend. It uses Claude AI for image analysis and problem generation.

---

## Backend

### Runtime & Language
- **Node.js 20+** - JavaScript runtime
- **TypeScript 5** - Type-safe JavaScript with compile-time checks

### Framework & Server
- **Express 5** - Minimal web framework for REST API
- **Multer** - Middleware for handling file uploads (images)
- **CORS** - Cross-origin resource sharing for frontend communication

### AI Integration
- **Anthropic SDK** - Official Claude API client
- **Claude Sonnet 4** - Vision model for image extraction and problem generation

### Validation & Types
- **Zod** - Runtime schema validation for API inputs/outputs and AI responses

---

## Frontend

### Framework
- **Next.js 16** - React framework with App Router
- **React 19** - UI component library

### Styling
- **Tailwind CSS 4** - Utility-first CSS framework
- **Framer Motion** - Animation library for smooth transitions

### Math Rendering
- **KaTeX** - Fast LaTeX math rendering in the browser

### UI Components
- **Radix UI** - Accessible, unstyled component primitives
- **Lucide React** - Icon library
- **React Dropzone** - Drag-and-drop file uploads

### State Management
- **React Hooks** - Built-in state management (useState, useEffect, useCallback)
- **localStorage** - Client-side session persistence

---

## Testing

- **Vitest** - Fast unit test framework (Jest-compatible)
- **Supertest** - HTTP assertion library for API testing
- **V8 Coverage** - Code coverage reporting

---

## CI/CD

- **GitHub Actions** - Automated testing and builds
  - Runs on Node 20.x and 22.x
  - Type checking for backend and frontend
  - Full test suite execution
  - Production builds

---

## Development Tools

- **ts-node** - Run TypeScript directly without compilation
- **dotenv** - Environment variable management
- **ESLint** - Code linting

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                            │
│                    (Next.js 16 + React 19)                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ Image       │  │ Practice    │  │ Session             │  │
│  │ Uploader    │  │ Interface   │  │ Management          │  │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘  │
│         │                │                     │             │
│         └────────────────┼─────────────────────┘             │
│                          │                                   │
│                    localStorage                              │
│                   (Session Persistence)                      │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP/REST
                           ▼
┌──────────────────────────────────────────────────────────────┐
│                      Backend API                             │
│                   (Express + TypeScript)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │ /api/        │  │ /api/        │  │ /api/            │   │
│  │ process-image│  │ check-answer │  │ generate-problems│   │
│  └──────┬───────┘  └──────┬───────┘  └────────┬─────────┘   │
│         │                 │                    │              │
│         ▼                 ▼                    ▼              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              Core Pipeline                          │    │
│  │  ┌─────────────┐ ┌─────────────┐ ┌───────────────┐  │    │
│  │  │ Image       │ │ Problem     │ │ Answer        │  │    │
│  │  │ Extraction  │ │ Generation  │ │ Validation    │  │    │
│  │  └──────┬──────┘ └──────┬──────┘ └───────────────┘  │    │
│  │         │               │                           │    │
│  └─────────┼───────────────┼───────────────────────────┘    │
│            │               │                                 │
└────────────┼───────────────┼─────────────────────────────────┘
             │               │
             ▼               ▼
┌─────────────────────────────────────────────────────────────┐
│                      Claude API                             │
│                  (Anthropic Claude Sonnet 4)                │
│                                                             │
│   • Vision: Extract math content from whiteboard photos     │
│   • Generation: Create adaptive practice problems           │
│   • 5 difficulty tiers for progressive learning             │
└─────────────────────────────────────────────────────────────┘
```

---

## Key Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@anthropic-ai/sdk` | ^0.71 | Claude API client |
| `express` | ^5.2 | Web server |
| `next` | ^16.0 | React framework |
| `react` | ^19.0 | UI library |
| `zod` | ^4.1 | Schema validation |
| `katex` | ^0.16 | Math rendering |
| `vitest` | ^4.0 | Testing |
| `typescript` | ^5.9 | Type system |

---

## Why These Choices?

**TypeScript everywhere** - Catches errors at compile time, better IDE support, self-documenting code.

**Next.js App Router** - Server components, API routes co-located with frontend, excellent DX.

**Express over Next.js API routes for backend** - Cleaner separation, easier to scale independently, better for file uploads.

**Zod for validation** - Runtime type checking for AI responses (which can be unpredictable), great TypeScript inference.

**KaTeX over MathJax** - 10x faster rendering, smaller bundle size, perfect for real-time math display.

**Vitest over Jest** - Native TypeScript support, faster execution, same API as Jest.

**localStorage for sessions** - Simple, no backend required for MVP, works offline.
