# v0 by Vercel — Expert Skill File Supplement

---

## SECTION 1 — v0 Model API

### API Endpoint & Base URL
- **Base URL**: `https://api.v0.dev` (NOT api.v0.app)
- **Chat Completions**: `POST https://api.v0.dev/v1/chat/completions` — OpenAI-compatible format
- **Platform API**: `https://api.v0.dev/v1` — RESTful endpoints for projects, chats, deployments, files
- **Enterprise URL**: `https://api.enterprise.v0.dev` (custom option in SDK)

### Authentication
- **API key generated at**: `https://v0.app/chat/settings/keys`
- **Auth method**: Bearer token — `Authorization: Bearer $V0_API_KEY`
- **SDK env var**: `V0_API_KEY` (auto-read by `v0-sdk`)
- **Prerequisite**: Requires **Premium ($20/mo) or Team ($30/user/mo)** with usage-based billing enabled. Free tier cannot use the API.

### OpenAI SDK Compatibility
- **Fully OpenAI-compatible**. Use any OpenAI SDK by changing only the base URL:
```python
from openai import OpenAI
client = OpenAI(base_url="https://api.v0.dev/v1", api_key="your-v0-api-key")
response = client.chat.completions.create(
    model="v0-1.5-md",
    messages=[{"role": "user", "content": "Create a React card component"}]
)
```
- **Vercel AI SDK** (recommended):
```ts
import { createOpenAI } from '@ai-sdk/openai'
const vercel = createOpenAI({ baseURL: 'https://api.v0.dev/v1', apiKey: process.env.V0_API_KEY })
const { text } = await generateText({ model: vercel('v0-1.5-md'), prompt: '...' })
```
- **LiteLLM** has native support: `model="v0/v0-1.5-md"`

### Model ID Strings

| API Model ID | Context Window | Max Output | Notes |
|---|---|---|---|
| `v0-1.5-md` | 128K tokens | 64K tokens | Medium — everyday tasks, UI generation. Base: Anthropic Sonnet 4 |
| `v0-1.5-lg` | 512K tokens | 64K tokens | Large — advanced thinking/reasoning |
| `v0-1.0-md` | 128K tokens | 32K tokens | Legacy medium. Base: Anthropic Sonnet 3.7 |

- **v0 Mini / Pro / Max / Max Fast** are UI-only model names in the v0.app chat interface. Their exact mapping to API model IDs is **not publicly documented**. The API docs only expose `v0-1.5-md` and `v0-1.5-lg`.
- The composite pipeline wraps base LLMs with a RAG layer, LLM Suspense streaming manipulation, and the custom `vercel-autofixer-01` model.

### In-App Model Token Pricing

| Model | Input | Cache Write | Cache Read | Output |
|---|---|---|---|---|
| v0 Mini | $1/1M | $1.25/1M | $0.10/1M | $5/1M |
| v0 Pro | $3/1M | $3.75/1M | $0.30/1M | $15/1M |
| v0 Max | $5/1M | $6.25/1M | $0.50/1M | $25/1M |
| v0 Max Fast | $30/1M | $37.50/1M | $3/1M | $150/1M |

### Cursor Integration (Verified — from v0.app/docs/cursor)
1. Open **Cursor Settings** (`⌘+Shift+J` / `Ctrl+Shift+J`)
2. Go to **Models** tab
3. Scroll to **OpenAI API Key** → paste your v0 API key
4. Click **Override OpenAI Base URL** → enter `https://api.v0.dev/v1`
5. Click **Add Custom Model** → enter `v0-1.5-md` and/or `v0-1.5-lg`
6. Click **Save** → **Verify**
7. In Cursor chat, select **Agent** mode → choose the v0 model from dropdown
- This is NOT through AI rules, config files, or MCP — it uses Cursor's built-in OpenAI-compatible provider settings.

### Zed Integration (Verified — from v0.app/docs/zed)
- Add to Zed settings JSON:
```json
"language_models": {
  "openai": {
    "api_url": "https://api.v0.dev/v1",
    "version": "1"
  }
}
```
- Model `v0-1.5-md` appears in Zed's Agent Panel dropdown after adding the API key.

### Cline Integration (Verified — from docs.cline.bot)
- Set API Provider to "OpenAI Compatible" → Base URL `https://api.v0.dev/v1` → enter API key → model ID `v0-1.5-md`

### Supported Parameters
| Parameter | Supported | Notes |
|---|---|---|
| `model` | ✅ Required | `v0-1.5-md`, `v0-1.5-lg`, `v0-1.0-md` |
| `messages` | ✅ Required | `user`, `assistant`, `system` roles |
| `stream` | ✅ | SSE format, `data:` prefixed JSON chunks |
| `tools` | ✅ | Function/tool definitions |
| `tool_choice` | ✅ | Control tool calling behavior |
| `temperature` | ❌ | **Not supported** per LiteLLM docs |
| `max_tokens` | ❌ | **Not supported** |
| `top_p`, `frequency_penalty` | ❌ | **Not supported** |

- Supports multimodal: text + base64-encoded images in message content arrays.

### Rate Limits & Quotas

| Resource | Limit |
|---|---|
| API Requests/day | 10,000 |
| Chat Messages/day | 1,000 |
| Max messages/day (v0-1.0-md) | 200 |
| Deployments/day | 100 |
| File Uploads/day | 1GB total |
| Files per project | 1,000 (3MB max per file) |
| Chats per project | 1,000 |
| GitHub Imports/day | 50 |

- Specific RPM/TPM limits for v0-1.5 models are **not publicly documented**. Contact support@v0.dev for higher limits.

### Official SDKs & Repos
- **v0-sdk** (github.com/vercel/v0-sdk): Full SDK monorepo — packages `v0-sdk`, `@v0-sdk/react`, `@v0-sdk/ai-tools`, `create-v0-sdk-app`
- **v0-language-model-chat-provider** (GitHub): VS Code extension providing v0 models via Language Model API
- **@v0-sdk/ai-tools**: Enables using v0 as a tool within AI agent workflows

### Unverified
- Exact mapping of Mini/Pro/Max to API model IDs — likely Mini=v0-1.5-md, Max=v0-1.5-lg but unconfirmed
- Exact RPM/TPM limits per tier beyond the daily totals above
- Whether v0 Max Fast has a distinct API model ID

---

## SECTION 2 — Error Patterns and Debugging

### Top 10 Error → Cause → Fix Reference

| # | Error / Symptom | Root Cause | Fix |
|---|---|---|---|
| **1** | `Module not found: Can't resolve '.../lucide-react/dist/esm/icons/pen-square'` or `Attempted import error: 'LoaderCircle' is not exported from 'lucide-react'` | LLM training data contains outdated Lucide icon names. Lucide updates weekly, renaming/removing icons. | v0's AutoFix embeds icon names in a vector DB and auto-swaps closest match within 100ms. **User workaround**: check icon existence at lucide.dev/icons, pin `lucide-react` to a specific version, import from package root not dist paths. |
| **2** | Layout looks correct in v0 preview but CSS is missing/broken after deploy — "the live deployed production site is severely crashed" | Tailwind CSS purging removes dynamically-generated classes in production. `globals.css` CSS custom properties or `@layer` directives may not transfer correctly. ESM module loading differences between v0 sandbox and production. | Always run `npm run build` locally before deploying. Verify `tailwind.config.js` content paths include all component directories. Confirm `globals.css` is imported in `layout.tsx`. Check `next.config.js` for required experimental flags. |
| **3** | Manual edits disappear: "Extensive manual changes saved yesterday reverted to the last generated version" / "The agent does not recognise any manual file editing" | v0's agent tracks only AI-generated state. Manual edits in the browser editor may not persist because the agent regenerates from its blueprint. | Keep custom code in separate files v0 won't touch. Use marker comments (`// BEGIN MANUAL SECTION`). **Best fix**: export to local dev + manage via Git. Use v0 Projects with GitHub integration. |
| **4** | `Failed to upload XYZ`, `Failed to load image from v0.blob.com/...`, `Vercel Blob: Access denied, please provide a valid token` | Rate limiting or quota on Vercel Blob storage backend. Auth token expiration during long sessions. Files contribute to context window size. | Refresh page/start new session. Host images externally and reference URLs. Reduce file sizes. Try a different browser. Often resolves on its own (intermittent server-side). |
| **5** | Chrome memory usage 6–10GB, tab unresponsive, 29-33 minute load times | Long chat histories (30-90+ prompts) load entire chat + rendered previews in memory. Projects with many versions accumulate massive DOM/JS state. | **Fork/duplicate to new project every 20-30 prompts** — primary fix. Close/reopen browser between sessions. Use dedicated browser profile for v0. |
| **6** | `Error: P1001: Can't reach database server at 'db.xxx.supabase.co:5432'` / "both Supabase and Neon packages are completely broken in the v0 preview environment due to ESM module loading issues" | Neon cold-start timeout (5s default too short). IPv6 vs IPv4 mismatch with Supabase. ESM module incompatibility in v0's browser sandbox. Env vars not propagating to preview. | Add `?connect_timeout=10` for Neon. Use Supavisor session mode or IPv4 add-on for Supabase. Verify env vars exist in v0 settings. **Test on deployed version, not just preview.** |
| **7** | "You are close to exceeding the content window for this chat. Try starting a new chat." / "Your message and attachment exceed the context window" | Extended sessions (30-70+ prompts) exhaust the model's context window. File attachments accelerate consumption. | **Fork the chat** — creates new chat with current project state, resetting context. Create a v0 Project to share codebase across chats without carrying history. Export to local and start fresh. |
| **8** | `Module not found: Can't resolve '@radix-ui/react-dialog'` / `Cannot find module 'autoprefixer'` / `ERESOLVE unable to resolve dependency tree` | v0 preview has all deps pre-installed; exported code may reference packages not in user's `package.json`. Version mismatches between v0's internal deps and local env (React 18 vs 19, Next.js 13 vs 14 vs 15). | Compare v0's `package.json` with yours and align versions. Run `npx shadcn@latest add` for missing shadcn components. Ensure `@/` path aliases configured in `tsconfig.json`. Use `npm install --legacy-peer-deps` for peer dep conflicts. |
| **9** | AutoFix enters infinite repair loop: "Every edit v0 makes is quickly reverted back and it's looping" / v0 starts auto-editing without user prompt, breaking the app | AutoFix's composite pipeline (`vercel-autofixer-01`) triggers repeatedly when fixes introduce new errors. Can activate unsolicited on code it detects as broken. | Manually revert to a previous version. Start a new chat from the last working state. For looping: wait for it to stop, then fork. Multi-file and cross-dependency errors are beyond AutoFix's scope. |
| **10** | Cascading error loops: "v0 got stuck in a cycle of errors — every time I tried to fix one, a new one popped up" / requesting a small change causes unnecessary modifications to other files | v0's agent sometimes makes broad changes beyond the requested scope, breaking working functionality. Context pollution from accumulated chat history. | Make atomic, single-change requests. Fork to a fresh chat with clean context. Explicitly instruct: "Only modify [specific file], do not change any other files." Use restore points to roll back. |

### AutoFix Pipeline Detail
The composite pipeline has four layers:
1. **Dynamic System Prompt** — injects current SDK versions, framework APIs to prevent outdated code
2. **LLM Suspense** — streaming find-and-replace that fixes icon imports, shortens blob URLs in real-time
3. **vercel-autofixer-01** — custom model trained via reinforcement fine-tuning (RFT) with Fireworks AI. Runs <250ms. Repairs common JSX/TypeScript errors.
4. **Post-stream linter** — catches style inconsistencies after streaming completes

AutoFix catches ~10% error rate in LLM-generated code. It **fails** on: multi-file dependency chains, missing npm packages, environment config issues, complex state logic bugs, and self-referential error loops.

---

## SECTION 3 — AI SDK Integration

### Default AI SDK Version
- v0 generates code using **AI SDK v5/v6 patterns** (AI SDK 6.0 released December 2025). Key indicators: `import { useChat } from '@ai-sdk/react'` (not old `'ai/react'`), `convertToModelMessages` (not old `convertToCoreMessages`), `toUIMessageStreamResponse()` (not old `toDataStreamResponse()`), `sendMessage` (not old `handleSubmit`).
- Older v0 chats and third-party guides may reference v3/v4 patterns — these are deprecated.

### What v0 Generates for "Build Me a Chatbot"

**Files created** (two-part architecture):

**1. `app/api/chat/route.ts`** (Server-side Route Handler):
```typescript
import { streamText, convertToModelMessages, UIMessage } from "ai";
export const maxDuration = 30;
export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();
  const result = streamText({
    model: "openai/gpt-5-mini", // or any AI Gateway string
    system: "You are a helpful assistant.",
    messages: await convertToModelMessages(messages),
  });
  return result.toUIMessageStreamResponse();
}
```

**2. `components/Chat.tsx`** or `app/page.tsx` (Client Component):
```typescript
"use client";
import { useChat } from "@ai-sdk/react";
export default function Chat() {
  const { messages, sendMessage, status } = useChat();
  // Renders messages using message.parts array, input form, send button
}
```

**3. `app/page.tsx`** — mounts the chat component.

### Connecting LLM Providers

**Method 1 — Vercel AI Gateway (default, zero setup):**
- Pass model as a string: `model: "openai/gpt-5-mini"`, `model: "anthropic/claude-sonnet-4.6"`, `model: "google/gemini-3-flash"`
- Pre-configured in AI SDK v5+. Supports 20+ providers.

**Method 2 — Connect Panel (Marketplace):**
- Click **Connect** in v0 sidebar → available: **Groq**, **fal** (image gen), **Deep Infra**, **Grok by xAI**
- One-click install via Vercel Marketplace.

**Method 3 — Environment Variables (Vars panel):**
- Click **Vars** in sidebar → add `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GOOGLE_API_KEY`, etc.

**Method 4 — Direct Provider SDK (for exported code):**
```typescript
import { openai } from '@ai-sdk/openai';
streamText({ model: openai('gpt-5.4'), ... })
```

### Core Hooks & Functions

| Hook/Function | Import | Purpose |
|---|---|---|
| `useChat` | `@ai-sdk/react` | Multi-turn streaming chat. Returns `{ messages, sendMessage, status, error, reload }`. Default endpoint: `/api/chat` |
| `useCompletion` | `@ai-sdk/react` | Single-turn text completions. May be deprecated in v5/v6. |
| `useObject` | `@ai-sdk/react` | Stream structured JSON object generation |
| `streamText` | `ai` | Server-side streaming text generation. Returns result with `.toUIMessageStreamResponse()` |
| `generateText` | `ai` | Server-side non-streaming text generation |
| `convertToModelMessages` | `ai` | Converts UIMessage[] to model-compatible format (replaces old `convertToCoreMessages`) |

### v5/v6 Breaking Changes from v4
- `sendMessage({ text: input })` replaces `handleSubmit`
- `message.parts` array replaces `message.content` string
- `toUIMessageStreamResponse()` replaces `toDataStreamResponse()`
- `convertToModelMessages` replaces `convertToCoreMessages`
- `UIMessage` type replaces `Message` type

### Tool Calling Pattern
```typescript
import { streamText, tool } from 'ai';
import { z } from 'zod';
const result = streamText({
  model: "openai/gpt-5-mini",
  messages: await convertToModelMessages(messages),
  tools: {
    getWeather: tool({
      description: 'Get weather for a location',
      inputSchema: z.object({ location: z.string() }),
      execute: async ({ location }) => ({ location, temperature: 72 }),
    }),
  },
  maxSteps: 5, // allow multi-step tool calls
});
```
Three tool types: server-side (auto-executed), client-side auto-executed (`onToolCall` callback), client-side user-interaction (rendered in UI, user provides input).

### AI SDK v6 Agent Abstraction (since Jan 21, 2026)
```typescript
import { ToolLoopAgent } from 'ai';
const agent = new ToolLoopAgent({
  model: 'openai/gpt-5.4',
  system: 'You are a helpful agent.',
  tools: { /* ... */ },
});
```

---

## SECTION 4 — v0 Blocks

### Official Definitions
- **Component** = UI primitive (atom): Button, Input, Switch, Card. The foundational building blocks from shadcn/ui.
- **Block** = Composed UI section (molecule/organism): Dashboard layout, navbar, login form, hero section. Assembled from multiple components.
- **App** = Full multi-page Next.js application with routing, shared layouts, navigation, and potentially backend logic.
- **Starter** = Pre-configured project template with database integrations (Supabase Starter, Neon Starter).

The v0 community categorizes submissions into: **Apps, Games, Sites, Components, Blocks, Starters**.

### Creating a Block
- **In v0 chat**: Describe what you want. v0 generates a Block rendered in the chat preview. Example: "Create a dashboard with sidebar, stats cards, and a chart."
- **In a custom registry**: Create component code, add a `registry-item` entry in `registry.json` with `type: "registry:block"`, specify `registryDependencies` and file paths, deploy registry, and navigate to `/registry/[name]` for an "Open in v0" button.
- **Installation**: `npx shadcn@latest add "URL"` installs blocks into existing projects.

### Remixing Community Blocks
- Browse at `v0.app/community` — filter tabs: All, Apps, Games, Sites, Components, Blocks, Starters, Trending.
- Click **Fork** on any community project to create your own editable copy.
- Registry-hosted blocks have an **"Open in v0"** button that transfers metadata, files, and design tokens to v0.app with full context.

### Most Popular Blocks (by fork count)
- Pointer AI Landing Page (~19.1K forks), Crypto Dashboard (~13.2K), Financial Dashboard (~10.4K), Restaurant POS (~10.3K), Creative Agency Portfolio (~10.1K), Shaders Hero Section (~10.5K), Hero Geometric Background (~9.1K), Logo Particles (~8.7K), Two-column Login Card (~7K), Sidebar Layout (~5K)

### Server-Side Logic
- **Standalone Blocks in chat are client-rendered.** Per the FAQ: "only the React v0 Block can execute that code in your browser."
- **Full v0 Projects** (with sandbox runtime) can include Next.js server-side capabilities: API routes, Server Components, Server Actions, database connections.
- v0 remains fundamentally frontend-first — no built-in ORM, no server-side business logic layer beyond what Next.js provides.

### Blocks vs. shadcn/ui Components
- shadcn/ui components are generic, reusable **UI primitives** (atoms) — copy-pasted source code, not npm deps, built with Tailwind + Radix UI.
- v0 Blocks are **higher-level, opinionated compositions** that combine primitives into functional UI sections. Blocks are what v0 generates; components are what Blocks are made of.
- Both are shareable via the shadcn Registry system.

---

## SECTION 5 — Database Integrations

### General Architecture
- v0 supports **4 databases** via Connect panel: **Supabase, Neon, Upstash, Vercel Blob**
- Additional Connect panel services: Groq, Grok, fal, Deep Infra (AI models), Stripe (payments)
- **v0 connects to databases without ORMs by default** — generates raw SQL, native SDK calls, or `@neondatabase/serverless`
- Env vars flow: Connect panel → Vercel Marketplace provisioning → env vars injected into Vercel project → accessible in v0 code and deployments

### Supabase — Step-by-Step

1. Click **Connect** in sidebar → select **Supabase** → **Create** (or reuse existing)
2. Redirected to Vercel Marketplace → accept terms → Supabase provisions new project
3. **13 env vars auto-populated**:
```
POSTGRES_URL, POSTGRES_PRISMA_URL, POSTGRES_URL_NON_POOLING
POSTGRES_USER, POSTGRES_HOST, POSTGRES_PASSWORD, POSTGRES_DATABASE
SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY, SUPABASE_URL
SUPABASE_JWT_SECRET, NEXT_PUBLIC_SUPABASE_ANON_KEY, NEXT_PUBLIC_SUPABASE_URL
```
4. v0 generates: `@supabase/supabase-js` + `@supabase/ssr` client setup in `/lib/supabase/client.ts` (browser) and `/lib/supabase/server.ts` (server, cookie-based). CRUD via `supabase.from('table').select/insert/update/delete()`. Auth via `supabase.auth.signUp/signInWithPassword()`. Real-time via `supabase.channel().on('postgres_changes', ...)`.
5. **v0 does NOT generate**: Row Level Security policies (critical security gap — may use `USING (true)` or skip RLS), proper middleware for auth token refresh, migration files, OAuth/MFA config, storage bucket policies, Edge Functions, or TypeScript type generation.

**Common mistakes**: Env vars disappearing in v0 preview (known bug). Forced creation of NEW database instead of connecting existing one. RLS disabled on generated tables. Using browser client in server context ("localStorage is not defined"). Exposing `SUPABASE_SERVICE_ROLE_KEY` in client code (bypasses all RLS).

### Neon (Postgres) — Step-by-Step

1. Click **Connect** → **Neon** → **Create** → Vercel Marketplace → configure region/plan
2. **Env vars**: `DATABASE_URL` (pooled), `DATABASE_URL_UNPOOLED` (direct), plus `POSTGRES_URL`, `PGHOST`, `PGUSER`, `PGDATABASE`, `PGPASSWORD`
3. **No ORM by default** — v0 generates raw SQL via `@neondatabase/serverless`:
```typescript
import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL!);
await sql('SELECT * FROM users WHERE id = $1', [userId]);
```
4. v0 can execute SQL directly in chat with a "Run Code" button (not always available — ask v0 to "generate a JS init script" as workaround).
5. **Common issues**: "Run Code" button doesn't always appear. v0 may over-generate schemas (extra tables for users, departments). `DATABASE_URL` conflicts if env var already exists.

### Upstash Redis — Step-by-Step

1. Click **Connect** → **Upstash** → **Create** → Vercel Marketplace → configure
2. **Env vars**: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
3. Uses `@upstash/redis` SDK:
```typescript
import { Redis } from "@upstash/redis";
const redis = Redis.fromEnv();
await redis.set("key", "value");
await redis.get("key");
```
4. Common patterns: rate limiting (`redis.incr()`), caching, session storage, view counters, feature flags.

### General Notes
- **v0 cannot introspect existing database schemas** — it cannot connect and read your schema automatically. Describe your schema in the prompt for v0 to generate matching UI/CRUD.
- **Known issue**: env vars may not be accessible in v0's preview environment even when visible in settings — test on deployed version.

---

## SECTION 6 — Design System Panel

### What the Design Panel Is
- The **"Design" tab** in v0's sidebar activates **Design Mode** (also via `Option+D` on Mac).
- When activated: cursor becomes a selection tool. Hovering highlights elements; clicking selects them. A **Design Panel** appears with controls for:
  - **Typography**: font family, size, weight, line height, letter spacing, alignment, decoration
  - **Color**: text color, background color
  - **Layout**: margin and padding (all sides)
  - **Border**: color, style, width
  - **Appearance**: opacity, corner radius
  - **Shadow**: box shadow
  - **Content**: direct text editing
- **Design Mode edits are free** — they do not consume credits. Only prompt-based changes cost credits.
- Distinct from **"Design Systems"** (separate docs page): Design Mode = per-element visual editing. Design Systems = project-wide theming via registries, CSS variables, and `globals.css`.

### Setting Global Design Tokens
- Tokens are set via **CSS variables in `globals.css`** following shadcn/ui conventions:
```css
:root {
  --background: rgb(235, 235, 231);
  --foreground: rgb(64, 64, 78);
  --primary: rgb(102, 54, 172);
  --primary-foreground: rgb(255, 255, 255);
  --spacing: 0.25rem;
  --radius: 0.5rem;
}
.dark { /* dark mode overrides */ }
```
- Typography set via `--font-sans`, `--font-mono`, `--font-serif` CSS variables. Fonts imported in `layout.tsx` via `next/font/google`.
- Methods to set: (1) Ask v0 to generate a palette, (2) Edit `globals.css` directly, (3) Use TweakCN (tweakcn.com) or shadcn/ui themes page to configure visually then copy CSS, (4) Attach Figma links.

### Creating and Saving a Custom Design System
- **Simple approach**: Edit `globals.css` in your v0 project, or prompt v0: "Create a warm, earthy color palette for my design system."
- **Registry approach (team/enterprise)**: Clone Vercel's Registry Starter Template → customize `src/app/tokens.css` + fonts in `layout.tsx` → add custom components and blocks → deploy → use "Open in v0" buttons.
- **v0 Themes** (launched June 2024): Create custom themes from prompts, modify individual tokens, switch between themes.
- **v0 Styles** (announced Sept 2025): Newer feature making theming even easier — exact UI details not fully documented publicly.

### How v0 Applies Tokens to Code
- v0 generates **Tailwind utility classes referencing CSS variables semantically**: `bg-background`, `text-foreground`, `bg-primary`, `border-border`, etc.
- The bridge is `@theme inline` in CSS (Tailwind v4) mapping CSS vars to Tailwind classes.
- Changing `--primary` in `globals.css` automatically propagates to all `bg-primary`, `text-primary`, etc.
- **Caveat**: v0 sometimes uses absolute Tailwind colors (`text-red-600`) instead of semantic tokens (`text-destructive`). Instruct v0 to use semantic tokens for consistent theming.

### Importing from Figma
- **Officially supported**: Attach a Figma link via the attachment icon in v0's chat. v0 analyzes both visual layout AND underlying design tokens (colors, spacing). Results are higher fidelity than screenshots.
- **From URL/screenshot**: Upload screenshots; v0 infers colors, typography, and spacing from visual inputs. No native "import brand from URL" feature.

### CSS Variables & shadcn/ui Interaction
- v0's design tokens use the **exact same CSS variable names** as shadcn/ui (`--background`, `--foreground`, `--primary`, etc.).
- Modifying these variables automatically affects all shadcn/ui components.
- CSS variables are portable — copy/paste between v0 and any shadcn/ui project.

### Switching Design Systems
- Use v0 Themes to switch between saved themes for generations.
- Swap `globals.css` content manually or via prompt.
- Use different registries for entirely different design systems.
- Light/dark mode built-in via `:root` and `.dark` class variants.

### Unverified
- Whether a dedicated dropdown/switcher UI exists for toggling between saved design systems within one project, or if switching still requires editing globals.css / re-prompting.

---

## SECTION 7 — 2026 Changelog and New Features

### January 2026
- **Jan 7**: Published "How we made v0 an effective coding agent" blog — detailed composite model pipeline (LLM Suspense, `vercel-autofixer-01`)
- **Jan 8**: Improved Web Search tool speed/token use; inline chat in VS Code editor; improved Tailwind v4 upgrade flow
- **Jan 15**: Model selection persists per user per team; template categories added
- **Jan 19**: Improved pricing structure; improved PR creation with option to push latest changes
- **Jan 21**: **AI SDK v6 agent support added**; **credit rollover** introduced (purchased credits roll over, expire after 1 year)
- **Jan 27**: **New Folders and Projects structure**; **new GitHub flow**; token pricing updated
- **Jan 28**: **"Import any GitHub repo into v0"** — work on actual codebases, edit, and ship changes to production without leaving v0

### February 2026 (Major "New v0" Release)
- **Feb 3**: Platform rebuilt from ground up ("Introducing the new v0"):
  - **Sandbox-based runtime** — imports any GitHub repo, auto-pulls env vars and configs from Vercel
  - **New Git panel** — create branches per chat, open PRs against main, deploy on merge. Designed for non-engineers.
  - **Snowflake and AWS database integrations**
  - **Enterprise-grade security** — deployment protection, secure enterprise connections, access controls
  - **v0 rebranded from v0.dev to v0.app**
- **Feb 9**: Paste multiple files at once
- **Feb 10**: **Nuxt and additional framework support** in Git imports; light/dark mode screenshots
- **Feb 11**: Branch picker for Vercel deployments; SSO page for team-specific auth
- **Feb 18**: **Simplified Chinese language support**; Tailwind CSS 4.2.0 update
- **Feb 23**: File deletion in editor; MCP servers auto-enable; "Library" page renamed to "Chats"
- **Feb 25**: Team setting to allow v0 to open PRs on behalf of members without GitHub accounts; "Transfer Chats" after account upgrade

### March 2026
- **Mar 2**: "Import from GitHub" for design system templates; Stripe integration Beta tag removed
- **Mar 3**: **Git support for version control** in Projects; **Python Services support** for backend dev; model selection when retrying messages
- **Mar 4**: **Auto model selection** (v0 automatically picks best model per task); responsive drag-to-resize; dynamic README for GitHub repos; low-credits warning and auto-recharge opt-in

### Pricing Changes (Current as of Q1 2026)
- **Free**: $0/mo, $5 included credits, 7 msg/day limit, 200 projects
- **Premium**: $20/mo, $20 included credits
- **Team**: $30/user/mo, $30 credits/user
- **Business**: $100/user/mo, $30 credits/user, training opt-out by default
- **Enterprise**: Custom pricing, SAML SSO, RBAC, data never used for training
- Token-based billing replaced fixed message counts. Credit rollover added Jan 2026. $2/day free daily credits for all paid users.

### New Integrations (Q4 2025 – Q1 2026)
- Snowflake, AWS databases, Stripe (native), Linear MCP, Notion MCP, Glean MCP, bring-your-own MCPs, AI Gateway

### New Model Updates
- v0 Mini/Pro/Max/Max Fast tiers (Dec 2025)
- Auto model selection (Mar 2026)
- Qwen 3.6 Plus added to AI Gateway (Apr 2026)
- Claude Opus 4.5 Preview, Nano Banana Pro, Gemini 3 Pro Preview available

---

## SECTION 8 — Agentic Workflows in v0

### Current Status: Agent Mode Is Live and Default
- Agent mode is **live and is the default mode** of v0 as of Feb 2026. No longer in beta (badges removed Feb 10, 2026).
- v0 is described as "an intelligent agent that can autonomously perform complex tasks beyond just generating code."
- Capabilities: task list creation, queued messages, automatic library doc lookup, automatic model selection, web search, site inspection, error auto-fixing.

### Building Multi-Step Agents
- **v0 itself is agentic** — it handles multi-step workflows internally when you describe complex tasks.
- For building custom agent **applications**, the tools are:
  - **AI SDK v6** — `ToolLoopAgent` abstraction for defining reusable agents
  - **Chat SDK** — deploy agents across chat platforms from a single codebase
  - **Workflow SDK** — multi-step orchestration with pause/resume/retry/state maintenance. New `@workflow/serde` package (Apr 2026) for class serialization.
  - **Vercel Queues** — offload background work
  - **Vercel Sandbox** — isolated execution for untrusted code
  - **MCP integrations** — connect to Stripe, Supabase, Neon, Upstash, Linear, Notion, Glean, or custom MCPs

### "Self-Driving Infrastructure" (from Vercel CPO blog, Apr 9, 2026)
Three layers:
1. **Infrastructure for coding agents to deploy to**: Immutable deployments, preview URLs, instant rollbacks, CLI/API/MCP give agents native deployment access. Generate code → open PR → get preview URL → verify → ship to production, all without human intervention.
2. **Infrastructure for building agents**: AI SDK + Chat SDK + AI Gateway (100s of models, budgets, routing, retries) + Fluid Compute + Workflows + Queues + Sandbox + Observability.
3. **Infrastructure that is itself agentic**: Platform auto-investigates anomalies, queries observability data, reads logs, performs root-cause analysis, reviews fixes in sandboxes. Currently requires human approval.

Key stat: **30% of Vercel deployments are now agent-initiated** (up 1000% in 6 months). Agent-deployed projects are **20x more likely** to call AI inference providers.

### Agent Capabilities in v0
- **Web Search** (SearchWeb subagent): real-time web search with citations
- **Site Inspection**: automated screenshot capture and visual analysis
- **Automatic Error Fixing**: via composite pipeline (LLM Suspense + autofixers)
- **Fix with v0**: auto-diagnoses deployment errors from logs (20 free uses/day on unedited code)
- **MCP tool connections**: Stripe, Supabase, Neon, Upstash, Linear, Notion, Glean, custom MCPs
- **Multi-task coordination** with context maintenance across conversations

### Unverified
- Whether "end-to-end agentic workflows in v0" (mentioned as "coming soon" in Feb blog) has fully shipped as a distinct feature
- Specific list of "Pre-installed Agents" referenced in v0 docs sidebar

---

## SECTION 9 — Non-Developer Workflows

### PM Workflows
- **Primary use case**: Rapid prototyping from user stories or PRDs — "a dashboard showing usage trends across plans" → functional app with charts, filters, test data.
- **Stakeholder alignment**: Interactive demos instead of static Figma mockups.
- **How PMs prompt differently**: Describe outcomes and user stories, not technical specs. Use "prompt enhancement" — give v0 a vague idea and let it expand into features. Structure prompts as product specs with target users, key features, and business goals.
- **PRD-to-prototype workflow** (verified from Stuart Ridgway, Principal PM): Write PRD with ChatPRD → paste into v0 → v0 builds working prototype within a minute → iterate via conversation → export for production.

### Marketer Workflows
- Describe landing page in plain language: "Landing page for Acme AI. Big hero with headline & CTA, three benefit cards, testimonial slider, contact form."
- Iterate via chat: change colors, copy, layout conversationally.
- Upload brand references (images, Figma files).
- Deploy with one click to get live URL.
- **Key enabler**: New Git panel lets non-engineers create branches, open PRs against main, and deploy on merge — first time non-engineers can ship production code through proper git workflows.

### Founder MVP Workflows
- Build landing pages, waitlist pages, onboarding flows, dashboards, data capture.
- **Real case study** — Thomas Franklin, CEO of Swapped: "Used v0 to mock up a three-step interactive tool in under 90 minutes. Instead of a deck or static Figma file, v0 gave us a tangible product. Launched polished version 48 hours later. If built with traditional tooling, would have cost $1,400. Ticket volume dropped 43% in five days."
- **Struggles**: Credit consumption (burns through credits fast during iteration). Debugging React/TypeScript errors without technical background. Backend complexity (connecting databases, payments, auth). The "last 20%" problem — v0 gets 60-80% there, remaining work requires developer skills.

### Key Limitations Non-Developers Hit
1. **Can't debug generated code** — server-side exceptions leave users stuck with no way to preview
2. **Complex state management** beyond v0's scope — must add manually
3. **No native backend generation** — must integrate auth/payments/databases manually
4. **React/TypeScript lock-in** — can't port to other frameworks
5. **Minor CSS tweaks sometimes fail** — v0 can't always fix simple styling issues
6. **Credit-hungry iteration** — non-developers prompt more iteratively, burning credits faster
7. **Code export integration** — requires understanding imports, packages, deployment

### Prompting Patterns for Non-Technical Users
1. Use "prompt enhancement" — write a basic idea and let v0 expand it
2. Structure prompts like product specs — include what, who, key features, visual style
3. Be specific about visual design — colors, fonts, spacing, mood
4. Paste full PRDs — v0 understands structured requirements
5. Make atomic changes — "Do one thing at a time. It feels more like a pull request."
6. Use the visual selector (Design Mode) — click on element and describe changes
7. Upload reference images or Figma designs
8. Use restore points — roll back to previous versions instead of debugging
9. Start with community templates instead of from scratch
10. Describe persona and problem first for better context

---

## SECTION 10 — Community Templates Deep Dive

### Template Categories (from v0.app/templates)
Apps & Games, Landing Pages, Dashboards, Components, Login & Sign Up, Blog & Portfolio, E-commerce, AI, Animations, Design Systems, Layouts, Website Templates, Agents

### Top 20 Templates by Engagement

| Template | Likes | Forks | Cost |
|---|---|---|---|
| Pointer AI Landing Page | 19K | 1.7K | Free |
| Brillance SaaS Landing Page | 12.2K | 1.8K | Free |
| Marketing Website | 11.1K | 503 | Free |
| Dashboard M.O.N.K.Y | 10.4K | 1.1K | Free |
| SaaS Landing Page (fnLk) | 9.5K | 372 | Free |
| Skal Ventures Template | 7.8K | 1.1K | Free |
| DynamicFrameLayout | 7.5K | 125 | Free |
| Waitlist | 5.8K | 279 | Free |
| Nano Banana Pro Playground | 5.2K | 606 | Free |
| Shaders Landing Page | 4.2K | 969 | Free |
| SaaS Landing Page (fUqr) | 3.1K | 607 | Free |
| KATACHI (E-commerce) | 3K | 662 | 1 Credit |
| Newsletter Template | 2.7K | 635 | Free |
| Shopify Ecommerce Template | 2.5K | 480 | Free |
| Habbo Hotel Multiplayer Chatroom | 2.4K | 381 | Free |
| MindSpace SaaS Landing Page | 1.9K | 283 | Free |
| Auralink SaaS Landing Page | 1.9K | 395 | Free |
| An Unusual Hero | 1.9K | 295 | Free |
| Nexus Work Management Platform | 1.8K | 283 | 1 Credit |
| Portfolio Template | 1.7K | 312 | Free |

### Templates with Backend Integration
- v0.app community templates are **primarily frontend-only UI** — they don't include working backends.
- **Vercel's separate template marketplace** (vercel.com/templates) has full-stack starters: Stripe Subscription Starter (Stripe + Supabase Auth + PostgreSQL), Supabase & Next.js Auth Starter, Stripe & Supabase SaaS Starter Kit (DrizzleORM + OAuth), Paddle Billing SaaS Starter.
- **Key distinction**: v0.app templates = UI starting points. vercel.com/templates = production-ready full-stack starters with auth, database, and payments.

### Best Templates by Use Case
- **SaaS**: Brillance (12.2K), MindSpace, Auralink, SaaS Landing Pages + Stripe Subscription Starter (full-stack)
- **E-commerce**: KATACHI (3K), Shopify Ecommerce Template + Shopify Commerce Starter (full-stack)
- **Portfolio**: Portfolio Template (1.7K), Paperfolio (1.3K)
- **Dashboard**: M.O.N.K.Y (10.4K), FINBRO, Nexus Work Management
- **AI App**: Nano Banana Pro Playground (5.2K), Habbo Hotel GPT-5 + LangChain Next.js Starter (full-stack)

### Forking Flow
1. Browse v0.app/templates → filter by category
2. Click "View Details" to preview
3. Click **"Duplicate"** → creates copy in your v0 workspace
4. v0 opens a new chat with the template as starting point
5. Modify via conversation → deploy when ready

Most templates are **Free**. Premium ones cost **1 Credit**.

### Template vs. Forking Community Project
- **Templates** (v0.app/templates): Curated, reviewed submissions with dedicated preview pages. Duplicating creates a clean, independent copy.
- **Forking** (v0.app/community): Any public project can be forked. Creates a copy of the entire project including all files and chat context. Useful for managing context window limits — fork resets conversation while keeping code. Tracks fork lineage.

---

## SECTION 11 — Next.js App Router File Structure

### Default File Tree
```
project-name/
├── app/
│   ├── layout.tsx          # Root layout — fonts, metadata, global providers
│   ├── page.tsx            # Home page — Server Component by default
│   ├── globals.css         # Tailwind CSS + CSS variables for theming
│   ├── favicon.ico
│   └── api/                # API routes (generated when needed)
│       └── [endpoint]/
│           └── route.ts    # Named exports: GET, POST, PUT, DELETE
├── components/
│   ├── ui/                 # shadcn/ui primitives (button.tsx, card.tsx, dialog.tsx...)
│   └── [custom].tsx        # App-specific composed components
├── lib/
│   └── utils.ts            # cn() utility function
├── hooks/                  # Custom React hooks (when needed)
├── public/                 # Static assets
├── components.json         # shadcn/ui configuration
├── tailwind.config.ts      # Tailwind CSS configuration
├── next.config.mjs         # Next.js configuration (typically minimal)
├── tsconfig.json           # TypeScript config with @/ path aliases
├── postcss.config.mjs      # PostCSS config
├── package.json            # Dependencies and scripts
└── .gitignore
```
- v0 does **NOT** use a `src/` directory by default — files go at root level.
- Flat component structure without heavy subdivision.

### Key File Contents

**`lib/utils.ts`** — the standard shadcn/ui utility:
```typescript
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

**`components.json`** — shadcn configuration:
```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "app/globals.css",
    "baseColor": "neutral",
    "cssVariables": true
  },
  "iconLibrary": "lucide",
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  }
}
```

### Import Paths
- v0 uses **`@/` path aliases** exclusively (not relative imports):
  - `import { Button } from "@/components/ui/button"`
  - `import { cn } from "@/lib/utils"`
- Configured via `tsconfig.json`: `"paths": { "@/*": ["./*"] }`

### Server vs. Client Components
- **Server Components are the default** — no `"use client"` directive.
- `"use client"` added only when component uses: React hooks (`useState`, `useEffect`), browser APIs, event handlers (`onClick`, `onChange`), client-side state.
- v0 prefers server-side patterns: Server Actions, server-side data fetching, Route Handlers.
- v0's security docs: can "move code to Route Handlers, Server Actions, or other server-side contexts to improve security."

### Environment Variables
- Server-side: variables WITHOUT `NEXT_PUBLIC_` prefix (stay server-only)
- Client-side: `NEXT_PUBLIC_*` variables exposed to browser
- v0 analyzes `NEXT_PUBLIC_` usage and warns about security risks
- Can auto-refactor to move secrets to server-side contexts

### Typical Dependencies (package.json)
- `next`, `react`, `react-dom`, `typescript`
- `tailwindcss`, `postcss`, `autoprefixer`, `tailwindcss-animate`
- `clsx`, `tailwind-merge` (for cn utility)
- `lucide-react` (icons)
- `class-variance-authority` (CVA, for component variants)
- Various `@radix-ui/*` packages (shadcn/ui primitives)

---

## SECTION 12 — Enterprise Features

### SAML SSO
- Enterprise plan includes **SAML 2.0-based SSO** integration with existing identity provider.
- Compatible with any SAML 2.0 IdP: **Okta, Azure AD (Microsoft Entra ID), Google Workspace, OneLogin, PingFederate**.
- Specific IdP list not enumerated by v0 docs, but standard SAML 2.0 compatibility confirmed.

### RBAC — Roles and Permissions

| Role | Capabilities | Cost |
|---|---|---|
| **Builder** | Full access: create/edit chats, projects, deployments, env vars, shared resources | Paid seat |
| **Creator** | Create and edit with fewer administrative permissions | Paid seat |
| **Viewer** | View-only access | **Free** — doesn't count toward paid seats |

- On non-Enterprise Team plans, all members have Builder access (no role differentiation).

### Audit Logging
- **Enterprise-only** feature: "Comprehensive logging of all user actions for compliance."
- Events include: chat creation, deployments, project changes, user actions.
- Advanced session controls and timeout policies.
- Specific event types not itemized publicly beyond "all user actions."

### Deployment Protection
- One-click deploys to secure infrastructure with dedicated Secure Compute environment.
- Vercel-level protections: DDoS protection (automatic detection + blocking), Secure Compute with private isolated environments, dedicated outgoing IPs, VPC peering, VPN support (AWS).

### Connecting to Own Infrastructure
- **AWS Marketplace**: v0 Enterprise available via AWS Marketplace
- **AWS Bedrock**: Enterprise can use Bedrock for AI inference
- **VPC peering and VPN support** for connecting to existing AWS infrastructure
- **Hyperscaler commitments**: supports hyperscaler procurement agreements

### Compliance Certifications

| Standard | Status |
|---|---|
| **SOC 2 Type 2** | ✅ v0 explicitly in scope |
| **ISO 27001:2022** | ✅ Certified |
| **GDPR** | ✅ Full compliance |
| **HIPAA** | ✅ BAA available (Secure Compute required) |
| **PCI DSS v4.0** | ✅ SAQ-D AOC |
| **EU-US Data Privacy Framework** | ✅ Certified |
| **TISAX AL2** | ✅ Assessment completed |
| **CCPA/CPRA** | ✅ Supported |

Full details at security.vercel.com.

### "Data Never Used for Training" Guarantee

| Tier | Training Policy |
|---|---|
| Free | May be used unless opted out (opt-out available in settings) |
| Premium/Team | NOT opted in by default; user must explicitly opt in |
| Business ($100/user/mo) | Training opt-out by default |
| **Enterprise** | **Contractual guarantee: data never used for training** |

Legal terms (v0 Enterprise Addendum): "Vercel represents and warrants that it shall not use v0 Customer Content to train its or its third-party AI providers' models or to improve the AI Products and Services, except with Customer's consent."

Additional guarantees: data isolation on separate infrastructure, no cross-contamination, sensitive content (API keys, env vars, PII) anonymized and redacted if opted in.

### Enterprise Pricing
- **Custom pricing only** — contact `vercel.com/contact/sales/v0-enterprise`
- No published ballpark figures.
- Business tier at $100/user/mo is the highest published tier. The $70 premium from Team → Business is "purely for privacy and support, not additional credits."
- Token pricing identical across plans: v0 Mini ($1-$5/1M), Pro ($3-$15/1M), Max ($5-$25/1M), Max Fast ($30-$150/1M).

### v0 Enterprise vs. Vercel Enterprise
- **v0 Enterprise** = AI code generation product (SAML SSO for v0, RBAC, audit logs, training opt-out, dedicated AI inference, AWS Bedrock, priority access, SLAs)
- **Vercel Enterprise** = deployment/hosting platform (Secure Compute, VPC peering, advanced DDoS, HIPAA with BAA, custom domains, edge network, MIU billing)
- v0 Enterprise builds on top of Vercel infrastructure — compliance certifications are inherited. Can be purchased separately but share billing infrastructure.

---

## Items Not Found or Unverifiable Across All Sections

1. **v0 Mini/Pro/Max ↔ API model ID mapping**: Official docs only expose `v0-1.5-md` and `v0-1.5-lg` as API models. Mini/Pro/Max appear to be UI-only names.
2. **Exact RPM/TPM rate limits per plan tier**: Only daily totals published; per-minute limits undocumented.
3. **temperature/max_tokens support**: LiteLLM says unsupported; Vercel's own docs simply don't mention these parameters.
4. **v0 Styles (Sept 2025 feature)**: Referenced but exact capabilities/UI not fully documented publicly.
5. **Pre-installed Agents list**: Referenced in v0 docs sidebar but specific agents not enumerated in fetched content.
6. **April 2026 v0 changelog entries**: No v0-specific entries found after Mar 4, 2026.
7. **Enterprise pricing ballpark**: Custom pricing only; no public figures.
8. **Exact audit log event types**: Only "comprehensive logging of all user actions" stated.
9. **Whether "end-to-end agentic workflows"** (Feb 2026 blog) has shipped as a distinct named feature or is the current agent mode itself.
10. **Tailwind v3 vs v4**: v0 appears to be transitioning; newer projects may use v4 (`@import "tailwindcss"`) while older patterns use v3 (`@tailwind` directives).